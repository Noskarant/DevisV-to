import { createAdminClient } from "@/lib/supabase/admin";
import {
  fulfillCheckoutSession,
  subscriptionIdFromInvoice,
  syncSubscription,
} from "@/lib/stripe/fulfillment";
import {
  sendPaymentFailedEmail,
  sendSubscriptionActivatedEmail,
  sendSubscriptionCanceledEmail,
} from "@/lib/email/send";
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

async function emailForUser(userId: string | null | undefined) {
  if (!userId) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  return data?.email ?? null;
}

async function trySendWebhookEmail(label: string, send: () => Promise<unknown>) {
  try {
    await send();
  } catch (error) {
    console.error("[STRIPE_WEBHOOK_EMAIL]", label, error instanceof Error ? error.message : "unknown");
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!secret || !stripeKey) {
    console.error("[STRIPE_WEBHOOK] Configuration Stripe manquante");
    return NextResponse.json({ error: "Configuration Stripe manquante." }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey);
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? "", secret);
  } catch (error) {
    console.error(
      "[STRIPE_WEBHOOK_SIGNATURE]",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json(
      { error: `Signature invalide: ${(error as Error).message}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await fulfillCheckoutSession(
        stripe,
        event.data.object as Stripe.Checkout.Session,
        "webhook"
      );
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const synced = await syncSubscription(stripe, subscription);

      if (event.type === "customer.subscription.created" && synced) {
        const period = subscriptionPeriod(subscription);
        const email = await emailForUser(synced.user_id);
        if (email) {
          await trySendWebhookEmail("subscription_activated", () =>
            sendSubscriptionActivatedEmail(email, {
              planLabel: "DevisVeto Plus",
              startedAt: toIso(period.start),
              nextBillingAt: toIso(period.end),
            })
          );
        }
      }

      if (event.type === "customer.subscription.deleted" && synced) {
        const period = subscriptionPeriod(subscription);
        const email = await emailForUser(synced.user_id);
        if (email) {
          await trySendWebhookEmail("subscription_canceled", () =>
            sendSubscriptionCanceledEmail(email, { accessEndsAt: toIso(period.end) })
          );
        }
      }
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

        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();
        const email = await emailForUser(subscription?.user_id);
        if (email) {
          await trySendWebhookEmail("payment_failed", () => sendPaymentFailedEmail(email));
        }
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
