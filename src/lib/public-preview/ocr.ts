import "server-only";

const DEFAULT_MISTRAL_OCR_MODEL = "mistral-ocr-latest";
const LEGACY_MISTRAL_OCR_MODELS = new Set(["mistral-ocr-4-0"]);

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

function resolveOcrModel() {
  const configured = process.env.MISTRAL_OCR_MODEL?.trim();
  if (!configured || LEGACY_MISTRAL_OCR_MODELS.has(configured)) {
    if (configured) {
      console.warn("[OCR] Legacy Mistral model ignored", {
        configuredModel: configured,
        selectedModel: DEFAULT_MISTRAL_OCR_MODEL,
      });
    }
    return DEFAULT_MISTRAL_OCR_MODEL;
  }
  return configured;
}

function compactProviderError(raw: string) {
  const compact = raw.replace(/\s+/g, " ").trim().slice(0, 700);
  if (!compact) return "empty provider response";

  try {
    const parsed = JSON.parse(compact) as {
      message?: unknown;
      detail?: unknown;
      error?: { message?: unknown; code?: unknown; type?: unknown } | string;
    };
    const nested = typeof parsed.error === "object" && parsed.error !== null ? parsed.error : null;
    return JSON.stringify({
      message:
        typeof nested?.message === "string"
          ? nested.message
          : typeof parsed.message === "string"
            ? parsed.message
            : typeof parsed.detail === "string"
              ? parsed.detail
              : typeof parsed.error === "string"
                ? parsed.error
                : undefined,
      code: nested && typeof nested.code === "string" ? nested.code : undefined,
      type: nested && typeof nested.type === "string" ? nested.type : undefined,
    });
  } catch {
    return compact;
  }
}

export async function extractDocumentText(input: {
  fileBuffer: Buffer;
  mimeType: string;
}): Promise<OcrResult | null> {
  const apiKey = process.env.MISTRAL_API_KEY?.trim();
  if (!apiKey) {
    console.error("[OCR] MISTRAL_API_KEY is missing");
    return null;
  }

  const model = resolveOcrModel();
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
        model,
        document,
        include_image_base64: false,
        include_blocks: false,
        confidence_scores_granularity: "page",
        extract_header: false,
        extract_footer: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const providerBody = await response.text();
      console.error("[OCR] Mistral request failed", {
        status: response.status,
        model,
        requestId: response.headers.get("x-request-id") ?? response.headers.get("request-id"),
        providerError: compactProviderError(providerBody),
      });
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
      console.error("[OCR] Empty document text", {
        model: payload.model ?? model,
        pageCount: pages.length,
      });
      return null;
    }

    const confidences = pages
      .map((page) => page.confidence_scores?.average_page_confidence_score)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const averageConfidence = confidences.length > 0
      ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
      : null;

    console.info("[OCR] Mistral completed", {
      model: payload.model ?? model,
      pageCount: pages.length,
      characterCount: text.length,
      averageConfidence,
    });

    return {
      text,
      pageCount: pages.length,
      averageConfidence,
      provider: "mistral",
      model: payload.model ?? model,
    };
  } catch (error) {
    console.error("[OCR] Extraction failed", {
      model,
      errorName: error instanceof Error ? error.name : "unknown",
      errorMessage: error instanceof Error ? error.message : "unknown",
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
