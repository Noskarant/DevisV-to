import { z } from "zod";

export const previewLineSchema = z.object({
  original_label: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().nullable().default(null),
  explanation: z.string().min(1),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  clarification: z.string().nullable().default(null),
});

export const previewSchema = z.object({
  intervention: z.string().min(1),
  total_amount: z.number().nullable().default(null),
  currency: z.string().default("EUR"),
  summary: z.string().min(1),
  categories: z.array(z.string().min(1)).min(1).max(12),
  lines: z.array(previewLineSchema).min(1).max(30),
  clarifications: z.array(z.string().min(1)).max(10).default([]),
  questions: z.array(z.string().min(1)).max(10).default([]),
  variation_factors: z.array(z.string().min(1)).max(10).default([]),
  price_context: z.string().min(1),
  warnings: z.array(z.string().min(1)).max(8).default([]),
});

export type PreviewPayload = z.infer<typeof previewSchema>;
export type PreviewLine = z.infer<typeof previewLineSchema>;
