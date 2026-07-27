import "server-only";

export type OcrResult = {
  text: string;
  pageCount: number;
  averageConfidence: number | null;
  provider: "mistral";
  model: string;
};

type MistralOcrPage = {
  markdown?: string;
  confidence_scores?: {
    average_page_confidence_score?: number;
  } | null;
};

type MistralOcrResponse = {
  model?: string;
  pages?: MistralOcrPage[];
};

function normalizeMimeType(mimeType: string) {
  return mimeType === "image/jpg" ? "image/jpeg" : mimeType;
}

export async function extractDocumentText(input: {
  fileBuffer: Buffer;
  mimeType: string;
}): Promise<OcrResult | null> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return null;

  const mimeType = normalizeMimeType(input.mimeType);
  const encoded = input.fileBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${encoded}`;
  const document = mimeType === "application/pdf"
    ? { type: "document_url", document_url: dataUrl }
    : { type: "image_url", image_url: dataUrl };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch("https://api.mistral.ai/v1/ocr", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.MISTRAL_OCR_MODEL ?? "mistral-ocr-4-0",
        document,
        include_image_base64: false,
        include_blocks: false,
        table_format: "markdown",
        confidence_scores_granularity: "page",
        extract_header: false,
        extract_footer: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("[OCR] Mistral request failed", response.status);
      return null;
    }

    const payload = (await response.json()) as MistralOcrResponse;
    const pages = payload.pages ?? [];
    const text = pages
      .map((page, index) => `--- PAGE ${index + 1} ---\n${page.markdown?.trim() ?? ""}`)
      .join("\n\n")
      .trim()
      .slice(0, 80_000);

    if (!text) {
      console.error("[OCR] Empty document text");
      return null;
    }

    const confidences = pages
      .map((page) => page.confidence_scores?.average_page_confidence_score)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const averageConfidence = confidences.length > 0
      ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
      : null;

    return {
      text,
      pageCount: pages.length,
      averageConfidence,
      provider: "mistral",
      model: payload.model ?? process.env.MISTRAL_OCR_MODEL ?? "mistral-ocr-4-0",
    };
  } catch (error) {
    console.error(
      "[OCR] Extraction failed",
      error instanceof Error ? error.name : "unknown"
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
