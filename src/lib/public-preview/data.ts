import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const PUBLIC_TOKEN_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidPublicToken(token: string) {
  return PUBLIC_TOKEN_PATTERN.test(token);
}

export async function findProfileByEmail(email: string) {
  const supabase = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", normalizedEmail)
    .limit(1)
    .maybeSingle();

  return existingProfile;
}

export async function findOrCreateProfileByEmail(
  email: string,
  options: { allowExisting?: boolean } = {}
) {
  const supabase = createAdminClient();
  const allowExisting = options.allowExisting ?? true;
  const normalizedEmail = email.trim().toLowerCase();
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", normalizedEmail)
    .limit(1)
    .maybeSingle();
  if (existingProfile) {
    if (!allowExisting) throw new Error("ACCOUNT_REQUIRES_LOGIN");
    return existingProfile;
  }

  let userId: string | null = null;
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
  });
  if (created.user) {
    userId = created.user.id;
  } else if (createError) {
    if (!allowExisting) throw new Error("ACCOUNT_REQUIRES_LOGIN");
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
  if (!isValidPublicToken(token)) return null;

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

const itemSelect =
  "id, original_label, category, quantity, unit_price, total_price, explanation, confidence_score, clarification_needed, source_page, source_quote, explicit_elements, elements_to_confirm, suggested_question, reading_status, display_order";
const reportSelect =
  "id, summary, amount_composition, price_variation_factors, questions_to_ask, priority_questions, generated_email_subject, generated_email_body, document_checks, document_readability, source_page_count, limitations, ai_raw_output, version, reviewed_at, created_at, updated_at";

export async function loadPublicPreview(token: string) {
  const caseId = await resolveCaseIdByPublicToken(token);
  if (!caseId) return null;
  const supabase = createAdminClient();
  const [{ data: caseRow }, { data: items }, { data: reports }, { data: payments }, { data: documents }] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "id, user_id, pet_id, document_type, status, detected_total_amount, currency, payment_status, entitlement_source, access_granted_at, comparison_case_id, created_at, pets(id, name, species), profiles(email)"
      )
      .eq("id", caseId)
      .single(),
    supabase.from("extracted_items").select(itemSelect).eq("case_id", caseId).order("display_order", { ascending: true }),
    supabase.from("case_reports").select(reportSelect).eq("case_id", caseId).order("version", { ascending: false }).limit(1),
    supabase.from("payments").select("id, status, amount, currency, created_at").eq("case_id", caseId).order("created_at", { ascending: false }).limit(1),
    supabase.from("case_documents").select("id, original_filename, mime_type, page_count, created_at").eq("case_id", caseId).order("created_at", { ascending: false }).limit(1),
  ]);
  if (!caseRow) return null;

  return {
    caseRow,
    items: items ?? [],
    report: reports?.[0] ?? null,
    payment: payments?.[0] ?? null,
    document: documents?.[0] ?? null,
    comparison: await loadComparisonData(caseRow.comparison_case_id),
  };
}

async function loadComparisonData(caseId: string | null) {
  if (!caseId) return null;
  const supabase = createAdminClient();
  const [{ data: caseRow }, { data: items }, { data: reports }] = await Promise.all([
    supabase
      .from("cases")
      .select("id, document_type, detected_total_amount, currency, created_at")
      .eq("id", caseId)
      .maybeSingle(),
    supabase.from("extracted_items").select(itemSelect).eq("case_id", caseId).order("display_order", { ascending: true }),
    supabase.from("case_reports").select(reportSelect).eq("case_id", caseId).order("version", { ascending: false }).limit(1),
  ]);
  if (!caseRow) return null;
  return { caseRow, items: items ?? [], report: reports?.[0] ?? null };
}
