import Link from "next/link";
import type { SeoGuide } from "@/lib/seo/guides";
import { getRelatedGuides } from "@/lib/seo/guides";

type GuidePageProps = {
  guide: SeoGuide;
};

function BrandMark() {
  return (
    <svg aria-hidden="true" className="h-10 w-10" viewBox="0 0 48 48" fill="none">
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

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" fill="#DCEEE8" />
      <path d="m6.5 10.2 2.2 2.2 4.8-5" stroke="#0C5B50" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GuidePage({ guide }: GuidePageProps) {
  const relatedGuides = getRelatedGuides(guide);
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${guide.updatedAt}T12:00:00Z`));

  return (
    <main className="min-h-screen bg-[#f4f7f4] text-[#173b35]">
      <header className="border-b border-[#dce7e2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-5 px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Accueil DevisVéto">
            <BrandMark />
            <div>
              <p className="text-lg font-extrabold tracking-[-0.02em] text-[#123f38]">DevisVéto</p>
              <p className="text-[9px] font-bold uppercase text-[#6a857f]">Votre devis, en clair</p>
            </div>
          </Link>
          <nav aria-label="Navigation principale" className="flex items-center gap-4">
            <Link href="/guides" className="hidden text-sm font-semibold text-[#45665f] hover:text-[#0c5b50] sm:inline">
              Tous les guides
            </Link>
            <Link href="/ce-que-fait-devisveto" className="hidden text-sm font-semibold text-[#45665f] hover:text-[#0c5b50] lg:inline">
              Notre cadre
            </Link>
            <Link href="/analyser" className="rounded-full bg-[#0c5b50] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_9px_25px_rgba(12,91,80,0.18)] hover:bg-[#084d44]">
              Analyser un document
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-2 text-sm text-[#68817b]">
          <Link href="/" className="font-semibold hover:text-[#0c5b50]">Accueil</Link>
          <span aria-hidden="true">/</span>
          <Link href="/guides" className="font-semibold hover:text-[#0c5b50]">Guides</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="max-w-[520px] truncate">{guide.title}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
          <article className="min-w-0">
            <header className="rounded-[32px] border border-[#d7e4df] bg-white p-7 shadow-[0_22px_70px_rgba(31,78,67,0.08)] sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#4f8177]">{guide.eyebrow}</p>
              <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-[1.08] text-[#123f38] sm:text-5xl lg:text-[56px]">
                {guide.title}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[#58756e] sm:text-lg">{guide.intro}</p>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#e4ece9] pt-5 text-xs font-semibold text-[#6c837d]">
                <span>Mis à jour le {formattedDate}</span>
                <span>Lecture : environ 6 minutes</span>
                <span>Contenu éditorial DevisVéto</span>
              </div>
            </header>

            <section aria-labelledby="a-retenir" className="mt-6 rounded-[28px] bg-[#123f38] p-7 text-white sm:p-8">
              <h2 id="a-retenir" className="font-serif text-3xl">À retenir</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {guide.takeaway.map((item) => (
                  <li key={item} className="flex gap-3 rounded-2xl bg-white/[0.08] p-4 text-sm leading-6 text-[#e5f0ed]">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-7 space-y-6">
              {guide.sections.map((section) => (
                <section key={section.title} className="rounded-[28px] border border-[#dce7e2] bg-white p-7 shadow-[0_12px_36px_rgba(31,78,67,0.045)] sm:p-9">
                  <h2 className="font-serif text-3xl leading-tight text-[#123f38]">{section.title}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-4 text-[15px] leading-8 text-[#4d6d66] sm:text-base">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="mt-5 space-y-3 text-[15px] leading-7 text-[#4d6d66] sm:text-base">
                      {section.bullets.map((item) => (
                        <li key={item} className="flex gap-3">
                          <CheckIcon />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.callout && (
                    <div className="mt-6 rounded-[22px] border border-[#efd4c9] bg-[#fff8f4] p-5">
                      <h3 className="font-semibold text-[#7a3f2f]">{section.callout.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#714b3f]">{section.callout.body}</p>
                    </div>
                  )}
                </section>
              ))}
            </div>

            <section aria-labelledby="questions-frequentes" className="mt-7 rounded-[28px] border border-[#dce7e2] bg-white p-7 sm:p-9">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#4f8177]">Questions fréquentes</p>
              <h2 id="questions-frequentes" className="mt-3 font-serif text-3xl text-[#123f38]">Vos questions sur ce document</h2>
              <div className="mt-6 divide-y divide-[#e4ece9]">
                {guide.faqs.map((faq) => (
                  <div key={faq.question} className="py-5 first:pt-0 last:pb-0">
                    <h3 className="text-base font-bold text-[#204f47]">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#58756e]">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            {guide.sources && guide.sources.length > 0 && (
              <section aria-labelledby="sources" className="mt-7 rounded-[24px] border border-[#dce7e2] bg-[#eef5f2] p-6">
                <h2 id="sources" className="text-sm font-bold uppercase tracking-[0.08em] text-[#315f57]">Sources et cadre</h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#4d6d66]">
                  {guide.sources.map((source) => (
                    <li key={source.href}>
                      <a href={source.href} target="_blank" rel="noreferrer" className="font-semibold text-[#0c5b50] underline decoration-[#93bdb2] underline-offset-4 hover:text-[#084d44]">
                        {source.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <section className="rounded-[26px] bg-[#123f38] p-6 text-white shadow-[0_22px_60px_rgba(18,63,56,0.18)]">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#9fcfc1]">Votre document</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight">Obtenez un aperçu clair de vos lignes.</h2>
              <p className="mt-4 text-sm leading-7 text-[#cfe1dc]">
                Ajoutez un devis ou une facture. DevisVéto repère les principaux postes et prépare les questions utiles à poser à la clinique.
              </p>
              <Link href="/analyser" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#123f38] hover:bg-[#edf5f2]">
                Voir mon aperçu gratuit <ArrowIcon />
              </Link>
              <p className="mt-4 text-xs leading-5 text-[#a9c9c1]">Aucun diagnostic, aucun classement des tarifs et aucun remplacement du vétérinaire.</p>
            </section>

            <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#315f57]">Guides liés</h2>
              <div className="mt-4 space-y-3">
                {relatedGuides.map((related) => (
                  <Link key={related.slug} href={`/guides/${related.slug}`} className="block rounded-2xl border border-[#e0e9e5] p-4 transition hover:border-[#a9c9c1] hover:bg-[#f7faf8]">
                    <span className="text-sm font-bold leading-6 text-[#204f47]">{related.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#68817b]">Lire le guide</span>
                  </Link>
                ))}
              </div>
              <Link href="/guides" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#0c5b50] hover:text-[#084d44]">
                Voir tous les guides <ArrowIcon />
              </Link>
            </section>
          </aside>
        </div>
      </div>

      <footer className="border-t border-[#dce7e2] bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 text-sm text-[#68817b] sm:flex-row sm:items-center">
          <div>
            <p className="font-bold text-[#204f47]">DevisVéto</p>
            <p className="mt-1">Comprendre un document vétérinaire sans remplacer le vétérinaire.</p>
          </div>
          <nav aria-label="Liens de pied de page" className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
            <Link href="/guides" className="hover:text-[#0c5b50]">Guides</Link>
            <Link href="/ce-que-fait-devisveto" className="hover:text-[#0c5b50]">Ce que fait DevisVéto</Link>
            <Link href="/confidentialite" className="hover:text-[#0c5b50]">Confidentialité</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
