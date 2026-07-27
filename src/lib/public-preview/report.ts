import "server-only";
import { loadPublicPreview } from "./data";
import { previewSchema, type PreviewLine, type PreviewPayload } from "./types";

export type PublicPreviewData = NonNullable<Awaited<ReturnType<typeof loadPublicPreview>>>;

export type ReportPet = {
  id: string;
  name: string;
  species: string;
};

export type CategoryTotal = {
  category: string;
  amount: number;
};

export type ReportViewModel = {
  preview: PreviewPayload;
  pet: ReportPet | null;
  paid: boolean;
  documentLabel: "Devis" | "Facture";
  createdAt: string;
  summaryParagraph: string;
  keyFacts: string[];
  clearlyIndicated: string[];
  toConfirm: string[];
  conclusion: string;
  categoryTotals: CategoryTotal[];
  representativeLine: PreviewLine;
};

export function firstRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export function formatMoney(amount: number | null, currency = "EUR") {
  if (amount === null || !Number.isFinite(amount)) return "Montant à confirmer";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount);
}

export function getPreviewPet(data: PublicPreviewData): ReportPet | null {
  return firstRelation(data.caseRow.pets as ReportPet | ReportPet[] | null);
}

export function isPreviewPaid(data: PublicPreviewData) {
  return data.caseRow.payment_status === "succeeded" || data.payment?.status === "succeeded";
}

export function payloadFromStoredData(data: PublicPreviewData): PreviewPayload {
  const pet = getPreviewPet(data);
  const raw = previewSchema.safeParse(data.report?.ai_raw_output);
  if (raw.success) return raw.data;

  const questions = Array.isArray(data.report?.questions_to_ask)
    ? (data.report.questions_to_ask as string[])
    : [];
  const factors = Array.isArray(data.report?.price_variation_factors)
    ? (data.report.price_variation_factors as string[])
    : [];
  const composition = data.report?.amount_composition as {
    categories?: string[];
    intervention?: string;
  } | null;

  return previewSchema.parse({
    intervention:
      composition?.intervention ||
      `${data.caseRow.document_type === "facture" ? "Facture" : "Devis"} vétérinaire`,
    total_amount: data.caseRow.detected_total_amount,
    currency: data.caseRow.currency || "EUR",
    summary:
      data.report?.summary ||
      `Le document de ${pet?.name || "votre animal"} a été lu et organisé.`,
    categories: composition?.categories?.length
      ? composition.categories
      : ["Prestations vétérinaires"],
    lines: data.items.length
      ? data.items.map((item) => ({
          original_label: item.original_label,
          category: item.category || "Prestation",
          amount: item.total_price,
          explanation:
            item.explanation || "Cette ligne sera détaillée dans le rapport complet.",
          confidence: item.confidence_score || "medium",
          clarification: item.clarification_needed,
        }))
      : [
          {
            original_label: "Document reçu",
            category: "Informations générales",
            amount: null,
            explanation: "Le document est enregistré et sera vérifié avant livraison.",
            confidence: "medium",
            clarification: null,
          },
        ],
    clarifications: data.items
      .map((item) => item.clarification_needed)
      .filter((item): item is string => Boolean(item)),
    questions,
    variation_factors: factors,
    price_context:
      "Le montant est présenté de façon factuelle, sans jugement sur le tarif ni sur la nécessité des soins.",
    warnings: data.report?.limitations ? [data.report.limitations] : [],
  });
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function representativeScore(line: PreviewLine) {
  const text = `${line.original_label} ${line.category} ${line.explanation}`.toLowerCase();
  const complexTerms = [
    "anesth",
    "chirurg",
    "hospital",
    "radiograph",
    "échograph",
    "analyse",
    "bilan",
    "médicament",
    "perfusion",
    "surveillance",
  ];
  const complexity = complexTerms.reduce((score, term) => score + (text.includes(term) ? 18 : 0), 0);
  return complexity + (line.clarification ? 35 : 0) + Math.min(line.explanation.length / 12, 25);
}

export function selectRepresentativeLine(lines: PreviewLine[]): PreviewLine {
  return [...lines].sort((a, b) => representativeScore(b) - representativeScore(a))[0] ?? lines[0]!;
}

function buildCategoryTotals(preview: PreviewPayload): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const line of preview.lines) {
    if (line.amount === null || !Number.isFinite(line.amount)) continue;
    const category = line.category.trim() || "Autres prestations";
    totals.set(category, (totals.get(category) ?? 0) + line.amount);
  }

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildReportViewModel(data: PublicPreviewData): ReportViewModel {
  const preview = payloadFromStoredData(data);
  const pet = getPreviewPet(data);
  const paid = isPreviewPaid(data);
  const documentLabel = data.caseRow.document_type === "facture" ? "Facture" : "Devis";
  const amountLabel = formatMoney(preview.total_amount, preview.currency);
  const lineClarifications = preview.lines.map((line) => line.clarification);
  const toConfirm = unique([...preview.clarifications, ...lineClarifications]);
  const categoryTotals = buildCategoryTotals(preview);
  const highestLine = [...preview.lines]
    .filter((line) => line.amount !== null && Number.isFinite(line.amount))
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0];

  const clearlyIndicated = unique([
    `${preview.lines.length} prestation${preview.lines.length > 1 ? "s" : ""} identifiée${preview.lines.length > 1 ? "s" : ""} dans le document.`,
    preview.total_amount !== null ? `Montant total indiqué : ${amountLabel}.` : null,
    highestLine && highestLine.amount !== null
      ? `Montant le plus élevé indiqué : ${highestLine.original_label} — ${formatMoney(highestLine.amount, preview.currency)}.`
      : null,
    preview.categories.length
      ? `Catégories présentes : ${preview.categories.join(", ")}.`
      : null,
  ]);

  const keyFacts = unique([
    `${preview.lines.length} ligne${preview.lines.length > 1 ? "s" : ""} comprise${preview.lines.length > 1 ? "s" : ""}`,
    preview.total_amount !== null ? `Total indiqué : ${amountLabel}` : null,
    `${toConfirm.length} point${toConfirm.length > 1 ? "s" : ""} à confirmer`,
    `${preview.questions.length} question${preview.questions.length > 1 ? "s" : ""} préparée${preview.questions.length > 1 ? "s" : ""}`,
  ]);

  const conclusion = [
    `Ce ${documentLabel.toLowerCase()} porte sur « ${preview.intervention} » et présente ${preview.lines.length} prestation${preview.lines.length > 1 ? "s" : ""}${preview.total_amount !== null ? ` pour un montant total indiqué de ${amountLabel}` : ""}.`,
    "Les explications reprennent les termes lisibles du document sans juger la nécessité médicale des soins ni le niveau du tarif.",
    toConfirm.length
      ? `${toConfirm.length} élément${toConfirm.length > 1 ? "s restent" : " reste"} à confirmer directement avec la clinique.`
      : "Aucun point de clarification majeur n’a été relevé dans les informations lisibles.",
  ].join(" ");

  return {
    preview,
    pet,
    paid,
    documentLabel,
    createdAt: data.report?.created_at || data.caseRow.created_at,
    summaryParagraph: preview.summary,
    keyFacts,
    clearlyIndicated,
    toConfirm,
    conclusion,
    categoryTotals,
    representativeLine: selectRepresentativeLine(preview.lines),
  };
}
