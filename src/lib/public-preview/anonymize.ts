import "server-only";

export type AnonymizationResult = {
  text: string;
  redactionCount: number;
  redactedCategories: string[];
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(text: string, pattern: RegExp) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return text.match(new RegExp(pattern.source, flags))?.length ?? 0;
}

function replaceTracked(
  state: AnonymizationResult,
  pattern: RegExp,
  replacement: string,
  category: string
) {
  const count = countMatches(state.text, pattern);
  if (count === 0) return;
  state.text = state.text.replace(pattern, replacement);
  state.redactionCount += count;
  if (!state.redactedCategories.includes(category)) state.redactedCategories.push(category);
}

function looksLikeBillableService(line: string) {
  const hasAmount = /(?:€|eur|chf|usd|gbp|\$|£)|\d{1,6}[,.]\d{2}/i.test(line);
  const hasServiceWord = /(consult|anesth|chirurg|radio|échograph|analyse|bilan|médicament|injection|hospital|soin|examen|surveillance|vacc|castr|stéril|pansement|prélèvement|laboratoire)/i.test(line);
  return hasAmount && hasServiceWord;
}

export function anonymizeDocumentText(text: string, petName?: string): AnonymizationResult {
  const state: AnonymizationResult = {
    text: text.replace(/\u0000/g, "").trim(),
    redactionCount: 0,
    redactedCategories: [],
  };

  if (petName?.trim()) {
    replaceTracked(
      state,
      new RegExp(`\\b${escapeRegExp(petName.trim())}\\b`, "giu"),
      "[ANIMAL]",
      "animal"
    );
  }

  replaceTracked(state, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, "[EMAIL]", "email");
  replaceTracked(state, /https?:\/\/[^\s)]+|\bwww\.[^\s)]+/giu, "[SITE_WEB]", "website");
  replaceTracked(
    state,
    /\b(?:\+33|0033|0)[1-9](?:[ .-]?\d{2}){4}\b/g,
    "[TÉLÉPHONE]",
    "phone"
  );
  replaceTracked(state, /\bFR\d{2}(?:[ A-Z0-9]{4}){5,7}\b/giu, "[IBAN]", "banking");
  replaceTracked(state, /\b(?:siret|siren)\s*[:#-]?\s*\d(?:[ .]?\d){8,13}\b/giu, "[IDENTIFIANT_ENTREPRISE]", "company_id");
  replaceTracked(state, /\b(?:n°|no|numéro)?\s*(?:devis|facture|client|dossier)\s*[:#-]?\s*[A-Z0-9/_-]{3,}\b/giu, "[RÉFÉRENCE]", "reference");
  replaceTracked(state, /\b(?:TVA|VAT)\s*(?:intracommunautaire)?\s*[:#-]?\s*[A-Z0-9 ]{6,}\b/giu, "[IDENTIFIANT_TVA]", "tax_id");

  const lines = state.text.split(/\r?\n/);
  const identityLine = /(?:clinique|cabinet|centre hospitalier|centre vétérinaire|docteur\b|\bdr\.?\s|raison sociale|adresse\b|téléphone\b|portable\b|courriel\b|e-mail\b|email\b|client\b|propriétaire\b|facturé à|coordonnées|identification du praticien)/i;
  const labelledIdentity = /^\s*(?:nom|prénom|adresse|client|propriétaire|praticien|vétérinaire|docteur|téléphone|portable|email|courriel)\s*[:\-]/i;

  state.text = lines
    .map((line, index) => {
      const nearDocumentEdge = index < 25 || index >= Math.max(0, lines.length - 15);
      if (
        (labelledIdentity.test(line) || (nearDocumentEdge && identityLine.test(line))) &&
        !looksLikeBillableService(line)
      ) {
        state.redactionCount += 1;
        if (!state.redactedCategories.includes("identity_line")) {
          state.redactedCategories.push("identity_line");
        }
        return "[IDENTITÉ_MASQUÉE]";
      }
      return line;
    })
    .join("\n")
    .replace(/(?:\[IDENTITÉ_MASQUÉE\]\s*){2,}/g, "[IDENTITÉ_MASQUÉE]\n")
    .trim();

  return state;
}
