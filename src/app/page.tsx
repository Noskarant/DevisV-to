import Link from "next/link";

type IconProps = { className?: string };

function BrandMark({ className = "h-11 w-11" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="15" fill="#0C5B50" />
      <path d="M17.5 12.5h10.8l5.2 5.2v17.8h-16V12.5Z" fill="white" fillOpacity="0.96" />
      <path d="M28 12.5v5.8h5.5" stroke="#A8D8C8" strokeWidth="2" />
      <path d="M21 24h9M21 29h6" stroke="#0C5B50" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14.6 19.2c1.3-1.5 3.7-.7 3.7 1.3 0 1.5-1.9 2.8-3.7 4-1.8-1.2-3.7-2.5-3.7-4 0-2 2.4-2.8 3.7-1.3Z" fill="#EF8E72" />
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

function CheckIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 20 20" fill="none">
      <path d="m4.5 10.5 3.2 3.1 7.8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 20 20" fill="none">
      <rect x="4" y="8" width="12" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const explanations = [
  {
    label: "Anesthésie gazeuse",
    amount: "132,00 €",
    text: "Administration et maintien de l’anesthésie pendant l’intervention. Le détail exact du protocole reste à confirmer avec la clinique.",
  },
  {
    label: "Surveillance postopératoire",
    amount: "64,00 €",
    text: "Temps de surveillance après l’intervention afin de suivre le réveil et l’état immédiat de l’animal.",
  },
  {
    label: "Bilan préopératoire",
    amount: "78,00 €",
    text: "Explication complète disponible dans le rapport.",
    locked: true,
  },
];

const recordFeatures = [
  { title: "Une timeline par animal", text: "Devis, factures et rapports restent classés chronologiquement dans le bon dossier." },
  { title: "Comparaison des documents", text: "Repérez les lignes ajoutées, retirées ou présentées différemment depuis le document précédent." },
  { title: "Poids et rappels", text: "Conservez les mesures et les dates utiles explicitement renseignées, sans automatiser de conseil médical." },
  { title: "Contexte complet", text: "Race, âge, allergies déclarées, traitements, clinique habituelle, assurance et notes pratiques." },
];

const faqItems = [
  {
    question: "DevisVéto peut-il me dire si mon vétérinaire est trop cher ?",
    answer: "Non. Le service explique la composition du document et les éléments qui peuvent influencer le montant. Il ne classe jamais un tarif comme normal, anormal ou excessif.",
  },
  {
    question: "Est-ce un avis médical ?",
    answer: "Non. DevisVéto ne pose aucun diagnostic, n’évalue pas la nécessité d’un soin et ne remplace jamais l’échange avec votre vétérinaire.",
  },
  {
    question: "Suis-je obligé de m’abonner ?",
    answer: "Non. Après l’aperçu gratuit, vous choisissez librement l’analyse unique à 8,90 € ou DevisVéto Plus à 6,90 €/mois. Aucune option n’est présélectionnée.",
  },
  {
    question: "Que contient DevisVéto Plus ?",
    answer: "Le premier rapport est inclus, puis un crédit d’analyse est ajouté chaque mois. Les crédits se cumulent jusqu’à trois et sont utilisables pour tous les animaux du foyer.",
  },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[#f4f7f4] text-[#173b35]">
      <header className="relative z-30 border-b border-[#dce7e2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-lg font-extrabold tracking-[-0.035em] text-[#123f38]">DevisVéto</p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#6a857f]">Votre devis, en clair</p>
            </div>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/connexion" className="hidden text-sm font-extrabold text-[#45665f] hover:text-[#0c5b50] sm:block">Mon espace</Link>
            <Link href="/analyser" className="rounded-full bg-[#0c5b50] px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_9px_25px_rgba(12,91,80,0.2)] transition hover:-translate-y-0.5 hover:bg-[#084d44]">Analyser un document</Link>
          </nav>
        </div>
      </header>

      <section className="relative px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20">
        <div className="pointer-events-none absolute left-[-10%] top-[-20%] h-[520px] w-[520px] rounded-full bg-[#cfe8df]/80 blur-3xl" />
        <div className="pointer-events-none absolute right-[-8%] top-[8%] h-[420px] w-[420px] rounded-full bg-[#f6d0c3]/45 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c9dfd7] bg-white/80 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#397268] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#4f9b85]" /> Aperçu personnalisé avant paiement
            </div>
            <h1 className="mt-6 max-w-3xl font-serif text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#123f38] sm:text-6xl lg:text-[72px]">
              Comprenez ses documents. Construisez son dossier dans le temps.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#617b75] sm:text-lg">
              DevisVéto explique les lignes d’un devis ou d’une facture vétérinaire, prépare vos questions et organise chaque document dans la timeline personnelle de votre animal.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/analyser" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0c5b50] px-6 py-4 text-sm font-extrabold text-white shadow-[0_14px_34px_rgba(12,91,80,0.24)] transition hover:-translate-y-0.5 hover:bg-[#084d44]">
                Obtenir mon aperçu gratuit <ArrowIcon />
              </Link>
              <Link href="#dossiers" className="inline-flex items-center justify-center rounded-full border border-[#bfd3cc] bg-white/85 px-6 py-4 text-sm font-extrabold text-[#315f57] hover:bg-white">Découvrir le dossier animal</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-[#6c837d]">
              <span className="inline-flex items-center gap-2"><CheckIcon className="h-3.5 w-3.5 text-[#0c5b50]" /> Aucune conclusion médicale</span>
              <span className="inline-flex items-center gap-2"><CheckIcon className="h-3.5 w-3.5 text-[#0c5b50]" /> Document anonymisé avant analyse textuelle</span>
              <span className="inline-flex items-center gap-2"><CheckIcon className="h-3.5 w-3.5 text-[#0c5b50]" /> Relecture humaine après paiement</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[38px] bg-white/45 blur-xl" />
            <div className="relative rounded-[32px] border border-white bg-white p-5 shadow-[0_34px_90px_rgba(31,78,67,0.16)] sm:p-7">
              <div className="flex items-start justify-between gap-4 rounded-[22px] bg-[#123f38] px-5 py-5 text-white">
                <div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9fcfc1]">Aperçu du document de Nala</p><h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.035em]">Intervention dentaire</h2></div>
                <div className="rounded-xl bg-white/10 px-3 py-2 text-right"><p className="text-[9px] font-bold uppercase text-[#aac9c1]">Total</p><p className="mt-1 text-lg font-extrabold">487,00 €</p></div>
              </div>
              <div className="mt-5 divide-y divide-[#e4ece9]">
                {explanations.map((item) => (
                  <div key={item.label} className="relative py-5 first:pt-0">
                    <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-extrabold text-[#204f47]">{item.label}</p><p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#849792]">Prestation détectée</p></div><p className="text-sm font-extrabold text-[#123f38]">{item.amount}</p></div>
                    <p className={`mt-3 text-sm leading-6 ${item.locked ? "text-[#a0afab]" : "text-[#617b75]"}`}>{item.text}</p>
                    {item.locked && <div className="absolute inset-x-0 bottom-0 flex h-14 items-end justify-center bg-gradient-to-t from-white via-white/95 to-transparent"><span className="inline-flex items-center gap-2 rounded-full border border-[#d5e2dd] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#617b75]"><LockIcon /> Débloqué après paiement</span></div>}
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#edf6f2] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#5d8179]">Questions préparées</p><p className="mt-2 text-2xl font-extrabold text-[#174f46]">7</p></div>
                <div className="rounded-2xl bg-[#fff8f4] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8c746b]">Points à préciser</p><p className="mt-2 text-2xl font-extrabold text-[#805a4c]">3</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="dossiers" className="bg-[#123f38] px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div className="lg:sticky lg:top-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#9fcfc1]">Le produit qui donne envie de revenir</p>
              <h2 className="mt-4 font-serif text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl">Un vrai dossier pour chacun de vos animaux.</h2>
              <p className="mt-5 text-base leading-8 text-[#c4d7d2]">Le rapport n’est plus isolé dans un email. Il rejoint un espace utile au quotidien, structuré autour de l’animal et de son historique documentaire.</p>
              <Link href="/dashboard/animaux/nouveau" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#123f38] hover:bg-[#edf5f2]">Créer un dossier animal <ArrowIcon /></Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {recordFeatures.map((feature, index) => (
                <article key={feature.title} className="rounded-[26px] border border-white/10 bg-white/[0.07] p-6 backdrop-blur">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sm font-extrabold text-[#a8d8ca]">0{index + 1}</span>
                  <h3 className="mt-5 font-serif text-2xl font-semibold tracking-[-0.035em]">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#c4d7d2]">{feature.text}</p>
                </article>
              ))}
              <div className="sm:col-span-2 rounded-[26px] bg-[#e9f4f0] p-6 text-[#173b35] sm:p-8">
                <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Exemple de timeline</p><h3 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38]">Nala · ses documents au même endroit</h3></div>
                  <span className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#397268]">3 documents</span>
                </div>
                <div className="mt-6 space-y-3">
                  {["12 septembre · Devis dentaire · 487 €", "20 septembre · Facture correspondante · 472 €", "4 novembre · Contrôle · 68 €"].map((entry, index) => <div key={entry} className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 text-sm font-extrabold text-[#315f57]"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0c5b50] text-xs text-white">{index + 1}</span>{entry}</div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#5d8179]">Tarifs simples</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.045em] text-[#123f38] sm:text-5xl">Voyez d’abord l’aperçu. Choisissez ensuite.</h2>
            <p className="mt-5 text-base leading-8 text-[#6c837d]">Aucun abonnement n’est imposé et aucune formule n’est présélectionnée.</p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
            <article className="rounded-[28px] border border-[#d8e5e0] bg-white p-7 shadow-[0_18px_55px_rgba(31,78,67,0.07)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#78908a]">Analyse unique</p>
              <div className="mt-3 flex items-baseline gap-2"><span className="font-serif text-5xl font-semibold tracking-[-0.05em] text-[#123f38]">8,90 €</span><span className="text-xs font-bold text-[#78908a]">une fois</span></div>
              <p className="mt-4 text-sm leading-7 text-[#647d77]">Pour comprendre le document présent, sans renouvellement.</p>
              <ul className="mt-6 space-y-3 text-sm font-semibold text-[#526f68]">
                {["Rapport complet", "Questions personnalisées", "Relecture humaine", "Conservation dans le dossier animal"].map((item) => <li key={item} className="flex gap-2"><CheckIcon className="mt-0.5 shrink-0 text-[#0c5b50]" /> {item}</li>)}
              </ul>
              <Link href="/analyser" className="mt-8 flex w-full justify-center rounded-full border border-[#bfd3cc] px-5 py-3.5 text-sm font-extrabold text-[#315f57] hover:bg-[#f1f6f4]">Commencer gratuitement</Link>
            </article>

            <article className="relative overflow-hidden rounded-[28px] border-2 border-[#79ae9e] bg-[#edf7f3] p-7 shadow-[0_22px_65px_rgba(31,78,67,0.12)]">
              <span className="absolute right-4 top-4 rounded-full bg-[#0c5b50] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white">Le plus complet</span>
              <p className="pr-28 text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">DevisVéto Plus</p>
              <div className="mt-3 flex items-baseline gap-2"><span className="font-serif text-5xl font-semibold tracking-[-0.05em] text-[#123f38]">6,90 €</span><span className="text-xs font-bold text-[#78908a]">par mois</span></div>
              <p className="mt-4 text-sm font-extrabold leading-7 text-[#315f57]">Le premier rapport est inclus immédiatement.</p>
              <ul className="mt-6 space-y-3 text-sm font-semibold text-[#526f68]">
                {["1 nouveau crédit chaque mois", "Crédits cumulables jusqu’à 3", "Tous les animaux du foyer", "Dossiers, comparaisons, poids et rappels", "Résiliable à tout moment"].map((item) => <li key={item} className="flex gap-2"><CheckIcon className="mt-0.5 shrink-0 text-[#0c5b50]" /> {item}</li>)}
              </ul>
              <Link href="/analyser" className="mt-8 flex w-full justify-center rounded-full bg-[#0c5b50] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_28px_rgba(12,91,80,0.2)] hover:bg-[#084d44]">Obtenir mon aperçu</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-[#dce7e2] bg-white px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#5d8179]">Cadre de confiance</p><h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.045em] text-[#123f38]">Un outil documentaire, avec des limites explicites.</h2><p className="mt-5 text-sm leading-7 text-[#6c837d]">DevisVéto est conçu pour expliquer, organiser et préparer l’échange avec la clinique — jamais pour décider à la place du vétérinaire.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Aucun diagnostic ni recommandation de soin", "Aucun verdict sur le caractère normal d’un prix", "Incertitudes et lignes illisibles signalées", "Validation humaine du rapport payé"].map((item) => <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#dce7e2] bg-[#f8faf9] p-5 text-sm font-extrabold leading-6 text-[#45665f]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e4f1ec] text-[#0c5b50]"><CheckIcon /></span>{item}</div>)}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center"><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#5d8179]">Questions fréquentes</p><h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.045em] text-[#123f38]">Avant de nous confier un document</h2></div>
          <div className="mt-10 divide-y divide-[#dce7e2] rounded-[28px] border border-[#dce7e2] bg-white px-6 shadow-[0_18px_55px_rgba(31,78,67,0.06)] sm:px-8">
            {faqItems.map((item) => <details key={item.question} className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-extrabold text-[#315f57]"><span>{item.question}</span><span className="text-xl text-[#78908a] transition group-open:rotate-45">+</span></summary><p className="mt-4 max-w-3xl text-sm leading-7 text-[#6c837d]">{item.answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="mx-auto max-w-6xl rounded-[34px] bg-[#123f38] px-6 py-12 text-center text-white shadow-[0_28px_75px_rgba(18,63,56,0.2)] sm:px-12 sm:py-16">
          <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#9fcfc1]">Le premier pas reste gratuit</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Envoyez le document et jugez la qualité de l’aperçu avant de payer.</h2>
          <Link href="/analyser" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-extrabold text-[#123f38] hover:bg-[#edf5f2]">Analyser mon document <ArrowIcon /></Link>
        </div>
      </section>

      <footer className="border-t border-[#dce7e2] bg-white px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3"><BrandMark className="h-9 w-9" /><div><p className="text-sm font-extrabold text-[#123f38]">DevisVéto</p><p className="text-xs text-[#829791]">Explication et suivi documentaire vétérinaire</p></div></div>
          <p className="text-xs leading-5 text-[#829791]">En cas d’urgence, contactez directement un vétérinaire et ne retardez pas les soins.</p>
        </div>
      </footer>
    </main>
  );
}
