import Link from "next/link";

export default function PaiementAnnulePage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Paiement annulé</h1>
      <p className="mt-3 text-sm text-slate-600">
        Votre dossier a été conservé, vous pouvez reprendre le paiement à tout moment.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-block rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white"
      >
        Retour à mon espace
      </Link>
    </main>
  );
}
