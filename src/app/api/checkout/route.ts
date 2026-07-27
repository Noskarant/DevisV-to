import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { productTypeSchema } from "@/lib/validation/schemas";
import { getStripe, PRODUCT_PRICES, type ProductType } from "@/lib/stripe/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  const body = await request.json();
  const caseId = body.case_id as string;
  const parsedProduct = productTypeSchema.safeParse(body.product_type ?? "single");
  if (!caseId || !parsedProduct.success) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }
  const productType: ProductType = parsedProduct.data;
  const priceInfo = PRODUCT_PRICES[productType];

  const supabase = await createClient();
  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .eq("user_id", user.id)
    .single();
  if (caseError || !caseRow) {
    return NextResponse.json({ error: "DOSSIER_INTROUVABLE" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripe();

  // Enregistre le paiement en attente dans tous les cas
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      case_id: caseId,
      product_type: productType,
      amount: priceInfo.amount,
      currency: "eur",
      status: "pending",
    })
    .select("id")
    .single();
  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  await supabase.from("cases").update({ status: "payment_pending", product_type: productType }).eq("id", caseId);

  if (!stripe) {
    // MODE MOCK : pas de clé Stripe configurée en dev.
    // Redirige directement vers la page de succès en simulant un paiement validé.
    await supabase
      .from("payments")
      .update({ status: "succeeded", stripe_checkout_session_id: `mock_${payment.id}` })
      .eq("id", payment.id);
    await supabase.from("cases").update({ status: "paid", payment_status: "succeeded" }).eq("id", caseId);

    return NextResponse.json({
      url: `${appUrl}/paiement/succes?case_id=${caseId}&mock=true`,
      mock: true,
    });
  }

  const priceId = process.env[priceInfo.envKey];
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: priceId
      ? [{ price: priceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "eur",
              product_data: { name: priceInfo.label },
              unit_amount: priceInfo.amount,
            },
            quantity: 1,
          },
        ],
    success_url: `${appUrl}/paiement/succes?case_id=${caseId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/paiement/annule?case_id=${caseId}`,
    metadata: { case_id: caseId, payment_id: payment.id, product_type: productType },
  });

  await supabase
    .from("payments")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", payment.id);

  return NextResponse.json({ url: session.url });
}
