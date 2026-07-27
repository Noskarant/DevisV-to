import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentConfirmedEmail } from "@/lib/email/send";
import Stripe from "stripe";
import { NextResponse } from "next/server";

function toIso(timestamp?: number | null) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

function subscriptionPeriod(subscription: Stripe.Subscription) {
  const firstItem = subscription.items.data[0] as Stripe.SubscriptionItem & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const legacy = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };

  return {
    start: firstItem?.current_period_start ?? legacy.current_period_start ?? null,
    end: firstItem?.current_period_end ?? legacy.current_period_end ?? null,
  };
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const compatible = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
    parent?: {
      subscription_details?: {
        subscription?: string | Stripe.Subscription | null;
      } | null;
    } | null;
  };
  const raw = compatible.parent?.subscription_details?.subscription ?? compatible.subscription;
  return typeof raw === "string" ? raw : raw?.id ?? null;
}

async function syncSubscription(
  stripe: Stripe,
  subscriptionOrId: Stripe.Subscription | string,
  fallbackUserId?: string | null
) {
  const subscription =
    typeof subscriptionOrId === "string"
      ? await stripe.subscriptions.retrieve(subscriptionOrId)
      : subscriptionOrId;
  const userId = subscription.metadata.user_id || fallbackUserId;
  if (!userId) return null;

  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const period = subscriptionPeriod(subscription);
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: subscription.status,
        current_period_start: toIso(period.start),
        current_period_end: toIso(period.end),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: toIso(subscription.canceled_at),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" }
    )
    .select("id, user_id")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!secret || !stripeKey) {
    return NextResponse.json({ mocked: true });
  }

  const stripe = new Stripe(stripeKey);
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? "", secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature invalide: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const caseId = session.metadata?.case_id;
      const paymentId = session.metadata?.payment_id;
      const userId = session.metadata?.user_id;
      const productType = session.metadata?.product_type;
      if (!caseId || !paymentId) return NextResponse.json({ received: true });

      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

      await supabase
        .from("payments")
        .update({
          status: "succeeded",
          stripe_payment_intent_id:
            typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
          stripe_subscription_id: subscriptionId ?? null,
          stripe_customer_id: customerId ?? null,
        })
        .eq("id", paymentId);

      await supabase
        .from("cases")
        .update({
          status: "paid",
          payment_status: "succeeded",
          entitlement_source: productType === "monthly" ? "subscription_checkout" : "single_payment",
          access_granted_at: new Date().toISOString(),
        })
        .eq("id", caseId);

      if (productType === "monthly" && subscriptionId) {
        await syncSubscription(stripe, subscriptionId, userId);
      }

      const { data: caseRow } = await supabase
        .from("cases")
        .select("user_id, pets(name), profiles(email)")
        .eq("id", caseId)
        .single();

      const pet = caseRow?.pets as unknown as { name: string } | null;
      const profile = caseRow?.profiles as unknown as { email: string } | null;
      if (profile?.email) {
        await sendPaymentConfirmedEmail(profile.email, pet?.name ?? "votre animal");
      }
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      await syncSubscription(stripe, event.data.object as Stripe.Subscription);
    }

    if (event.type === "customer.subscription.deleted") {
      await syncSubscription(stripe, event.data.object as Stripe.Subscription);
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = subscriptionIdFromInvoice(invoice);
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const synced = await syncSubscription(stripe, subscription);
        const compatibleInvoice = invoice as Stripe.Invoice & { billing_reason?: string | null };

        if (synced && compatibleInvoice.billing_reason !== "subscription_create") {
          await supabase.rpc("grant_monthly_analysis_credit", {
            p_user_id: synced.user_id,
            p_subscription_id: synced.id,
            p_external_reference: `invoice:${invoice.id}`,
          });
        }

        if (synced) {
          await supabase.from("payments").upsert(
            {
              user_id: synced.user_id,
              case_id: null,
              stripe_customer_id:
                typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id,
              stripe_subscription_id: subscriptionId,
              stripe_invoice_id: invoice.id,
              product_type: "monthly",
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: "succeeded",
            },
            { onConflict: "stripe_invoice_id" }
          );
        }
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = subscriptionIdFromInvoice(invoice);
      if (subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const caseId = session.metadata?.case_id;
      const paymentId = session.metadata?.payment_id;
      if (caseId && paymentId) {
        await supabase.from("payments").update({ status: "failed" }).eq("id", paymentId);
        await supabase.from("cases").update({ payment_status: "failed" }).eq("id", caseId);
      }
    }
  } catch (error) {
    console.error("[STRIPE_WEBHOOK]", event.type, error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Webhook non traité." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
