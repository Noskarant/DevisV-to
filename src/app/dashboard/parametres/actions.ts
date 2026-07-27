"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { sendDataDeletionConfirmedEmail } from "@/lib/email/send";
import { redirect } from "next/navigation";

export async function deleteMyDataAction() {
  const user = await requireUser();
  const supabase = await createClient();

  // Supprime les fichiers stockés (tous les documents sous le user_id)
  const { data: files } = await supabase.storage.from("case-documents").list(user.id, {
    limit: 1000,
  });
  // list() ne descend pas récursivement dans les sous-dossiers case_id ;
  // on récupère donc les chemins via case_documents pour un nettoyage complet.
  const { data: docs } = await supabase
    .from("case_documents")
    .select("storage_path, cases!inner(user_id)")
    .eq("cases.user_id", user.id);

  const paths = (docs ?? []).map((d) => d.storage_path);
  if (paths.length > 0) {
    await supabase.storage.from("case-documents").remove(paths);
  }
  void files; // liste de premier niveau non utilisée directement, gardée pour debug futur

  // Supprime les dossiers (cascade : documents, lignes, rapports, paiements, feedback)
  await supabase.from("cases").delete().eq("user_id", user.id);
  await supabase.from("pets").delete().eq("user_id", user.id);

  if (user.email) {
    await sendDataDeletionConfirmedEmail(user.email);
  }

  redirect("/dashboard");
}
