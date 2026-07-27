import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentConfirmedEmail } from "@/lib/email/send";
import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!secret || !stripeKey) {
    // Mode mock : pas de Stripe configuré, le webhook n'a rien à vérifier.
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const caseId = session.metadata?.case_id;
    const paymentId = session.metadata?.payment_id;
    if (!caseId || !paymentId) return NextResponse.json({ received: true });

    await supabase
      .from("payments")
      .update({
        status: "succeeded",
        stripe_payment_intent_id: (session.payment_intent as string) ?? null,
      })
      .eq("id", paymentId);

    await supabase
      .from("cases")
      .update({ status: "paid", payment_status: "succeeded" })
      .eq("id", caseId);

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

  if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const caseId = session.metadata?.case_id;
    const paymentId = session.metadata?.payment_id;
    if (caseId && paymentId) {
      await supabase.from("payments").update({ status: "failed" }).eq("id", paymentId);
      await supabase
        .from("cases")
        .update({ payment_status: "failed" })
        .eq("id", caseId);
    }
  }

  return NextResponse.json({ received: true });
}
