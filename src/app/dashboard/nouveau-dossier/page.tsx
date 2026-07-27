import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Wizard } from "./wizard";

export default async function NouveauDossierPage() {
  try {
    await requireUser();
  } catch {
    redirect("/connexion?next=/dashboard/nouveau-dossier");
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <Wizard />
    </main>
  );
}
