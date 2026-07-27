import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "La gestion de l’abonnement est temporairement indisponible." },
        { status: 503 }
      );
    }

    const supabase = createAdminClient();
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: "Aucun abonnement à gérer." }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[BILLING_PORTAL]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Impossible d’ouvrir la gestion de l’abonnement." }, { status: 500 });
  }
}
