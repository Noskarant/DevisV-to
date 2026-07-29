import "server-only";
import { formatMoney, type ReportViewModel } from "@/lib/public-preview/report";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 44;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_LIMIT = 56;

const COLORS = {
  forest: [0.071, 0.247, 0.22] as const,
  green: [0.047, 0.357, 0.314] as const,
  body: [0.19, 0.34, 0.31] as const,
  muted: [0.39, 0.49, 0.46] as const,
  pale: [0.93, 0.97, 0.95] as const,
  paleStrong: [0.89, 0.95, 0.92] as const,
  cream: [0.985, 0.975, 0.94] as const,
  coral: [0.67, 0.32, 0.24] as const,
  coralPale: [1, 0.96, 0.94] as const,
  white: [1, 1, 1] as const,
  line: [0.82, 0.88, 0.86] as const,
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

function pdfText(value: string) {
  return value
    .normalize("NFC")
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/→/g, "->")
    .replace(/✓/g, "OK")
    .replace(/•/g, "-");
}

function toWinAnsiHex(value: string) {
  const bytes: number[] = [];
  for (const character of pdfText(value)) {
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
  for (const char of pdfText(text)) {
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
  for (const paragraph of pdfText(text).replace(/\r/g, "").split("\n")) {
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

function money(amount: number | null, currency: string) {
  return pdfText(formatMoney(amount, currency));
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
      this.textAt("DevisVéto", MARGIN, this.y, 11.5, "bold", COLORS.forest);
      this.textRight("Rapport documentaire", PAGE_WIDTH - MARGIN, this.y, 9.2, "regular", COLORS.muted);
      this.y -= 18;
      this.ruleAt(this.y);
      this.y -= 24;
    }
  }

  private finishPage() {
    const pageNumber = this.pages.length + 1;
    this.textAt("DevisVéto - explication documentaire, sans avis vétérinaire", MARGIN, 28, 8, "regular", COLORS.muted);
    this.textRight(String(pageNumber), PAGE_WIDTH - MARGIN, 28, 8, "regular", COLORS.muted);
    this.pages.push(this.commands);
  }

  newPage() {
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

  private textRight(text: string, right: number, y: number, size: number, font: Font, color: Color) {
    const width = approximateTextWidth(text, size, font);
    this.textAt(text, right - width, y, size, font, color);
  }

  private fillRect(x: number, y: number, width: number, height: number, color: Color) {
    this.commands.push(`q ${colorCommand(color)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f Q`);
  }

  private strokeRect(x: number, y: number, width: number, height: number, color: Color, lineWidth = 0.8) {
    this.commands.push(`q ${colorCommand(color)} RG ${lineWidth} w ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S Q`);
  }

  private ruleAt(y: number) {
    this.commands.push(`q ${colorCommand(COLORS.line)} RG 0.8 w ${MARGIN} ${y.toFixed(2)} m ${PAGE_WIDTH - MARGIN} ${y.toFixed(2)} l S Q`);
  }

  private verticalRule(x: number, top: number, bottom: number, color: Color) {
    this.commands.push(`q ${colorCommand(color)} RG 1.5 w ${x.toFixed(2)} ${top.toFixed(2)} m ${x.toFixed(2)} ${bottom.toFixed(2)} l S Q`);
  }

  private drawLines(lines: string[], x: number, startY: number, size: number, lineHeight: number, font: Font, color: Color) {
    let currentY = startY;
    for (const line of lines) {
      if (line) this.textAt(line, x, currentY, size, font, color);
      currentY -= lineHeight;
    }
    return currentY;
  }

  write(text: string, options: TextOptions = {}) {
    const x = options.x ?? MARGIN;
    const width = options.width ?? CONTENT_WIDTH;
    const size = options.size ?? 10.8;
    const lineHeight = options.lineHeight ?? size * 1.45;
    const font = options.font ?? "regular";
    const color = options.color ?? COLORS.body;
    const gapAfter = options.gapAfter ?? 0;
    const lines = wrapText(text, width, size, font);
    this.ensure(Math.max(lines.length, 1) * lineHeight + gapAfter);
    this.y = this.drawLines(lines, x, this.y, size, lineHeight, font, color) - gapAfter;
  }

  label(text: string) {
    this.write(text.toUpperCase(), { size: 8.4, lineHeight: 11, font: "bold", color: COLORS.green, gapAfter: 5 });
  }

  heading(text: string, size = 20) {
    this.write(text, { size, lineHeight: size * 1.16, font: "bold", color: COLORS.forest, gapAfter: 11 });
  }

  paragraph(text: string, gapAfter = 14) {
    this.write(text, { size: 10.8, lineHeight: 15.6, color: COLORS.body, gapAfter });
  }

  bullet(text: string, color: Color = COLORS.body) {
    const lines = wrapText(text, CONTENT_WIDTH - 20, 10.2, "regular");
    this.ensure(Math.max(lines.length, 1) * 14.2 + 4);
    this.textAt("-", MARGIN + 3, this.y, 10.5, "bold", COLORS.green);
    this.y = this.drawLines(lines, MARGIN + 18, this.y, 10.2, 14.2, "regular", color) - 4;
  }

  spacer(height: number) {
    this.ensure(height);
    this.y -= height;
  }

  section(label: string, title: string, minFollowingHeight = 110, forceNewPage = false) {
    if (forceNewPage) this.newPage();
    this.ensure(58 + minFollowingHeight);
    this.label(label);
    this.heading(title, 20);
  }

  notice(title: string, text: string, color: Color = COLORS.pale) {
    const lines = wrapText(text, CONTENT_WIDTH - 32, 9.6, "regular");
    const height = 36 + lines.length * 13.4;
    this.ensure(height + 8);
    const top = this.y;
    this.fillRect(MARGIN, top - height, CONTENT_WIDTH, height, color);
    this.textAt(title, MARGIN + 16, top - 20, 9.8, "bold", COLORS.green);
    this.drawLines(lines, MARGIN + 16, top - 39, 9.6, 13.4, "regular", COLORS.body);
    this.y = top - height - 8;
  }

  private metricCards(items: string[]) {
    const gap = 10;
    const width = (CONTENT_WIDTH - gap * 2) / 3;
    const height = 62;
    this.ensure(height + 12);
    const top = this.y;
    items.slice(0, 3).forEach((item, index) => {
      const x = MARGIN + index * (width + gap);
      this.fillRect(x, top - height, width, height, COLORS.pale);
      const lines = wrapText(item, width - 24, 9.7, "bold").slice(0, 3);
      this.drawLines(lines, x + 12, top - 22, 9.7, 13, "bold", COLORS.forest);
    });
    this.y = top - height - 12;
  }

  private twoColumnSummary(leftTitle: string, leftItems: string[], rightTitle: string, rightItems: string[]) {
    const gap = 22;
    const width = (CONTENT_WIDTH - gap) / 2;
    const leftLines = leftItems.slice(0, 3).map((item) => wrapText(item, width - 24, 9.7, "regular"));
    const rightLines = rightItems.slice(0, 3).map((item, index) => wrapText(`${index + 1}. ${item}`, width - 20, 9.7, "regular"));
    const leftHeight = 24 + leftLines.reduce((sum, lines) => sum + lines.length * 13.2 + 6, 0);
    const rightHeight = 24 + rightLines.reduce((sum, lines) => sum + lines.length * 13.2 + 6, 0);
    const height = Math.max(leftHeight, rightHeight);
    this.ensure(height + 12);
    const top = this.y;
    const leftX = MARGIN;
    const rightX = MARGIN + width + gap;
    this.textAt(leftTitle.toUpperCase(), leftX, top, 8.3, "bold", COLORS.green);
    this.textAt(rightTitle.toUpperCase(), rightX, top, 8.3, "bold", COLORS.green);
    let leftY = top - 20;
    leftLines.forEach((lines) => {
      this.textAt("-", leftX + 2, leftY, 9.7, "bold", COLORS.green);
      leftY = this.drawLines(lines, leftX + 15, leftY, 9.7, 13.2, "regular", COLORS.body) - 6;
    });
    let rightY = top - 20;
    rightLines.forEach((lines) => {
      rightY = this.drawLines(lines, rightX, rightY, 9.7, 13.2, "regular", COLORS.body) - 6;
    });
    this.y = top - height - 12;
  }

  cover(report: ReportViewModel) {
    const coverHeight = 218;
    this.fillRect(0, PAGE_HEIGHT - coverHeight, PAGE_WIDTH, coverHeight, COLORS.forest);
    this.textAt("DevisVéto", MARGIN, PAGE_HEIGHT - 54, 15.5, "bold", COLORS.white);
    this.textAt("RAPPORT DOCUMENTAIRE COMPLET", MARGIN, PAGE_HEIGHT - 86, 9.2, "bold", COLORS.paleStrong);
    const title = `${report.documentLabel} de ${report.pet?.name || "votre animal"} - en clair`;
    let titleY = PAGE_HEIGHT - 124;
    for (const line of wrapText(title, CONTENT_WIDTH - 20, 27, "bold")) {
      this.textAt(line, MARGIN, titleY, 27, "bold", COLORS.white);
      titleY -= 31;
    }
    this.textAt(`${report.preview.lines.length} prestations identifiées`, MARGIN, PAGE_HEIGHT - 193, 10.2, "regular", COLORS.paleStrong);
    this.textRight(money(report.preview.total_amount, report.preview.currency), PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 193, 15, "bold", COLORS.white);
    this.y = PAGE_HEIGHT - coverHeight - 34;

    this.label("Avant de répondre à la clinique");
    this.heading("L’essentiel en cinq minutes", 21);
    this.paragraph(report.summaryParagraph, 14);
    this.metricCards(report.keyFacts);
    this.twoColumnSummary("Trois faits essentiels", report.clearlyIndicated, "Trois questions prioritaires", report.priorityQuestions);
    this.notice(report.reviewState.label, report.reviewState.detail);
  }

  private measureItems(items: string[], width: number) {
    return items.slice(0, 4).reduce((height, item) => height + Math.max(wrapText(item, width - 16, 9.3, "regular").length, 1) * 12.4 + 3, 0);
  }

  lineDetail(line: ReportViewModel["preview"]["lines"][number], currency: string, index: number) {
    const innerWidth = CONTENT_WIDTH - 28;
    const titleWidth = CONTENT_WIDTH - 142;
    const titleLines = wrapText(line.original_label, titleWidth, 12, "bold");
    const headerHeight = Math.max(47, 20 + titleLines.length * 14);
    const statusText = `${readingLabel(line.reading_status)}${line.source_page ? ` - page ${line.source_page}` : ""}`;
    const sourceLines = line.source_quote ? wrapText(`Source : « ${line.source_quote} »`, innerWidth - 12, 9.2, "regular") : [];
    const explanationLines = wrapText(line.explanation, innerWidth, 10.2, "regular");
    const explicit = line.explicit_elements.slice(0, 4);
    const missing = (line.elements_to_confirm.length ? line.elements_to_confirm : line.clarification ? [line.clarification] : []).slice(0, 4);
    const columnGap = 14;
    const columnWidth = (innerWidth - columnGap) / 2;
    const columnHeight = Math.max(
      explicit.length ? 22 + this.measureItems(explicit, columnWidth) : 0,
      missing.length ? 22 + this.measureItems(missing, columnWidth) : 0
    );
    const questionLines = line.suggested_question ? wrapText(`« ${line.suggested_question} »`, innerWidth, 10, "bold") : [];
    const sourceHeight = 19 + (sourceLines.length ? sourceLines.length * 12.4 + 8 : 0);
    const explanationHeight = 19 + explanationLines.length * 14.2 + 9;
    const questionHeight = questionLines.length ? 29 + questionLines.length * 13.8 + 9 : 0;
    const totalHeight = headerHeight + 14 + sourceHeight + explanationHeight + (columnHeight ? columnHeight + 10 : 0) + questionHeight + 13;

    this.ensure(totalHeight + 14);
    const top = this.y;
    const bottom = top - totalHeight;
    this.strokeRect(MARGIN, bottom, CONTENT_WIDTH, totalHeight, COLORS.line);
    this.fillRect(MARGIN, top - headerHeight, CONTENT_WIDTH, headerHeight, index % 2 === 0 ? COLORS.pale : COLORS.cream);
    this.fillRect(MARGIN + 12, top - 34, 24, 24, COLORS.forest);
    this.textAt(String(index + 1), MARGIN + 19, top - 27, 9.5, "bold", COLORS.white);
    this.drawLines(titleLines, MARGIN + 46, top - 19, 12, 14, "bold", COLORS.forest);
    this.textRight(money(line.amount, currency), PAGE_WIDTH - MARGIN - 12, top - 20, 11.2, "bold", COLORS.forest);
    this.textAt(line.category.toUpperCase(), MARGIN + 46, top - headerHeight + 10, 7.8, "bold", COLORS.muted);

    let currentY = top - headerHeight - 15;
    const statusColor = line.reading_status === "clear" ? COLORS.green : COLORS.coral;
    this.textAt(statusText, MARGIN + 14, currentY, 8.8, "bold", statusColor);
    currentY -= 17;
    if (sourceLines.length) {
      this.verticalRule(MARGIN + 16, currentY + 3, currentY - sourceLines.length * 12.4 + 5, COLORS.paleStrong);
      currentY = this.drawLines(sourceLines, MARGIN + 25, currentY, 9.2, 12.4, "regular", COLORS.muted) - 8;
    }

    this.textAt("CE QUE CELA SIGNIFIE", MARGIN + 14, currentY, 8.2, "bold", COLORS.green);
    currentY -= 17;
    currentY = this.drawLines(explanationLines, MARGIN + 14, currentY, 10.2, 14.2, "regular", COLORS.body) - 9;

    if (columnHeight) {
      const leftX = MARGIN + 14;
      const rightX = leftX + columnWidth + columnGap;
      if (explicit.length) {
        this.fillRect(leftX, currentY - columnHeight + 7, columnWidth, columnHeight, COLORS.pale);
        this.textAt("CE QUI EST ÉCRIT", leftX + 10, currentY - 9, 8, "bold", COLORS.green);
        let itemY = currentY - 26;
        explicit.forEach((item) => {
          const lines = wrapText(item, columnWidth - 26, 9.3, "regular");
          this.textAt("-", leftX + 10, itemY, 9.3, "bold", COLORS.green);
          itemY = this.drawLines(lines, leftX + 22, itemY, 9.3, 12.4, "regular", COLORS.body) - 3;
        });
      }
      if (missing.length) {
        this.fillRect(rightX, currentY - columnHeight + 7, columnWidth, columnHeight, COLORS.coralPale);
        this.textAt("À CONFIRMER", rightX + 10, currentY - 9, 8, "bold", COLORS.coral);
        let itemY = currentY - 26;
        missing.forEach((item) => {
          const lines = wrapText(item, columnWidth - 26, 9.3, "regular");
          this.textAt("-", rightX + 10, itemY, 9.3, "bold", COLORS.coral);
          itemY = this.drawLines(lines, rightX + 22, itemY, 9.3, 12.4, "regular", COLORS.body) - 3;
        });
      }
      currentY -= columnHeight + 10;
    }

    if (questionLines.length) {
      const questionHeightDraw = 25 + questionLines.length * 13.8;
      this.fillRect(MARGIN + 14, currentY - questionHeightDraw + 5, innerWidth, questionHeightDraw, COLORS.paleStrong);
      this.textAt("QUESTION À POSER", MARGIN + 25, currentY - 10, 8.1, "bold", COLORS.green);
      this.drawLines(questionLines, MARGIN + 25, currentY - 28, 10, 13.8, "bold", COLORS.forest);
    }

    this.y = bottom - 14;
  }

  amountRow(label: string, value: string) {
    this.ensure(31);
    this.textAt(label, MARGIN, this.y, 10.4, "bold", COLORS.body);
    this.textRight(value, PAGE_WIDTH - MARGIN, this.y, 10.4, "bold", COLORS.forest);
    this.y -= 17;
    this.ruleAt(this.y);
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

  pdf.section("Détail du document", "Chaque prestation, expliquée clairement", 170, true);
  report.preview.lines.forEach((line, index) => pdf.lineDetail(line, report.preview.currency, index));

  if (report.documentChecks.length) {
    pdf.section("Contrôles factuels", "Ce qui a été vérifié automatiquement", 100);
    report.documentChecks.forEach((check) => {
      pdf.notice(
        check.status === "attention" ? `À vérifier - ${check.label}` : check.status === "ok" ? `Contrôle conforme - ${check.label}` : check.label,
        check.detail,
        check.status === "attention" ? COLORS.coralPale : COLORS.pale
      );
    });
  }

  if (report.categoryTotals.length) {
    pdf.section("Répartition factuelle", "Comment le montant se répartit", 100);
    report.categoryTotals.forEach((item) => {
      const label = `${item.category}${item.percentage !== null ? ` - ${item.percentage} %` : ""}`;
      pdf.amountRow(label, money(item.amount, report.preview.currency));
    });
    pdf.paragraph("Cette répartition reprend uniquement les montants lisibles. Elle ne juge ni le niveau du tarif ni la nécessité des soins.", 10);
  }

  if (report.comparison) {
    pdf.section("Version révisée", "Ce qui a changé depuis le document précédent", 100);
    if (report.comparison.totalDelta !== null) pdf.paragraph(`Écart total : ${report.comparison.totalDelta > 0 ? "+" : ""}${money(report.comparison.totalDelta, report.preview.currency)}.`, 8);
    report.comparison.added.forEach((item) => pdf.bullet(`Ligne ajoutée : ${item}`));
    report.comparison.removed.forEach((item) => pdf.bullet(`Ligne retirée : ${item}`, COLORS.muted));
    report.comparison.changed.forEach((item) => pdf.bullet(`${item.label} : ${money(item.before, report.preview.currency)} -> ${money(item.after, report.preview.currency)}`));
    pdf.paragraph(`${report.comparison.resolvedClarifications} point(s) semblent désormais précisés. ${report.comparison.remainingClarifications} restent à confirmer.`, 10);
  }

  pdf.section("Conclusion", "Ce que l’on peut retenir du document", 100);
  pdf.paragraph(report.conclusion, 16);
  pdf.label("Ce qui reste à confirmer");
  if (report.toConfirm.length) report.toConfirm.forEach((item) => pdf.bullet(item, COLORS.body));
  else pdf.paragraph("Aucun point de clarification majeur n’a été relevé dans les informations lisibles.");

  pdf.section("Préparer l’échange", "Questions à garder sous la main", 100);
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
