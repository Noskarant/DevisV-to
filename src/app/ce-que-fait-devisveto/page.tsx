import Link from "next/link";

export const metadata = {
  title: "Ce que DevisVéto fait et ne fait pas",
  description:
    "DevisVéto explique les devis et factures vétérinaires sans diagnostic, sans jugement de prix et sans remplacer le vétérinaire.",
};

const done = [
  "explique les libellés présents sur un devis ou une facture",
  "repère les montants et les lignes qui doivent être confirmés",
  "prépare des questions coopératives à poser à la clinique",
  "organise les documents par animal dans un espace client",
];

const notDone = [
  "ne pose aucun diagnostic",
  "ne décide jamais si un soin est nécessaire ou inutile",
  "ne dit pas qu’un prix est normal, anormal ou trop cher",
  "ne remplace pas l’échange avec le vétérinaire",
];

export default function ScopePage() {
  return (
    <main className="min-h-screen bg-[#f4f7f4] px-5 py-12 text-[#173b35] sm:px-8">
      <section className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-[#0c5b50]">
          DevisVéto
        </Link>
        <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase text-[#5d8179]">
              Cadre du service
            </p>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-[#123f38] sm:text-5xl">
              Une aide pour comprendre le document, pas un avis vétérinaire.
            </h1>
            <p className="mt-5 text-base leading-8 text-[#58756e]">
              Le produit doit rassurer le propriétaire sans créer de conflit avec la clinique. Il
              transforme un document difficile à lire en questions concrètes et factuelles.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <article className="rounded-[26px] border border-[#cddfd8] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.06)]">
              <h2 className="font-serif text-2xl text-[#123f38]">DevisVéto fait</h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-[#45665f]">
                {done.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </article>
            <article className="rounded-[26px] border border-[#efd4c9] bg-[#fff8f4] p-6 shadow-[0_14px_40px_rgba(31,78,67,0.05)]">
              <h2 className="font-serif text-2xl text-[#7a3f2f]">DevisVéto ne fait pas</h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-[#714b3f]">
                {notDone.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
        <div className="mt-9 rounded-[28px] bg-[#123f38] p-7 text-white sm:p-9">
          <h2 className="font-serif text-3xl">En cas d&apos;urgence</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#cfe1dc]">
            Si l&apos;état de l&apos;animal inquiète, il faut contacter directement une clinique vétérinaire.
            DevisVéto ne doit jamais retarder une décision de soin.
          </p>
          <Link href="/analyser" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#123f38]">
            Comprendre un document
          </Link>
        </div>
      </section>
    </main>
  );
}
