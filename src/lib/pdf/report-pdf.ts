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
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

function toWinAnsiHex(value: string) {
  const bytes: number[] = [];
  for (const character of value.normalize("NFC")) {
    const code = character.codePointAt(0) ?? 63;
    if (code <= 255) {
      bytes.push(code);
    } else if (WIN_ANSI[code] !== undefined) {
      bytes.push(WIN_ANSI[code]);
    } else {
      bytes.push(63);
    }
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
  const paragraphs = text.replace(/\r/g, "").split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (approximateTextWidth(candidate, size, font) <= width || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

class PdfCanvas {
  private pages: string[][] = [];
  private commands: string[] = [];
  private y = PAGE_HEIGHT - MARGIN;

  constructor() {
    this.startPage();
  }

  private startPage() {
    this.commands = [];
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private finishPage() {
    const pageNumber = this.pages.length + 1;
    this.commands.push(
      `BT /F1 8 Tf ${colorCommand(COLORS.muted)} rg 1 0 0 1 ${MARGIN} 28 Tm <${toWinAnsiHex("DevisVéto — document explicatif, sans avis vétérinaire")}> Tj ET`,
      `BT /F1 8 Tf ${colorCommand(COLORS.muted)} rg 1 0 0 1 ${PAGE_WIDTH - MARGIN - 18} 28 Tm <${toWinAnsiHex(String(pageNumber))}> Tj ET`
    );
    this.pages.push(this.commands);
  }

  private newPage() {
    this.finishPage();
    this.startPage();
    this.smallHeader();
  }

  private ensure(height: number) {
    if (this.y - height < BOTTOM_LIMIT) this.newPage();
  }

  private textAt(text: string, x: number, y: number, size: number, font: Font, color: Color) {
    const fontName = font === "bold" ? "F2" : "F1";
    this.commands.push(
      `BT /${fontName} ${size} Tf ${colorCommand(color)} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm <${toWinAnsiHex(text)}> Tj ET`
    );
  }

  private smallHeader() {
    this.textAt("DevisVéto", MARGIN, this.y, 11, "bold", COLORS.forest);
    this.textAt("Rapport complet", PAGE_WIDTH - MARGIN - 92, this.y, 9, "regular", COLORS.muted);
    this.y -= 19;
    this.rule();
    this.y -= 22;
  }

  rect(x: number, y: number, width: number, height: number, color: Color, radius = 0) {
    if (radius <= 0) {
      this.commands.push(`q ${colorCommand(color)} rg ${x} ${y} ${width} ${height} re f Q`);
      return;
    }

    const k = 0.5522847498;
    const r = Math.min(radius, width / 2, height / 2);
    const right = x + width;
    const top = y + height;
    this.commands.push(
      `q ${colorCommand(color)} rg`,
      `${x + r} ${y} m`,
      `${right - r} ${y} l`,
      `${right - r + r * k} ${y} ${right} ${y + r - r * k} ${right} ${y + r} c`,
      `${right} ${top - r} l`,
      `${right} ${top - r + r * k} ${right - r + r * k} ${top} ${right - r} ${top} c`,
      `${x + r} ${top} l`,
      `${x + r - r * k} ${top} ${x} ${top - r + r * k} ${x} ${top - r} c`,
      `${x} ${y + r} l`,
      `${x} ${y + r - r * k} ${x + r - r * k} ${y} ${x + r} ${y} c`,
      "f Q"
    );
  }

  rule() {
    this.commands.push(
      `q ${colorCommand(COLORS.line)} RG 0.8 w ${MARGIN} ${this.y} m ${PAGE_WIDTH - MARGIN} ${this.y} l S Q`
    );
  }

  write(text: string, options: TextOptions = {}) {
    const x = options.x ?? MARGIN;
    const width = options.width ?? CONTENT_WIDTH;
    const size = options.size ?? 11;
    const lineHeight = options.lineHeight ?? size * 1.45;
    const font = options.font ?? "regular";
    const color = options.color ?? COLORS.forest;
    const gapAfter = options.gapAfter ?? 0;
    const lines = wrapText(text, width, size, font);
    const height = Math.max(lines.length, 1) * lineHeight + gapAfter;
    this.ensure(height);

    for (const line of lines) {
      if (line) this.textAt(line, x, this.y, size, font, color);
      this.y -= lineHeight;
    }
    this.y -= gapAfter;
  }

  label(text: string) {
    this.write(text.toUpperCase(), {
      size: 8,
      lineHeight: 11,
      font: "bold",
      color: COLORS.green,
      gapAfter: 5,
    });
  }

  heading(text: string, size = 20) {
    this.write(text, {
      size,
      lineHeight: size * 1.18,
      font: "bold",
      color: COLORS.forest,
      gapAfter: 11,
    });
  }

  paragraph(text: string, gapAfter = 14) {
    this.write(text, {
      size: 10.5,
      lineHeight: 15.5,
      color: COLORS.muted,
      gapAfter,
    });
  }

  bullet(text: string, color: Color = COLORS.forest) {
    const bulletX = MARGIN + 4;
    const textX = MARGIN + 18;
    const width = CONTENT_WIDTH - 18;
    const lines = wrapText(text, width, 10.2, "regular");
    const height = Math.max(lines.length, 1) * 14.5 + 5;
    this.ensure(height);
    this.textAt("•", bulletX, this.y, 11, "bold", COLORS.green);
    for (const line of lines) {
      this.textAt(line, textX, this.y, 10.2, "regular", color);
      this.y -= 14.5;
    }
    this.y -= 5;
  }

  spacer(height: number) {
    this.ensure(height);
    this.y -= height;
  }

  cover(report: ReportViewModel) {
    this.rect(0, PAGE_HEIGHT - 230, PAGE_WIDTH, 230, COLORS.forest);
    this.textAt("DevisVéto", MARGIN, PAGE_HEIGHT - 56, 15, "bold", COLORS.white);
    this.textAt("RAPPORT COMPLET", MARGIN, PAGE_HEIGHT - 88, 9, "bold", COLORS.pale);

    const title = `Le ${report.documentLabel.toLowerCase()} de ${report.pet?.name || "votre animal"}, en clair`;
    const titleLines = wrapText(title, CONTENT_WIDTH - 40, 27, "bold");
    let titleY = PAGE_HEIGHT - 124;
    for (const line of titleLines) {
      this.textAt(line, MARGIN, titleY, 27, "bold", COLORS.white);
      titleY -= 31;
    }

    this.textAt(
      `${report.preview.lines.length} prestations identifiées`,
      MARGIN,
      PAGE_HEIGHT - 208,
      10,
      "regular",
      COLORS.pale
    );
    this.textAt(
      formatMoney(report.preview.total_amount, report.preview.currency),
      PAGE_WIDTH - MARGIN - 105,
      PAGE_HEIGHT - 208,
      14,
      "bold",
      COLORS.white
    );

    this.y = PAGE_HEIGHT - 268;
    this.label("Ce que signifie ce document");
    this.heading(report.preview.intervention, 21);
    this.paragraph(report.summaryParagraph, 20);

    this.label("Les points à retenir");
    for (const fact of report.keyFacts.slice(0, 4)) this.bullet(fact);
    this.spacer(6);

    this.rect(MARGIN, this.y - 74, CONTENT_WIDTH, 74, COLORS.pale, 12);
    this.textAt("À garder en tête", MARGIN + 16, this.y - 22, 10, "bold", COLORS.green);
    const notice = "Ce rapport explique le document fourni. Il ne pose aucun diagnostic, ne juge pas la nécessité des soins et ne remplace pas les explications de la clinique.";
    const noticeLines = wrapText(notice, CONTENT_WIDTH - 32, 9.2, "regular");
    let noticeY = this.y - 40;
    for (const line of noticeLines.slice(0, 3)) {
      this.textAt(line, MARGIN + 16, noticeY, 9.2, "regular", COLORS.muted);
      noticeY -= 12.5;
    }
    this.y -= 94;
  }

  sectionBreak(label: string, title: string) {
    this.ensure(70);
    this.spacer(8);
    this.label(label);
    this.heading(title, 20);
  }

  lineDetail(
    line: ReportViewModel["preview"]["lines"][number],
    currency: string,
    index: number
  ) {
    this.ensure(105);
    this.rect(MARGIN, this.y - 30, CONTENT_WIDTH, 30, index % 2 === 0 ? COLORS.pale : COLORS.cream, 7);
    this.textAt(line.original_label, MARGIN + 12, this.y - 19, 11, "bold", COLORS.forest);
    this.textAt(
      formatMoney(line.amount, currency),
      PAGE_WIDTH - MARGIN - 92,
      this.y - 19,
      10.5,
      "bold",
      COLORS.forest
    );
    this.y -= 44;

    this.write("Ce que cela signifie", {
      size: 8.5,
      lineHeight: 11,
      font: "bold",
      color: COLORS.green,
      gapAfter: 4,
    });
    this.paragraph(line.explanation, 7);

    if (line.clarification) {
      this.write("À confirmer avec la clinique", {
        size: 8.5,
        lineHeight: 11,
        font: "bold",
        color: COLORS.coral,
        gapAfter: 4,
      });
      this.paragraph(line.clarification, 8);
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
  objects.set(
    2,
    Buffer.from(`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`, "ascii")
  );
  objects.set(
    3,
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "ascii")
  );
  objects.set(
    4,
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>", "ascii")
  );

  pageStreams.forEach((stream, index) => {
    const pageId = pageIds[index];
    const contentId = contentIds[index];
    const streamBuffer = Buffer.from(stream, "ascii");
    objects.set(
      pageId,
      Buffer.from(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
        "ascii"
      )
    );
    objects.set(
      contentId,
      Buffer.concat([
        Buffer.from(`<< /Length ${streamBuffer.length} >>\nstream\n`, "ascii"),
        streamBuffer,
        Buffer.from("\nendstream", "ascii"),
      ])
    );
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
  for (let id = 1; id <= maxId; id += 1) {
    xrefLines.push(`${String(offsets[id]).padStart(10, "0")} 00000 n `);
  }
  const trailer = [
    ...xrefLines,
    "trailer",
    `<< /Size ${maxId + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
    "",
  ].join("\n");
  chunks.push(Buffer.from(trailer, "ascii"));
  return Buffer.concat(chunks);
}

export function generateReportPdf(report: ReportViewModel) {
  const canvas = new PdfCanvas();
  canvas.cover(report);

  canvas.sectionBreak("Détail du document", "Chaque ligne, expliquée simplement");
  for (const [index, line] of report.preview.lines.entries()) {
    canvas.lineDetail(line, report.preview.currency, index);
  }

  if (report.categoryTotals.length > 0) {
    canvas.sectionBreak("Lecture du montant", "Comment le montant se répartit");
    for (const item of report.categoryTotals) {
      canvas.ensure(24);
      canvas.write(item.category, {
        width: CONTENT_WIDTH - 110,
        size: 10.5,
        lineHeight: 14,
        font: "bold",
        color: COLORS.forest,
      });
      canvas.write(formatMoney(item.amount, report.preview.currency), {
        x: PAGE_WIDTH - MARGIN - 100,
        width: 100,
        size: 10.5,
        lineHeight: 14,
        font: "bold",
        color: COLORS.green,
        gapAfter: 4,
      });
      canvas.rule();
      canvas.spacer(9);
    }
    canvas.paragraph(
      "Cette répartition reprend uniquement les montants lisibles du document. Elle ne permet pas de conclure qu’un tarif est normal, anormal ou justifié.",
      10
    );
  }

  canvas.sectionBreak("Conclusion", "Ce que l’on peut retenir du document");
  canvas.paragraph(report.conclusion, 18);

  canvas.label("Ce qui est clairement indiqué");
  for (const item of report.clearlyIndicated) canvas.bullet(item);
  canvas.spacer(8);

  canvas.label("Ce qui reste à confirmer");
  if (report.toConfirm.length > 0) {
    for (const item of report.toConfirm) canvas.bullet(item, COLORS.muted);
  } else {
    canvas.paragraph("Aucun point de clarification majeur n’a été relevé dans les informations lisibles.");
  }

  canvas.sectionBreak("Préparer l’échange", "Les questions à poser à la clinique");
  if (report.preview.questions.length > 0) {
    for (const [index, question] of report.preview.questions.entries()) {
      canvas.ensure(34);
      canvas.write(`${index + 1}. ${question}`, {
        size: 10.5,
        lineHeight: 15.5,
        color: COLORS.forest,
        gapAfter: 8,
      });
    }
  } else {
    canvas.paragraph("Aucune question personnalisée n’a été générée à partir des informations lisibles.");
  }

  canvas.spacer(12);
  canvas.rect(MARGIN, canvas["y"] - 82, CONTENT_WIDTH, 82, COLORS.pale, 12);
  canvas.write(
    "DevisVéto explique le contenu du document fourni. Ce rapport ne constitue pas un diagnostic, ne juge pas la nécessité des soins et ne remplace pas les explications de la clinique vétérinaire. Les éléments indiqués comme étant à confirmer n’ont pas pu être établis à partir du document seul.",
    {
      x: MARGIN + 16,
      width: CONTENT_WIDTH - 32,
      size: 9.2,
      lineHeight: 13,
      color: COLORS.muted,
      gapAfter: 0,
    }
  );

  return buildPdfObjects(canvas.finish());
}
