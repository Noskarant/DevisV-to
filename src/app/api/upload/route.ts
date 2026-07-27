import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { documentUploadSchema } from "@/lib/validation/schemas";
import { NextResponse } from "next/server";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
]);

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const caseId = formData.get("case_id") as string | null;

  if (!file || !caseId) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "TYPE_NON_SUPPORTE" }, { status: 415 });
  }

  const parsed = documentUploadSchema.safeParse({
    mime_type: file.type,
    file_size: file.size,
    original_filename: file.name,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const supabase = await createClient();

  // Vérifie que le dossier appartient bien à l'utilisateur
  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .eq("user_id", user.id)
    .single();

  if (caseError || !caseRow) {
    return NextResponse.json({ error: "DOSSIER_INTROUVABLE" }, { status: 404 });
  }

  const extension = file.name.split(".").pop() ?? "bin";
  const randomName = crypto.randomUUID();
  const storagePath = `${user.id}/${caseId}/${randomName}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("case-documents")
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: docRow, error: docError } = await supabase
    .from("case_documents")
    .insert({
      case_id: caseId,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
      extraction_status: "pending",
    })
    .select("id")
    .single();

  if (docError) {
    return NextResponse.json({ error: docError.message }, { status: 500 });
  }

  await supabase.from("cases").update({ status: "extraction_pending" }).eq("id", caseId);

  return NextResponse.json({ document_id: docRow.id, storage_path: storagePath });
}
