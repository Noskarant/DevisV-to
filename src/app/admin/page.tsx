import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type CaseRow = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  document_title: string | null;
  document_type: string | null;
  detected_total_amount: number | null;
  payment_status: string | null;
  entitlement_source: string | null;
  consent_anonymized_statistics: boolean | null;
  pets: { name: string | null; species: string | null } | null;
  profiles: { email: string | null } | null;
};

type RawCaseRow = Omit<CaseRow, "pets" | "profiles"> & {
  pets: { name: string | null; species: string | null } | { name: string | null; species: string | null }[] | null;
  profiles: { email: string | null } | { email: string | null }[] | null;
};

const ALL_STATUSES = [
  "draft",
  "uploaded",
  "extraction_pending",
  "extracted",
  "payment_pending",
  "paid",
  "review_pending",
  "needs_information",
  "approved",
  "delivered",
  "error",
  "refunded",
];

const ATTENTION_STATUSES = new Set(["paid", "review_pending", "needs_information", "error"]);

function formatCurrency(amount: number | null) {
  if (!amount) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "error") return "bg-red-50 text-red-700 ring-red-200";
  if (status === "review_pending" || status === "needs_information") return "bg-amber-50 text-amber-800 ring-amber-200";
  if (status === "delivered" || status === "approved") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "paid") return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/connexion?next=/admin");
  }

  const { status, q } = await searchParams;
  const searchTerm = q?.trim().toLowerCase() ?? "";
  const supabase = await createClient();

  let query = supabase
    .from("cases")
    .select(
      "id, status, created_at, updated_at, document_title, document_type, detected_total_amount, payment_status, entitlement_source, consent_anonymized_statistics, pets(name, species), profiles(email)"
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data: cases } = await query.limit(250);
  const rows = ((cases ?? []) as unknown as RawCaseRow[]).map((c) => ({
    ...c,
    pets: firstRelation(c.pets),
    profiles: firstRelation(c.profiles),
  }));
  const filteredRows = searchTerm
    ? rows.filter((c) =>
        [
          c.profiles?.email,
          c.pets?.name,
          c.pets?.species,
          c.document_title,
          c.document_type,
          c.status,
          c.payment_status,
          c.id,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchTerm))
      )
    : rows;

  const stats = {
    total: filteredRows.length,
    paid: filteredRows.filter((c) => c.payment_status === "paid").length,
    toReview: filteredRows.filter((c) => c.status === "review_pending" || c.status === "paid").length,
    blocked: filteredRows.filter((c) => c.status === "error" || c.status === "needs_information").length,
  };

  const statusLinks = ALL_STATUSES.map((s) => ({
    status: s,
    count: rows.filter((c) => c.status === s).length,
  })).filter((item) => item.count > 0 || item.status === status);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Administration</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Dossiers clients</h1>
          <p className="mt-2 text-sm text-slate-600">Les 250 derniers dossiers, filtrables par statut, email, animal ou document.</p>
        </div>
        <Link href="/dashboard" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Retour espace
        </Link>
      </div>

      <section className="mt-7 grid gap-3 sm:grid-cols-4">
        {[
          ["Total affiché", stats.total],
          ["Paiements OK", stats.paid],
          ["À relire", stats.toReview],
          ["Bloqués", stats.blocked],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <form className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher email, animal, document, ID..."
          className="min-h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none ring-slate-900/10 focus:ring-4"
        />
        <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Rechercher
        </button>
        {status || q ? (
          <Link href="/admin" className="rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Réinitialiser
          </Link>
        ) : null}
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={q ? `/admin?q=${encodeURIComponent(q)}` : "/admin"}
          className={`rounded-full px-3 py-1 text-xs ${
            !status ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Tous <span className="opacity-70">{rows.length}</span>
        </Link>
        {statusLinks.map(({ status: s, count }) => (
          <Link
            key={s}
            href={`/admin?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full px-3 py-1 text-xs ${
              status === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {s} <span className="opacity-70">{count}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Animal</th>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Paiement</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Dernière activité</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((c) => {
              const needsAttention = ATTENTION_STATUSES.has(c.status);
              return (
                <tr key={c.id} className={`border-t border-slate-100 ${needsAttention ? "bg-amber-50/30" : "hover:bg-slate-50"}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{c.profiles?.email ?? "—"}</p>
                    <p className="mt-1 font-mono text-[11px] text-slate-400">{c.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{c.pets?.name ?? "—"}</p>
                    <p className="mt-1 text-xs text-slate-500">{c.pets?.species ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-[220px] truncate font-medium text-slate-800">{c.document_title ?? "Document sans titre"}</p>
                    <p className="mt-1 text-xs text-slate-500">{c.document_type ?? "type non détecté"}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(c.detected_total_amount)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{c.payment_status ?? "—"}</p>
                    <p className="mt-1 text-xs text-slate-500">{c.entitlement_source ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(c.updated_at ?? c.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/dossiers/${c.id}`} className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                  Aucun dossier ne correspond à ces filtres.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
