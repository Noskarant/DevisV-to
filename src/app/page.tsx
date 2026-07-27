import Link from "next/link";

const reassurance = [
  "Explication claire, sans jargon",
  "Données protégées, hébergées en Europe",
  "Aucune décision médicale prise par l'application",
  "Analyse relue par un humain avant livraison",
  "Document supprimable à tout moment",
];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <section className="text-center">
        <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
          Comprenez votre devis vétérinaire avant de décider.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">
          Chaque ligne expliquée simplement, les éléments qui peuvent influencer le
          montant, et les questions utiles à poser à votre vétérinaire.
        </p>
        <Link
          href="/dashboard/nouveau-dossier"
          className="mt-8 inline-block rounded-full bg-slate-900 px-8 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          Faire expliquer mon devis
        </Link>
      </section>

      <section className="mt-16 grid gap-3 sm:grid-cols-2">
        {reassurance.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
          >
            {item}
          </div>
        ))}
      </section>

      <section className="mt-16 rounded-2xl bg-slate-50 px-6 py-8 text-sm text-slate-600">
        <p className="font-medium text-slate-900">Ce que DevisVéto ne fait pas :</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Comparer les tarifs entre vétérinaires</li>
          <li>Dire si un devis est trop cher ou anormal</li>
          <li>Juger la nécessité médicale d&apos;un soin</li>
          <li>Remplacer l&apos;avis de votre vétérinaire</li>
        </ul>
      </section>
    </main>
  );
}
