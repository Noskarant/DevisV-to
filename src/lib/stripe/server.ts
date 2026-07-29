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
    envKeys: ["STRIPE_SINGLE_PRICE_ID", "STRIPE_PRICE_SINGLE"],
  },
  monthly: {
    amount: 690,
    label: "DevisVéto Plus",
    envKeys: ["STRIPE_MONTHLY_PRICE_ID", "STRIPE_PRICE_MONTHLY"],
  },
  pack3: {
    amount: 1790,
    label: "Pack 3 analyses",
    envKeys: ["STRIPE_PACK3_PRICE_ID", "STRIPE_PRICE_PACK3"],
  },
  annual: {
    amount: 3990,
    label: "Pass annuel",
    envKeys: ["STRIPE_ANNUAL_PRICE_ID", "STRIPE_PRICE_ANNUAL"],
  },
} as const;

export type ProductType = keyof typeof PRODUCT_PRICES;

export function getStripePriceId(productType: ProductType) {
  const price = PRODUCT_PRICES[productType];
  for (const key of price.envKeys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return null;
}
