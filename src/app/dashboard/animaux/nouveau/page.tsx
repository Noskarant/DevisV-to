import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createPetAction } from "../actions";
import { PetForm } from "../pet-form";

export const metadata = {
  title: "Ajouter un animal — DevisVéto",
};

export default async function NewPetPage() {
  try {
    await requireUser();
  } catch {
    redirect("/connexion?next=/dashboard/animaux/nouveau");
  }

  return (
    <main className="min-h-screen bg-[#f4f7f4] px-5 py-8 text-[#173b35] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="text-sm font-extrabold text-[#45665f] hover:text-[#0c5b50]">
          ← Retour à mon espace
        </Link>
        <div className="mt-6 rounded-[28px] bg-[#123f38] px-6 py-7 text-white shadow-[0_22px_60px_rgba(18,63,56,0.16)] sm:px-9 sm:py-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#9fcfc1]">Nouvel animal</p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Créez sa fiche en moins d’une minute.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#c4d7d2]">
            Son nom et son espèce suffisent pour commencer. Vous pourrez compléter toutes les autres informations plus tard.
          </p>
          <div className="mt-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-[#d9e8e4]">
            Ces informations servent uniquement à organiser son suivi documentaire.
          </div>
        </div>

        <div className="mt-7">
          <PetForm action={createPetAction} submitLabel="Créer la fiche de mon animal" />
        </div>
      </div>
    </main>
  );
}
