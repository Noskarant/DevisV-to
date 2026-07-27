import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { findOrCreateProfileByEmail } from "@/lib/public-preview/data";
import { generatePreview } from "@/lib/public-preview/generate";
import { sendPreviewReadyEmail } from "@/lib/email/send";

export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
]);

const inputSchema = z.object({
  email: z.string().trim().email("Adresse email invalide.").max(254),
  pet_id: z.string().uuid().optional().or(z.literal("")).transform((value) => value || null),
  pet_name: z.string().trim().min(1, "Indiquez le prénom de votre animal.").max(80),
  species: z.enum(["chien", "chat", "autre"]),
  document_type: z.enum(["devis", "facture"]),
  emergency_context: z.enum(["true", "false"]).transform((value) => value === "true"),
  user_description: z.string().trim().max(1500).optional().default(""),
  primary_question: z.string().trim().max(500).optional().default(""),
  consent_data_processing: z.literal("true", {
    error: "Le consentement au traitement du document est obligatoire.",
  }),
  consent_anonymized_statistics: z.enum(["true", "false"]).transform((value) => value === "true"),
  consent_anonymized_content: z.enum(["true", "false"]).transform((value) => value === "true"),
});

function safeExtension(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return extension || "bin";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Ajoutez un devis ou une facture." }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Format non pris en charge. Utilisez un PDF, JPG, PNG ou HEIC." },
        { status: 415 }
      );
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Le document doit faire moins de 10 Mo." }, { status: 400 });
    }

    const rawInput = Object.fromEntries(
      [
        "email",
        "pet_id",
        "pet_name",
        "species",
        "document_type",
        "emergency_context",
        "user_description",
        "primary_question",
        "consent_data_processing",
        "consent_anonymized_statistics",
        "consent_anonymized_content",
      ].map((key) => [key, String(formData.get(key) ?? "")])
    );
    const parsed = inputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Informations invalides." },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const supabase = createAdminClient();
    const profile = await findOrCreateProfileByEmail(input.email);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .gte("created_at", oneHourAgo);
    if ((count ?? 0) >= 5) {
      return NextResponse.json(
        { error: "Trop de demandes ont été envoyées récemment. Réessayez dans une heure." },
        { status: 429 }
      );
    }

    let pet: { id: string; name: string; species: "chien" | "chat" | "autre" } | null = null;

    if (input.pet_id) {
      const sessionClient = await createClient();
      const { data: { user } } = await sessionClient.auth.getUser();
      if (!user || user.id !== profile.id) {
        return NextResponse.json(
          { error: "Reconnectez-vous pour ajouter ce document au dossier de cet animal." },
          { status: 403 }
        );
      }

      const { data: selectedPet } = await supabase
        .from("pets")
        .select("id, name, species")
        .eq("id", input.pet_id)
        .eq("user_id", profile.id)
        .is("archived_at", null)
        .maybeSingle();
      if (!selectedPet) {
        return NextResponse.json({ error: "Dossier animal introuvable." }, { status: 404 });
      }
      pet = selectedPet;
    } else {
      const { data: matchingPets } = await supabase
        .from("pets")
        .select("id, name, species")
        .eq("user_id", profile.id)
        .eq("species", input.species)
        .ilike("name", input.pet_name)
        .is("archived_at", null)
        .limit(1);

      pet = matchingPets?.[0] ?? null;
      if (!pet) {
        const { data: createdPet, error: petError } = await supabase
          .from("pets")
          .insert({
            user_id: profile.id,
            name: input.pet_name,
            species: input.species,
            sex: "inconnu",
          })
          .select("id, name, species")
          .single();
        if (petError || !createdPet) throw new Error(petError?.message ?? "Animal non créé.");
        pet = createdPet;
      }
    }

    const { data: previousCase } = await supabase
      .from("cases")
      .select("id")
      .eq("user_id", profile.id)
      .eq("pet_id", pet.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: caseRow, error: caseError } = await supabase
      .from("cases")
      .insert({
        user_id: profile.id,
        pet_id: pet.id,
        case_type: "devis_upload",
        document_type: input.document_type,
        status: "extraction_pending",
        emergency_context: input.emergency_context,
        user_description: input.user_description || null,
        primary_question: input.primary_question || null,
        comparison_case_id: previousCase?.id ?? null,
        currency: "EUR",
        consent_data_processing: true,
        consent_anonymized_statistics: input.consent_anonymized_statistics,
        consent_anonymized_content: input.consent_anonymized_content,
      })
      .select("id")
      .single();
    if (caseError || !caseRow) throw new Error(caseError?.message ?? "Dossier non créé.");

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `${profile.id}/${caseRow.id}/${crypto.randomUUID()}.${safeExtension(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("case-documents")
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { error: documentError } = await supabase.from("case_documents").insert({
      case_id: caseRow.id,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
      extraction_status: "processing",
    });
    if (documentError) throw new Error(documentError.message);

    const preview = await generatePreview({
      fileBuffer: buffer,
      mimeType: file.type,
      filename: file.name,
      petName: pet.name,
      species: pet.species,
      documentType: input.document_type,
      emergencyContext: input.emergency_context,
      userDescription: input.user_description,
      primaryQuestion: input.primary_question,
    });

    const itemRows = preview.lines.map((line, index) => ({
      case_id: caseRow.id,
      original_label: line.original_label,
      normalized_label: line.original_label,
      category: line.category,
      total_price: line.amount,
      explanation: line.explanation,
      confidence_score: line.confidence,
      clarification_needed: line.clarification,
      display_order: index,
    }));
    const { error: itemsError } = await supabase.from("extracted_items").insert(itemRows);
    if (itemsError) throw new Error(itemsError.message);

    const { error: reportError } = await supabase.from("case_reports").insert({
      case_id: caseRow.id,
      summary: preview.summary,
      amount_composition: { categories: preview.categories, intervention: preview.intervention },
      price_variation_factors: preview.variation_factors,
      questions_to_ask: preview.questions,
      limitations: preview.warnings.join("\n"),
      ai_raw_output: preview,
      version: 1,
    });
    if (reportError) throw new Error(reportError.message);

    await supabase.from("case_documents").update({ extraction_status: "done" }).eq("case_id", caseRow.id);
    await supabase
      .from("cases")
      .update({
        status: "extracted",
        detected_total_amount: preview.total_amount,
        currency: preview.currency,
      })
      .eq("id", caseRow.id);

    const token = crypto.randomUUID();
    const { error: eventError } = await supabase.from("analytics_events").insert({
      user_id: profile.id,
      case_id: caseRow.id,
      event_name: "public_preview_created",
      metadata: { token, source: input.pet_id ? "pet_record" : "public_funnel", filename: file.name },
    });
    if (eventError) throw new Error(eventError.message);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const previewUrl = `${appUrl}/apercu/${token}`;
    await sendPreviewReadyEmail(profile.email, pet.name, previewUrl);

    return NextResponse.json({ url: `/apercu/${token}` });
  } catch (error) {
    console.error("[PUBLIC_ANALYSE]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Nous n’avons pas pu préparer l’aperçu. Vérifiez le document puis réessayez." },
      { status: 500 }
    );
  }
}
