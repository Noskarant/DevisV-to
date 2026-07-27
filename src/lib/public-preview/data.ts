import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function findOrCreateProfileByEmail(email: string) {
  const supabase = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", normalizedEmail)
    .limit(1)
    .maybeSingle();

  if (existingProfile) return existingProfile;

  let userId: string | null = null;
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
  });

  if (created.user) {
    userId = created.user.id;
  } else if (createError) {
    const { data: listed } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = listed.users.find((user) => user.email?.toLowerCase() === normalizedEmail)?.id ?? null;
  }

  if (!userId) throw new Error("Impossible de créer l’espace client.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, email: normalizedEmail }, { onConflict: "id" })
    .select("id, email")
    .single();

  if (profileError || !profile) throw new Error(profileError?.message ?? "Profil introuvable.");
  return profile;
}

export async function resolveCaseIdByPublicToken(token: string) {
  const supabase = createAdminClient();
  const { data: event } = await supabase
    .from("analytics_events")
    .select("case_id")
    .eq("event_name", "public_preview_created")
    .contains("metadata", { token })
    .limit(1)
    .maybeSingle();

  return (event?.case_id as string | null) ?? null;
}

export async function loadPublicPreview(token: string) {
  const caseId = await resolveCaseIdByPublicToken(token);
  if (!caseId) return null;

  const supabase = createAdminClient();
  const [{ data: caseRow }, { data: items }, { data: reports }, { data: payments }] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "id, user_id, pet_id, document_type, status, detected_total_amount, currency, payment_status, created_at, pets(id, name, species), profiles(email)"
      )
      .eq("id", caseId)
      .single(),
    supabase
      .from("extracted_items")
      .select(
        "id, original_label, category, total_price, explanation, confidence_score, clarification_needed, display_order"
      )
      .eq("case_id", caseId)
      .order("display_order", { ascending: true }),
    supabase
      .from("case_reports")
      .select(
        "id, summary, amount_composition, price_variation_factors, questions_to_ask, limitations, ai_raw_output, version, created_at"
      )
      .eq("case_id", caseId)
      .order("version", { ascending: false })
      .limit(1),
    supabase
      .from("payments")
      .select("id, status, amount, currency, created_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (!caseRow) return null;

  return {
    caseRow,
    items: items ?? [],
    report: reports?.[0] ?? null,
    payment: payments?.[0] ?? null,
  };
}
