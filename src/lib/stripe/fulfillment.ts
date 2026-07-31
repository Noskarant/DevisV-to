import "server-only";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentConfirmedEmail } from "@/lib/email/send";
import { resolveCaseIdByPublicToken } from "@/lib/public-preview/data";
import { getStripe, PRODUCT_PRICES, type ProductType } from "./server";

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

export function subscriptionIdFromInvoice(invoice: Stripe.Invoice) {
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

export async function syncSubscription(
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

type FulfillmentSource = "webhook" | "checkout_return";

function checkoutIsPaid(session: Stripe.Checkout.Session) {
  return (
    session.status === "complete" &&
    (session.payment_status === "paid" || session.payment_status === "no_payment_required")
  );
}

export async function fulfillCheckoutSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  source: FulfillmentSource
) {
  if (!checkoutIsPaid(session)) return { fulfilled: false, reason: "SESSION_NOT_PAID" as const };

  const caseId = session.metadata?.case_id;
  const paymentId = session.metadata?.payment_id;
  const userId = session.metadata?.user_id;
  const productType = session.metadata?.product_type;
  const publicToken = session.metadata?.public_token;

  if (!caseId || !paymentId || !userId || !productType) {
    throw new Error("STRIPE_METADATA_INCOMPLETE");
  }

  const supabase = createAdminClient();
  const [{ data: payment }, { data: caseBefore }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, case_id, user_id, status, stripe_checkout_session_id, amount, currency, product_type")
      .eq("id", paymentId)
      .maybeSingle(),
    supabase
      .from("cases")
      .select("id, user_id, payment_status")
      .eq("id", caseId)
      .maybeSingle(),
  ]);

  if (!payment || !caseBefore) throw new Error("STRIPE_TARGET_NOT_FOUND");
  if (payment.case_id !== caseId || payment.user_id !== userId || caseBefore.user_id !== userId) {
    throw new Error("STRIPE_METADATA_MISMATCH");
  }
  if (
    payment.stripe_checkout_session_id &&
    payment.stripe_checkout_session_id !== session.id
  ) {
    throw new Error("STRIPE_SESSION_MISMATCH");
  }

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const { error: paymentError } = await supabase
    .from("payments")
    .update({
      status: "succeeded",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId ?? null,
      stripe_subscription_id: subscriptionId ?? null,
      stripe_customer_id: customerId ?? null,
    })
    .eq("id", paymentId);
  if (paymentError) throw new Error(paymentError.message);

  const { error: caseError } = await supabase
    .from("cases")
    .update({
      status: "paid",
      payment_status: "succeeded",
      product_type: productType,
      entitlement_source: productType === "monthly" ? "subscription_checkout" : "single_payment",
      access_granted_at: new Date().toISOString(),
    })
    .eq("id", caseId);
  if (caseError) throw new Error(caseError.message);

  if (productType === "monthly" && subscriptionId) {
    await syncSubscription(stripe, subscriptionId, userId);
  }

  const firstFulfillment = caseBefore.payment_status !== "succeeded";
  if (firstFulfillment) {
    await supabase.from("analytics_events").insert({
      user_id: userId,
      case_id: caseId,
      event_name: "checkout_fulfilled",
      metadata: {
        source,
        product_type: productType,
        stripe_checkout_session_id: session.id,
        public_token: publicToken ?? null,
      },
    });

    const { data: caseRow } = await supabase
      .from("cases")
      .select("pets(name), profiles(email)")
      .eq("id", caseId)
      .single();
    const pet = caseRow?.pets as unknown as { name: string } | null;
    const profile = caseRow?.profiles as unknown as { email: string } | null;
    if (profile?.email) {
      const typedProductType =
        payment.product_type && payment.product_type in PRODUCT_PRICES
          ? (payment.product_type as ProductType)
          : null;
      try {
        await sendPaymentConfirmedEmail(profile.email, pet?.name ?? "votre animal", {
          amountCents: payment.amount,
          currency: payment.currency,
          productLabel: typedProductType ? PRODUCT_PRICES[typedProductType].label : null,
          paidAt: new Date(),
        });
      } catch (error) {
        console.error(
          "[STRIPE_FULFILLMENT_EMAIL]",
          error instanceof Error ? error.message : "unknown"
        );
      }
    }
  }

  return { fulfilled: true, caseId, paymentId, productType };
}

export async function reconcileCheckoutReturn(input: {
  token: string;
  sessionId: string;
}) {
  const stripe = getStripe();
  if (!stripe) return { fulfilled: false, reason: "STRIPE_UNAVAILABLE" as const };

  const caseId = await resolveCaseIdByPublicToken(input.token);
  if (!caseId) return { fulfilled: false, reason: "CASE_NOT_FOUND" as const };

  const supabase = createAdminClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("id, case_id, stripe_checkout_session_id")
    .eq("case_id", caseId)
    .eq("stripe_checkout_session_id", input.sessionId)
    .maybeSingle();
  if (!payment) return { fulfilled: false, reason: "PAYMENT_NOT_FOUND" as const };

  const session = await stripe.checkout.sessions.retrieve(input.sessionId);
  if (
    session.metadata?.public_token !== input.token ||
    session.metadata?.case_id !== caseId ||
    session.metadata?.payment_id !== payment.id
  ) {
    throw new Error("STRIPE_RETURN_MISMATCH");
  }

  return fulfillCheckoutSession(stripe, session, "checkout_return");
}
