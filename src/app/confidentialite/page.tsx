import Link from "next/link";

export const metadata = {
  title: "Confidentialité des documents vétérinaires",
  description:
    "Comment DevisVéto protège les devis, factures et informations de votre animal pendant l'analyse documentaire.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f4] px-5 py-12 text-[#173b35] sm:px-8">
      <article className="mx-auto max-w-3xl rounded-[28px] border border-[#dce7e2] bg-white p-7 shadow-[0_18px_55px_rgba(31,78,67,0.08)] sm:p-10">
        <Link href="/" className="text-sm font-semibold text-[#0c5b50]">
          DevisVéto
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase text-[#5d8179]">
          Confidentialité
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#123f38]">
          Vos documents vétérinaires restent privés.
        </h1>
        <div className="mt-7 space-y-6 text-sm leading-7 text-[#4d6d66]">
          <p>
            DevisVéto lit un devis ou une facture pour en préparer une explication documentaire.
            Le service ne pose pas de diagnostic, ne recommande pas de soin et ne juge pas le
            montant demandé par une clinique.
          </p>
          <section>
            <h2 className="font-semibold text-[#204f47]">Ce qui est traité</h2>
            <p className="mt-2">
              Le fichier transmis, les informations saisies sur l&apos;animal, l&apos;adresse email et les
              résultats d&apos;analyse nécessaires à l&apos;affichage de l&apos;aperçu et du rapport.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-[#204f47]">Anonymisation avant analyse</h2>
            <p className="mt-2">
              Les noms, coordonnées, références et identifiants détectables sont retirés côté
              serveur avant l&apos;analyse textuelle. Le texte brut OCR n&apos;est pas envoyé au modèle avant
              cette étape.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-[#204f47]">Conservation et suppression</h2>
            <p className="mt-2">
              Les documents sont conservés dans un stockage privé afin de pouvoir retrouver le
              rapport depuis l&apos;espace client. Une demande de suppression peut être traitée depuis
              l&apos;espace client ou en contactant le support.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-[#204f47]">Accès au document original</h2>
            <p className="mt-2">
              Le document original n&apos;est pas accessible depuis l&apos;aperçu gratuit. Il est seulement
              disponible avec le rapport complet, via un lien non indexé et non mis en cache.
            </p>
          </section>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/analyser" className="rounded-full bg-[#0c5b50] px-5 py-3 text-sm font-semibold text-white">
            Analyser un document
          </Link>
          <Link href="/ce-que-fait-devisveto" className="rounded-full border border-[#cddbd6] px-5 py-3 text-sm font-semibold text-[#315f57]">
            Ce que le service fait
          </Link>
        </div>
      </article>
    </main>
  );
}
