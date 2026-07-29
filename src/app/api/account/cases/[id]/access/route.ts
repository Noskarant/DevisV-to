import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, payment_status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!caseRow) {
    return NextResponse.json({ error: "Analyse introuvable." }, { status: 404 });
  }

  const { data: previewEvent } = await supabase
    .from("analytics_events")
    .select("metadata")
    .eq("case_id", id)
    .eq("user_id", user.id)
    .eq("event_name", "public_preview_created")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const token = (previewEvent?.metadata as { token?: unknown } | null)?.token;
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Lien d’analyse introuvable." }, { status: 404 });
  }

  return NextResponse.json(
    {
      url: `/apercu/${token}`,
      access: caseRow.payment_status === "succeeded" ? "complete" : "preview",
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
