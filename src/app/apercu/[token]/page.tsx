import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPublicPreview } from "@/lib/public-preview/data";
import { previewSchema, type PreviewPayload } from "@/lib/public-preview/types";
import { CheckoutButton } from "./checkout-button";

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

function formatMoney(amount: number | null, currency = "EUR") {
  if (amount === null || !Number.isFinite(amount)) return "Montant à confirmer";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount);
}

function firstRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function payloadFromStoredData(data: NonNullable<Awaited<ReturnType<typeof loadPublicPreview>>>): PreviewPayload {
  const pet = firstRelation(data.caseRow.pets as { name: string; species: string } | Array<{ name: string; species: string }> | null);
  const raw = previewSchema.safeParse(data.report?.ai_raw_output);
  if (raw.success) return raw.data;

  const questions = Array.isArray(data.report?.questions_to_ask)
    ? (data.report?.questions_to_ask as string[])
    : [];
  const factors = Array.isArray(data.report?.price_variation_factors)
    ? (data.report?.price_variation_factors as string[])
    : [];
  const composition = data.report?.amount_composition as { categories?: string[]; intervention?: string } | null;

  return previewSchema.parse({
    intervention: composition?.intervention || `${data.caseRow.document_type === "facture" ? "Facture" : "Devis"} vétérinaire`,
    total_amount: data.caseRow.detected_total_amount,
    currency: data.caseRow.currency || "EUR",
    summary: data.report?.summary || `Le document de ${pet?.name || "votre animal"} a été lu et organisé.`,
    categories: composition?.categories?.length ? composition.categories : ["Prestations vétérinaires"],
    lines: data.items.length
      ? data.items.map((item) => ({
          original_label: item.original_label,
          category: item.category || "Prestation",
          amount: item.total_price,
          explanation: item.explanation || "Cette ligne sera détaillée dans le rapport complet.",
          confidence: item.confidence_score || "medium",
          clarification: item.clarification_needed,
        }))
      : [
          {
            original_label: "Document reçu",
            category: "Informations générales",
            amount: null,
            explanation: "Le document est enregistré et sera vérifié avant livraison.",
            confidence: "medium",
            clarification: null,
          },
        ],
    clarifications: data.items.map((item) => item.clarification_needed).filter(Boolean),
    questions,
    variation_factors: factors,
    price_context:
      "Il n’est pas possible de déterminer de manière fiable si le montant global est élevé sans connaître le contexte médical et le détail des prestations incluses.",
    warnings: data.report?.limitations ? [data.report.limitations] : [],
  });
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

  const preview = payloadFromStoredData(data);
  const pet = firstRelation(data.caseRow.pets as { name: string; species: string } | Array<{ name: string; species: string }> | null);
  const paid = data.caseRow.payment_status === "succeeded" || data.payment?.status === "succeeded";
  const paymentReturning = query.payment === "success" && !paid;
  const visibleLines = preview.lines.slice(0, 2);
  const lockedLines = preview.lines.slice(2);
  const visibleQuestions = preview.questions.slice(0, 2);
  const lockedQuestionCount = Math.max(preview.questions.length - visibleQuestions.length, 0);
  const visibleClarification = preview.clarifications[0];
  const lockedClarificationCount = Math.max(preview.clarifications.length - 1, 0);

  return (
    <main className="min-h-screen bg-[#f4f7f4] text-[#173b35]">
      <header className="border-b border-[#dce7e2] bg-white/95">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark />
            <span className="text-lg font-extrabold tracking-[-0.035em] text-[#123f38]">DevisVéto</span>
          </Link>
          <div className="rounded-full bg-[#e7f3ee] px-3 py-1.5 text-xs font-extrabold text-[#397268]">Lien privé</div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        <div className="mb-8 rounded-[26px] bg-[#123f38] px-6 py-7 text-white shadow-[0_22px_55px_rgba(18,63,56,0.16)] sm:px-9">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#9fcfc1]">Votre aperçu personnalisé</p>
              <h1 className="mt-3 font-serif text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Le document de {pet?.name || "votre animal"}, en clair.</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-[#c4d7d2] sm:text-base">{preview.summary}</p>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/10 px-5 py-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#a9c9c1]">Montant indiqué</p>
              <p className="mt-1 text-2xl font-extrabold">{formatMoney(preview.total_amount, preview.currency)}</p>
            </div>
          </div>
        </div>

        {paymentReturning && (
          <div className="mb-6 rounded-2xl border border-[#efd5a9] bg-[#fff9ed] px-5 py-4 text-sm font-semibold text-[#7a5c25]">
            Paiement reçu. La confirmation est en cours ; cette page se mettra à jour dès validation.
          </div>
        )}

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="space-y-7">
            <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)] sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Lecture du document</p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38]">{preview.intervention}</h2>
                </div>
                <div className="rounded-full bg-[#edf6f2] px-4 py-2 text-xs font-extrabold text-[#397268]">{preview.lines.length} ligne{preview.lines.length > 1 ? "s" : ""} identifiée{preview.lines.length > 1 ? "s" : ""}</div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {preview.categories.map((category) => <span key={category} className="rounded-full border border-[#d4e4de] bg-[#f7faf9] px-3 py-1.5 text-xs font-bold text-[#4a7068]">{category}</span>)}
              </div>
            </section>

            <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)] sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Explication ligne par ligne</p><h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38]">Voyez exactement ce qui a été compris.</h2></div>
                <span className="hidden text-xs font-bold text-[#78908a] sm:block">2 explications offertes</span>
              </div>

              <div className="mt-7 divide-y divide-[#e5ece9]">
                {visibleLines.map((line, index) => (
                  <article key={`${line.original_label}-${index}`} className="py-6 first:pt-0">
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="text-sm font-extrabold text-[#204f47]">{line.original_label}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.09em] text-[#78908a]">{line.category}</p></div>
                      <p className="shrink-0 text-sm font-extrabold text-[#123f38]">{formatMoney(line.amount, preview.currency)}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#617b75]">{line.explanation}</p>
                    {line.clarification && <div className="mt-3 rounded-xl bg-[#fff8f4] px-4 py-3 text-xs font-semibold leading-5 text-[#805a4c]">À préciser : {line.clarification}</div>}
                  </article>
                ))}

                {lockedLines.map((line, index) => (
                  <article key={`${line.original_label}-locked-${index}`} className="relative overflow-hidden py-6">
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="text-sm font-extrabold text-[#204f47]">{line.original_label}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.09em] text-[#78908a]">{line.category}</p></div>
                      <p className="shrink-0 text-sm font-extrabold text-[#123f38]">{formatMoney(line.amount, preview.currency)}</p>
                    </div>
                    <p className="mt-3 max-h-12 overflow-hidden text-sm leading-7 text-[#849792]">{line.explanation.slice(0, 110)}…</p>
                    <div className="absolute inset-x-0 bottom-0 flex h-16 items-end justify-center bg-gradient-to-t from-white via-white/95 to-transparent pb-1">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#d3e1dc] bg-white px-3 py-1.5 text-xs font-extrabold text-[#56756e]"><LockIcon /> Explication complète verrouillée</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)]">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Points à clarifier</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.035em] text-[#123f38]">Ce qui mérite une précision.</h2>
                {visibleClarification ? <div className="mt-5 rounded-2xl bg-[#fff8f4] px-4 py-4 text-sm font-semibold leading-6 text-[#765448]">{visibleClarification}</div> : <p className="mt-5 text-sm leading-6 text-[#6c837d]">Aucune ambiguïté majeure n’a été détectée dans l’aperçu.</p>}
                {lockedClarificationCount > 0 && <div className="mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-[#d5e1dd] px-4 py-3 text-sm font-bold text-[#718780]"><LockIcon /> {lockedClarificationCount} autre{lockedClarificationCount > 1 ? "s" : ""} point{lockedClarificationCount > 1 ? "s" : ""} identifié{lockedClarificationCount > 1 ? "s" : ""}</div>}
              </div>

              <div className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)]">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Questions personnalisées</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.035em] text-[#123f38]">Prêtes à poser à la clinique.</h2>
                <div className="mt-5 space-y-3">
                  {visibleQuestions.map((question, index) => <div key={question} className="rounded-2xl bg-[#edf6f2] px-4 py-3 text-sm font-semibold leading-6 text-[#315f57]"><span className="mr-2 text-[#0c5b50]">{index + 1}.</span>{question}</div>)}
                  {lockedQuestionCount > 0 && <div className="flex items-center gap-2 rounded-2xl border border-dashed border-[#d5e1dd] px-4 py-3 text-sm font-bold text-[#718780]"><LockIcon /> {lockedQuestionCount} autre{lockedQuestionCount > 1 ? "s" : ""} question{lockedQuestionCount > 1 ? "s" : ""} dans le rapport</div>}
                </div>
              </div>
            </section>

            <section className="rounded-[26px] border border-[#dce7e2] bg-[#123f38] p-6 text-white sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#9fcfc1]">« Donc, est-ce que c’est cher ? »</p>
              <p className="mt-4 text-base leading-8 text-[#d5e4e0]">{preview.price_context}</p>
              {preview.variation_factors.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{preview.variation_factors.map((factor) => <span key={factor} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-[#d9e8e4]">{factor}</span>)}</div>}
            </section>
          </div>

          <aside className="lg:sticky lg:top-6">
            <div className="rounded-[28px] border border-[#d8e6e1] bg-white p-6 shadow-[0_22px_55px_rgba(31,78,67,0.12)]">
              {paid ? (
                <>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e5f3ed] text-xl text-[#0c5b50]">✓</div>
                  <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Paiement confirmé</p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38]">Votre rapport complet est en vérification.</h2>
                  <p className="mt-3 text-sm leading-6 text-[#6c837d]">Toutes les lignes, les points à clarifier et les questions seront relus avant livraison. Vous recevrez un email dès que le rapport sera prêt.</p>
                  <Link href="/connexion" className="mt-6 inline-flex w-full justify-center rounded-full border border-[#cbdcd6] px-4 py-3 text-sm font-extrabold text-[#315f57] hover:bg-[#f1f6f4]">Accéder à mon espace</Link>
                </>
              ) : (
                <>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Rapport complet</p>
                  <div className="mt-2 flex items-baseline gap-2"><span className="font-serif text-5xl font-semibold tracking-[-0.05em] text-[#123f38]">6,90 €</span><span className="text-xs font-bold text-[#829791]">une seule fois</span></div>
                  <ul className="mt-6 space-y-3 text-sm font-semibold leading-6 text-[#526f68]">
                    <li>✓ Toutes les lignes expliquées</li><li>✓ Tous les points à faire préciser</li><li>✓ 5 à 8 questions personnalisées</li><li>✓ Facteurs qui peuvent influencer le montant</li><li>✓ Vérification humaine avant livraison</li><li>✓ Rapport consultable et téléchargeable</li>
                  </ul>
                  <div className="mt-7"><CheckoutButton token={token} /></div>
                  <p className="mt-4 text-center text-xs leading-5 text-[#879a95]">Paiement sécurisé · Aucun abonnement · Aucun renouvellement automatique</p>
                  <div className="mt-5 rounded-2xl bg-[#f5f8f7] px-4 py-3 text-xs font-semibold leading-5 text-[#647d77]">Si le document ne peut pas être exploité correctement, le dossier est signalé avant livraison.</div>
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
