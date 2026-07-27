import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { deleteMyDataAction } from "./actions";

export default async function ParametresPage() {
  try {
    await requireUser();
  } catch {
    redirect("/connexion?next=/dashboard/parametres");
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-xl font-semibold text-slate-900">Paramètres</h1>

      <section className="mt-8 rounded-xl border border-red-100 bg-red-50 p-5">
        <h2 className="text-sm font-semibold text-slate-900">Supprimer mes données</h2>
        <p className="mt-2 text-sm text-slate-600">
          Cette action supprime définitivement vos animaux, vos dossiers, vos documents et
          vos rapports. Elle est irréversible.
        </p>
        <form action={deleteMyDataAction}>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Supprimer définitivement mes données
          </button>
        </form>
      </section>
    </main>
  );
}
