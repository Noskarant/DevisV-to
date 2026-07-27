import Link from "next/link";

type IconProps = {
  className?: string;
};

function BrandMark({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="15" fill="#0C5B50" />
      <path
        d="M17.5 12.5h10.8l5.2 5.2v17.8h-16V12.5Z"
        fill="white"
        fillOpacity="0.96"
      />
      <path d="M28 12.5v5.8h5.5" stroke="#A8D8C8" strokeWidth="2" />
      <path d="M21 24h9M21 29h6" stroke="#0C5B50" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M14.6 19.2c1.3-1.5 3.7-.7 3.7 1.3 0 1.5-1.9 2.8-3.7 4-1.8-1.2-3.7-2.5-3.7-4 0-2 2.4-2.8 3.7-1.3Z"
        fill="#EF8E72"
      />
    </svg>
  );
}

function ArrowIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 20 20" fill="none">
      <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 20 20" fill="none">
      <path d="m4.5 10.5 3.2 3.1 7.8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5V19h14v-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReviewIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none">
      <path d="M7 3.5h8l3 3V20H7V3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M15 3.5V7h3M10 11h5M10 14.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m4 17 1.5 1.5L8 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReportIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3.5" width="16" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9h8M8 13h5M8 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 20 20" fill="none">
      <rect x="4" y="8" width="12" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 20 20" fill="none">
      <path d="M10 16.5S3.5 13 3.5 7.6A3.4 3.4 0 0 1 10 6.2a3.4 3.4 0 0 1 6.5 1.4C16.5 13 10 16.5 10 16.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function QuestionIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7.9 7.7a2.2 2.2 0 1 1 3.1 2c-.8.4-1 .8-1 1.5M10 14.2h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const processSteps = [
  {
    number: "01",
    title: "Envoyez votre document",
    description:
      "Photographiez votre devis ou importez le PDF depuis votre téléphone. Quelques informations sur votre animal suffisent.",
    icon: UploadIcon,
  },
  {
    number: "02",
    title: "Le dossier est vérifié",
    description:
      "Les lignes sont retranscrites, expliquées et relues avant publication. Les zones ambiguës restent clairement signalées.",
    icon: ReviewIcon,
  },
  {
    number: "03",
    title: "Recevez votre rapport",
    description:
      "Vous retrouvez une explication ligne par ligne et une liste de questions simples à poser à votre vétérinaire.",
    icon: ReportIcon,
  },
];

const deliverables = [
  {
    title: "Chaque ligne traduite simplement",
    description:
      "Actes, examens, anesthésie, médicaments, surveillance : le vocabulaire technique est reformulé sans le dénaturer.",
  },
  {
    title: "Les postes qui influencent le montant",
    description:
      "Nous identifions les éléments présents dans le document qui peuvent faire varier le coût, sans porter de jugement sur le tarif.",
  },
  {
    title: "Des questions prêtes à poser",
    description:
      "Ce qui est inclus, les contrôles, les médicaments, l'hospitalisation ou les frais complémentaires possibles.",
  },
  {
    title: "Les incertitudes clairement indiquées",
    description:
      "Une ligne illisible ou insuffisamment détaillée n'est jamais complétée au hasard : elle est signalée comme telle.",
  },
];

const faqItems = [
  {
    question: "DevisVéto peut-il me dire si mon vétérinaire est trop cher ?",
    answer:
      "Non. Le service explique ce qui compose votre devis et les éléments qui peuvent influencer son montant. Il ne classe pas un tarif comme normal ou anormal et ne met pas les cliniques en concurrence.",
  },
  {
    question: "Est-ce un avis médical ?",
    answer:
      "Non. DevisVéto n'évalue pas la nécessité d'un soin, ne pose aucun diagnostic et ne remplace jamais l'échange avec votre vétérinaire. En cas d'urgence, n'attendez pas un rapport pour faire soigner votre animal.",
  },
  {
    question: "Mes documents sont-ils confidentiels ?",
    answer:
      "Les documents sont stockés dans un espace privé. Vous pouvez demander leur suppression et aucun usage secondaire n'est réalisé sans consentement distinct.",
  },
  {
    question: "Combien coûte une explication ?",
    answer:
      "L'analyse complète est proposée à 6,90 €, en paiement unique et sans abonnement imposé.",
  },
];

export default function LandingPage() {
  return (
    <main className="overflow-hidden bg-[#fbfaf6] text-[#173b35]">
      <div className="border-b border-[#dce7e2] bg-[#edf6f2] px-4 py-2.5 text-center text-xs font-medium tracking-[0.01em] text-[#315f57] sm:text-sm">
        Service indépendant d&apos;explication de documents vétérinaires — ne remplace pas l&apos;avis de votre vétérinaire
      </div>

      <header className="relative z-20 border-b border-[#e5ebe7]/90 bg-[#fbfaf6]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" className="group flex items-center gap-3" aria-label="DevisVéto, accueil">
            <BrandMark className="h-10 w-10 transition-transform duration-300 group-hover:-rotate-2 group-hover:scale-[1.03]" />
            <div>
              <span className="block text-[19px] font-bold leading-none tracking-[-0.035em] text-[#123f38]">
                DevisVéto
              </span>
              <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6a857f] sm:block">
                Votre devis, en clair
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#45665f] lg:flex" aria-label="Navigation principale">
            <a className="transition-colors hover:text-[#0c5b50]" href="#fonctionnement">
              Comment ça marche
            </a>
            <a className="transition-colors hover:text-[#0c5b50]" href="#rapport">
              Le rapport
            </a>
            <a className="transition-colors hover:text-[#0c5b50]" href="#questions">
              Questions fréquentes
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/connexion"
              className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-[#315f57] transition-colors hover:bg-[#edf3f0] sm:inline-flex"
            >
              Se connecter
            </Link>
            <Link
              href="/dashboard/nouveau-dossier"
              className="inline-flex items-center gap-2 rounded-full bg-[#0c5b50] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(12,91,80,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#084d44] sm:px-5"
            >
              Expliquer mon devis
              <ArrowIcon className="hidden h-4 w-4 sm:block" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_18%,rgba(126,190,166,0.22),transparent_31%),radial-gradient(circle_at_8%_72%,rgba(239,142,114,0.12),transparent_27%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#bad5cb] to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe2da] bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.13em] text-[#397268] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#ef8e72]" />
              Pour chiens, chats et NAC
            </div>

            <h1 className="mt-7 max-w-[760px] font-serif text-[44px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#123f38] sm:text-[60px] lg:text-[68px]">
              Votre devis vétérinaire, expliqué clairement.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#526f69] sm:text-xl sm:leading-9">
              Comprenez chaque acte, examen et médicament. Identifiez ce qui mérite d&apos;être précisé et préparez les bonnes questions avant de décider avec votre vétérinaire.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/dashboard/nouveau-dossier"
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#0c5b50] px-7 text-base font-bold text-white shadow-[0_18px_45px_rgba(12,91,80,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#084d44]"
              >
                Faire expliquer mon devis
                <ArrowIcon className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#fonctionnement"
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-[#ccdbd5] bg-white/70 px-7 text-base font-semibold text-[#315f57] transition-all hover:border-[#aac8bd] hover:bg-white"
              >
                Voir le fonctionnement
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#56736d]">
              <span className="inline-flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-[#0c7a69]" /> Paiement unique de 6,90 €
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-[#0c7a69]" /> Rapport relu avant livraison
              </span>
              <span className="inline-flex items-center gap-2">
                <LockIcon className="h-4 w-4 text-[#0c7a69]" /> Document privé
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[570px] lg:mx-0 lg:justify-self-end">
            <div className="absolute -left-7 top-16 hidden h-28 w-28 rounded-full bg-[#f6c8b8]/55 blur-2xl sm:block" />
            <div className="absolute -right-7 bottom-8 h-36 w-36 rounded-full bg-[#9bcdbd]/45 blur-3xl" />

            <div className="relative rounded-[30px] border border-white/90 bg-white/95 p-3 shadow-[0_35px_90px_rgba(31,78,67,0.17)] ring-1 ring-[#dce8e3]">
              <div className="rounded-[24px] border border-[#e1ebe7] bg-[#f7faf8]">
                <div className="flex items-center justify-between border-b border-[#dde9e4] px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <BrandMark className="h-9 w-9" />
                    <div>
                      <p className="text-sm font-bold text-[#173f38]">Rapport DevisVéto</p>
                      <p className="mt-0.5 text-xs text-[#78908b]">Dossier n° DV-2026-184</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#dff2e9] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#23715f]">
                    Rapport relu
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between rounded-2xl bg-[#123f38] px-4 py-4 text-white">
                    <div>
                      <p className="text-xs font-medium text-[#b8d3cc]">Animal concerné</p>
                      <p className="mt-1 text-lg font-bold">Moka</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">Chat européen</p>
                      <p className="mt-1 text-xs text-[#b8d3cc]">4,8 kg · 6 ans</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#78908b]">3 postes expliqués</p>
                      <p className="mt-1 text-sm font-semibold text-[#244941]">Extrait de votre rapport</p>
                    </div>
                    <div className="rounded-xl border border-[#d8e5e0] bg-white px-3 py-2 text-right">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-[#8aa099]">Total du devis</p>
                      <p className="text-base font-bold text-[#173f38]">487,00 €</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-[#dfe9e5] bg-white p-4 shadow-[0_7px_20px_rgba(31,78,67,0.05)]">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-[#1e463f]">Bilan pré-anesthésique</p>
                        <span className="whitespace-nowrap text-sm font-bold text-[#1e463f]">72,00 €</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[#617b75]">
                        Examens réalisés avant l&apos;anesthésie pour vérifier certains paramètres de santé et adapter la prise en charge.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#dfe9e5] bg-white p-4 shadow-[0_7px_20px_rgba(31,78,67,0.05)]">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-[#1e463f]">Anesthésie gazeuse</p>
                        <span className="whitespace-nowrap text-sm font-bold text-[#1e463f]">128,00 €</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[#617b75]">
                        Permet de maintenir l&apos;animal endormi pendant l&apos;intervention et comprend généralement une surveillance dédiée.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#f0d7cd] bg-[#fff8f5] p-4">
                      <div className="flex items-center gap-2 text-[#a44f37]">
                        <QuestionIcon className="h-4 w-4" />
                        <p className="text-xs font-bold uppercase tracking-[0.1em]">Question utile</p>
                      </div>
                      <p className="mt-2 text-xs font-medium leading-5 text-[#754e42]">
                        « La surveillance après l&apos;intervention et le contrôle postopératoire sont-ils compris dans ce montant ? »
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-[#dce8e3] bg-white px-4 py-3 shadow-[0_18px_45px_rgba(31,78,67,0.14)] sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6f3ee] text-[#0c6b5e]">
                <LockIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#244941]">Vos données restent privées</p>
                <p className="mt-0.5 text-[11px] text-[#78908b]">Suppression possible à tout moment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#dfe8e4] bg-white/70">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-[#e2eae6] px-5 sm:px-8 md:grid-cols-4 lg:px-10">
          {[
            ["1 document", "PDF ou photo"],
            ["6,90 €", "Paiement unique"],
            ["100 %", "Explication, pas de diagnostic"],
            ["À tout moment", "Suppression des données"],
          ].map(([value, label]) => (
            <div key={label} className="px-3 py-6 text-center sm:px-6 sm:py-7">
              <p className="text-lg font-extrabold tracking-[-0.02em] text-[#123f38] sm:text-xl">{value}</p>
              <p className="mt-1 text-xs font-medium text-[#718b85] sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="fonctionnement" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#df7657]">Simple et rassurant</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] text-[#123f38] sm:text-5xl">
              De votre devis à un rapport clair, en trois étapes.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#607a74] sm:text-lg">
              Pas de jargon supplémentaire, pas de verdict médical : uniquement les informations nécessaires pour mieux échanger avec votre clinique.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {processSteps.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.number}
                  className="group relative overflow-hidden rounded-[26px] border border-[#dce7e2] bg-white p-7 shadow-[0_18px_55px_rgba(31,78,67,0.07)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(31,78,67,0.11)] sm:p-8"
                >
                  <span className="absolute right-6 top-4 font-serif text-6xl font-bold text-[#eef4f1] transition-colors group-hover:text-[#e4efeb]">
                    {step.number}
                  </span>
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6f3ee] text-[#0c665a]">
                    <Icon />
                  </div>
                  <h3 className="relative mt-7 text-xl font-extrabold tracking-[-0.02em] text-[#173f38]">{step.title}</h3>
                  <p className="relative mt-3 text-sm leading-6 text-[#627b75] sm:text-[15px]">{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="rapport" className="scroll-mt-24 bg-[#123f38] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:gap-20">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#f3a58e]">Le contenu du rapport</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Tout ce qu&apos;il faut pour poser des questions précises.
            </h2>
            <p className="mt-6 text-base leading-8 text-[#bed2cc] sm:text-lg">
              Le but n&apos;est pas de contester votre vétérinaire, mais de vous permettre de comprendre le document et d&apos;avoir une conversation plus sereine.
            </p>

            <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.06] p-5">
              <div className="flex items-start gap-3">
                <HeartIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#f3a58e]" />
                <p className="text-sm leading-6 text-[#d7e5e1]">
                  Une décision médicale se prend avec le vétérinaire qui connaît votre animal. DevisVéto reste volontairement à sa place : expliquer le document.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {deliverables.map((item, index) => (
              <article
                key={item.title}
                className={`rounded-[24px] border p-6 sm:p-7 ${
                  index === 0
                    ? "border-[#efaa95]/60 bg-[#fff7f4] text-[#173f38]"
                    : "border-white/15 bg-white/[0.07]"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${
                    index === 0 ? "bg-[#f6d7cd] text-[#9a4b35]" : "bg-white/10 text-[#bfe0d6]"
                  }`}
                >
                  {index + 1}
                </div>
                <h3 className={`mt-5 text-lg font-extrabold tracking-[-0.02em] ${index === 0 ? "text-[#173f38]" : "text-white"}`}>
                  {item.title}
                </h3>
                <p className={`mt-3 text-sm leading-6 ${index === 0 ? "text-[#5c716c]" : "text-[#bfd0cb]"}`}>
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[32px] border border-[#e2e9e6] bg-white p-7 shadow-[0_25px_80px_rgba(31,78,67,0.08)] sm:p-10 lg:grid-cols-[1fr_0.86fr] lg:items-center lg:p-14">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#df7657]">« Est-ce que c&apos;est cher ? »</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] text-[#123f38] sm:text-5xl">
              Une réponse utile, sans faux verdict.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#607a74] sm:text-lg">
              Sans connaître le contexte médical complet, il serait trompeur de classer un montant comme élevé ou faible. Le rapport vous montre plutôt quels postes peuvent expliquer le montant et ce qui doit être précisé.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#f0d7cd] bg-[#fff8f5] p-6 sm:p-7">
            <p className="text-sm font-extrabold text-[#93462f]">Exemple de formulation dans le rapport</p>
            <p className="mt-4 text-sm leading-7 text-[#6f5147]">
              « Le devis comprend ici l&apos;anesthésie et les médicaments. La durée de surveillance et les éventuels examens préopératoires ne sont pas clairement détaillés. Demandez s&apos;ils sont inclus et quels frais complémentaires pourraient être ajoutés. »
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#dfe8e4] bg-[#edf6f2] px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.78fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#397268]">Une tarification simple</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] text-[#123f38] sm:text-5xl">
              Une analyse complète. Aucun abonnement imposé.
            </h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                "Explication de toutes les lignes lisibles",
                "Facteurs qui peuvent influencer le montant",
                "5 à 10 questions personnalisées",
                "Rapport consultable dans votre espace",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm leading-6 text-[#4e6f68]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#cfe8df] text-[#0c6b5e]">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#cdded7] bg-white p-7 shadow-[0_24px_70px_rgba(31,78,67,0.12)] sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#718b85]">Analyse unique</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-black tracking-[-0.05em] text-[#123f38]">6,90 €</span>
              <span className="pb-1.5 text-sm font-medium text-[#718b85]">TTC</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#607a74]">Paiement unique, sans renouvellement automatique.</p>
            <Link
              href="/dashboard/nouveau-dossier"
              className="mt-7 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#0c5b50] px-6 text-sm font-bold text-white shadow-[0_14px_35px_rgba(12,91,80,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#084d44]"
            >
              Commencer mon dossier
              <ArrowIcon />
            </Link>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-[#718b85]">
              <LockIcon className="h-4 w-4" /> Paiement sécurisé et document privé
            </div>
          </div>
        </div>
      </section>

      <section id="questions" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.68fr_1fr] lg:gap-20">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#df7657]">Questions fréquentes</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] text-[#123f38] sm:text-5xl">
              Un service transparent jusque dans ses limites.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#607a74]">
              La confiance vient aussi de ce que nous refusons de promettre. Voici les réponses essentielles avant d&apos;envoyer votre document.
            </p>
          </div>

          <div className="divide-y divide-[#dfe8e4] border-y border-[#dfe8e4]">
            {faqItems.map((item) => (
              <details key={item.question} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-left text-base font-extrabold text-[#173f38] marker:content-none sm:text-lg">
                  {item.question}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#cfded8] text-xl font-light text-[#397268] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 pr-10 text-sm leading-7 text-[#607a74] sm:text-[15px]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[#ef8e72] px-7 py-12 text-[#183d36] sm:px-12 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-16">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#743b2d]">Un devis plus clair, une discussion plus sereine</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Ne restez pas seul face à un document incompréhensible.
            </h2>
          </div>
          <Link
            href="/dashboard/nouveau-dossier"
            className="mt-8 inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-full bg-[#123f38] px-7 text-base font-bold text-white shadow-[0_18px_40px_rgba(18,63,56,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#0a332d] lg:mt-0"
          >
            Faire expliquer mon devis
            <ArrowIcon className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#dfe8e4] bg-white px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <BrandMark className="h-9 w-9" />
              <span className="text-lg font-extrabold tracking-[-0.03em] text-[#123f38]">DevisVéto</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#718b85]">
              Service indépendant d&apos;explication de devis vétérinaires. Aucun diagnostic, aucun avis sur la nécessité médicale des soins.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#58736d]">
            <Link className="hover:text-[#0c5b50]" href="/connexion">Connexion</Link>
            <Link className="hover:text-[#0c5b50]" href="/confidentialite">Confidentialité</Link>
            <Link className="hover:text-[#0c5b50]" href="/conditions">Conditions d&apos;utilisation</Link>
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-2 border-t border-[#e5ebe8] pt-6 text-xs text-[#8aa099] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DevisVéto. Tous droits réservés.</p>
          <p>Conçu en France pour aider les propriétaires d&apos;animaux à mieux comprendre leurs documents.</p>
        </div>
      </footer>
    </main>
  );
}
