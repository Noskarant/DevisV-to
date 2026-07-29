import "server-only";
import { loadPublicPreview } from "./data";
import {
  previewSchema,
  type DocumentCheck,
  type PreviewLine,
  type PreviewPayload,
} from "./types";

export type PublicPreviewData = NonNullable<Awaited<ReturnType<typeof loadPublicPreview>>>;

export type ReportPet = {
  id: string;
  name: string;
  species: string;
};

export type CategoryTotal = {
  category: string;
  amount: number;
  percentage: number | null;
};

export type ComparisonSummary = {
  totalDelta: number | null;
  added: string[];
  removed: string[];
  changed: Array<{ label: string; before: number | null; after: number | null }>;
  resolvedClarifications: number;
  remainingClarifications: number;
};

export type ReviewState = {
  label: string;
  detail: string;
  reviewedAt: string | null;
  version: number;
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
  documentChecks: DocumentCheck[];
  priorityQuestions: string[];
  emailSubject: string | null;
  emailBody: string | null;
  reviewState: ReviewState;
  sourceCoverage: number;
  comparison: ComparisonSummary | null;
  revisionEligibleUntil: string | null;
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

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
}

export function payloadFromStoredData(data: PublicPreviewData): PreviewPayload {
  const pet = getPreviewPet(data);
  const raw = previewSchema.safeParse(data.report?.ai_raw_output);
  if (raw.success) return raw.data;

  const questions = stringArray(data.report?.questions_to_ask);
  const factors = stringArray(data.report?.price_variation_factors);
  const composition = data.report?.amount_composition as { categories?: string[]; intervention?: string } | null;
  return previewSchema.parse({
    intervention: composition?.intervention || `${data.caseRow.document_type === "facture" ? "Facture" : "Devis"} vétérinaire`,
    total_amount: data.caseRow.detected_total_amount,
    currency: data.caseRow.currency || "EUR",
    summary: data.report?.summary || `Le document de ${pet?.name || "votre animal"} a été lu et organisé.`,
    categories: composition?.categories?.length ? composition.categories : ["Prestations vétérinaires"],
    lines: data.items.length
      ? data.items.map((item) => ({
          original_label: item.original_label,
          category: item.category || "Prestation",
          amount: item.total_price,
          quantity: item.quantity,
          unit_price: item.unit_price,
          explanation: item.explanation || "Cette ligne sera détaillée dans le rapport complet.",
          explicit_elements: stringArray(item.explicit_elements),
          elements_to_confirm: stringArray(item.elements_to_confirm),
          suggested_question: item.suggested_question,
          source_page: item.source_page,
          source_quote: item.source_quote,
          reading_status: item.reading_status || "uncertain",
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
    clarifications: data.items.map((item) => item.clarification_needed).filter((item): item is string => Boolean(item)),
    questions,
    priority_questions: stringArray(data.report?.priority_questions),
    variation_factors: factors,
    price_context: "Le montant est présenté de façon factuelle, sans jugement sur le tarif ni sur la nécessité des soins.",
    warnings: data.report?.limitations ? [data.report.limitations] : [],
    document_checks: Array.isArray(data.report?.document_checks) ? data.report.document_checks : [],
    page_count: data.report?.source_page_count || data.document?.page_count || null,
    document_readability: data.report?.document_readability || "usable",
    email_subject: data.report?.generated_email_subject || null,
    email_body: data.report?.generated_email_body || null,
  });
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function representativeScore(line: PreviewLine, maxAmount: number) {
  const text = `${line.original_label} ${line.category} ${line.explanation}`.toLowerCase();
  const complexTerms = ["anesth", "chirurg", "hospital", "radiograph", "échograph", "analyse", "bilan", "médicament", "perfusion", "surveillance", "biops", "imagerie"];
  const obviousTerms = ["consultation", "collerette", "frais de dossier"];
  const complexity = complexTerms.reduce((score, term) => score + (text.includes(term) ? 18 : 0), 0);
  const obviousPenalty = obviousTerms.some((term) => text.includes(term)) ? 35 : 0;
  const relativeAmount = line.amount !== null && maxAmount > 0 ? Math.min((line.amount / maxAmount) * 30, 30) : 0;
  const ambiguity = line.elements_to_confirm.length || line.clarification ? 32 : 0;
  const actionability = line.suggested_question ? 26 : 0;
  const evidence = line.source_page && line.source_quote ? 20 : 0;
  return complexity + relativeAmount + ambiguity + actionability + evidence - obviousPenalty;
}

export function selectRepresentativeLine(lines: PreviewLine[]): PreviewLine {
  const maxAmount = Math.max(...lines.map((line) => line.amount ?? 0), 0);
  return [...lines].sort((a, b) => representativeScore(b, maxAmount) - representativeScore(a, maxAmount))[0] ?? lines[0]!;
}

function buildCategoryTotals(preview: PreviewPayload): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const line of preview.lines) {
    if (line.amount === null || !Number.isFinite(line.amount)) continue;
    const category = line.category.trim() || "Autres prestations";
    totals.set(category, (totals.get(category) ?? 0) + line.amount);
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage: preview.total_amount && preview.total_amount > 0 ? Math.round((amount / preview.total_amount) * 1000) / 10 : null,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function normalizeLabel(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildComparison(data: PublicPreviewData, preview: PreviewPayload, toConfirm: string[]): ComparisonSummary | null {
  if (!data.comparison) return null;
  const previousRaw = data.comparison.report?.ai_raw_output;
  const previousParsed = previewSchema.safeParse(previousRaw);
  const previousLines = previousParsed.success
    ? previousParsed.data.lines
    : data.comparison.items.map((item) => ({ original_label: item.original_label, amount: item.total_price, clarification: item.clarification_needed }));
  const before = new Map(previousLines.map((line) => [normalizeLabel(line.original_label), line]));
  const after = new Map(preview.lines.map((line) => [normalizeLabel(line.original_label), line]));
  const added = preview.lines.filter((line) => !before.has(normalizeLabel(line.original_label))).map((line) => line.original_label);
  const removed = previousLines.filter((line) => !after.has(normalizeLabel(line.original_label))).map((line) => line.original_label);
  const changed = preview.lines.flatMap((line) => {
    const previous = before.get(normalizeLabel(line.original_label));
    if (!previous || previous.amount === line.amount) return [];
    return [{ label: line.original_label, before: previous.amount ?? null, after: line.amount }];
  });
  const previousClarifications = previousParsed.success
    ? unique([...previousParsed.data.clarifications, ...previousParsed.data.lines.flatMap((line) => [line.clarification, ...line.elements_to_confirm])])
    : unique(previousLines.map((line) => line.clarification));
  const currentTotal = preview.total_amount;
  const previousTotal = previousParsed.success ? previousParsed.data.total_amount : data.comparison.caseRow.detected_total_amount;
  return {
    totalDelta: currentTotal !== null && previousTotal !== null ? Math.round((currentTotal - previousTotal) * 100) / 100 : null,
    added,
    removed,
    changed,
    resolvedClarifications: Math.max(previousClarifications.length - toConfirm.length, 0),
    remainingClarifications: toConfirm.length,
  };
}

function buildReviewState(data: PublicPreviewData, paid: boolean): ReviewState {
  const reviewedAt = data.report?.reviewed_at || null;
  const version = Number(data.report?.version || 1);
  if (reviewedAt) {
    return {
      label: `Vérifié le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(reviewedAt))}`,
      detail: "La fidélité de cette version au document transmis a été contrôlée. Ce contrôle n’est pas une validation médicale.",
      reviewedAt,
      version,
    };
  }
  if (paid) {
    return {
      label: "Vérification documentaire en attente",
      detail: "Le rapport existe déjà. Une personne doit encore contrôler la correspondance des lignes et des montants avec le document.",
      reviewedAt: null,
      version,
    };
  }
  return {
    label: "Analyse automatique terminée",
    detail: "Le document a été extrait, structuré et contrôlé par des règles factuelles. La vérification humaine fait partie du rapport complet.",
    reviewedAt: null,
    version,
  };
}

function revisionDeadline(data: PublicPreviewData, paid: boolean) {
  if (!paid || data.caseRow.entitlement_source === "revision_comparison") return null;
  const start = data.caseRow.access_granted_at ? new Date(data.caseRow.access_granted_at).getTime() : NaN;
  if (!Number.isFinite(start)) return null;
  const deadline = start + 7 * 24 * 60 * 60 * 1000;
  return deadline > Date.now() ? new Date(deadline).toISOString() : null;
}

export function buildReportViewModel(data: PublicPreviewData): ReportViewModel {
  const preview = payloadFromStoredData(data);
  const pet = getPreviewPet(data);
  const paid = isPreviewPaid(data);
  const documentLabel = data.caseRow.document_type === "facture" ? "Facture" : "Devis";
  const amountLabel = formatMoney(preview.total_amount, preview.currency);
  const toConfirm = unique([
    ...preview.clarifications,
    ...preview.lines.flatMap((line) => [line.clarification, ...line.elements_to_confirm]),
  ]);
  const categoryTotals = buildCategoryTotals(preview);
  const highestLine = [...preview.lines].filter((line) => line.amount !== null).sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0];
  const clearlyIndicated = unique([
    `${preview.lines.length} prestation${preview.lines.length > 1 ? "s" : ""} identifiée${preview.lines.length > 1 ? "s" : ""}.`,
    preview.total_amount !== null ? `Montant total indiqué : ${amountLabel}.` : null,
    highestLine?.amount !== null && highestLine ? `Poste au montant le plus élevé : ${highestLine.original_label} — ${formatMoney(highestLine.amount, preview.currency)}.` : null,
    preview.page_count ? `Document de ${preview.page_count} page${preview.page_count > 1 ? "s" : ""}.` : null,
  ]);
  const keyFacts = unique([
    preview.total_amount !== null ? `${amountLabel} au total` : "Total à confirmer",
    `${preview.lines.length} prestation${preview.lines.length > 1 ? "s" : ""} reconnue${preview.lines.length > 1 ? "s" : ""}`,
    `${toConfirm.length} élément${toConfirm.length > 1 ? "s" : ""} à confirmer`,
    `${preview.questions.length} question${preview.questions.length > 1 ? "s" : ""} préparée${preview.questions.length > 1 ? "s" : ""}`,
  ]);
  const conclusion = [
    `Ce ${documentLabel.toLowerCase()} porte sur « ${preview.intervention} » et présente ${preview.lines.length} prestation${preview.lines.length > 1 ? "s" : ""}${preview.total_amount !== null ? ` pour un total indiqué de ${amountLabel}` : ""}.`,
    "Les explications sont reliées aux libellés du document et restent strictement documentaires.",
    toConfirm.length ? `${toConfirm.length} élément${toConfirm.length > 1 ? "s restent" : " reste"} à demander directement à la clinique.` : "Aucun point de clarification majeur n’a été relevé dans les informations lisibles.",
  ].join(" ");
  const sourcedCount = preview.lines.filter((line) => line.source_page && line.source_quote).length;
  const priorityQuestions = preview.priority_questions.length ? preview.priority_questions : preview.questions.slice(0, 3);

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
    documentChecks: preview.document_checks,
    priorityQuestions,
    emailSubject: preview.email_subject,
    emailBody: preview.email_body,
    reviewState: buildReviewState(data, paid),
    sourceCoverage: preview.lines.length ? Math.round((sourcedCount / preview.lines.length) * 100) : 0,
    comparison: buildComparison(data, preview, toConfirm),
    revisionEligibleUntil: revisionDeadline(data, paid),
  };
}
