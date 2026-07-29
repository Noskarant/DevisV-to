import "server-only";
import { formatMoney, type ReportViewModel } from "@/lib/public-preview/report";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_LIMIT = 58;

const COLORS = {
  forest: [0.071, 0.247, 0.22] as const,
  green: [0.047, 0.357, 0.314] as const,
  muted: [0.36, 0.48, 0.45] as const,
  pale: [0.93, 0.97, 0.95] as const,
  cream: [0.98, 0.975, 0.95] as const,
  coral: [0.89, 0.47, 0.36] as const,
  white: [1, 1, 1] as const,
  line: [0.84, 0.89, 0.87] as const,
};

type Color = readonly [number, number, number];
type Font = "regular" | "bold";
type TextOptions = {
  x?: number;
  width?: number;
  size?: number;
  lineHeight?: number;
  font?: Font;
  color?: Color;
  gapAfter?: number;
};

const WIN_ANSI: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};

function toWinAnsiHex(value: string) {
  const bytes: number[] = [];
  for (const character of value.normalize("NFC")) {
    const code = character.codePointAt(0) ?? 63;
    if (code <= 255) bytes.push(code);
    else if (WIN_ANSI[code] !== undefined) bytes.push(WIN_ANSI[code]);
    else bytes.push(63);
  }
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function colorCommand(color: Color) {
  return `${color[0]} ${color[1]} ${color[2]}`;
}

function approximateTextWidth(text: string, size: number, font: Font) {
  const weightFactor = font === "bold" ? 1.04 : 1;
  let units = 0;
  for (const char of text) {
    if (char === " ") units += 0.28;
    else if (/[ilI1.,:;!'|]/.test(char)) units += 0.27;
    else if (/[mwMW@%&]/.test(char)) units += 0.82;
    else if (/[A-Z0-9]/.test(char)) units += 0.61;
    else units += 0.51;
  }
  return units * size * weightFactor;
}

function wrapText(text: string, width: number, size: number, font: Font) {
  const output: string[] = [];
  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      output.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (!current || approximateTextWidth(candidate, size, font) <= width) current = candidate;
      else {
        output.push(current);
        current = word;
      }
    }
    if (current) output.push(current);
  }
  return output;
}

function readingLabel(status: ReportViewModel["preview"]["lines"][number]["reading_status"]) {
  return {
    clear: "Lu clairement dans le document",
    uncertain: "Lecture à vérifier",
    missing: "Non précisé dans le document",
    possibly_included: "Possiblement inclus dans une ligne globale",
  }[status];
}

class PdfWriter {
  private pages: string[][] = [];
  private commands: string[] = [];
  private y = PAGE_HEIGHT - MARGIN;

  constructor() {
    this.startPage(false);
  }

  private startPage(withHeader: boolean) {
    this.commands = [];
    this.y = PAGE_HEIGHT - MARGIN;
    if (withHeader) {
      this.textAt("DevisVéto", MARGIN, this.y, 11, "bold", COLORS.forest);
      this.textAt("Rapport documentaire", PAGE_WIDTH - MARGIN - 112, this.y, 9, "regular", COLORS.muted);
      this.y -= 18;
      this.rule();
      this.y -= 22;
    }
  }

  private finishPage() {
    const pageNumber = this.pages.length + 1;
    this.commands.push(
      `BT /F1 8 Tf ${colorCommand(COLORS.muted)} rg 1 0 0 1 ${MARGIN} 28 Tm <${toWinAnsiHex("DevisVéto — explication documentaire, sans avis vétérinaire")}> Tj ET`,
      `BT /F1 8 Tf ${colorCommand(COLORS.muted)} rg 1 0 0 1 ${PAGE_WIDTH - MARGIN - 18} 28 Tm <${toWinAnsiHex(String(pageNumber))}> Tj ET`
    );
    this.pages.push(this.commands);
  }

  private newPage() {
    this.finishPage();
    this.startPage(true);
  }

  ensure(height: number) {
    if (this.y - height < BOTTOM_LIMIT) this.newPage();
  }

  private textAt(text: string, x: number, y: number, size: number, font: Font, color: Color) {
    const fontName = font === "bold" ? "F2" : "F1";
    this.commands.push(`BT /${fontName} ${size} Tf ${colorCommand(color)} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm <${toWinAnsiHex(text)}> Tj ET`);
  }

  rect(x: number, y: number, width: number, height: number, color: Color) {
    this.commands.push(`q ${colorCommand(color)} rg ${x} ${y} ${width} ${height} re f Q`);
  }

  rule() {
    this.commands.push(`q ${colorCommand(COLORS.line)} RG 0.8 w ${MARGIN} ${this.y} m ${PAGE_WIDTH - MARGIN} ${this.y} l S Q`);
  }

  write(text: string, options: TextOptions = {}) {
    const x = options.x ?? MARGIN;
    const width = options.width ?? CONTENT_WIDTH;
    const size = options.size ?? 10.5;
    const lineHeight = options.lineHeight ?? size * 1.45;
    const font = options.font ?? "regular";
    const color = options.color ?? COLORS.forest;
    const gapAfter = options.gapAfter ?? 0;
    const lines = wrapText(text, width, size, font);
    this.ensure(Math.max(lines.length, 1) * lineHeight + gapAfter);
    for (const line of lines) {
      if (line) this.textAt(line, x, this.y, size, font, color);
      this.y -= lineHeight;
    }
    this.y -= gapAfter;
  }

  label(text: string) {
    this.write(text.toUpperCase(), { size: 8, lineHeight: 11, font: "bold", color: COLORS.green, gapAfter: 5 });
  }

  heading(text: string, size = 20) {
    this.write(text, { size, lineHeight: size * 1.18, font: "bold", color: COLORS.forest, gapAfter: 11 });
  }

  paragraph(text: string, gapAfter = 14) {
    this.write(text, { size: 10.5, lineHeight: 15.5, color: COLORS.muted, gapAfter });
  }

  bullet(text: string, color: Color = COLORS.forest) {
    const lines = wrapText(text, CONTENT_WIDTH - 18, 10.2, "regular");
    this.ensure(Math.max(lines.length, 1) * 14.5 + 5);
    this.textAt("•", MARGIN + 4, this.y, 11, "bold", COLORS.green);
    for (const line of lines) {
      this.textAt(line, MARGIN + 18, this.y, 10.2, "regular", color);
      this.y -= 14.5;
    }
    this.y -= 5;
  }

  spacer(height: number) {
    this.ensure(height);
    this.y -= height;
  }

  notice(title: string, text: string, color: Color = COLORS.pale) {
    const lines = wrapText(text, CONTENT_WIDTH - 32, 9.2, "regular");
    const height = 34 + lines.length * 13;
    this.ensure(height + 8);
    const top = this.y;
    this.rect(MARGIN, top - height, CONTENT_WIDTH, height, color);
    this.textAt(title, MARGIN + 16, top - 20, 9.5, "bold", COLORS.green);
    let textY = top - 38;
    for (const line of lines) {
      this.textAt(line, MARGIN + 16, textY, 9.2, "regular", COLORS.muted);
      textY -= 13;
    }
    this.y -= height + 8;
  }

  section(label: string, title: string) {
    this.ensure(70);
    this.spacer(8);
    this.label(label);
    this.heading(title, 20);
  }

  cover(report: ReportViewModel) {
    this.rect(0, PAGE_HEIGHT - 232, PAGE_WIDTH, 232, COLORS.forest);
    this.textAt("DevisVéto", MARGIN, PAGE_HEIGHT - 56, 15, "bold", COLORS.white);
    this.textAt("RAPPORT DOCUMENTAIRE COMPLET", MARGIN, PAGE_HEIGHT - 88, 9, "bold", COLORS.pale);
    const title = `${report.documentLabel} de ${report.pet?.name || "votre animal"} — en clair`;
    let titleY = PAGE_HEIGHT - 126;
    for (const line of wrapText(title, CONTENT_WIDTH - 35, 27, "bold")) {
      this.textAt(line, MARGIN, titleY, 27, "bold", COLORS.white);
      titleY -= 31;
    }
    this.textAt(`${report.preview.lines.length} prestations`, MARGIN, PAGE_HEIGHT - 207, 10, "regular", COLORS.pale);
    this.textAt(formatMoney(report.preview.total_amount, report.preview.currency), PAGE_WIDTH - MARGIN - 108, PAGE_HEIGHT - 207, 14, "bold", COLORS.white);
    this.y = PAGE_HEIGHT - 266;

    this.label("Avant de répondre à la clinique");
    this.heading("L’essentiel en cinq minutes", 21);
    this.paragraph(report.summaryParagraph, 14);
    this.label("Trois faits essentiels");
    report.clearlyIndicated.slice(0, 3).forEach((item) => this.bullet(item));
    this.spacer(5);
    this.label("Trois questions prioritaires");
    report.priorityQuestions.slice(0, 3).forEach((item, index) => this.bullet(`${index + 1}. ${item}`));
    this.spacer(6);
    this.notice(report.reviewState.label, report.reviewState.detail);
  }

  lineDetail(line: ReportViewModel["preview"]["lines"][number], currency: string, index: number) {
    this.ensure(145);
    this.rect(MARGIN, this.y - 30, CONTENT_WIDTH, 30, index % 2 === 0 ? COLORS.pale : COLORS.cream);
    this.textAt(line.original_label.slice(0, 62), MARGIN + 12, this.y - 19, 11, "bold", COLORS.forest);
    this.textAt(formatMoney(line.amount, currency), PAGE_WIDTH - MARGIN - 92, this.y - 19, 10.5, "bold", COLORS.forest);
    this.y -= 43;
    const source = `${readingLabel(line.reading_status)}${line.source_page ? ` · page ${line.source_page}` : ""}`;
    this.write(source, { size: 8.5, lineHeight: 11, font: "bold", color: line.reading_status === "clear" ? COLORS.green : COLORS.coral, gapAfter: 4 });
    if (line.source_quote) this.write(`Source : « ${line.source_quote} »`, { size: 9, lineHeight: 13, color: COLORS.muted, gapAfter: 7 });
    this.write("Ce que cela signifie", { size: 8.5, lineHeight: 11, font: "bold", color: COLORS.green, gapAfter: 4 });
    this.paragraph(line.explanation, 6);
    if (line.explicit_elements.length) {
      this.write("Ce qui est écrit", { size: 8.5, lineHeight: 11, font: "bold", color: COLORS.green, gapAfter: 4 });
      line.explicit_elements.slice(0, 4).forEach((item) => this.bullet(item, COLORS.muted));
    }
    const missing = line.elements_to_confirm.length ? line.elements_to_confirm : line.clarification ? [line.clarification] : [];
    if (missing.length) {
      this.write("Ce que le document ne précise pas", { size: 8.5, lineHeight: 11, font: "bold", color: COLORS.coral, gapAfter: 4 });
      missing.slice(0, 4).forEach((item) => this.bullet(item, COLORS.muted));
    }
    if (line.suggested_question) {
      this.write("Question associée", { size: 8.5, lineHeight: 11, font: "bold", color: COLORS.green, gapAfter: 4 });
      this.paragraph(`« ${line.suggested_question} »`, 7);
    }
    this.rule();
    this.y -= 14;
  }

  finish() {
    this.finishPage();
    return this.pages.map((page) => page.join("\n"));
  }
}

function buildPdfObjects(pageStreams: string[]) {
  const objects = new Map<number, Buffer>();
  const pageIds = pageStreams.map((_, index) => 5 + index * 2);
  const contentIds = pageStreams.map((_, index) => 6 + index * 2);
  objects.set(1, Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "ascii"));
  objects.set(2, Buffer.from(`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`, "ascii"));
  objects.set(3, Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "ascii"));
  objects.set(4, Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>", "ascii"));
  pageStreams.forEach((stream, index) => {
    const streamBuffer = Buffer.from(stream, "ascii");
    objects.set(pageIds[index], Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentIds[index]} 0 R >>`, "ascii"));
    objects.set(contentIds[index], Buffer.concat([Buffer.from(`<< /Length ${streamBuffer.length} >>\nstream\n`, "ascii"), streamBuffer, Buffer.from("\nendstream", "ascii")]));
  });
  const maxId = Math.max(...objects.keys());
  const header = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary");
  const chunks: Buffer[] = [header];
  const offsets = new Array(maxId + 1).fill(0);
  let cursor = header.length;
  for (let id = 1; id <= maxId; id += 1) {
    const body = objects.get(id);
    if (!body) throw new Error(`Objet PDF manquant : ${id}`);
    const prefix = Buffer.from(`${id} 0 obj\n`, "ascii");
    const suffix = Buffer.from("\nendobj\n", "ascii");
    offsets[id] = cursor;
    chunks.push(prefix, body, suffix);
    cursor += prefix.length + body.length + suffix.length;
  }
  const xrefOffset = cursor;
  const xrefLines = ["xref", `0 ${maxId + 1}`, "0000000000 65535 f "];
  for (let id = 1; id <= maxId; id += 1) xrefLines.push(`${String(offsets[id]).padStart(10, "0")} 00000 n `);
  chunks.push(Buffer.from([...xrefLines, "trailer", `<< /Size ${maxId + 1} /Root 1 0 R >>`, "startxref", String(xrefOffset), "%%EOF", ""].join("\n"), "ascii"));
  return Buffer.concat(chunks);
}

export function generateReportPdf(report: ReportViewModel) {
  const pdf = new PdfWriter();
  pdf.cover(report);

  pdf.section("Détail du document", "Chaque ligne, avec sa preuve source");
  report.preview.lines.forEach((line, index) => pdf.lineDetail(line, report.preview.currency, index));

  if (report.documentChecks.length) {
    pdf.section("Contrôles factuels", "Ce qui a été vérifié automatiquement");
    report.documentChecks.forEach((check) => {
      pdf.write(`${check.status === "attention" ? "À vérifier" : check.status === "ok" ? "Contrôle conforme" : "Information"} — ${check.label}`, { font: "bold", color: check.status === "attention" ? COLORS.coral : COLORS.green, gapAfter: 4 });
      pdf.paragraph(check.detail, 8);
    });
  }

  if (report.categoryTotals.length) {
    pdf.section("Répartition factuelle", "Comment le montant se répartit");
    report.categoryTotals.forEach((item) => pdf.bullet(`${item.category}${item.percentage !== null ? ` (${item.percentage} %)` : ""} : ${formatMoney(item.amount, report.preview.currency)}`));
    pdf.paragraph("Cette répartition reprend uniquement les montants lisibles. Elle ne juge ni le niveau du tarif ni la nécessité des soins.", 10);
  }

  if (report.comparison) {
    pdf.section("Version révisée", "Ce qui a changé depuis le document précédent");
    if (report.comparison.totalDelta !== null) pdf.paragraph(`Écart total : ${report.comparison.totalDelta > 0 ? "+" : ""}${formatMoney(report.comparison.totalDelta, report.preview.currency)}.`, 8);
    report.comparison.added.forEach((item) => pdf.bullet(`Ligne ajoutée : ${item}`));
    report.comparison.removed.forEach((item) => pdf.bullet(`Ligne retirée : ${item}`, COLORS.muted));
    report.comparison.changed.forEach((item) => pdf.bullet(`${item.label} : ${formatMoney(item.before, report.preview.currency)} → ${formatMoney(item.after, report.preview.currency)}`));
    pdf.paragraph(`${report.comparison.resolvedClarifications} point(s) semblent désormais précisés. ${report.comparison.remainingClarifications} restent à confirmer.`, 10);
  }

  pdf.section("Conclusion", "Ce que l’on peut retenir du document");
  pdf.paragraph(report.conclusion, 16);
  pdf.label("Ce qui reste à confirmer");
  if (report.toConfirm.length) report.toConfirm.forEach((item) => pdf.bullet(item, COLORS.muted));
  else pdf.paragraph("Aucun point de clarification majeur n’a été relevé dans les informations lisibles.");

  pdf.section("Préparer l’échange", "Questions à garder sous la main");
  report.preview.questions.forEach((question, index) => pdf.bullet(`${index + 1}. ${question}`));
  if (report.emailBody) {
    pdf.spacer(8);
    pdf.label("E-mail prêt à envoyer");
    if (report.emailSubject) pdf.write(`Objet : ${report.emailSubject}`, { font: "bold", gapAfter: 7 });
    pdf.paragraph(report.emailBody, 12);
  }

  pdf.notice(
    "Limites et confidentialité",
    "DevisVéto explique le contenu du document fourni. Ce rapport ne constitue pas un diagnostic, ne juge pas la nécessité des soins et ne remplace pas les explications de la clinique vétérinaire. Les éléments indiqués comme étant à confirmer n’ont pas pu être établis à partir du document seul. Le PDF est privé et généré depuis la version la plus récente du rapport."
  );
  return buildPdfObjects(pdf.finish());
}
