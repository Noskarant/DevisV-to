import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { guides } from "@/lib/seo/guides";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.devisveto.fr";

export const metadata: Metadata = {
  title: "Guides pour comprendre un devis ou une facture vétérinaire",
  description:
    "Guides pratiques pour lire un devis vétérinaire, comprendre une facture, préparer les questions à poser et identifier les postes d’une opération ou d’une anesthésie.",
  alternates: { canonical: "/guides" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/guides",
    title: "Guides DevisVéto",
    description:
      "Comprendre les documents vétérinaires sans diagnostic, sans comparaison de prix et sans remplacer le vétérinaire.",
    siteName: "DevisVéto",
  },
};

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

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function GuidesHubPage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Guides DevisVéto",
    itemListElement: guides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      url: `${appUrl}/guides/${guide.slug}`,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: appUrl },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${appUrl}/guides` },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f4f7f4] text-[#173b35]">
      <JsonLd data={[itemListJsonLd, breadcrumbJsonLd]} />
      <header className="border-b border-[#dce7e2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-5 px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Accueil DevisVéto">
            <BrandMark />
            <div>
              <p className="text-lg font-extrabold tracking-[-0.02em] text-[#123f38]">DevisVéto</p>
              <p className="text-[9px] font-bold uppercase text-[#6a857f]">Votre devis, en clair</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/ce-que-fait-devisveto" className="hidden text-sm font-semibold text-[#45665f] hover:text-[#0c5b50] sm:inline">
              Notre cadre
            </Link>
            <Link href="/analyser" className="rounded-full bg-[#0c5b50] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_9px_25px_rgba(12,91,80,0.18)] hover:bg-[#084d44]">
              Analyser un document
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
        <div className="pointer-events-none absolute left-[-10%] top-[-35%] h-[520px] w-[520px] rounded-full bg-[#cfe8df]/75 blur-3xl" />
        <div className="pointer-events-none absolute right-[-8%] top-[-10%] h-[420px] w-[420px] rounded-full bg-[#f6d0c3]/40 blur-3xl" />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#4f8177]">Bibliothèque DevisVéto</p>
          <h1 className="mx-auto mt-4 max-w-4xl font-serif text-5xl leading-[1.05] text-[#123f38] sm:text-6xl">
            Comprendre un document vétérinaire, sans interpréter les soins.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[#58756e] sm:text-lg">
            Des guides pratiques pour lire les libellés, repérer les postes importants et préparer des questions factuelles à poser à la clinique.
          </p>
          <div className="mx-auto mt-7 flex max-w-3xl flex-wrap justify-center gap-2 text-xs font-semibold text-[#45665f]">
            <span className="rounded-full border border-[#cddfd8] bg-white px-3 py-2">Aucun diagnostic</span>
            <span className="rounded-full border border-[#cddfd8] bg-white px-3 py-2">Aucun classement des prix</span>
            <span className="rounded-full border border-[#cddfd8] bg-white px-3 py-2">Sources officielles lorsque nécessaire</span>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-3">
          {guides.map((guide, index) => (
            <article key={guide.slug} className="group flex min-h-[310px] flex-col rounded-[28px] border border-[#dce7e2] bg-white p-7 shadow-[0_14px_42px_rgba(31,78,67,0.05)] transition hover:-translate-y-1 hover:border-[#b9d1c9] hover:shadow-[0_22px_60px_rgba(31,78,67,0.09)]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#5d8179]">{guide.eyebrow}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#edf6f2] text-sm font-bold text-[#0c5b50]">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h2 className="mt-6 font-serif text-3xl leading-tight text-[#123f38]">{guide.title}</h2>
              <p className="mt-4 line-clamp-4 text-sm leading-7 text-[#58756e]">{guide.description}</p>
              <Link href={`/guides/${guide.slug}`} className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-bold text-[#0c5b50] group-hover:text-[#084d44]">
                Lire le guide <ArrowIcon />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#123f38] px-5 py-16 text-white sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#9fcfc1]">Vous avez déjà un document ?</p>
            <h2 className="mt-3 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">Voyez les principales lignes avant d’aller plus loin.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#cfe1dc]">Ajoutez votre devis ou votre facture pour obtenir un aperçu factuel et une liste de questions utiles.</p>
          </div>
          <Link href="/analyser" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#123f38] hover:bg-[#edf5f2]">
            Voir mon aperçu gratuit <ArrowIcon />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#dce7e2] bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 text-sm text-[#68817b] sm:flex-row sm:items-center">
          <div>
            <p className="font-bold text-[#204f47]">DevisVéto</p>
            <p className="mt-1">Comprendre un document vétérinaire sans remplacer le vétérinaire.</p>
          </div>
          <nav aria-label="Liens de pied de page" className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
            <Link href="/" className="hover:text-[#0c5b50]">Accueil</Link>
            <Link href="/ce-que-fait-devisveto" className="hover:text-[#0c5b50]">Ce que fait DevisVéto</Link>
            <Link href="/confidentialite" className="hover:text-[#0c5b50]">Confidentialité</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
