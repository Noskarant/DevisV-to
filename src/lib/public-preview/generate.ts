import "server-only";
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

function buildFallbackPreview(input: GeneratePreviewInput): PreviewPayload {
  const context = input.userDescription?.trim();
  const question = input.primaryQuestion?.trim();

  return {
    intervention: context || `${input.documentType === "devis" ? "Devis" : "Facture"} vétérinaire de ${input.petName}`,
    total_amount: null,
    currency: "EUR",
    summary:
      `Le document concernant ${input.petName} a bien été reçu. La lecture détaillée sera vérifiée avant la livraison du rapport complet.`,
    categories: ["Document vétérinaire", "Prestations à détailler", "Questions à préparer"],
    lines: [
      {
        original_label: "Document reçu",
        category: "Informations générales",
        amount: null,
        explanation:
          "Le fichier est exploitable et a été enregistré dans votre dossier privé. Les libellés et montants seront repris sans être complétés au hasard.",
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
    price_context:
      "Il n’est pas possible de conclure de manière fiable si le montant est élevé sans connaître le contexte médical et le détail exact des prestations. Le rapport complet explique les postes présents et les informations à faire préciser.",
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

export async function generatePreview(input: GeneratePreviewInput): Promise<PreviewPayload> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const normalizedMime = input.mimeType === "image/jpg" ? "image/jpeg" : input.mimeType;
  const supported = ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(normalizedMime);

  if (!apiKey || !supported) return buildFallbackPreview(input);

  const encoded = input.fileBuffer.toString("base64");
  const fileBlock: Record<string, unknown> = normalizedMime === "application/pdf"
    ? {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: encoded },
        title: input.filename,
      }
    : {
        type: "image",
        source: { type: "base64", media_type: normalizedMime, data: encoded },
      };

  const systemPrompt = `Tu analyses uniquement un devis ou une facture vétérinaire afin d'en expliquer le contenu à un propriétaire d'animal.
Règles absolues :
- ne pose aucun diagnostic ;
- ne juge jamais la nécessité médicale d'un acte ;
- ne dis jamais qu'un prix est normal, anormal, trop cher ou bon marché ;
- n'accuse jamais une clinique de surfacturation ;
- n'invente aucune ligne, aucun montant ni aucune prestation ;
- distingue ce qui est lisible de ce qui est incertain ;
- si une information est illisible, écris-le explicitement ;
- formule les questions de façon coopérative et non accusatoire ;
- réponds exclusivement avec un objet JSON valide, sans markdown ni commentaire.`;

  const requestedShape = {
    intervention: "type d'intervention ou objet principal du document, sans inventer",
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
    variation_factors: ["facteurs présents ou pertinents pouvant influencer le montant, sans fourchette de prix"],
    price_context: "réponse qualitative à la préoccupation sur le prix, sans verdict ni comparaison chiffrée",
    warnings: ["limites et urgence éventuelle"],
  };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
        max_tokens: 3500,
        temperature: 0.1,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              fileBlock,
              {
                type: "text",
                text: `Animal : ${input.petName} (${input.species}).\nType : ${input.documentType}.\nUrgence déclarée : ${input.emergencyContext ? "oui" : "non"}.\nContexte utilisateur : ${input.userDescription || "non renseigné"}.\nQuestion principale : ${input.primaryQuestion || "non renseignée"}.\n\nExtrais le document et retourne exactement cette structure JSON :\n${JSON.stringify(requestedShape)}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[PREVIEW] Anthropic error", response.status);
      return buildFallbackPreview(input);
    }

    const payload = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = payload.content?.find((block) => block.type === "text")?.text;
    if (!text) return buildFallbackPreview(input);

    const parsed = previewSchema.safeParse(extractJson(text));
    if (!parsed.success) {
      console.error("[PREVIEW] Invalid structured response", parsed.error.issues.map((issue) => issue.path.join(".")));
      return buildFallbackPreview(input);
    }

    return parsed.data;
  } catch (error) {
    console.error("[PREVIEW] Generation failed", error instanceof Error ? error.message : "unknown");
    return buildFallbackPreview(input);
  }
}
