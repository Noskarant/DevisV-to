import "server-only";
import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export const PRODUCT_PRICES = {
  single: {
    amount: 890,
    label: "Analyse unique DevisVéto",
    envKey: "STRIPE_PRICE_SINGLE",
  },
  monthly: {
    amount: 690,
    label: "DevisVéto Plus",
    envKey: "STRIPE_PRICE_MONTHLY",
  },
  pack3: { amount: 1790, label: "Pack 3 analyses", envKey: "STRIPE_PRICE_PACK3" },
  annual: { amount: 3990, label: "Pass annuel", envKey: "STRIPE_PRICE_ANNUAL" },
} as const;

export type ProductType = keyof typeof PRODUCT_PRICES;
