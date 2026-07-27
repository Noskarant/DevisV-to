import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { deleteMyDataAction } from "./actions";

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d="m4.5 10.5 3.2 3.1 7.8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function ParametresPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/connexion?next=/dashboard/parametres");
  }

  return (
    <main className="min-h-screen bg-[#f4f7f4] px-5 py-8 text-[#173b35] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0c5b50] text-lg font-black text-white">DV</span>
            <div>
              <p className="text-lg font-extrabold tracking-[-0.035em] text-[#123f38]">DevisVéto</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#78908a]">Paramètres</p>
            </div>
          </Link>
          <Link href="/dashboard" className="rounded-full border border-[#cddbd6] bg-white px-4 py-2.5 text-sm font-extrabold text-[#45665f] hover:bg-[#f1f6f4]">
            Retour à mon espace
          </Link>
        </header>

        <section className="mt-8 rounded-[30px] bg-[#123f38] px-6 py-8 text-white shadow-[0_24px_70px_rgba(18,63,56,0.18)] sm:px-9 sm:py-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#9fcfc1]">Confidentialité et contrôle</p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Vos données restent sous votre contrôle.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#c4d7d2]">
            Retrouvez les informations liées à votre espace et choisissez à tout moment ce que vous souhaitez conserver.
          </p>
        </section>

        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.06)]">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Votre accès</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.035em] text-[#123f38]">Adresse de connexion</h2>
            <div className="mt-5 rounded-2xl bg-[#f3f7f5] px-4 py-3 text-sm font-extrabold text-[#315f57]">
              {user.email || "Adresse non disponible"}
            </div>
            <p className="mt-3 text-xs leading-5 text-[#78908a]">Un lien sécurisé est envoyé à cette adresse lorsque vous accédez à DevisVéto.</p>
          </section>

          <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.06)]">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Ce que vous retrouvez ici</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.035em] text-[#123f38]">Un espace privé par animal</h2>
            <div className="mt-5 space-y-3 text-sm font-semibold text-[#526f68]">
              {["Informations et mesures que vous renseignez", "Documents et rapports associés", "Rappels et historique de suivi"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e7f3ee] text-[#0c5b50]"><CheckIcon /></span>
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-7 rounded-[26px] border border-[#f0c9bc] bg-[#fff8f5] p-6 shadow-[0_14px_40px_rgba(120,67,49,0.05)] sm:p-7">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#a35f49]">Suppression définitive</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.035em] text-[#713c2e]">Supprimer mon espace DevisVéto</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#855b4f]">
            Cette action efface définitivement vos animaux, leurs informations, vos documents et vos rapports. Elle ne peut pas être annulée.
          </p>
          <form action={deleteMyDataAction} className="mt-5">
            <label className="flex max-w-2xl items-start gap-3 rounded-2xl border border-[#efd2c8] bg-white/70 px-4 py-3.5 text-sm leading-6 text-[#744c40]">
              <input type="checkbox" required className="mt-1 h-4 w-4 accent-[#b94b35]" />
              <span>Je comprends que toutes les données de mon espace seront supprimées définitivement.</span>
            </label>
            <button
              type="submit"
              className="mt-4 rounded-full bg-[#b94b35] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(185,75,53,0.18)] hover:bg-[#9f3f2d]"
            >
              Supprimer mon espace et mes données
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
