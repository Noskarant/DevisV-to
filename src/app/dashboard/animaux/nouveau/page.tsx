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
          ← Retour à mes animaux
        </Link>
        <div className="mt-6 rounded-[28px] bg-[#123f38] px-6 py-8 text-white sm:px-9">
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#9fcfc1]">Nouveau dossier animal</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Regroupez toutes ses informations au même endroit.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#c4d7d2]">
            Ces données servent à organiser les documents et le suivi. Elles ne sont jamais utilisées pour poser un diagnostic.
          </p>
        </div>

        <div className="mt-7">
          <PetForm action={createPetAction} submitLabel="Créer le dossier animal" />
        </div>
      </div>
    </main>
  );
}
