import "server-only";
import type { DocumentCheck, PreviewLine, PreviewPayload, ReadingStatus } from "./types";

type PageSource = { page: number; text: string };

type EnrichInput = {
  preview: PreviewPayload;
  sourceText: string;
  pageCount: number;
  ocrConfidence: number | null;
  documentType: "devis" | "facture";
  petName: string;
};

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parsePages(sourceText: string): PageSource[] {
  const matches = [...sourceText.matchAll(/--- PAGE (\d+) ---\n([\s\S]*?)(?=\n\n--- PAGE \d+ ---|$)/g)];
  if (!matches.length) return [{ page: 1, text: sourceText }];
  return matches.map((match) => ({ page: Number(match[1]), text: match[2]?.trim() ?? "" }));
}

function amountNeedles(amount: number | null) {
  if (amount === null || !Number.isFinite(amount)) return [];
  const fixed = amount.toFixed(2);
  return unique([
    fixed,
    fixed.replace(".", ","),
    fixed.replace(/\.00$/, ""),
    fixed.replace(".", ",").replace(/,00$/, ""),
  ]);
}

function bestSource(line: PreviewLine, pages: PageSource[]) {
  const label = normalized(line.original_label);
  const labelWords = label.split(" ").filter((word) => word.length >= 4);
  const amounts = amountNeedles(line.amount);
  let best: { page: number; quote: string; score: number } | null = null;

  for (const page of pages) {
    const sourceLines = page.text.split("\n").map((value) => value.trim()).filter(Boolean);
    for (const sourceLine of sourceLines) {
      const candidate = normalized(sourceLine);
      const labelMatch = label && candidate.includes(label);
      const wordMatches = labelWords.filter((word) => candidate.includes(word)).length;
      const amountMatch = amounts.some((amount) => sourceLine.includes(amount));
      const score = (labelMatch ? 100 : 0) + wordMatches * 14 + (amountMatch ? 35 : 0);
      if (score > (best?.score ?? 0) && score >= 35) {
        best = { page: page.page, quote: sourceLine.slice(0, 420), score };
      }
    }
  }

  return best;
}

function safeReadingStatus(line: PreviewLine, sourceFound: boolean): ReadingStatus {
  if (line.reading_status === "missing" || line.reading_status === "possibly_included") return line.reading_status;
  if (!sourceFound || line.confidence === "low") return "uncertain";
  return line.confidence === "high" ? "clear" : "uncertain";
}

function enrichLine(line: PreviewLine, pages: PageSource[], fallbackQuestion?: string): PreviewLine {
  const source = bestSource(line, pages);
  const sourcePage = line.source_page && line.source_page <= pages.length ? line.source_page : source?.page ?? null;
  const suppliedQuote = line.source_quote?.trim() || null;
  const quoteIsVerifiable = suppliedQuote
    ? pages.some((page) => normalized(page.text).includes(normalized(suppliedQuote)))
    : false;
  const sourceQuote = quoteIsVerifiable ? suppliedQuote : source?.quote ?? null;
  const sourceFound = Boolean(sourcePage && sourceQuote);
  const elementsToConfirm = unique([
    ...line.elements_to_confirm,
    line.clarification,
  ]).slice(0, 8);
  const explicitElements = line.explicit_elements.length
    ? unique(line.explicit_elements).slice(0, 8)
    : unique([
        sourceFound ? `Libellé retrouvé page ${sourcePage}.` : null,
        line.amount !== null ? `Montant associé lisible : ${line.amount.toFixed(2).replace(".", ",")} €.` : null,
      ]);

  return {
    ...line,
    source_page: sourcePage,
    source_quote: sourceQuote,
    reading_status: safeReadingStatus(line, sourceFound),
    explicit_elements: explicitElements,
    elements_to_confirm: elementsToConfirm,
    suggested_question: line.suggested_question || fallbackQuestion || null,
    clarification: elementsToConfirm[0] ?? line.clarification,
  };
}

function checkSum(lines: PreviewLine[], total: number | null, currency: string): DocumentCheck {
  const amounts = lines.map((line) => line.amount).filter((value): value is number => value !== null && Number.isFinite(value));
  const sum = Math.round(amounts.reduce((acc, value) => acc + value, 0) * 100) / 100;
  const money = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);
  if (!amounts.length) {
    return { key: "sum", label: "Somme des lignes", status: "info", detail: "Aucun montant individuel exploitable n’a pu être additionné." };
  }
  if (total === null) {
    return { key: "sum", label: "Somme des lignes", status: "info", detail: `Les montants individuels lisibles totalisent ${money(sum)}, mais aucun total général fiable n’a été identifié.` };
  }
  const difference = Math.round((total - sum) * 100) / 100;
  if (Math.abs(difference) <= 0.03) {
    return { key: "sum", label: "Somme des lignes", status: "ok", detail: `La somme des montants détectés correspond au total indiqué : ${money(total)}.` };
  }
  return {
    key: "sum",
    label: "Écart entre les lignes et le total",
    status: "attention",
    detail: `Les montants individuels détectés totalisent ${money(sum)}, contre ${money(total)} indiqué au total. Une taxe, une remise, un acompte ou une ligne globale peut expliquer l’écart de ${money(Math.abs(difference))}.`,
  };
}

function buildChecks(preview: PreviewPayload, sourceText: string, documentType: "devis" | "facture"): DocumentCheck[] {
  const checks: DocumentCheck[] = [checkSum(preview.lines, preview.total_amount, preview.currency)];
  const linesWithoutAmount = preview.lines.filter((line) => line.amount === null);
  checks.push({
    key: "missing_amounts",
    label: "Montants individuels",
    status: linesWithoutAmount.length ? "attention" : "ok",
    detail: linesWithoutAmount.length
      ? `${linesWithoutAmount.length} ligne${linesWithoutAmount.length > 1 ? "s n’ont" : " n’a"} pas de montant individuel isolé.`
      : "Chaque prestation extraite possède un montant individuel lisible.",
  });

  const counts = new Map<string, number>();
  for (const line of preview.lines) {
    const key = normalized(line.original_label);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const duplicateCount = [...counts.values()].filter((count) => count > 1).length;
  checks.push({
    key: "duplicates",
    label: "Libellés répétés",
    status: duplicateCount ? "attention" : "ok",
    detail: duplicateCount
      ? `${duplicateCount} libellé${duplicateCount > 1 ? "s apparaissent" : " apparaît"} plusieurs fois. Cela peut correspondre à des actes distincts et doit être lu dans son contexte.`
      : "Aucun libellé identique répété n’a été détecté.",
  });

  const normalizedSource = normalized(sourceText);
  const hasRange = /\d[\d .]*[,.]\d{2}\s*(?:a|à|jusqu a|[-–])\s*\d[\d .]*[,.]\d{2}/i.test(sourceText);
  checks.push({
    key: "range",
    label: "Fourchette de montant",
    status: "info",
    detail: hasRange ? "Une fourchette ou plusieurs montants possibles apparaissent dans le document." : "Aucune fourchette explicite n’a été repérée.",
  });

  const depositMatch = sourceText.match(/(?:acompte|arrhes?)\s*(?:de|:)?\s*(\d{1,3}\s*%|\d[\d .]*[,.]\d{2}\s*(?:€|eur))/i);
  checks.push({
    key: "deposit",
    label: "Acompte ou arrhes",
    status: "info",
    detail: depositMatch ? `Le document mentionne : « ${depositMatch[0].trim()} ».` : "Aucun acompte ou arrhes n’a été repéré explicitement.",
  });

  const validityMatch = sourceText.match(/(?:validit[eé]|valable)\s*(?:du devis|:|de|pendant)?\s*([^\n.]{1,60})/i);
  checks.push({
    key: "validity",
    label: documentType === "devis" ? "Validité du devis" : "Date et période",
    status: "info",
    detail: validityMatch ? `Indication retrouvée : « ${validityMatch[0].trim()} ».` : `Aucune ${documentType === "devis" ? "durée de validité" : "période"} explicite n’a été repérée.`,
  });

  const hasTax = /\b(?:tva|ttc|ht)\b/i.test(sourceText);
  const hasDiscount = /\b(?:remise|rabais|avoir)\b/i.test(sourceText);
  checks.push({
    key: "tax_discount",
    label: "Taxes et remises",
    status: "info",
    detail: `${hasTax ? "Une mention de TVA, TTC ou HT est présente." : "Aucune mention fiscale explicite n’a été repérée."}${hasDiscount ? " Une remise, un rabais ou un avoir est également mentionné." : ""}`,
  });

  const detectedKind = normalizedSource.includes("facture") ? "facture" : normalizedSource.includes("devis") ? "devis" : null;
  checks.push({
    key: "document_type",
    label: "Type de document",
    status: detectedKind && detectedKind !== documentType ? "attention" : "ok",
    detail: detectedKind
      ? `Le document contient clairement le terme « ${detectedKind} »${detectedKind !== documentType ? `, alors qu’il a été déclaré comme ${documentType}.` : "."}`
      : `Le type « ${documentType} » provient de votre sélection ; aucun intitulé suffisamment clair n’a été retrouvé.`,
  });

  return checks.slice(0, 10);
}

function buildEmail(petName: string, questions: string[]) {
  const selected = questions.slice(0, 3);
  if (!selected.length) return { subject: null, body: null };
  const body = [
    "Bonjour,",
    "",
    `Afin de bien comprendre le document concernant ${petName}, pourriez-vous me préciser les éléments suivants :`,
    "",
    ...selected.map((question, index) => `${index + 1}. ${question}`),
    "",
    "Merci par avance pour ces précisions.",
  ].join("\n");
  return { subject: `Quelques précisions sur le document de ${petName}`, body };
}

export function enrichPreviewWithTraceability(input: EnrichInput): PreviewPayload {
  const pages = parsePages(input.sourceText);
  const fallbackQuestions = input.preview.questions;
  const lines = input.preview.lines.map((line, index) => enrichLine(line, pages, fallbackQuestions[index]));
  const questions = unique([
    ...lines.map((line) => line.suggested_question),
    ...input.preview.questions,
  ]).slice(0, 12);
  const priorityQuestions = questions.slice(0, 3);
  const sourceRatio = lines.filter((line) => line.source_page && line.source_quote).length / Math.max(lines.length, 1);
  const insufficient = lines.length < 1 || (input.preview.total_amount === null && lines.length < 2) || ((input.ocrConfidence ?? 1) < 0.55 && sourceRatio < 0.35);
  const partial = !insufficient && ((input.ocrConfidence !== null && input.ocrConfidence < 0.72) || sourceRatio < 0.65);
  const documentReadability = insufficient ? "insufficient" : partial ? "partial" : "usable";
  const email = buildEmail(input.petName, priorityQuestions);

  return {
    ...input.preview,
    lines,
    questions,
    priority_questions: priorityQuestions,
    document_checks: buildChecks({ ...input.preview, lines }, input.sourceText, input.documentType),
    page_count: input.pageCount || pages.length || null,
    document_readability: documentReadability,
    email_subject: email.subject,
    email_body: email.body,
    warnings: unique([
      ...input.preview.warnings,
      documentReadability === "partial" ? "Certaines informations sont lisibles, mais quelques zones doivent être vérifiées sur le document original." : null,
      documentReadability === "insufficient" ? "Le document n’est pas assez lisible pour produire un rapport fiable. Ajoutez une photo plus nette ou le PDF original." : null,
    ]).slice(0, 10),
  };
}
