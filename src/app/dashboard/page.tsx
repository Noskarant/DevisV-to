import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  uploaded: "Document reçu",
  extraction_pending: "Extraction en cours",
  extracted: "Extraction terminée",
  payment_pending: "Paiement en attente",
  paid: "Payé — analyse en cours",
  review_pending: "Vérification en cours",
  needs_information: "Information complémentaire nécessaire",
  approved: "Validé",
  delivered: "Rapport disponible",
  error: "Erreur",
  refunded: "Remboursé",
};

export default async function DashboardPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/connexion?next=/dashboard");
  }

  const supabase = await createClient();
  const { data: cases } = await supabase
    .from("cases")
    .select("id, status, created_at, pets(name)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Mes dossiers</h1>
        <Link
          href="/dashboard/nouveau-dossier"
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Nouveau dossier
        </Link>
      </div>

      {!cases?.length && (
        <p className="mt-8 text-sm text-slate-500">
          Vous n&apos;avez pas encore de dossier. Envoyez votre premier devis.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {cases?.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/dossiers/${c.id}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-300"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {(c.pets as unknown as { name: string } | null)?.name ?? "Animal"}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(c.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              {STATUS_LABELS[c.status] ?? c.status}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
