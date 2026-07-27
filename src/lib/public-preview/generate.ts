import "server-only";
import { anonymizeDocumentText, anonymizeFreeText } from "./anonymize";
import { extractDocumentText } from "./ocr";
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

const SAFE_PRICE_CONTEXT =
  "Il n’est pas possible de conclure de manière fiable si le montant est élevé sans connaître le contexte médical et le détail exact des prestations. Le rapport explique les postes présents et les informations à faire préciser.";

const SAFE_EXPLANATION =
  "Cette ligne correspond à une prestation mentionnée dans le document. Son contenu exact doit être confirmé avec la clinique lorsqu’il n’est pas suffisamment détaillé.";

const FORBIDDEN_VERDICT_PATTERN =
  /(?:prix\s+(?:normal|anormal)|trop\s+cher|bon\s+marché|surfactur|arnaque|abusif|injustifié)/i;
const FORBIDDEN_MEDICAL_PATTERN =
  /(?:refusez|acceptez\s+(?:le|ce)\s+soin|retardez|annulez|ne\s+faites\s+pas|ce\s+soin\s+est\s+(?:inutile|obligatoire|nécessaire)|vous\s+devez\s+(?:accepter|refuser))/i;

function buildFallbackPreview(input: GeneratePreviewInput): PreviewPayload {
  const context = input.userDescription?.trim();
  const question = input.primaryQuestion?.trim();

  return {
    intervention:
      context ||
      `${input.documentType === "devis" ? "Devis" : "Facture"} vétérinaire de ${input.petName}`,
    total_amount: null,
    currency: "EUR",
    summary: `Le document concernant ${input.petName} a bien été reçu. La lecture détaillée sera vérifiée avant la livraison du rapport complet.`,
    categories: ["Document vétérinaire", "Prestations à détailler", "Questions à préparer"],
    lines: [
      {
        original_label: "Document reçu",
        category: "Informations générales",
        amount: null,
        explanation:
          "Le fichier a été enregistré dans votre dossier privé. Les libellés et montants seront repris sans être complétés au hasard.",
        confidence: "high",
        clarification: null,
      },
      {
        original_label: context || "Contexte communiqué",
        category: "Contexte",
        amount: null,
        explanation: context
          ? "Ce contexte servira à expliquer les prestations sans juger la nécessité médicale des soins."
          : "Le rapport distinguera clairement ce qui apparaît sur le document de ce qui doit être demandé à la clinique.",
        confidence: context ? "high" : "medium",
        clarification: null,
      },
      {
        original_label: question || "Question principale",
        category: "Préparation de l’échange",
        amount: null,
        explanation: question
          ? "Le rapport répondra à cette préoccupation par des explications documentaires et des questions non accusatoires à poser au vétérinaire."
          : "Des questions personnalisées seront préparées à partir des prestations réellement présentes dans le document.",
        confidence: "medium",
        clarification: "La lecture automatique détaillée sera complétée lors de la vérification du dossier.",
      },
    ],
    clarifications: [
      "Vérifier précisément ce qui est inclus dans chaque ligne et ce qui pourrait être facturé séparément.",
      "Faire préciser les examens, médicaments, contrôles ou durées de surveillance qui ne sont pas détaillés.",
    ],
    questions: [
      "Pourriez-vous me préciser ce qui est inclus dans les principales lignes de ce document ?",
      "Quels frais supplémentaires pourraient éventuellement s’ajouter au montant indiqué ?",
      "Les médicaments, contrôles et soins après l’intervention sont-ils compris ?",
    ],
    variation_factors: [
      "Nature et complexité des prestations",
      "Anesthésie et surveillance éventuelles",
      "Examens, médicaments et hospitalisation",
    ],
    price_context: SAFE_PRICE_CONTEXT,
    warnings: [
      "Cet aperçu explique un document et ne constitue pas un avis vétérinaire.",
      input.emergencyContext
        ? "Le dossier est signalé comme urgent : les soins ne doivent pas être retardés dans l’attente du rapport."
        : "En cas d’urgence ou d’aggravation, contactez directement un vétérinaire.",
    ],
  };
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("JSON introuvable");
  return JSON.parse(withoutFence.slice(start, end + 1));
}

function normalizeAmount(raw: string) {
  const normalized = raw.replace(/[\s.](?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
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
  if (FORBIDDEN_VERDICT_PATTERN.test(value) || FORBIDDEN_MEDICAL_PATTERN.test(value)) {
    return fallback;
  }
  return value;
}

function validateAndSanitizePreview(
  preview: PreviewPayload,
  sourceText: string,
  ocrConfidence: number | null,
  emergencyContext: boolean
): PreviewPayload {
  const sourceAmounts = extractDocumentAmounts(sourceText);
  const lowOcrConfidence = ocrConfidence !== null && ocrConfidence < 0.72;
  const veryLowOcrConfidence = ocrConfidence !== null && ocrConfidence < 0.6;

  const lines = preview.lines.map((line) => {
    const amountIsValid =
      line.amount === null || isAmountPresent(sourceAmounts, Math.round(line.amount * 100) / 100);
    const unsafeExplanation =
      FORBIDDEN_VERDICT_PATTERN.test(line.explanation) ||
      FORBIDDEN_MEDICAL_PATTERN.test(line.explanation);

    return {
      ...line,
      amount: amountIsValid ? line.amount : null,
      explanation: unsafeExplanation ? SAFE_EXPLANATION : line.explanation,
      confidence:
        !amountIsValid || veryLowOcrConfidence
          ? ("low" as const)
          : lowOcrConfidence && line.confidence === "high"
            ? ("medium" as const)
            : line.confidence,
      clarification:
        !amountIsValid && !line.clarification
          ? "Le montant associé à cette ligne doit être vérifié sur le document original."
          : line.clarification,
    };
  });

  const totalAmount =
    preview.total_amount !== null && isAmountPresent(sourceAmounts, preview.total_amount)
      ? preview.total_amount
      : null;

  const warnings = [...preview.warnings];
  if (!warnings.some((warning) => /ne constitue pas un avis vétérinaire/i.test(warning))) {
    warnings.unshift("Cet aperçu explique un document et ne constitue pas un avis vétérinaire.");
  }
  if (lowOcrConfidence) {
    warnings.push(
      "Certaines zones du document sont difficiles à lire ; les lignes concernées doivent être vérifiées sur l’original."
    );
  }
  if (
    emergencyContext &&
    !warnings.some((warning) => /ne doivent pas être retardés|urgence/i.test(warning))
  ) {
    warnings.push(
      "Le dossier est signalé comme urgent : les soins ne doivent pas être retardés dans l’attente du rapport."
    );
  }

  return {
    ...preview,
    total_amount: totalAmount,
    summary: sanitizeNarrative(preview.summary, "Le document a été lu et ses principales prestations ont été organisées pour faciliter votre échange avec la clinique."),
    lines,
    clarifications: preview.clarifications.map((item) =>
      sanitizeNarrative(item, "Demandez à la clinique de préciser ce qui est inclus dans cette prestation.")
    ),
    questions: preview.questions.map((item) =>
      sanitizeNarrative(item, "Pourriez-vous me préciser ce qui est inclus dans cette prestation ?")
    ),
    variation_factors: preview.variation_factors.map((item) =>
      sanitizeNarrative(item, "Détail et conditions de réalisation de la prestation")
    ),
    price_context: sanitizeNarrative(preview.price_context, SAFE_PRICE_CONTEXT),
    warnings: [...new Set(warnings)].slice(0, 8),
  };
}

const requestedShape = {
  intervention: "type d’intervention ou objet principal du document, sans inventer",
  total_amount: "nombre ou null",
  currency: "EUR ou devise réellement indiquée",
  summary: "résumé clair en 2 à 4 phrases",
  categories: ["catégories réellement présentes"],
  lines: [
    {
      original_label: "libellé exact ou très fidèle",
      category: "catégorie simple",
      amount: "nombre ou null",
      explanation: "explication compréhensible et prudente",
      confidence: "high | medium | low",
      clarification: "question ou précision nécessaire, ou null",
    },
  ],
  clarifications: ["points concrets à faire préciser"],
  questions: ["5 à 8 questions personnalisées à poser au vétérinaire"],
  variation_factors: [
    "facteurs présents ou pertinents pouvant influencer le montant, sans fourchette de prix",
  ],
  price_context:
    "réponse qualitative à la préoccupation sur le prix, sans verdict ni comparaison chiffrée",
  warnings: ["limites et urgence éventuelle"],
};

async function generateWithDeepSeek(input: {
  anonymizedDocument: string;
  safeContext: string;
  safeQuestion: string;
  species: GeneratePreviewInput["species"];
  documentType: GeneratePreviewInput["documentType"];
  emergencyContext: boolean;
}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `Tu analyses uniquement le texte OCR anonymisé d’un devis ou d’une facture vétérinaire afin d’en expliquer le contenu à un propriétaire d’animal.
Réponds exclusivement avec un objet JSON valide.
Règles absolues :
- ne pose aucun diagnostic ;
- ne juge jamais la nécessité médicale d’un acte ;
- ne dis jamais qu’un prix est normal, anormal, trop cher ou bon marché ;
- n’accuse jamais une clinique de surfacturation ;
- n’invente aucune ligne, aucun montant ni aucune prestation ;
- conserve fidèlement les montants réellement présents ;
- distingue ce qui est lisible de ce qui est incertain ;
- traite les marqueurs entre crochets comme des informations volontairement masquées ;
- ne tente jamais de reconstruire une identité masquée ;
- si une information est illisible, écris-le explicitement ;
- formule les questions de façon coopérative et non accusatoire ;
- aucun raisonnement, commentaire ou markdown hors de l’objet JSON.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const baseUrl = (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
        thinking: { type: "disabled" },
        temperature: 0.1,
        max_tokens: 3500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Espèce : ${input.species}.\nType de document : ${input.documentType}.\nUrgence déclarée : ${input.emergencyContext ? "oui" : "non"}.\nContexte anonymisé : ${input.safeContext || "non renseigné"}.\nQuestion anonymisée : ${input.safeQuestion || "non renseignée"}.\n\nTexte OCR anonymisé :\n${input.anonymizedDocument}\n\nRetourne exactement cette structure JSON :\n${JSON.stringify(requestedShape)}`,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("[PREVIEW] DeepSeek request failed", response.status);
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          reasoning_content?: string | null;
        };
      }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = previewSchema.safeParse(extractJson(content));
    if (!parsed.success) {
      console.error(
        "[PREVIEW] Invalid DeepSeek response",
        parsed.error.issues.map((issue) => issue.path.join("."))
      );
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error(
      "[PREVIEW] DeepSeek generation failed",
      error instanceof Error ? error.name : "unknown"
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generatePreview(input: GeneratePreviewInput): Promise<PreviewPayload> {
  const ocr = await extractDocumentText({
    fileBuffer: input.fileBuffer,
    mimeType: input.mimeType,
  });
  if (!ocr) return buildFallbackPreview(input);

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
  if (!generated) return buildFallbackPreview(input);

  const validated = validateAndSanitizePreview(
    generated,
    anonymizedDocument.text,
    ocr.averageConfidence,
    input.emergencyContext
  );

  console.info("[PREVIEW] Secure pipeline completed", {
    ocrProvider: ocr.provider,
    ocrModel: ocr.model,
    pageCount: ocr.pageCount,
    redactionCount:
      anonymizedDocument.redactionCount +
      safeContext.redactionCount +
      safeQuestion.redactionCount,
    deepseekModel: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
    thinkingMode: "disabled",
  });

  return validated;
}
