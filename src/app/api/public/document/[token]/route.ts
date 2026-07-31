import { createAdminClient } from "@/lib/supabase/admin";
import { resolveCaseIdByPublicToken } from "@/lib/public-preview/data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const caseId = await resolveCaseIdByPublicToken(token);
  if (!caseId) return Response.json({ error: "Document introuvable." }, { status: 404 });

  const supabase = createAdminClient();
  const [{ data: caseRow }, { data: payments }] = await Promise.all([
    supabase
      .from("cases")
      .select("payment_status")
      .eq("id", caseId)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("status")
      .eq("case_id", caseId)
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const paid = caseRow?.payment_status === "succeeded" || Boolean(payments?.length);
  if (!paid) {
    return Response.json(
      { error: "Le document original est disponible avec le rapport complet." },
      {
        status: 403,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }

  const { data: document } = await supabase
    .from("case_documents")
    .select("storage_path, original_filename, mime_type")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!document) return Response.json({ error: "Document introuvable." }, { status: 404 });

  const { data, error } = await supabase.storage.from("case-documents").download(document.storage_path);
  if (error || !data) return Response.json({ error: "Document indisponible." }, { status: 404 });

  return new Response(await data.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": document.mime_type || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.original_filename)}`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
