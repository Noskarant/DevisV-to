import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/connexion?next=/admin");
  }

  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("cases")
    .select(
      "id, status, created_at, detected_total_amount, payment_status, consent_anonymized_statistics, pets(name, species), profiles(email)"
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data: cases } = await query;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-xl font-semibold text-slate-900">Dossiers</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin"
          className={`rounded-full px-3 py-1 text-xs ${
            !status ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          Tous
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs ${
              status === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            <th className="py-2">Utilisateur</th>
            <th className="py-2">Animal</th>
            <th className="py-2">Montant détecté</th>
            <th className="py-2">Paiement</th>
            <th className="py-2">Statut</th>
            <th className="py-2">Créé le</th>
            <th className="py-2">Anonymisation</th>
          </tr>
        </thead>
        <tbody>
          {cases?.map((c) => {
            const pet = c.pets as unknown as { name: string; species: string } | null;
            const profile = c.profiles as unknown as { email: string } | null;
            return (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="py-2">
                  <Link href={`/admin/dossiers/${c.id}`} className="text-slate-900 underline">
                    {profile?.email ?? "—"}
                  </Link>
                </td>
                <td className="py-2">{pet?.name ?? "—"}</td>
                <td className="py-2">
                  {c.detected_total_amount ? `${c.detected_total_amount} €` : "—"}
                </td>
                <td className="py-2">{c.payment_status}</td>
                <td className="py-2">{c.status}</td>
                <td className="py-2">
                  {new Date(c.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="py-2">{c.consent_anonymized_statistics ? "Oui" : "Non"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
