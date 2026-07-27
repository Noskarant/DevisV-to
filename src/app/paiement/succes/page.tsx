import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PaiementSuccesPage({
  searchParams,
}: {
  searchParams: Promise<{ case_id?: string }>;
}) {
  const { case_id } = await searchParams;
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/connexion");
  }

  if (!case_id) redirect("/dashboard");

  const supabase = await createClient();
  // La preuve de paiement vient toujours de la base (mise à jour par le webhook
  // ou le mode mock), jamais du simple retour de navigation sur cette page.
  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, status, payment_status")
    .eq("id", case_id)
    .eq("user_id", user!.id)
    .single();

  const isPaid = caseRow?.payment_status === "succeeded";

  return (
    <main className="mx-auto max-w-md px-6 py-16 text-center">
      {isPaid ? (
        <>
          <h1 className="text-2xl font-semibold text-slate-900">Paiement confirmé</h1>
          <p className="mt-3 text-sm text-slate-600">
            Votre document est en cours d&apos;analyse. Vous recevrez un email dès que
            votre rapport sera prêt.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold text-slate-900">
            Paiement en cours de vérification
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Nous confirmons votre paiement, cela peut prendre quelques instants.
          </p>
        </>
      )}
      <Link
        href="/dashboard"
        className="mt-8 inline-block rounded-full bg-slate-900 px-6 py-2.5 text-sm font-medium text-white"
      >
        Suivre mon dossier
      </Link>
    </main>
  );
}
