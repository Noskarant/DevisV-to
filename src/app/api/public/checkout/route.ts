import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveCaseIdByPublicToken } from "@/lib/public-preview/data";
import { getStripe, PRODUCT_PRICES } from "@/lib/stripe/server";

const checkoutSchema = z.object({
  token: z.string().trim().min(1),
  plan: z.enum(["single", "monthly", "credit"]).default("single"),
});

export async function POST(request: Request) {
  try {
    const parsed = checkoutSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Choix de paiement invalide." }, { status: 400 });
    }

    const { token, plan } = parsed.data;
    const caseId = await resolveCaseIdByPublicToken(token);
    if (!caseId) return NextResponse.json({ error: "APERÇU_INTROUVABLE" }, { status: 404 });

    const supabase = createAdminClient();
    const { data: caseRow } = await supabase
      .from("cases")
      .select("id, user_id, payment_status, status, pets(name)")
      .eq("id", caseId)
      .single();
    if (!caseRow) return NextResponse.json({ error: "DOSSIER_INTROUVABLE" }, { status: 404 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    if (caseRow.payment_status === "succeeded") {
      return NextResponse.json({ url: `${appUrl}/apercu/${token}?payment=already-paid` });
    }

    if (plan === "credit") {
      const { data: consumed, error } = await supabase.rpc("consume_analysis_credit", {
        p_user_id: caseRow.user_id,
        p_case_id: caseId,
      });
      if (error || !consumed) {
        return NextResponse.json(
          { error: "Aucun crédit disponible pour cette analyse." },
          { status: 409 }
        );
      }

      await supabase.from("analytics_events").insert({
        user_id: caseRow.user_id,
        case_id: caseId,
        event_name: "subscription_credit_used",
        metadata: { source: "public_preview" },
      });

      return NextResponse.json({ url: `${appUrl}/apercu/${token}?payment=credit` });
    }

    const stripe = getStripe();
    const localMockEnabled = process.env.NODE_ENV !== "production" && process.env.MOCK_MODE === "true";
    if (!stripe && !localMockEnabled) {
      console.error("[PUBLIC_CHECKOUT] STRIPE_SECRET_KEY manquante");
      return NextResponse.json(
        { error: "Le paiement sécurisé est temporairement indisponible." },
        { status: 503 }
      );
    }

    const [{ data: profile }, { data: liveSubscriptions }] = await Promise.all([
      supabase.from("profiles").select("email").eq("id", caseRow.user_id).single(),
      supabase
        .from("subscriptions")
        .select("id, status")
        .eq("user_id", caseRow.user_id)
        .in("status", ["incomplete", "trialing", "active", "past_due"])
        .limit(1),
    ]);

    if (plan === "monthly" && liveSubscriptions?.length) {
      return NextResponse.json(
        { error: "Un abonnement DevisVéto Plus est déjà rattaché à ce compte." },
        { status: 409 }
      );
    }

    const priceInfo = PRODUCT_PRICES[plan];
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: caseRow.user_id,
        case_id: caseId,
        product_type: plan,
        amount: priceInfo.amount,
        currency: "eur",
        status: "pending",
      })
      .select("id")
      .single();
    if (paymentError || !payment) throw new Error(paymentError?.message ?? "Paiement non créé.");

    await supabase
      .from("cases")
      .update({ status: "payment_pending", product_type: plan })
      .eq("id", caseId);
    await supabase.from("analytics_events").insert({
      user_id: caseRow.user_id,
      case_id: caseId,
      event_name: "checkout_started",
      metadata: { source: "public_preview", plan },
    });

    if (!stripe) {
      await supabase
        .from("payments")
        .update({ status: "succeeded", stripe_checkout_session_id: `mock_${payment.id}` })
        .eq("id", payment.id);
      await supabase
        .from("cases")
        .update({
          status: "paid",
          payment_status: "succeeded",
          entitlement_source: plan === "monthly" ? "subscription_checkout" : "single_payment",
          access_granted_at: new Date().toISOString(),
        })
        .eq("id", caseId);

      if (plan === "monthly") {
        await supabase.from("subscriptions").insert({
          user_id: caseRow.user_id,
          stripe_subscription_id: `mock_sub_${payment.id}`,
          stripe_customer_id: `mock_customer_${caseRow.user_id}`,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      return NextResponse.json({ url: `${appUrl}/apercu/${token}?payment=success&mock=true`, mock: true });
    }

    const priceId = process.env[priceInfo.envKey];
    const monthly = plan === "monthly";
    const session = await stripe.checkout.sessions.create({
      mode: monthly ? "subscription" : "payment",
      customer_email: profile?.email || undefined,
      allow_promotion_codes: false,
      line_items: priceId
        ? [{ price: priceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "eur",
                product_data: {
                  name: priceInfo.label,
                  description: monthly
                    ? "Cette analyse incluse, puis 1 crédit d’analyse par mois, cumulable jusqu’à 3."
                    : "Toutes les lignes expliquées, les points à clarifier et les questions personnalisées.",
                },
                unit_amount: priceInfo.amount,
                ...(monthly ? { recurring: { interval: "month" as const } } : {}),
              },
              quantity: 1,
            },
          ],
      success_url: `${appUrl}/apercu/${token}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/apercu/${token}?payment=cancelled`,
      metadata: {
        case_id: caseId,
        user_id: caseRow.user_id,
        payment_id: payment.id,
        product_type: plan,
        public_token: token,
      },
      ...(monthly
        ? {
            subscription_data: {
              metadata: {
                case_id: caseId,
                user_id: caseRow.user_id,
                payment_id: payment.id,
                public_token: token,
              },
            },
          }
        : {}),
    });

    await supabase
      .from("payments")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", payment.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[PUBLIC_CHECKOUT]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Le paiement n’a pas pu être préparé." }, { status: 500 });
  }
}
