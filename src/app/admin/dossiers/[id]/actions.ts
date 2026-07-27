"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { sendNeedsInformationEmail, sendReportReadyEmail } from "@/lib/email/send";

async function logAudit(
  caseId: string,
  adminId: string,
  action: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    case_id: caseId,
    user_id: adminId,
    action,
    metadata: metadata ?? null,
  });
}

export async function getSignedDocumentUrl(storagePath: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("case-documents")
    .createSignedUrl(storagePath, 60 * 10); // 10 minutes
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function updateExtractedItem(
  itemId: string,
  caseId: string,
  fields: {
    original_label?: string;
    normalized_label?: string;
    category?: string;
    quantity?: number | null;
    unit_price?: number | null;
    total_price?: number | null;
    explanation?: string;
    confidence_score?: "high" | "medium" | "low";
    clarification_needed?: string | null;
  }
) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("extracted_items").update(fields).eq("id", itemId);
  if (error) throw new Error(error.message);
  await logAudit(caseId, admin.id, "edit_extracted_item", { itemId, fields });
  revalidatePath(`/admin/dossiers/${caseId}`);
}

export async function addExtractedItem(caseId: string, displayOrder: number) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("extracted_items").insert({
    case_id: caseId,
    original_label: "Nouvelle ligne",
    category: "autres",
    confidence_score: "low",
    display_order: displayOrder,
  });
  if (error) throw new Error(error.message);
  await logAudit(caseId, admin.id, "add_extracted_item");
  revalidatePath(`/admin/dossiers/${caseId}`);
}

export async function deleteExtractedItem(itemId: string, caseId: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("extracted_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  await logAudit(caseId, admin.id, "delete_extracted_item", { itemId });
  revalidatePath(`/admin/dossiers/${caseId}`);
}

export async function updateReport(
  caseId: string,
  reportId: string | null,
  fields: {
    summary?: string;
    amount_composition?: string[];
    price_variation_factors?: string[];
    questions_to_ask?: string[];
    limitations?: string;
  }
) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  if (reportId) {
    const { error } = await supabase.from("case_reports").update(fields).eq("id", reportId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("case_reports")
      .insert({ case_id: caseId, ...fields });
    if (error) throw new Error(error.message);
  }
  await logAudit(caseId, admin.id, "edit_report", { fields });
  revalidatePath(`/admin/dossiers/${caseId}`);
}

export async function addInternalComment(caseId: string, comment: string) {
  const admin = await requireAdmin();
  await logAudit(caseId, admin.id, "internal_comment", { comment });
  revalidatePath(`/admin/dossiers/${caseId}`);
}

export async function setCaseStatus(caseId: string, status: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("cases").update({ status }).eq("id", caseId);
  if (error) throw new Error(error.message);
  await logAudit(caseId, admin.id, "set_status", { status });

  if (status === "needs_information") {
    const { data: caseRow } = await supabase
      .from("cases")
      .select("pets(name), profiles(email)")
      .eq("id", caseId)
      .single();
    const pet = caseRow?.pets as unknown as { name: string } | null;
    const profile = caseRow?.profiles as unknown as { email: string } | null;
    if (profile?.email) {
      await sendNeedsInformationEmail(profile.email, pet?.name ?? "votre animal");
    }
  }

  revalidatePath(`/admin/dossiers/${caseId}`);
}

export async function approveAndPublish(caseId: string, reportId: string) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const { error: reportError } = await supabase
    .from("case_reports")
    .update({ reviewer_id: admin.id, reviewed_at: new Date().toISOString() })
    .eq("id", reportId);
  if (reportError) throw new Error(reportError.message);

  const { error: caseError } = await supabase
    .from("cases")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", caseId);
  if (caseError) throw new Error(caseError.message);

  await logAudit(caseId, admin.id, "approve_and_publish");
  revalidatePath(`/admin/dossiers/${caseId}`);
  revalidatePath("/admin");

  const { data: caseRow } = await supabase
    .from("cases")
    .select("pets(name), profiles(email)")
    .eq("id", caseId)
    .single();
  const pet = caseRow?.pets as unknown as { name: string } | null;
  const profile = caseRow?.profiles as unknown as { email: string } | null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (profile?.email) {
    await sendReportReadyEmail(
      profile.email,
      pet?.name ?? "votre animal",
      `${appUrl}/dashboard/dossiers/${caseId}/rapport`
    );
  }
}
