import Link from "next/link";
import { notFound } from "next/navigation";
import { getBillingSummary, isSubscriptionActive } from "@/lib/billing/entitlements";
import { loadPublicPreview } from "@/lib/public-preview/data";
import { buildReportViewModel, formatMoney } from "@/lib/public-preview/report";
import type { PreviewLine } from "@/lib/public-preview/types";
import { PurchaseOptions } from "./checkout-button";
import { ReportActions } from "./report-actions";

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

function readingStatus(line: PreviewLine) {
  const labels = {
    clear: "Lu clairement dans le document",
    uncertain: "Lecture à vérifier",
    missing: "Non précisé dans le document",
    possibly_included: "Possiblement inclus dans une ligne globale",
  } as const;
  return labels[line.reading_status];
}

function statusClass(line: PreviewLine) {
  return line.reading_status === "clear"
    ? "bg-[#e7f3ee] text-[#397268]"
    : line.reading_status === "missing"
      ? "bg-[#fff1ec] text-[#9a5a45]"
      : "bg-[#fff8e9] text-[#876a2f]";
}

function SourceEvidence({ line, token }: { line: PreviewLine; token: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-[#d9e7e2] bg-[#fbfcfb] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusClass(line)}`}>{readingStatus(line)}</span>
          {line.source_page && <span className="text-xs font-semibold text-[#6c837d]">Source : page {line.source_page}</span>}
        </div>
        {line.source_page && (
          <a
            href={`/api/public/document/${token}#page=${line.source_page}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-[#0c5b50] underline decoration-[#a9cfc3] underline-offset-4"
          >
            Voir cette ligne dans le document
          </a>
        )}
      </div>
      {line.source_quote ? (
        <blockquote className="mt-3 border-l-2 border-[#9fcfc1] pl-3 text-sm leading-6 text-[#607a74]">« {line.source_quote} »</blockquote>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[#7c918c]">L’extrait exact n’a pas pu être isolé automatiquement. La ligne reste marquée à vérifier.</p>
      )}
    </div>
  );
}

function ExplainedLine({ line, token }: { line: PreviewLine; token: string }) {
  return (
    <article className="py-7 first:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-[#204f47]">{line.original_label}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.07em] text-[#78908a]">{line.category}</p>
        </div>
        <p className="shrink-0 text-base font-semibold text-[#123f38]">{formatMoney(line.amount)}</p>
      </div>
      <SourceEvidence line={line} token={token} />
      <div className="mt-4 rounded-2xl bg-[#f1f7f4] px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#397268]">Ce que cela signifie</p>
        <p className="mt-2 text-sm leading-7 text-[#526f68]">{line.explanation}</p>
      </div>
      {line.explicit_elements.length > 0 && (
        <div className="mt-3 rounded-2xl border border-[#dce7e2] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#5d8179]">Ce qui est écrit</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-[#526f68]">
            {line.explicit_elements.map((item) => <li key={item}>✓ {item}</li>)}
          </ul>
        </div>
      )}
      {(line.elements_to_confirm.length > 0 || line.clarification) && (
        <div className="mt-3 rounded-2xl bg-[#fff8f4] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#a16551]">Ce que le document ne précise pas</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-[#765448]">
            {(line.elements_to_confirm.length ? line.elements_to_confirm : [line.clarification!]).map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      )}
      {line.suggested_question && (
        <div className="mt-3 rounded-2xl bg-[#eaf5f1] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#397268]">Question à poser</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#315f57]">« {line.suggested_question} »</p>
        </div>
      )}
    </article>
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
  const accessReturning = query.payment === "success" && !paid;
  const representativeLine = report.representativeLine;
  const lockedLines = preview.lines.filter((line) => line !== representativeLine);
  const visibleQuestions = paid ? preview.questions : report.priorityQuestions.slice(0, 1);
  const lockedQuestionCount = Math.max(preview.questions.length - visibleQuestions.length, 0);
  const visibleClarifications = paid ? report.toConfirm : report.toConfirm.slice(0, 1);
  const lockedClarificationCount = Math.max(report.toConfirm.length - visibleClarifications.length, 0);
  const title = `${report.documentLabel === "Devis" ? "Le devis" : "La facture"} de ${pet?.name || "votre animal"} a été analysé`;

  return (
    <main className="min-h-screen bg-[#f4f7f4] text-[#173b35]">
      <header className="border-b border-[#dce7e2] bg-white/95">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3"><BrandMark /><span className="text-lg font-semibold tracking-[-0.02em] text-[#123f38]">DevisVéto</span></Link>
          <div className="flex items-center gap-3">
            {pet?.id && <Link href={`/dashboard/animaux/${pet.id}`} className="hidden text-sm font-semibold text-[#45665f] hover:text-[#0c5b50] sm:block">Fiche de {pet.name}</Link>}
            <div className="rounded-full bg-[#e7f3ee] px-3 py-1.5 text-xs font-semibold text-[#397268]">Lien privé</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        <section className="mb-8 rounded-[28px] bg-[#123f38] px-6 py-7 text-white shadow-[0_22px_55px_rgba(18,63,56,0.16)] sm:px-9 sm:py-9">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9fcfc1]">{paid ? "Votre rapport complet" : "Résultat de la lecture"}</p>
          <h1 className="mt-3 max-w-4xl font-serif text-3xl font-semibold tracking-[-0.022em] sm:text-5xl">{title}</h1>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a9c9c1]">Total indiqué</p><p className="mt-1 text-2xl font-semibold">{formatMoney(preview.total_amount, preview.currency)}</p></div>
            <div className="rounded-2xl bg-white/10 px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a9c9c1]">Prestations reconnues</p><p className="mt-1 text-2xl font-semibold">{preview.lines.length}</p></div>
            <div className="rounded-2xl bg-white/10 px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a9c9c1]">À confirmer avec la clinique</p><p className="mt-1 text-2xl font-semibold">{report.toConfirm.length}</p></div>
          </div>
          <p className="mt-6 max-w-4xl text-sm leading-7 text-[#c4d7d2] sm:text-base">Nous avons retrouvé les lignes et les montants du document. {paid ? "Commencez par les faits et les questions prioritaires, puis consultez le détail." : "Voici le principal point à comprendre avant de répondre à la clinique."}</p>
        </section>

        {accessReturning && <div className="mb-6 rounded-2xl border border-[#efd5a9] bg-[#fff9ed] px-5 py-4 text-sm font-semibold text-[#7a5c25]">Votre accès est en cours de confirmation par Stripe. Actualisez cette page dans quelques instants si nécessaire.</div>}

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <div className="space-y-7">
            {paid && (
              <section className="rounded-[26px] border border-[#cfe1da] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Avant de répondre à la clinique</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">L’essentiel en cinq minutes.</h2>
                <p className="mt-4 text-sm leading-7 text-[#5f7973]">{report.summaryParagraph}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{report.keyFacts.map((fact) => <div key={fact} className="rounded-2xl bg-[#f1f7f4] px-4 py-4 text-sm font-semibold leading-5 text-[#315f57]">{fact}</div>)}</div>
                <div className="mt-7 grid gap-6 md:grid-cols-2">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Trois faits essentiels</p><ul className="mt-3 space-y-3 text-sm leading-6 text-[#526f68]">{report.clearlyIndicated.slice(0, 3).map((item) => <li key={item}>✓ {item}</li>)}</ul></div>
                  <div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Trois questions prioritaires</p><ol className="mt-3 space-y-3 text-sm leading-6 text-[#315f57]">{report.priorityQuestions.map((item, index) => <li key={item}><span className="mr-2 font-semibold">{index + 1}.</span>{item}</li>)}</ol></div>
                </div>
              </section>
            )}

            <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)] sm:p-8">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Explication reliée au document</p><h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">{paid ? "Chaque ligne, avec sa preuve source." : "Une prestation complexe, expliquée entièrement."}</h2></div>
                <span className="text-xs font-semibold text-[#78908a]">{report.sourceCoverage}% des lignes reliées à un extrait</span>
              </div>
              <div className="mt-7 divide-y divide-[#e5ece9]">{(paid ? preview.lines : [representativeLine]).map((line) => <ExplainedLine key={`${line.original_label}-${line.source_page}`} line={line} token={token} />)}</div>

              {!paid && lockedLines.length > 0 && (
                <div className="mt-3 border-t border-[#e5ece9] pt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Toutes les autres lignes reconnues</p>
                  <div className="mt-4 space-y-2">{lockedLines.map((line) => <div key={`${line.original_label}-locked`} className="flex items-center justify-between gap-4 rounded-2xl border border-[#e0e9e6] px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#315f57]">{line.original_label}</p><p className="mt-0.5 text-xs text-[#829791]">{line.category}{line.source_page ? ` · page ${line.source_page}` : ""}</p></div><div className="flex shrink-0 items-center gap-3"><span className="text-sm font-semibold text-[#315f57]">{formatMoney(line.amount, preview.currency)}</span><LockIcon /></div></div>)}</div>
                  <p className="mt-4 text-center text-sm font-semibold text-[#56756e]">Les libellés et montants restent visibles. Seules les explications, les vérifications et les actions sont réservées au rapport complet.</p>
                </div>
              )}
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)]"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Principal point à clarifier</p><h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.022em] text-[#123f38]">Ce que le document ne précise pas.</h2><div className="mt-5 space-y-3">{visibleClarifications.length ? visibleClarifications.map((item) => <div key={item} className="rounded-2xl bg-[#fff8f4] px-4 py-4 text-sm font-semibold leading-6 text-[#765448]">{item}</div>) : <p className="text-sm leading-6 text-[#6c837d]">Aucun point majeur n’a été relevé dans les informations lisibles.</p>}{lockedClarificationCount > 0 && <div className="flex items-center gap-2 rounded-2xl border border-dashed border-[#d5e1dd] px-4 py-3 text-sm font-semibold text-[#718780]"><LockIcon /> {lockedClarificationCount} autre{lockedClarificationCount > 1 ? "s" : ""} point{lockedClarificationCount > 1 ? "s" : ""}</div>}</div></div>
              <div className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)]"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Question personnalisée</p><h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.022em] text-[#123f38]">Prête à poser à la clinique.</h2><div className="mt-5 space-y-3">{visibleQuestions.map((question, index) => <div key={question} className="rounded-2xl bg-[#edf6f2] px-4 py-3 text-sm font-semibold leading-6 text-[#315f57]"><span className="mr-2">{index + 1}.</span>{question}</div>)}{lockedQuestionCount > 0 && <div className="flex items-center gap-2 rounded-2xl border border-dashed border-[#d5e1dd] px-4 py-3 text-sm font-semibold text-[#718780]"><LockIcon /> {lockedQuestionCount} autre{lockedQuestionCount > 1 ? "s" : ""} question{lockedQuestionCount > 1 ? "s" : ""}</div>}</div></div>
            </section>

            {paid && report.categoryTotals.length > 0 && (
              <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)] sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Répartition factuelle du montant</p><h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">Comment le total se répartit.</h2><div className="mt-6 divide-y divide-[#e5ece9]">{report.categoryTotals.map((item) => <div key={item.category} className="flex items-center justify-between gap-5 py-4 first:pt-0"><span className="text-sm font-semibold text-[#315f57]">{item.category}{item.percentage !== null ? ` · ${item.percentage} %` : ""}</span><span className="text-sm font-semibold text-[#123f38]">{formatMoney(item.amount, preview.currency)}</span></div>)}</div><p className="mt-5 text-xs leading-5 text-[#78908a]">Cette répartition reprend uniquement les montants lisibles. Elle ne permet pas de conclure qu’un tarif est normal, anormal ou justifié.</p></section>
            )}

            {paid && report.documentChecks.length > 0 && (
              <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)] sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Contrôles factuels automatiques</p><h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">Ce qui a été vérifié sans interprétation.</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{report.documentChecks.map((check) => <div key={check.key} className={`rounded-2xl border px-4 py-4 ${check.status === "attention" ? "border-[#efd8ce] bg-[#fff8f4]" : check.status === "ok" ? "border-[#cfe1da] bg-[#f1f7f4]" : "border-[#dde6e3] bg-[#fafbfa]"}`}><p className="text-sm font-semibold text-[#204f47]">{check.label}</p><p className="mt-2 text-xs leading-5 text-[#647d77]">{check.detail}</p></div>)}</div></section>
            )}

            {paid && (
              <section className="rounded-[26px] border border-[#cfe1da] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)] sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Préparer l’échange</p><h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">Vos questions et un e-mail prêt à envoyer.</h2>{report.emailBody && <div className="mt-5 whitespace-pre-wrap rounded-2xl bg-[#f1f7f4] px-5 py-5 text-sm leading-7 text-[#526f68]"><p className="mb-3 font-semibold text-[#204f47]">Objet : {report.emailSubject}</p>{report.emailBody}</div>}<div className="mt-5"><ReportActions questions={preview.questions} priorityQuestions={report.priorityQuestions} emailSubject={report.emailSubject} emailBody={report.emailBody} /></div></section>
            )}

            {paid && report.comparison && (
              <section className="rounded-[26px] border border-[#cfe1da] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)] sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Comparaison avec la version précédente</p><h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">Ce qui a changé dans le document.</h2>{report.comparison.totalDelta !== null && <p className="mt-4 text-lg font-semibold text-[#204f47]">Écart total : {report.comparison.totalDelta > 0 ? "+" : ""}{formatMoney(report.comparison.totalDelta, preview.currency)}</p>}<div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-[#f1f7f4] p-4"><p className="text-sm font-semibold">Lignes ajoutées</p><p className="mt-2 text-sm leading-6 text-[#647d77]">{report.comparison.added.length ? report.comparison.added.join(" · ") : "Aucune"}</p></div><div className="rounded-2xl bg-[#fff8f4] p-4"><p className="text-sm font-semibold">Lignes retirées</p><p className="mt-2 text-sm leading-6 text-[#647d77]">{report.comparison.removed.length ? report.comparison.removed.join(" · ") : "Aucune"}</p></div></div>{report.comparison.changed.length > 0 && <div className="mt-4 space-y-2">{report.comparison.changed.map((item) => <div key={item.label} className="flex items-center justify-between rounded-2xl border border-[#dce7e2] px-4 py-3 text-sm"><span className="font-semibold">{item.label}</span><span>{formatMoney(item.before, preview.currency)} → {formatMoney(item.after, preview.currency)}</span></div>)}</div>}<p className="mt-5 text-sm leading-6 text-[#647d77]">{report.comparison.resolvedClarifications} point{report.comparison.resolvedClarifications > 1 ? "s" : ""} semble{report.comparison.resolvedClarifications > 1 ? "nt" : ""} désormais précisé{report.comparison.resolvedClarifications > 1 ? "s" : ""}. {report.comparison.remainingClarifications} reste{report.comparison.remainingClarifications > 1 ? "nt" : ""} à confirmer.</p></section>
            )}

            {!paid && (
              <section className="rounded-[26px] border border-[#cfe1da] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)] sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Votre rapport complet contient</p><h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">Tout ce qu’il faut pour appeler la clinique sereinement.</h2><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#f1f7f4] px-4 py-4 text-sm font-semibold">{preview.lines.length} prestations expliquées et reliées au document</div><div className="rounded-2xl bg-[#f1f7f4] px-4 py-4 text-sm font-semibold">{report.toConfirm.length} points à confirmer</div><div className="rounded-2xl bg-[#f1f7f4] px-4 py-4 text-sm font-semibold">{preview.questions.length} questions personnalisées</div><div className="rounded-2xl bg-[#f1f7f4] px-4 py-4 text-sm font-semibold">Répartition de {formatMoney(preview.total_amount, preview.currency)} et contrôles factuels</div><div className="rounded-2xl bg-[#f1f7f4] px-4 py-4 text-sm font-semibold">E-mail prêt à envoyer à la clinique</div><div className="rounded-2xl bg-[#f1f7f4] px-4 py-4 text-sm font-semibold">PDF privé et vérification documentaire humaine</div></div></section>
            )}

            <section className="rounded-[26px] bg-[#123f38] p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9fcfc1]">Conclusion neutre</p><h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.022em]">Ce que le document permet de comprendre.</h2><p className="mt-4 text-base leading-8 text-[#d5e4e0]">{report.conclusion}</p></section>
          </div>

          <aside className="lg:sticky lg:top-6">
            <div className="rounded-[28px] border border-[#d8e6e1] bg-white p-6 shadow-[0_22px_55px_rgba(31,78,67,0.12)]">
              {paid ? (
                <>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e5f3ed] text-xl text-[#0c5b50]">✓</div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Rapport complet disponible</p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">Gardez une version claire sous la main.</h2>
                  <a href={`/api/public/report/${token}`} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0c5b50] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#084d44]"><DownloadIcon /> Télécharger le PDF privé</a>
                  <Link href={pet?.id ? `/dashboard/animaux/${pet.id}` : "/dashboard"} className="mt-3 inline-flex w-full justify-center rounded-full border border-[#cbdcd6] px-4 py-3 text-sm font-semibold text-[#45665f] hover:bg-[#f1f6f4]">Retrouver la fiche de {pet?.name || "mon animal"}</Link>
                  {report.revisionEligibleUntil && pet?.id && <Link href={`/analyser?pet_id=${pet.id}`} className="mt-3 inline-flex w-full justify-center rounded-full border border-[#cbdcd6] px-4 py-3 text-center text-sm font-semibold text-[#45665f] hover:bg-[#f1f6f4]">Comparer gratuitement une version révisée avant le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(report.revisionEligibleUntil))}</Link>}
                  <div className="mt-5 rounded-2xl bg-[#f5f8f7] px-4 py-4"><p className="text-sm font-semibold text-[#315f57]">{report.reviewState.label}</p><p className="mt-2 text-xs leading-5 text-[#647d77]">{report.reviewState.detail}</p></div>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Recevoir le rapport complet</p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.022em] text-[#123f38]">{preview.lines.length} explications et un plan d’action concret.</h2>
                  <div className="mt-4 rounded-2xl bg-[#f1f7f4] px-4 py-4 text-sm leading-6 text-[#526f68]">{preview.lines.length} explications · {report.toConfirm.length} points à confirmer · {preview.questions.length} questions · contrôles factuels · e-mail · PDF privé</div>
                  <div className="mt-6"><PurchaseOptions token={token} creditBalance={billing.creditBalance} subscriptionActive={isSubscriptionActive(billing.subscription?.status)} lineCount={preview.lines.length} /></div>
                  <div className="mt-5 rounded-2xl bg-[#f5f8f7] px-4 py-3 text-xs font-semibold leading-5 text-[#647d77]">{report.reviewState.label}. Le contrôle porte sur la fidélité au document, jamais sur la nécessité des soins ou le niveau du tarif.</div>
                </>
              )}
            </div>
            <div className="mt-5 rounded-2xl border border-[#dce7e2] bg-white/80 px-5 py-4"><p className="text-sm font-semibold text-[#315f57]">Votre document reste privé</p><p className="mt-2 text-xs leading-5 text-[#718780]">Lien non indexé, téléchargement protégé, aucun cache public. Le document reste dans votre espace jusqu’à ce que vous le supprimiez depuis les paramètres.</p></div>
            <div className="mt-3 rounded-2xl border border-[#dce7e2] bg-white/75 px-5 py-4 text-xs leading-5 text-[#718780]">DevisVéto explique le document. Le service ne juge ni la nécessité des soins ni le caractère normal d’un tarif.</div>
          </aside>
        </div>
      </div>
    </main>
  );
}
