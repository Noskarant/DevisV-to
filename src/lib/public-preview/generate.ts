import "server-only";
import { jsonrepair } from "jsonrepair";
import { anonymizeDocumentText, anonymizeFreeText } from "./anonymize";
import { extractDocumentText } from "./ocr";
import { enrichPreviewWithTraceability } from "./traceability";
import { previewSchema, type PreviewPayload } from "./types";

type GeneratePreviewInput = {
  fileBuffer: Buffer;
  mimeType: string;
  filename: string;
  petName: string;
  species: "chien" | "chat" | "autre";
  documentType: "devis" | "facture";
  emergencyContext: boolean;
  userDescription?: string;
  primaryQuestion?: string;
};

type JsonRecord = Record<string, unknown>;

const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
const DEEPSEEK_TIMEOUT_MS = 42_000;
const DEEPSEEK_MAX_TOKENS = 9000;
const SAFE_PRICE_CONTEXT =
  "Le montant est présenté de façon factuelle. Le rapport explique sa composition et les informations à faire préciser, sans juger le tarif ni la nécessité des soins.";
const SAFE_EXPLANATION =
  "Cette ligne correspond à une prestation mentionnée dans le document. Son contenu exact doit être confirmé avec la clinique lorsqu’il n’est pas suffisamment détaillé.";
const FORBIDDEN_VERDICT_PATTERN =
  /(?:prix\s+(?:normal|anormal)|trop\s+cher|bon\s+marché|surfactur|arnaque|abusif|injustifié|montant\s+(?:cohérent|raisonnable))/i;
const FORBIDDEN_MEDICAL_PATTERN =
  /(?:refusez|acceptez\s+(?:le|ce)\s+soin|retardez|annulez|ne\s+faites\s+pas|ce\s+soin\s+est\s+(?:inutile|obligatoire|nécessaire)|vous\s+devez\s+(?:accepter|refuser))/i;

function isDevelopmentMockEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.MOCK_MODE === "true";
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function buildFallbackPreview(input: GeneratePreviewInput): PreviewPayload {
  const context = input.userDescription?.trim();
  const question = input.primaryQuestion?.trim();
  return previewSchema.parse({
    intervention: context || `${input.documentType === "devis" ? "Devis" : "Facture"} vétérinaire de ${input.petName}`,
    total_amount: null,
    currency: "EUR",
    summary: `Le document concernant ${input.petName} a bien été reçu. Une lecture fiable nécessite encore une vérification du fichier original.`,
    categories: ["Document vétérinaire"],
    lines: [
      {
        original_label: "Document reçu",
        category: "Informations générales",
        amount: null,
        explanation: "Le fichier a été enregistré dans votre espace privé, sans compléter au hasard les zones non lisibles.",
        confidence: "low",
        reading_status: "uncertain",
        clarification: "Ajoutez une photo plus nette ou le PDF original si les informations principales ne sont pas lisibles.",
      },
    ],
    clarifications: ["Vérifier les libellés et les montants directement sur le document original."],
    questions: question ? [question] : [],
    variation_factors: [],
    price_context: SAFE_PRICE_CONTEXT,
    warnings: ["Cet aperçu explique un document et ne constitue pas un avis vétérinaire."],
    document_readability: "insufficient",
  });
}

function extractJson(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("JSON introuvable");
  const candidate = trimmed.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return JSON.parse(jsonrepair(candidate));
  }
}

function normalizeAmount(raw: string) {
  const compact = raw.replace(/[^\d,.-]/g, "").trim();
  if (!compact) return null;
  const commaIndex = compact.lastIndexOf(",");
  const dotIndex = compact.lastIndexOf(".");
  let normalized = compact;
  if (commaIndex >= 0 && dotIndex >= 0) {
    const decimalSeparator = commaIndex > dotIndex ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    normalized = compact.split(thousandsSeparator).join("");
    if (decimalSeparator === ",") normalized = normalized.replace(",", ".");
  } else if (commaIndex >= 0) {
    normalized = compact.replace(",", ".");
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function coerceNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
  if (typeof value === "string") return normalizeAmount(value);
  return value;
}

function normalizeGeneratedCandidate(value: unknown): unknown {
  if (!isRecord(value)) return value;
  return {
    ...value,
    total_amount: coerceNumber(value.total_amount),
    currency: typeof value.currency === "string" ? value.currency.trim().toUpperCase().replace(/^€$/, "EUR") : value.currency,
    lines: Array.isArray(value.lines)
      ? value.lines.map((line) =>
          isRecord(line)
            ? {
                ...line,
                amount: coerceNumber(line.amount),
                quantity: coerceNumber(line.quantity),
                unit_price: coerceNumber(line.unit_price),
                source_page: coerceNumber(line.source_page),
                clarification: line.clarification ?? null,
                suggested_question: line.suggested_question ?? null,
                source_quote: line.source_quote ?? null,
              }
            : line
        )
      : value.lines,
  };
}

function extractDocumentAmounts(text: string) {
  const amounts = new Set<number>();
  const patterns = [
    /(\d{1,6}(?:[ .]\d{3})*[,.]\d{2})\s*(?:€|EUR|CHF|USD|GBP|\$|£)/giu,
    /(?:€|EUR|CHF|USD|GBP|\$|£)\s*(\d{1,6}(?:[ .]\d{3})*[,.]\d{2})/giu,
    /\b(\d{1,6}[,.]\d{2})\b/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const amount = normalizeAmount(match[1]);
      if (amount !== null) amounts.add(amount);
    }
  }
  return amounts;
}

function isAmountPresent(amounts: Set<number>, value: number) {
  return [...amounts].some((candidate) => Math.abs(candidate - value) <= 0.02);
}

function sanitizeNarrative(value: string, fallback: string) {
  return FORBIDDEN_VERDICT_PATTERN.test(value) || FORBIDDEN_MEDICAL_PATTERN.test(value) ? fallback : value;
}

function sanitizePreview(preview: PreviewPayload, sourceText: string, ocrConfidence: number | null, emergencyContext: boolean) {
  const sourceAmounts = extractDocumentAmounts(sourceText);
  const lowOcrConfidence = ocrConfidence !== null && ocrConfidence < 0.72;
  const veryLowOcrConfidence = ocrConfidence !== null && ocrConfidence < 0.6;
  const lines = preview.lines.map((line) => {
    const amountIsValid = line.amount === null || isAmountPresent(sourceAmounts, line.amount);
    const explanation = sanitizeNarrative(line.explanation, SAFE_EXPLANATION);
    const elementsToConfirm = line.elements_to_confirm.map((item) =>
      sanitizeNarrative(item, "Demandez à la clinique de préciser ce qui est inclus dans cette prestation.")
    );
    return {
      ...line,
      amount: amountIsValid ? line.amount : null,
      explanation,
      explicit_elements: line.explicit_elements.map((item) => sanitizeNarrative(item, "Information lisible dans le document.")),
      elements_to_confirm: elementsToConfirm,
      suggested_question: line.suggested_question
        ? sanitizeNarrative(line.suggested_question, "Pourriez-vous me préciser ce qui est inclus dans cette prestation ?")
        : null,
      confidence: !amountIsValid || veryLowOcrConfidence ? ("low" as const) : lowOcrConfidence && line.confidence === "high" ? ("medium" as const) : line.confidence,
      clarification: !amountIsValid
        ? line.clarification || "Le montant associé à cette ligne doit être vérifié sur le document original."
        : line.clarification
          ? sanitizeNarrative(line.clarification, "Demandez à la clinique de préciser ce qui est inclus dans cette prestation.")
          : null,
    };
  });
  const totalAmount = preview.total_amount !== null && isAmountPresent(sourceAmounts, preview.total_amount) ? preview.total_amount : null;
  const warnings = unique([
    "Cet aperçu explique un document et ne constitue pas un avis vétérinaire.",
    ...preview.warnings.map((item) => sanitizeNarrative(item, "Certaines informations doivent être vérifiées sur le document original.")),
    lowOcrConfidence ? "Certaines zones du document sont difficiles à lire et doivent être vérifiées sur l’original." : null,
    emergencyContext ? "Le dossier est signalé comme urgent : les soins ne doivent pas être retardés dans l’attente du rapport." : null,
  ]).slice(0, 10);
  return previewSchema.parse({
    ...preview,
    total_amount: totalAmount,
    summary: sanitizeNarrative(preview.summary, "Le document a été lu et ses principales prestations ont été organisées pour préparer votre échange avec la clinique."),
    lines,
    clarifications: preview.clarifications.map((item) => sanitizeNarrative(item, "Demandez à la clinique de préciser ce qui est inclus dans cette prestation.")),
    questions: preview.questions.map((item) => sanitizeNarrative(item, "Pourriez-vous me préciser ce qui est inclus dans cette prestation ?")),
    variation_factors: preview.variation_factors.map((item) => sanitizeNarrative(item, "Détail et conditions de réalisation de la prestation")),
    price_context: sanitizeNarrative(preview.price_context, SAFE_PRICE_CONTEXT),
    warnings,
  });
}

const requestedShape = {
  intervention: "objet principal du document, sans inventer",
  total_amount: null,
  currency: "EUR",
  summary: "résumé concret en 2 à 4 phrases de ce que prévoit le devis ou de ce que construit la facture",
  categories: ["catégories réellement présentes"],
  lines: [
    {
      original_label: "libellé exact lu sur le document",
      category: "catégorie simple",
      amount: null,
      quantity: null,
      unit_price: null,
      explanation: "vulgarisation neutre et précise du terme",
      explicit_elements: ["ce qui est clairement écrit pour cette ligne"],
      elements_to_confirm: ["ce que le document ne précise pas"],
      suggested_question: "question coopérative directement liée à cette ligne",
      source_page: 1,
      source_quote: "court extrait exact du texte OCR contenant le libellé ou le montant",
      reading_status: "clear",
      confidence: "high",
      clarification: null,
    },
  ],
  clarifications: ["points concrets à faire préciser"],
  questions: ["5 à 8 questions personnalisées à poser à la clinique"],
  variation_factors: ["éléments du document qui peuvent faire évoluer le total, sans jugement de prix"],
  price_context: "lecture factuelle du montant et de sa composition, sans verdict",
  warnings: ["limites documentaires et urgence éventuelle"],
};

function compactProviderError(raw: string) {
  const compact = raw.replace(/\s+/g, " ").trim().slice(0, 700);
  if (!compact) return "empty provider response";
  try {
    const parsed = JSON.parse(compact) as { message?: unknown; error?: { message?: unknown; code?: unknown; type?: unknown } | string };
    const nested = typeof parsed.error === "object" && parsed.error !== null ? parsed.error : null;
    return JSON.stringify({
      message: typeof nested?.message === "string" ? nested.message : typeof parsed.message === "string" ? parsed.message : typeof parsed.error === "string" ? parsed.error : undefined,
      code: nested && typeof nested.code === "string" ? nested.code : undefined,
      type: nested && typeof nested.type === "string" ? nested.type : undefined,
    });
  } catch {
    return compact;
  }
}

function resolveDeepSeekModel() {
  const configured = process.env.DEEPSEEK_MODEL?.trim();
  if (!configured) return DEFAULT_DEEPSEEK_MODEL;
  const normalized = configured.toLowerCase();
  if (normalized === "deepseek-v4-flash" || normalized === "deepseek-v4-pro") return normalized;
  if (normalized === "deepseek-chat" || normalized === "deepseek-reasoner") {
    console.warn("[PREVIEW] Retired DeepSeek model replaced", {
      configuredModel: configured,
      resolvedModel: DEFAULT_DEEPSEEK_MODEL,
    });
    return DEFAULT_DEEPSEEK_MODEL;
  }
  console.warn("[PREVIEW] Unknown DeepSeek model replaced", {
    configuredModel: configured,
    resolvedModel: DEFAULT_DEEPSEEK_MODEL,
  });
  return DEFAULT_DEEPSEEK_MODEL;
}

async function generateWithDeepSeek(input: {
  anonymizedDocument: string;
  safeContext: string;
  safeQuestion: string;
  species: GeneratePreviewInput["species"];
  documentType: GeneratePreviewInput["documentType"];
  emergencyContext: boolean;
}) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    console.error("[PREVIEW] DEEPSEEK_API_KEY is missing");
    return null;
  }
  const model = resolveDeepSeekModel();
  const systemPrompt = `Tu lis uniquement le texte OCR anonymisé d’un devis ou d’une facture vétérinaire pour en préparer une explication documentaire traçable.
Réponds exclusivement avec un objet JSON valide.
Règles absolues :
- aucun diagnostic, avis médical ou recommandation de traitement ;
- aucun jugement sur la nécessité d’un acte ;
- ne dis jamais qu’un prix est normal, anormal, cohérent, raisonnable, trop cher ou bon marché ;
- n’invente aucune ligne, aucun montant, aucune inclusion ni aucune page ;
- une entrée dans lines pour chaque prestation tarifée lisible, sans inclure le total général comme prestation ;
- conserve le libellé exact, le montant, la quantité et le prix unitaire lorsqu’ils sont lisibles ;
- source_page doit correspondre aux marqueurs --- PAGE X --- ;
- source_quote doit être un court extrait strictement présent dans le texte OCR ;
- explicit_elements contient seulement ce qui est écrit ;
- elements_to_confirm contient seulement les informations absentes ou ambiguës ;
- reading_status vaut clear, uncertain, missing ou possibly_included ;
- questions coopératives, spécifiques et non accusatoires ;
- aucun raisonnement ni markdown hors JSON.`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS);
  try {
    const baseUrl = (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        thinking: { type: "disabled" },
        temperature: 0.05,
        max_tokens: DEEPSEEK_MAX_TOKENS,
        stream: false,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Espèce : ${input.species}.\nType déclaré : ${input.documentType}.\nUrgence déclarée : ${input.emergencyContext ? "oui" : "non"}.\nContexte anonymisé : ${input.safeContext || "non renseigné"}.\nQuestion anonymisée : ${input.safeQuestion || "non renseignée"}.\n\nTexte OCR anonymisé :\n${input.anonymizedDocument}\n\nRetourne exactement cette structure, en remplaçant les exemples uniquement par les informations réellement présentes :\n${JSON.stringify(requestedShape)}`,
          },
        ],
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      const providerBody = await response.text();
      console.error("[PREVIEW] DeepSeek request failed", { status: response.status, model, requestId: response.headers.get("x-request-id") ?? response.headers.get("request-id"), providerError: compactProviderError(providerBody) });
      return null;
    }
    const payload = (await response.json()) as { choices?: Array<{ finish_reason?: string | null; message?: { content?: string | null } }> };
    const choice = payload.choices?.[0];
    const content = choice?.message?.content;
    if (!content?.trim()) {
      console.error("[PREVIEW] DeepSeek returned empty content", { model, finishReason: choice?.finish_reason ?? null });
      return null;
    }
    const parsed = previewSchema.safeParse(normalizeGeneratedCandidate(extractJson(content)));
    if (!parsed.success) {
      console.error("[PREVIEW] Invalid DeepSeek response", { model, issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code, message: issue.message })) });
      return null;
    }
    console.info("[PREVIEW] DeepSeek completed", { model, lineCount: parsed.data.lines.length, totalAmount: parsed.data.total_amount });
    return parsed.data;
  } catch (error) {
    console.error("[PREVIEW] DeepSeek generation failed", { model, errorName: error instanceof Error ? error.name : "unknown", errorMessage: error instanceof Error ? error.message : "unknown" });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generatePreview(input: GeneratePreviewInput): Promise<PreviewPayload> {
  const mockEnabled = isDevelopmentMockEnabled();
  const ocr = await extractDocumentText({ fileBuffer: input.fileBuffer, mimeType: input.mimeType });
  if (!ocr) {
    if (mockEnabled) return buildFallbackPreview(input);
    throw new Error("PIPELINE_OCR_FAILED");
  }
  const anonymizedDocument = anonymizeDocumentText(ocr.text, input.petName);
  const safeContext = anonymizeFreeText(input.userDescription ?? "", input.petName);
  const safeQuestion = anonymizeFreeText(input.primaryQuestion ?? "", input.petName);
  const generated = await generateWithDeepSeek({
    anonymizedDocument: anonymizedDocument.text,
    safeContext: safeContext.text,
    safeQuestion: safeQuestion.text,
    species: input.species,
    documentType: input.documentType,
    emergencyContext: input.emergencyContext,
  });
  if (!generated) {
    if (mockEnabled) return buildFallbackPreview(input);
    throw new Error("PIPELINE_DEEPSEEK_FAILED");
  }
  const sanitized = sanitizePreview(generated, anonymizedDocument.text, ocr.averageConfidence, input.emergencyContext);
  const enriched = enrichPreviewWithTraceability({
    preview: sanitized,
    sourceText: anonymizedDocument.text,
    pageCount: ocr.pageCount,
    ocrConfidence: ocr.averageConfidence,
    documentType: input.documentType,
    petName: input.petName,
  });
  console.info("[PREVIEW] Secure traceable pipeline completed", {
    ocrProvider: ocr.provider,
    ocrModel: ocr.model,
    pageCount: ocr.pageCount,
    lineCount: enriched.lines.length,
    totalAmount: enriched.total_amount,
    readability: enriched.document_readability,
    sourcedLines: enriched.lines.filter((line) => line.source_page && line.source_quote).length,
    redactionCount: anonymizedDocument.redactionCount + safeContext.redactionCount + safeQuestion.redactionCount,
    deepseekModel: resolveDeepSeekModel(),
    thinkingMode: "disabled",
  });
  return enriched;
}
