import Link from "next/link";
import { notFound } from "next/navigation";
import { getBillingSummary, isSubscriptionActive } from "@/lib/billing/entitlements";
import { loadPublicPreview } from "@/lib/public-preview/data";
import {
  buildReportViewModel,
  formatMoney,
} from "@/lib/public-preview/report";
import { PurchaseOptions } from "./checkout-button";

export const dynamic = "force-dynamic";

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

function LockIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <rect x="4" y="8" width="12" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15.5h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const data = await loadPublicPreview(token);
  if (!data) notFound();

  const billing = await getBillingSummary(data.caseRow.user_id);
  const report = buildReportViewModel(data);
  const { preview, pet, paid } = report;
  const paymentReturning = query.payment === "success" && !paid;
  const representativeLine = report.representativeLine;
  const lockedLines = preview.lines.filter((line) => line !== representativeLine);
  const visibleQuestions = paid ? preview.questions : preview.questions.slice(0, 2);
  const lockedQuestionCount = Math.max(preview.questions.length - visibleQuestions.length, 0);
  const visibleClarifications = paid ? report.toConfirm : report.toConfirm.slice(0, 1);
  const lockedClarificationCount = Math.max(report.toConfirm.length - visibleClarifications.length, 0);

  return (
    <main className="min-h-screen bg-[#f4f7f4] text-[#173b35]">
      <header className="border-b border-[#dce7e2] bg-white/95">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark />
            <span className="text-lg font-semibold tracking-[-0.02em] text-[#123f38]">DevisVéto</span>
          </Link>
          <div className="flex items-center gap-3">
            {pet?.id && (
              <Link href={`/dashboard/animaux/${pet.id}`} className="hidden text-sm font-semibold text-[#45665f] hover:text-[#0c5b50] sm:block">
                Fiche de {pet.name}
              </Link>
            )}
            <div className="rounded-full bg-[#e7f3ee] px-3 py-1.5 text-xs font-semibold text-[#397268]">Lien privé</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        <div className="mb-8 rounded-[26px] bg-[#123f38] px-6 py-7 text-white shadow-[0_22px_55px_rgba(18,63,56,0.16)] sm:px-9">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9fcfc1]">
                {paid ? "Votre rapport complet" : "Votre aperçu personnalisé"}
              </p>
              <h1 className="mt-3 font-serif text-3xl font-semibold tracking-[-0.022em] sm:text-5xl">
                Le document de {pet?.name || "votre animal"}, en clair.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[#c4d7d2] sm:text-base">{report.summaryParagraph}</p>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/10 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a9c9c1]">Montant indiqué</p>
              <p className="mt-1 text-2xl font-semibold">{formatMoney(preview.total_amount, preview.currency)}</p>
            </div>
          </div>
        </div>

        {paymentReturning && (
          <div className="mb-6 rounded-2xl border border-[#efd5a9] bg-[#fff9ed] px-5 py-4 text-sm font-semibold text-[#7a5c25]">
            Votre accès est en cours de confirmation par Stripe. Actualisez cette page dans quelques instants si nécessaire.
          </div>
        )}

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <div className="space-y-7">
            <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)] sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">
                    {paid ? "Ce que signifie ce document" : "Lecture du document"}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">{preview.intervention}</h2>
                </div>
                <div className="rounded-full bg-[#edf6f2] px-4 py-2 text-xs font-semibold text-[#397268]">
                  {preview.lines.length} ligne{preview.lines.length > 1 ? "s" : ""} identifiée{preview.lines.length > 1 ? "s" : ""}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {preview.categories.map((category) => (
                  <span key={category} className="rounded-full border border-[#d4e4de] bg-[#f7faf9] px-3 py-1.5 text-xs font-semibold text-[#4a7068]">
                    {category}
                  </span>
                ))}
              </div>
              {paid && (
                <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {report.keyFacts.map((fact) => (
                    <div key={fact} className="rounded-2xl bg-[#f1f7f4] px-4 py-4 text-sm font-semibold leading-5 text-[#315f57]">{fact}</div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)] sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Explication ligne par ligne</p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">
                    {paid ? "Chaque terme, expliqué simplement." : "Un exemple concret de l’analyse."}
                  </h2>
                </div>
                {!paid && <span className="hidden text-xs font-semibold text-[#78908a] sm:block">1 explication détaillée offerte</span>}
              </div>

              <div className="mt-7 divide-y divide-[#e5ece9]">
                {(paid ? preview.lines : [representativeLine]).map((line, index) => (
                  <article key={`${line.original_label}-${index}`} className="py-7 first:pt-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#204f47]">{line.original_label}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.07em] text-[#78908a]">{line.category}</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-[#123f38]">{formatMoney(line.amount, preview.currency)}</p>
                    </div>
                    <div className="mt-5 rounded-2xl bg-[#f1f7f4] px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#397268]">Ce que cela signifie</p>
                      <p className="mt-2 text-sm leading-7 text-[#526f68]">{line.explanation}</p>
                    </div>
                    {line.clarification && (
                      <div className="mt-3 rounded-2xl bg-[#fff8f4] px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#a16551]">À confirmer avec la clinique</p>
                        <p className="mt-2 text-sm leading-6 text-[#765448]">{line.clarification}</p>
                      </div>
                    )}
                  </article>
                ))}

                {!paid && lockedLines.length > 0 && (
                  <div className="py-5">
                    <div className="space-y-2">
                      {lockedLines.map((line) => (
                        <div key={`${line.original_label}-locked`} className="flex items-center justify-between gap-4 rounded-2xl border border-[#e0e9e6] px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#315f57]">{line.original_label}</p>
                            <p className="mt-0.5 text-xs text-[#829791]">{line.category}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-sm font-semibold text-[#315f57]">{formatMoney(line.amount, preview.currency)}</span>
                            <LockIcon />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-center text-sm font-semibold text-[#56756e]">
                      {lockedLines.length} autre{lockedLines.length > 1 ? "s" : ""} prestation{lockedLines.length > 1 ? "s" : ""} expliquée{lockedLines.length > 1 ? "s" : ""} dans le rapport complet.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {paid && report.categoryTotals.length > 0 && (
              <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Lecture du montant</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">Comment le montant se répartit.</h2>
                <div className="mt-6 divide-y divide-[#e5ece9]">
                  {report.categoryTotals.map((item) => (
                    <div key={item.category} className="flex items-center justify-between gap-5 py-4 first:pt-0">
                      <span className="text-sm font-semibold text-[#315f57]">{item.category}</span>
                      <span className="text-sm font-semibold text-[#123f38]">{formatMoney(item.amount, preview.currency)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-xs leading-5 text-[#78908a]">
                  Cette répartition reprend uniquement les montants lisibles du document. Elle ne permet pas de conclure qu’un tarif est normal, anormal ou justifié.
                </p>
              </section>
            )}

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Points à clarifier</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.022em] text-[#123f38]">Ce que le document ne précise pas.</h2>
                <div className="mt-5 space-y-3">
                  {visibleClarifications.length ? visibleClarifications.map((item) => (
                    <div key={item} className="rounded-2xl bg-[#fff8f4] px-4 py-4 text-sm font-semibold leading-6 text-[#765448]">{item}</div>
                  )) : (
                    <p className="text-sm leading-6 text-[#6c837d]">Aucun point de clarification majeur n’a été relevé dans les informations lisibles.</p>
                  )}
                  {lockedClarificationCount > 0 && (
                    <div className="flex items-center gap-2 rounded-2xl border border-dashed border-[#d5e1dd] px-4 py-3 text-sm font-semibold text-[#718780]">
                      <LockIcon /> {lockedClarificationCount} autre{lockedClarificationCount > 1 ? "s" : ""} point{lockedClarificationCount > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Questions personnalisées</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.022em] text-[#123f38]">À garder sous la main.</h2>
                <div className="mt-5 space-y-3">
                  {visibleQuestions.map((question) => (
                    <div key={question} className="rounded-2xl bg-[#edf6f2] px-4 py-3 text-sm font-semibold leading-6 text-[#315f57]">{question}</div>
                  ))}
                  {lockedQuestionCount > 0 && (
                    <div className="flex items-center gap-2 rounded-2xl border border-dashed border-[#d5e1dd] px-4 py-3 text-sm font-semibold text-[#718780]">
                      <LockIcon /> {lockedQuestionCount} autre{lockedQuestionCount > 1 ? "s" : ""} question{lockedQuestionCount > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {!paid && (
              <section className="rounded-[26px] border border-[#cfe1da] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">En résumé</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">Ce que ce document signifie, en quelques lignes.</h2>
                <p className="mt-5 text-sm leading-7 text-[#5f7973]">{report.summaryParagraph}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {report.keyFacts.map((fact) => (
                    <div key={fact} className="rounded-2xl bg-[#f1f7f4] px-4 py-4 text-sm font-semibold leading-5 text-[#315f57]">{fact}</div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl bg-[#123f38] px-5 py-5 text-sm leading-6 text-[#d5e4e0]">
                  Le rapport complet reprend chaque ligne, explique les termes, rassemble les points à confirmer et les questions utiles, puis les regroupe dans un PDF facile à conserver ou à partager.
                </div>
              </section>
            )}

            <section className="rounded-[26px] border border-[#dce7e2] bg-[#123f38] p-6 text-white sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9fcfc1]">Conclusion globale</p>
              <h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.022em]">Ce que l’on peut retenir du document.</h2>
              <p className="mt-4 text-base leading-8 text-[#d5e4e0]">{report.conclusion}</p>
              {preview.variation_factors.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {preview.variation_factors.map((factor) => (
                    <span key={factor} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#d9e8e4]">{factor}</span>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-6">
            <div className="rounded-[28px] border border-[#d8e6e1] bg-white p-6 shadow-[0_22px_55px_rgba(31,78,67,0.12)]">
              {paid ? (
                <>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e5f3ed] text-xl text-[#0c5b50]">✓</div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Rapport complet disponible</p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">Conservez une version claire du document.</h2>
                  <p className="mt-3 text-sm leading-6 text-[#6c837d]">
                    Le PDF reprend le résumé, chaque prestation expliquée, la conclusion et toutes les questions préparées.
                  </p>
                  <a
                    href={`/api/public/report/${token}`}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0c5b50] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#084d44]"
                  >
                    <DownloadIcon /> Télécharger le rapport PDF
                  </a>
                  <Link href={pet?.id ? `/dashboard/animaux/${pet.id}` : "/dashboard"} className="mt-3 inline-flex w-full justify-center rounded-full border border-[#cbdcd6] px-4 py-3 text-sm font-semibold text-[#45665f] hover:bg-[#f1f6f4]">
                    Retrouver la fiche de {pet?.name || "mon animal"}
                  </Link>
                  <div className="mt-5 rounded-2xl bg-[#f5f8f7] px-4 py-3 text-xs font-semibold leading-5 text-[#647d77]">
                    La vérification humaine reste incluse. Toute correction apportée au rapport sera reprise dans la prochaine version téléchargée.
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Recevoir le rapport complet</p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">Toutes les explications, dans un document à conserver.</h2>
                  <div className="mt-4 rounded-2xl bg-[#f1f7f4] px-4 py-4 text-sm leading-6 text-[#526f68]">
                    {preview.lines.length} explications détaillées · {report.toConfirm.length} point{report.toConfirm.length > 1 ? "s" : ""} à confirmer · {preview.questions.length} question{preview.questions.length > 1 ? "s" : ""} personnalisée{preview.questions.length > 1 ? "s" : ""} · PDF inclus
                  </div>
                  <div className="mt-6">
                    <PurchaseOptions token={token} creditBalance={billing.creditBalance} subscriptionActive={isSubscriptionActive(billing.subscription?.status)} />
                  </div>
                  <div className="mt-5 rounded-2xl bg-[#f5f8f7] px-4 py-3 text-xs font-semibold leading-5 text-[#647d77]">
                    Le rapport complet reste relu par une personne. L’abonnement est facultatif et aucune option n’est présélectionnée.
                  </div>
                </>
              )}
            </div>
            <div className="mt-5 rounded-2xl border border-[#dce7e2] bg-white/75 px-5 py-4 text-xs leading-5 text-[#718780]">
              DevisVéto explique le document. Le service ne juge ni la nécessité des soins ni le caractère normal d’un tarif.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
