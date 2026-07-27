import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CaseEditor } from "./case-editor";

export default async function AdminCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/connexion?next=/admin");
  }

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: caseRow }, { data: documents }, { data: items }, { data: report }, { data: logs }] =
    await Promise.all([
      supabase
        .from("cases")
        .select("*, pets(name, species, breed, weight_kg), profiles(email)")
        .eq("id", id)
        .single(),
      supabase
        .from("case_documents")
        .select("*")
        .eq("case_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("extracted_items")
        .select("*")
        .eq("case_id", id)
        .order("display_order", { ascending: true }),
      supabase.from("case_reports").select("*").eq("case_id", id).maybeSingle(),
      supabase
        .from("audit_logs")
        .select("*")
        .eq("case_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  if (!caseRow) redirect("/admin");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <CaseEditor
        caseRow={caseRow}
        documents={documents ?? []}
        items={items ?? []}
        report={report ?? null}
        logs={logs ?? []}
      />
    </main>
  );
}
