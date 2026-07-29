import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { getBillingSummary, isSubscriptionActive } from "@/lib/billing/entitlements";
import { BillingPortalButton } from "./billing-portal-button";

const STATUS_LABELS: Record<string, string> = {
  draft: "À compléter",
  uploaded: "Document reçu",
  extraction_pending: "Lecture en cours",
  extracted: "Aperçu disponible",
  payment_pending: "Choix de l’offre",
  paid: "Rapport complet",
  review_pending: "Relecture humaine",
  needs_information: "Précision demandée",
  approved: "Rapport validé",
  delivered: "Rapport disponible",
  error: "À vérifier",
  refunded: "Dossier clôturé",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
}

function speciesLabel(species: string) {
  return species === "chien" ? "Chien" : species === "chat" ? "Chat" : "Autre animal";
}

export default async function DashboardPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/connexion?next=/dashboard");
  }

  const supabase = await createClient();
  const [{ data: pets }, { data: cases }, { data: reminders }, billing] = await Promise.all([
    supabase
      .from("pets")
      .select("id, name, species, breed, birth_date, approximate_age, weight_kg, color, photo_path, archived_at")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("cases")
      .select("id, pet_id, status, payment_status, document_type, document_title, detected_total_amount, currency, created_at, pets(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pet_reminders")
      .select("id, pet_id, title, due_date, completed_at, pets(name)")
      .eq("user_id", user.id)
      .is("completed_at", null)
      .gte("due_date", new Date().toISOString().slice(0, 10))
      .order("due_date", { ascending: true })
      .limit(5),
    getBillingSummary(user.id),
  ]);

  const caseIds = (cases ?? []).map((item) => item.id);
  const { data: previewEvents } = caseIds.length
    ? await supabase
        .from("analytics_events")
        .select("case_id, metadata")
        .eq("user_id", user.id)
        .eq("event_name", "public_preview_created")
        .in("case_id", caseIds)
    : { data: [] as Array<{ case_id: string; metadata: unknown }> };

  const tokenByCase = new Map<string, string>();
  for (const event of previewEvents ?? []) {
    const token = (event.metadata as { token?: unknown } | null)?.token;
    if (typeof token === "string" && token) tokenByCase.set(event.case_id, token);
  }

  const photoUrls = new Map<string, string>();
  await Promise.all(
    (pets ?? []).map(async (pet) => {
      if (!pet.photo_path) return;
      const { data } = await supabase.storage.from("pet-photos").createSignedUrl(pet.photo_path, 60 * 60);
      if (data?.signedUrl) photoUrls.set(pet.id, data.signedUrl);
    })
  );

  const subscriptionActive = isSubscriptionActive(billing.subscription?.status);
  const hasPets = Boolean(pets?.length);
  const casesByPet = new Map<string, NonNullable<typeof cases>>();
  for (const item of cases ?? []) {
    if (!item.pet_id) continue;
    const current = casesByPet.get(item.pet_id) ?? [];
    current.push(item);
    casesByPet.set(item.pet_id, current);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f4] px-5 py-8 text-[#173b35] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0c5b50] text-lg font-semibold text-white">DV</span>
            <div>
              <p className="text-lg font-semibold tracking-[-0.02em] text-[#123f38]">DevisVéto</p>
              <p className="text-[10px] font-semibold uppercase text-[#78908a]">Votre espace</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/parametres" className="rounded-full border border-[#cddbd6] bg-white px-4 py-2.5 text-sm font-semibold text-[#45665f] hover:bg-[#f1f6f4]">
              Paramètres
            </Link>
            <Link href="/dashboard/animaux/nouveau" className="rounded-full bg-[#0c5b50] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(12,91,80,0.2)] hover:bg-[#084d44]">
              Ajouter un animal
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="rounded-[30px] bg-[#123f38] px-6 py-8 text-white shadow-[0_24px_70px_rgba(18,63,56,0.18)] sm:px-9">
            <p className="text-xs font-semibold uppercase text-[#9fcfc1]">{hasPets ? "Votre espace" : "Pour commencer"}</p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl sm:text-5xl">
              {hasPets ? "Retrouvez vos animaux et toutes vos analyses." : "Ajoutez votre premier animal."}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#c4d7d2]">
              {hasPets
                ? "Les devis, factures, rapports payés, PDF, poids et rappels restent liés à votre compte après chaque reconnexion."
                : "Son nom et son espèce suffisent pour créer sa fiche. Vous pourrez compléter le reste plus tard."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={hasPets ? "/analyser" : "/dashboard/animaux/nouveau"} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#123f38] hover:bg-[#eef5f2]">
                {hasPets ? "Ajouter un devis ou une facture" : "Créer sa fiche"}
              </Link>
              {hasPets && (
                <span className="rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-[#d5e4e0]">
                  {pets?.length ?? 0} animal{(pets?.length ?? 0) > 1 ? "aux" : ""} · {cases?.length ?? 0} document{(cases?.length ?? 0) > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          <div className={`rounded-[30px] border p-6 shadow-[0_18px_50px_rgba(31,78,67,0.09)] ${subscriptionActive ? "border-[#acd1c5] bg-[#eaf5f1]" : "border-[#dce7e2] bg-white"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-[#5d8179]">DevisVéto Plus</p>
                <h2 className="mt-2 font-serif text-3xl text-[#123f38]">
                  {subscriptionActive ? "Votre formule est active" : "DevisVéto Plus · 6,90 €/mois"}
                </h2>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#397268] shadow-sm">
                {billing.creditBalance}/3 crédits
              </span>
            </div>
            {subscriptionActive ? (
              <>
                <p className="mt-4 text-sm leading-6 text-[#526f68]">Vous recevez un crédit chaque mois, utilisable pour n’importe lequel de vos animaux.</p>
                {billing.subscription?.current_period_end && (
                  <p className="mt-3 text-xs font-semibold text-[#78908a]">
                    Prochain renouvellement : {formatDate(billing.subscription.current_period_end)}
                    {billing.subscription.cancel_at_period_end ? " · arrêt prévu" : ""}
                  </p>
                )}
                <div className="mt-5"><BillingPortalButton /></div>
              </>
            ) : (
              <>
                <ul className="mt-4 space-y-2 text-sm font-semibold leading-6 text-[#526f68]">
                  <li>✓ Le rapport lié à votre aperçu est inclus</li>
                  <li>✓ 1 nouveau crédit chaque mois</li>
                  <li>✓ Jusqu’à 3 crédits disponibles</li>
                  <li>✓ Utilisables pour tous vos animaux</li>
                </ul>
                <p className="mt-5 text-xs leading-5 text-[#78908a]">Cette formule vous sera proposée depuis un aperçu. Vous pouvez l’arrêter à tout moment.</p>
              </>
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-[#5d8179]">Vos animaux</p>
              <h2 className="mt-2 font-serif text-3xl text-[#123f38]">Leurs fiches et leurs chronologies</h2>
            </div>
            {hasPets && <Link href="/dashboard/animaux/nouveau" className="text-sm font-semibold text-[#0c5b50]">+ Ajouter un animal</Link>}
          </div>

          {!pets?.length ? (
            <div className="mt-6 rounded-[26px] border-2 border-dashed border-[#c9ddd6] bg-white/70 px-6 py-12 text-center">
              <p className="font-serif text-3xl text-[#123f38]">Aucun animal ajouté pour l’instant.</p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#6c837d]">Vous avez seulement besoin de son nom et de son espèce.</p>
              <Link href="/dashboard/animaux/nouveau" className="mt-6 inline-flex rounded-full bg-[#0c5b50] px-5 py-3 text-sm font-semibold text-white">Ajouter mon animal</Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {pets.map((pet) => {
                const petCases = casesByPet.get(pet.id) ?? [];
                const latest = petCases[0];
                const photoUrl = photoUrls.get(pet.id);
                return (
                  <Link key={pet.id} href={`/dashboard/animaux/${pet.id}`} className="group rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.06)] transition hover:-translate-y-1 hover:border-[#9fc9bc] hover:shadow-[0_20px_55px_rgba(31,78,67,0.12)]">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        role="img"
                        aria-label={`Photo de ${pet.name}`}
                        className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#e7f3ee] bg-cover bg-center text-2xl font-semibold text-[#245f55]"
                        style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}
                      >
                        {!photoUrl && (pet.species === "chien" ? "🐕" : pet.species === "chat" ? "🐈" : "🐾")}
                      </div>
                      <span className="rounded-full bg-[#f2f6f4] px-3 py-1 text-[11px] font-semibold text-[#5d8179]">{petCases.length} document{petCases.length > 1 ? "s" : ""}</span>
                    </div>
                    <h3 className="mt-5 font-serif text-3xl text-[#123f38] group-hover:text-[#0c5b50]">{pet.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-[#78908a]">{[speciesLabel(pet.species), pet.breed].filter(Boolean).join(" · ")}</p>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-[#f5f8f7] px-3 py-2.5">
                        <p className="text-[9px] font-semibold uppercase text-[#8a9e99]">Poids</p>
                        <p className="mt-1 text-sm font-semibold text-[#315f57]">{pet.weight_kg ? `${Number(pet.weight_kg)} kg` : "À renseigner"}</p>
                      </div>
                      <div className="rounded-xl bg-[#f5f8f7] px-3 py-2.5">
                        <p className="text-[9px] font-semibold uppercase text-[#8a9e99]">Dernier document</p>
                        <p className="mt-1 truncate text-sm font-semibold text-[#315f57]">{latest?.document_title || (latest ? STATUS_LABELS[latest.status] ?? latest.status : "Aucun document")}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-8 grid gap-7 lg:grid-cols-2">
          <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.06)]">
            <p className="text-xs font-semibold uppercase text-[#5d8179]">Documents récents</p>
            <h2 className="mt-2 font-serif text-2xl text-[#123f38]">Vos dernières analyses</h2>
            <div className="mt-5 space-y-3">
              {(cases ?? []).slice(0, 5).map((item) => {
                const relation = item.pets as unknown as { name: string } | Array<{ name: string }> | null;
                const petName = Array.isArray(relation) ? relation[0]?.name : relation?.name;
                const token = tokenByCase.get(item.id);
                const href = token ? `/apercu/${token}` : `/dashboard/dossiers/${item.id}`;
                const paid = item.payment_status === "succeeded";
                return (
                  <Link key={item.id} href={href} className="flex items-center justify-between gap-4 rounded-2xl border border-[#e0e9e6] px-4 py-3 hover:border-[#a9cec2]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#315f57]">{item.document_title || (item.document_type === "facture" ? "Facture vétérinaire" : "Devis vétérinaire")}</p>
                      <p className="mt-1 text-xs text-[#78908a]">{petName || "Animal"} · {formatDate(item.created_at)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${paid ? "bg-[#dff0ea] text-[#28695e]" : "bg-[#edf6f2] text-[#397268]"}`}>
                      {paid ? "Complet" : STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </Link>
                );
              })}
              {!cases?.length && <p className="text-sm text-[#78908a]">Vous n’avez encore ajouté aucun document.</p>}
            </div>
          </section>

          <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.06)]">
            <p className="text-xs font-semibold uppercase text-[#5d8179]">À venir</p>
            <h2 className="mt-2 font-serif text-2xl text-[#123f38]">Prochains rappels</h2>
            <div className="mt-5 space-y-3">
              {(reminders ?? []).map((reminder) => {
                const relation = reminder.pets as unknown as { name: string } | Array<{ name: string }> | null;
                const petName = Array.isArray(relation) ? relation[0]?.name : relation?.name;
                return (
                  <Link key={reminder.id} href={`/dashboard/animaux/${reminder.pet_id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-[#e0e9e6] px-4 py-3 hover:border-[#a9cec2]">
                    <div>
                      <p className="text-sm font-semibold text-[#315f57]">{reminder.title}</p>
                      <p className="mt-1 text-xs text-[#78908a]">{petName || "Animal"}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#9b664e]">{formatDate(reminder.due_date)}</span>
                  </Link>
                );
              })}
              {!reminders?.length && <p className="text-sm text-[#78908a]">Aucun rappel à venir.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
