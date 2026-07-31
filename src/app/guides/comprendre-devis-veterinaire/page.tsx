import Link from "next/link";

export const metadata = {
  title: "Comprendre un devis vétérinaire ligne par ligne",
  description:
    "Guide pour lire un devis vétérinaire, repérer les lignes importantes et préparer les questions utiles à poser à la clinique.",
};

const sections = [
  {
    title: "Identifier le type de document",
    body:
      "Un devis présente une estimation avant les soins. Une facture reprend ce qui a réellement été réalisé. Les deux documents peuvent contenir des lignes proches, mais ils ne répondent pas à la même question.",
  },
  {
    title: "Repérer les postes principaux",
    body:
      "Les lignes les plus fréquentes concernent la consultation, l’anesthésie, les analyses, l’imagerie, les médicaments, l’hospitalisation ou la surveillance. Un libellé court peut couvrir plusieurs éléments.",
  },
  {
    title: "Chercher ce qui est explicitement inclus",
    body:
      "Certains documents précisent la quantité, le prix unitaire, la durée de surveillance ou le type d’analyse. Quand ces détails manquent, il vaut mieux demander une précision simple à la clinique.",
  },
  {
    title: "Préparer les questions sans accusation",
    body:
      "Une bonne question aide à comprendre le document: ce qui est inclus, ce qui pourrait changer, ce qui est déjà prévu et ce qui reste conditionnel.",
  },
];

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-[#fbfaf6] px-5 py-12 text-[#173b35] sm:px-8">
      <article className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-[#0c5b50]">
          DevisVéto
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase text-[#5d8179]">
          Guide pratique
        </p>
        <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-[#123f38] sm:text-5xl">
          Comment comprendre un devis vétérinaire ligne par ligne.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[#58756e]">
          Un devis vétérinaire peut être difficile à lire parce qu&apos;il mélange des actes, des
          consommables, des examens, des médicaments et parfois des conditions à confirmer. L&apos;objectif
          n&apos;est pas de juger le prix, mais de comprendre ce que le document dit vraiment.
        </p>

        <div className="mt-10 space-y-5">
          {sections.map((section, index) => (
            <section key={section.title} className="rounded-[24px] border border-[#dce7e2] bg-white p-6 shadow-[0_12px_34px_rgba(31,78,67,0.05)]">
              <span className="text-xs font-semibold uppercase text-[#78908a]">
                Étape {index + 1}
              </span>
              <h2 className="mt-2 font-serif text-2xl text-[#123f38]">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#4d6d66]">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-[28px] bg-[#123f38] p-7 text-white sm:p-9">
          <h2 className="font-serif text-3xl">Vous avez déjà un document ?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#cfe1dc]">
            Ajoutez le devis ou la facture pour obtenir un aperçu factuel, les lignes reconnues et
            les premières questions à poser à la clinique.
          </p>
          <Link href="/analyser" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#123f38]">
            Voir mon aperçu gratuit
          </Link>
        </section>
      </article>
    </main>
  );
}
