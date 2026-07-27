import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  uploaded: "Document reçu",
  extraction_pending: "Lecture en cours",
  extracted: "Aperçu disponible",
  payment_pending: "Paiement en attente",
  paid: "Rapport en préparation",
  review_pending: "Vérification humaine",
  needs_information: "Informations demandées",
  approved: "Rapport validé",
  delivered: "Rapport disponible",
  error: "À vérifier",
  refunded: "Remboursé",
};

type ExtractedItem = {
  id: string;
  original_label: string;
  normalized_label: string | null;
  category: string | null;
  total_price: number | null;
  explanation: string | null;
  clarification_needed: string | null;
  display_order: number;
};

function formatMoney(amount: number | null, currency = "EUR") {
  if (amount === null || !Number.isFinite(Number(amount))) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(Number(amount));
}

function formatDate(value?: string | null) {
  if (!value) return "Date non indiquée";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(value));
}

function normalizedKey(item: ExtractedItem) {
  return (item.normalized_label || item.original_label)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compareItems(current: ExtractedItem[], previous: ExtractedItem[]) {
  const currentMap = new Map(current.map((item) => [normalizedKey(item), item]));
  const previousMap = new Map(previous.map((item) => [normalizedKey(item), item]));
  const added = current.filter((item) => !previousMap.has(normalizedKey(item)));
  const removed = previous.filter((item) => !currentMap.has(normalizedKey(item)));
  const changed = current.flatMap((item) => {
    const before = previousMap.get(normalizedKey(item));
    if (!before || before.total_price === null || item.total_price === null) return [];
    const delta = Number(item.total_price) - Number(before.total_price);
    if (Math.abs(delta) < 0.01) return [];
    return [{ item, before, delta }];
  });
  return { added, removed, changed };
}

function firstRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/connexion?next=/dashboard");
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: caseRow } = await supabase
    .from("cases")
    .select(
      "id, user_id, pet_id, comparison_case_id, status, document_type, document_date, detected_total_amount, currency, payment_status, entitlement_source, user_description, primary_question, created_at, delivered_at, pets(id, name, species), case_documents(original_filename, mime_type)"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!caseRow) notFound();

  const pet = firstRelation(
    caseRow.pets as
      | { id: string; name: string; species: string }
      | Array<{ id: string; name: string; species: string }>
      | null
  );
  const documents = caseRow.case_documents as unknown as Array<{ original_filename: string; mime_type: string }> | null;
  const hasAccess = caseRow.payment_status === "succeeded";
  const delivered = caseRow.status === "delivered";

  const [{ data: items }, { data: reports }] = await Promise.all([
    supabase
      .from("extracted_items")
      .select("id, original_label, normalized_label, category, total_price, explanation, clarification_needed, display_order")
      .eq("case_id", id)
      .order("display_order", { ascending: true }),
    supabase
      .from("case_reports")
      .select("summary, questions_to_ask, price_variation_factors, limitations, reviewed_at")
      .eq("case_id", id)
      .order("version", { ascending: false })
      .limit(1),
  ]);

  let previousCaseId = caseRow.comparison_case_id as string | null;
  if (!previousCaseId && caseRow.pet_id) {
    const { data: previous } = await supabase
      .from("cases")
      .select("id")
      .eq("user_id", user.id)
      .eq("pet_id", caseRow.pet_id)
      .lt("created_at", caseRow.created_at)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    previousCaseId = previous?.id ?? null;
  }

  let previousCase: {
    id: string;
    document_type: string | null;
    document_date: string | null;
    created_at: string;
    detected_total_amount: number | null;
    currency: string | null;
  } | null = null;
  let previousItems: ExtractedItem[] = [];

  if (previousCaseId) {
    const [{ data: previous }, { data: oldItems }] = await Promise.all([
      supabase
        .from("cases")
        .select("id, document_type, document_date, created_at, detected_total_amount, currency")
        .eq("id", previousCaseId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("extracted_items")
        .select("id, original_label, normalized_label, category, total_price, explanation, clarification_needed, display_order")
        .eq("case_id", previousCaseId)
        .order("display_order", { ascending: true }),
    ]);
    previousCase = previous;
    previousItems = (oldItems ?? []) as ExtractedItem[];
  }

  const currentItems = (items ?? []) as ExtractedItem[];
  const comparison = previousCase ? compareItems(currentItems, previousItems) : null;
  const report = reports?.[0] ?? null;
  const questions = Array.isArray(report?.questions_to_ask) ? (report.questions_to_ask as string[]) : [];
  const factors = Array.isArray(report?.price_variation_factors) ? (report.price_variation_factors as string[]) : [];

  return (
    <main className="min-h-screen bg-[#f4f7f4] px-5 py-8 text-[#173b35] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href={pet?.id ? `/dashboard/animaux/${pet.id}` : "/dashboard"} className="text-sm font-extrabold text-[#45665f] hover:text-[#0c5b50]">
            ← Retour au dossier de {pet?.name || "l’animal"}
          </Link>
          {pet?.id && <Link href={`/analyser?pet_id=${pet.id}`} className="rounded-full bg-[#0c5b50] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#084d44]">Ajouter un autre document</Link>}
        </div>

        <section className="mt-6 rounded-[30px] bg-[#123f38] px-6 py-8 text-white shadow-[0_24px_70px_rgba(18,63,56,0.18)] sm:px-9">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#9fcfc1]">{caseRow.document_type === "facture" ? "Facture" : "Devis"} de {pet?.name || "votre animal"}</p>
              <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{documents?.[0]?.original_filename || "Document vétérinaire"}</h1>
              <p className="mt-4 text-sm text-[#c4d7d2]">{formatDate(caseRow.document_date || caseRow.created_at)} · {STATUS_LABELS[caseRow.status] ?? caseRow.status}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#a9c9c1]">Total détecté</p>
              <p className="mt-1 text-2xl font-extrabold">{formatMoney(caseRow.detected_total_amount, caseRow.currency || "EUR")}</p>
            </div>
          </div>
        </section>

        {!hasAccess && (
          <section className="mt-7 rounded-[26px] border border-[#efd5a9] bg-[#fff9ed] p-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#8c6a2d]">Rapport non débloqué</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#6d501e]">Les informations complètes restent protégées.</h2>
            <p className="mt-3 text-sm leading-6 text-[#7a6742]">Retournez à votre lien d’aperçu reçu par email pour choisir l’analyse unique à 8,90 € ou DevisVéto Plus à 6,90 €/mois.</p>
          </section>
        )}

        {hasAccess && !delivered && (
          <section className="mt-7 rounded-[26px] border border-[#bcd8ce] bg-[#edf7f3] p-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#397268]">Vérification en cours</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#174f46]">Le rapport complet est en relecture humaine.</h2>
            <p className="mt-3 text-sm leading-6 text-[#526f68]">La structure du document est déjà enregistrée dans la timeline. Les explications finales seront affichées ici après validation.</p>
          </section>
        )}

        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] lg:items-start">
          <div className="space-y-7">
            <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.06)] sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Prestations détectées</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38]">Le contenu du document</h2>
              <div className="mt-6 divide-y divide-[#e4ece9]">
                {currentItems.map((item, index) => (
                  <article key={item.id} className="py-5 first:pt-0">
                    <div className="flex items-start justify-between gap-4">
                      <div><p className="text-sm font-extrabold text-[#204f47]">{item.original_label}</p><p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#78908a]">{item.category || "Prestation"}</p></div>
                      <p className="shrink-0 text-sm font-extrabold text-[#123f38]">{formatMoney(item.total_price, caseRow.currency || "EUR")}</p>
                    </div>
                    {delivered && item.explanation ? <p className="mt-3 text-sm leading-7 text-[#617b75]">{item.explanation}</p> : index < 2 ? <p className="mt-3 text-sm leading-7 text-[#829791]">Explication visible dans l’aperçu ou après validation du rapport.</p> : <div className="mt-3 rounded-xl bg-[#f5f8f7] px-4 py-3 text-xs font-bold text-[#78908a]">Explication complète protégée</div>}
                    {delivered && item.clarification_needed && <p className="mt-3 rounded-xl bg-[#fff8f4] px-4 py-3 text-xs font-semibold leading-5 text-[#805a4c]">À clarifier : {item.clarification_needed}</p>}
                  </article>
                ))}
                {!currentItems.length && <p className="py-5 text-sm text-[#78908a]">Aucune ligne exploitable enregistrée.</p>}
              </div>
            </section>

            {hasAccess && comparison && previousCase && (
              <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.06)] sm:p-8">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Comparaison documentaire</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38]">Ce qui change depuis le document précédent</h2>
                <p className="mt-3 text-sm leading-6 text-[#6c837d]">Comparaison avec le document du {formatDate(previousCase.document_date || previousCase.created_at)}. Elle repère des différences de libellés et de montants, sans juger les choix médicaux.</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#edf7f3] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#5d8179]">Nouvelles lignes</p><p className="mt-2 text-3xl font-extrabold text-[#174f46]">{comparison.added.length}</p></div>
                  <div className="rounded-2xl bg-[#fff8f4] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#8c746b]">Lignes absentes</p><p className="mt-2 text-3xl font-extrabold text-[#805a4c]">{comparison.removed.length}</p></div>
                  <div className="rounded-2xl bg-[#f5f8f7] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#78908a]">Montants modifiés</p><p className="mt-2 text-3xl font-extrabold text-[#315f57]">{comparison.changed.length}</p></div>
                </div>

                <div className="mt-6 space-y-4">
                  {comparison.added.length > 0 && <div><h3 className="text-sm font-extrabold text-[#315f57]">Apparaît dans le nouveau document</h3><div className="mt-2 flex flex-wrap gap-2">{comparison.added.map((item) => <span key={item.id} className="rounded-full bg-[#e7f3ee] px-3 py-1.5 text-xs font-bold text-[#397268]">{item.original_label}</span>)}</div></div>}
                  {comparison.removed.length > 0 && <div><h3 className="text-sm font-extrabold text-[#315f57]">N’apparaît plus explicitement</h3><div className="mt-2 flex flex-wrap gap-2">{comparison.removed.map((item) => <span key={item.id} className="rounded-full bg-[#fff0ea] px-3 py-1.5 text-xs font-bold text-[#94624f]">{item.original_label}</span>)}</div></div>}
                  {comparison.changed.length > 0 && <div><h3 className="text-sm font-extrabold text-[#315f57]">Montants différents pour un libellé similaire</h3><div className="mt-2 space-y-2">{comparison.changed.map(({ item, before, delta }) => <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#e0e9e6] px-4 py-3 text-xs"><span className="font-bold text-[#315f57]">{item.original_label}</span><span className="text-right font-extrabold text-[#123f38]">{formatMoney(before.total_price, caseRow.currency || "EUR")} → {formatMoney(item.total_price, caseRow.currency || "EUR")} <small className="block text-[#78908a]">{delta > 0 ? "+" : ""}{formatMoney(delta, caseRow.currency || "EUR")}</small></span></div>)}</div></div>}
                  {!comparison.added.length && !comparison.removed.length && !comparison.changed.length && <p className="rounded-2xl bg-[#f5f8f7] px-4 py-4 text-sm font-semibold text-[#617b75]">Aucune différence nette n’a été détectée entre les libellés structurés.</p>}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Contexte fourni</p>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#617b75]">{caseRow.user_description || "Aucun contexte supplémentaire n’a été renseigné."}</p>
              {caseRow.primary_question && <div className="mt-4 rounded-2xl bg-[#edf6f2] px-4 py-3 text-sm font-semibold leading-6 text-[#315f57]">Question initiale : {caseRow.primary_question}</div>}
            </section>

            {delivered && report && (
              <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.07)]">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Rapport validé</p>
                <p className="mt-4 text-sm leading-7 text-[#617b75]">{report.summary}</p>
                {questions.length > 0 && <div className="mt-5 space-y-2">{questions.map((question, index) => <div key={question} className="rounded-xl bg-[#edf6f2] px-4 py-3 text-xs font-semibold leading-5 text-[#315f57]">{index + 1}. {question}</div>)}</div>}
                {factors.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{factors.map((factor) => <span key={factor} className="rounded-full bg-[#f2f6f4] px-3 py-1.5 text-[11px] font-bold text-[#617b75]">{factor}</span>)}</div>}
              </section>
            )}

            <section className="rounded-2xl border border-[#dce7e2] bg-white/75 px-5 py-4 text-xs leading-5 text-[#718780]">Cette comparaison porte uniquement sur la structure des documents. Elle ne constitue pas une recommandation médicale ni une évaluation des tarifs.</section>
          </aside>
        </div>
      </div>
    </main>
  );
}
