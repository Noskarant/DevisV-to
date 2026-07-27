import Link from "next/link";
import { LoginForm } from "./login-form";

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

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f7f4] px-5 py-6 sm:px-8 lg:flex lg:items-stretch lg:p-6">
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[420px] w-[420px] rounded-full bg-[#cfe8df]/65 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-15%] right-[-8%] h-[420px] w-[420px] rounded-full bg-[#f6d0c3]/45 blur-3xl" />

      <section className="relative mx-auto flex w-full max-w-7xl overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(31,78,67,0.13)]">
        <div className="relative hidden w-[46%] overflow-hidden bg-[#123f38] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="pointer-events-none absolute -right-28 top-24 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-12 top-40 h-48 w-48 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-[#ef8e72]/20 blur-2xl" />

          <Link href="/" className="relative inline-flex items-center gap-3 self-start">
            <BrandMark />
            <div>
              <p className="text-xl font-extrabold tracking-[-0.035em]">DevisVéto</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a9c9c1]">Votre devis, en clair</p>
            </div>
          </Link>

          <div className="relative my-14 max-w-lg">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#f1a48d]">Votre espace DevisVéto</p>
            <h1 className="mt-5 font-serif text-5xl font-semibold leading-[1.06] tracking-[-0.04em] xl:text-[56px]">
              Tout le suivi de vos animaux, au même endroit.
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-[#bfd2cd]">
              Retrouvez les analyses, les documents et les informations utiles de chaque animal dans un espace clair et privé.
            </p>

            <div className="mt-9 space-y-4">
              {[
                "Une fiche claire pour chaque animal",
                "Vos documents restent privés",
                "Vous gardez le contrôle de vos données",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-[#e3eeeb]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[#9dd5c6]">
                    <CheckIcon />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="relative max-w-md text-xs leading-5 text-[#8eb0a8]">
            DevisVéto explique les documents vétérinaires. Il ne pose aucun diagnostic et ne remplace pas l&apos;avis de votre vétérinaire.
          </p>
        </div>

        <div className="flex min-h-[calc(100vh-3rem)] flex-1 flex-col px-6 py-8 sm:px-10 lg:min-h-0 lg:px-14 lg:py-12 xl:px-20">
          <div className="flex items-center justify-between lg:justify-end">
            <Link href="/" className="inline-flex items-center gap-3 lg:hidden">
              <BrandMark />
              <span className="text-lg font-extrabold tracking-[-0.035em] text-[#123f38]">DevisVéto</span>
            </Link>
            <Link href="/" className="text-sm font-bold text-[#45665f] transition-colors hover:text-[#0c5b50]">
              Retour à l&apos;accueil
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-14">
            <div className="inline-flex self-start rounded-full bg-[#e8f3ef] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#397268]">
              Accès sécurisé
            </div>
            <h2 className="mt-5 font-serif text-4xl font-semibold tracking-[-0.04em] text-[#123f38] sm:text-5xl">
              Votre espace DevisVéto, en un clic.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#647d77]">
              Entrez votre adresse email. Nous vous envoyons un lien sécurisé pour retrouver vos informations, sans mot de passe.
            </p>

            {error && (
              <div className="mt-6 rounded-2xl border border-[#f0c9bc] bg-[#fff6f2] px-4 py-3 text-sm font-medium text-[#93462f]">
                Ce lien n&apos;est plus valide. Demandez-en un nouveau pour accéder à votre espace.
              </div>
            )}

            <LoginForm />

            <p className="mt-6 text-center text-xs leading-5 text-[#829791]">
              En continuant, vous acceptez les{` `}
              <Link className="font-semibold underline hover:text-[#0c5b50]" href="/conditions">conditions d&apos;utilisation</Link>
              {` `}et la{` `}
              <Link className="font-semibold underline hover:text-[#0c5b50]" href="/confidentialite">politique de confidentialité</Link>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
