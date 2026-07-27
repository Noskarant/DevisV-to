import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveCaseIdByPublicToken } from "@/lib/public-preview/data";
import { getStripe, PRODUCT_PRICES } from "@/lib/stripe/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim();
    if (!token) return NextResponse.json({ error: "APERÇU_INTROUVABLE" }, { status: 400 });

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

    const stripe = getStripe();
    const localMockEnabled = process.env.NODE_ENV !== "production" && process.env.MOCK_MODE === "true";
    if (!stripe && !localMockEnabled) {
      console.error("[PUBLIC_CHECKOUT] STRIPE_SECRET_KEY manquante");
      return NextResponse.json(
        { error: "Le paiement sécurisé est temporairement indisponible." },
        { status: 503 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", caseRow.user_id)
      .single();

    const priceInfo = PRODUCT_PRICES.single;
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: caseRow.user_id,
        case_id: caseId,
        product_type: "single",
        amount: priceInfo.amount,
        currency: "eur",
        status: "pending",
      })
      .select("id")
      .single();
    if (paymentError || !payment) throw new Error(paymentError?.message ?? "Paiement non créé.");

    await supabase
      .from("cases")
      .update({ status: "payment_pending", product_type: "single" })
      .eq("id", caseId);
    await supabase.from("analytics_events").insert({
      user_id: caseRow.user_id,
      case_id: caseId,
      event_name: "checkout_started",
      metadata: { source: "public_preview" },
    });

    if (!stripe) {
      await supabase
        .from("payments")
        .update({ status: "succeeded", stripe_checkout_session_id: `mock_${payment.id}` })
        .eq("id", payment.id);
      await supabase
        .from("cases")
        .update({ status: "paid", payment_status: "succeeded" })
        .eq("id", caseId);
      return NextResponse.json({ url: `${appUrl}/apercu/${token}?payment=success&mock=true`, mock: true });
    }

    const priceId = process.env[priceInfo.envKey];
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: profile?.email || undefined,
      line_items: priceId
        ? [{ price: priceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "eur",
                product_data: {
                  name: "Rapport complet DevisVéto",
                  description: "Toutes les lignes expliquées, points à clarifier et questions personnalisées.",
                },
                unit_amount: priceInfo.amount,
              },
              quantity: 1,
            },
          ],
      success_url: `${appUrl}/apercu/${token}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/apercu/${token}?payment=cancelled`,
      metadata: {
        case_id: caseId,
        payment_id: payment.id,
        product_type: "single",
        public_token: token,
      },
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
