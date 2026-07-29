import { z } from "zod";

export const readingStatusSchema = z.enum([
  "clear",
  "uncertain",
  "missing",
  "possibly_included",
]);

export const documentCheckSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(["ok", "attention", "info"]),
  detail: z.string().min(1),
});

export const previewLineSchema = z.object({
  original_label: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().nullable().default(null),
  quantity: z.number().nullable().default(null),
  unit_price: z.number().nullable().default(null),
  explanation: z.string().min(1),
  explicit_elements: z.array(z.string().min(1)).max(8).default([]),
  elements_to_confirm: z.array(z.string().min(1)).max(8).default([]),
  suggested_question: z.string().nullable().default(null),
  source_page: z.number().int().positive().nullable().default(null),
  source_quote: z.string().max(500).nullable().default(null),
  reading_status: readingStatusSchema.default("uncertain"),
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
  clarifications: z.array(z.string().min(1)).max(12).default([]),
  questions: z.array(z.string().min(1)).max(12).default([]),
  priority_questions: z.array(z.string().min(1)).max(3).default([]),
  variation_factors: z.array(z.string().min(1)).max(10).default([]),
  price_context: z.string().min(1),
  warnings: z.array(z.string().min(1)).max(10).default([]),
  document_checks: z.array(documentCheckSchema).max(12).default([]),
  page_count: z.number().int().positive().nullable().default(null),
  document_readability: z.enum(["usable", "partial", "insufficient"]).default("usable"),
  email_subject: z.string().max(180).nullable().default(null),
  email_body: z.string().max(5000).nullable().default(null),
});

export type PreviewPayload = z.infer<typeof previewSchema>;
export type PreviewLine = z.infer<typeof previewLineSchema>;
export type DocumentCheck = z.infer<typeof documentCheckSchema>;
export type ReadingStatus = z.infer<typeof readingStatusSchema>;
