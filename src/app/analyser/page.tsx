import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicWizard } from "./public-wizard";

function BrandMark() {
  return (
    <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="15" fill="#0C5B50" />
      <path d="M17.5 12.5h10.8l5.2 5.2v17.8h-16V12.5Z" fill="white" fillOpacity="0.96" />
      <path d="M28 12.5v5.8h5.5" stroke="#A8D8C8" strokeWidth="2" />
      <path d="M21 24h9M21 29h6" stroke="#0C5B50" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14.6 19.2c1.3-1.5 3.7-.7 3.7 1.3 0 1.5-1.9 2.8-3.7 4-1.8-1.2-3.7-2.5-3.7-4 0-2 2.4-2.8 3.7-1.3Z" fill="#EF8E72" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d="m4.5 10.5 3.2 3.1 7.8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const metadata = {
  title: "Comprendre un document vétérinaire — DevisVéto",
  description: "Déposez un devis ou une facture vétérinaire et obtenez une première lecture claire, reliée aux lignes du document.",
};

export default async function AnalyserPage({
  searchParams,
}: {
  searchParams: Promise<{ pet_id?: string }>;
}) {
  const { pet_id: petId } = await searchParams;
  let initialPet: { id: string; name: string; species: "chien" | "chat" | "autre"; email?: string | null } | null = null;

  if (petId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: pet } = await supabase
        .from("pets")
        .select("id, name, species")
        .eq("id", petId)
        .eq("user_id", user.id)
        .is("archived_at", null)
        .maybeSingle();
      if (pet) initialPet = { id: pet.id, name: pet.name, species: pet.species, email: user.email };
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f4] text-[#173b35]">
      <header className="border-b border-[#dce7e2] bg-white/95">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark />
            <div><p className="text-lg font-semibold tracking-[-0.02em] text-[#123f38]">DevisVéto</p><p className="mt-0.5 text-[9px] font-semibold uppercase text-[#6a857f]">Votre devis, en clair</p></div>
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-[#45665f] hover:text-[#0c5b50]">Mon espace</Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 py-10 sm:px-8 sm:py-14">
        <div className="pointer-events-none absolute left-[-8%] top-[-12%] h-80 w-80 rounded-full bg-[#cfe8df]/75 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-15%] right-[-6%] h-80 w-80 rounded-full bg-[#f6d0c3]/45 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <aside className="pt-3 lg:sticky lg:top-10 lg:pt-8">
            <div className="inline-flex rounded-full bg-[#e4f1ec] px-3 py-1.5 text-xs font-semibold uppercase text-[#397268]">Voyez déjà ce que contient votre document</div>
            <h1 className="mt-5 max-w-xl font-serif text-4xl leading-[1.1] text-[#123f38] sm:text-5xl lg:text-[56px]">Comprenez ce qui est prévu, ce qui manque et quoi demander à la clinique.</h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-[#647d77]">L’aperçu montre une vraie prestation expliquée avec son libellé, son montant, sa page source et une question personnalisée.</p>
            <div className="mt-8 space-y-4">
              {[
                "Une prestation complexe expliquée entièrement",
                "Tous les libellés et montants détectés restent visibles",
                "Un point précis et une question prête à poser",
                "Aucun diagnostic ni jugement sur le prix",
              ].map((item) => <div key={item} className="flex items-center gap-3 text-sm font-semibold text-[#365f57]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#0c5b50] shadow-sm"><CheckIcon /></span>{item}</div>)}
            </div>
            <div className="mt-9 rounded-2xl border border-[#d8e7e1] bg-white/75 p-5 text-sm leading-6 text-[#647d77]"><p className="font-semibold text-[#123f38]">Votre document reste privé.</p><p className="mt-1.5">Lien non indexé, téléchargement protégé et suppression disponible depuis votre espace. Le fichier reste conservé jusqu’à votre demande de suppression.</p></div>
            <div className="mt-4 rounded-2xl border border-[#d8e7e1] bg-white/60 p-5 text-sm leading-6 text-[#647d77]"><p className="font-semibold text-[#123f38]">DevisVéto ne remplace pas votre vétérinaire.</p><p className="mt-1.5">Si l’état de votre animal vous inquiète, contactez directement une clinique.</p></div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[#5f7d76]">
              <Link href="/confidentialite" className="hover:text-[#0c5b50]">Confidentialité</Link>
              <Link href="/ce-que-fait-devisveto" className="hover:text-[#0c5b50]">Périmètre du service</Link>
              <Link href="/guides/comprendre-devis-veterinaire" className="hover:text-[#0c5b50]">Guide devis</Link>
            </div>
          </aside>
          <div className="rounded-[30px] border border-white bg-white p-5 shadow-[0_28px_80px_rgba(31,78,67,0.13)] sm:p-8 lg:p-10"><PublicWizard initialPet={initialPet} /></div>
        </div>
      </section>
    </main>
  );
}
