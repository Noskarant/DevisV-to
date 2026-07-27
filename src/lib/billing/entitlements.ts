import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type BillingSummary = {
  subscription: {
    id: string;
    status: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
  creditBalance: number;
  canUseCredit: boolean;
};

const LIVE_STATUSES = ["trialing", "active", "past_due"];

export async function getBillingSummary(userId: string): Promise<BillingSummary> {
  const supabase = createAdminClient();
  const [{ data: subscriptions }, { data: balance }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "id, status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end"
      )
      .eq("user_id", userId)
      .in("status", LIVE_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.rpc("get_analysis_credit_balance", { p_user_id: userId }),
  ]);

  const subscription = subscriptions?.[0] ?? null;
  const creditBalance = typeof balance === "number" ? balance : Number(balance ?? 0);

  return {
    subscription,
    creditBalance: Math.max(0, Number.isFinite(creditBalance) ? creditBalance : 0),
    canUseCredit: Boolean(subscription && subscription.status !== "past_due" && creditBalance > 0),
  };
}

export function isSubscriptionActive(status?: string | null) {
  return status === "active" || status === "trialing";
}
