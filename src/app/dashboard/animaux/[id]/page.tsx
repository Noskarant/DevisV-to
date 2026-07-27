import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PetForm } from "../pet-form";
import {
  addReminderAction,
  addWeightAction,
  archivePetAction,
  completeReminderAction,
  updatePetAction,
} from "../actions";

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

function formatMoney(amount: number | null, currency = "EUR") {
  if (amount === null || !Number.isFinite(Number(amount))) return null;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(Number(amount));
}

function formatDate(value?: string | null) {
  if (!value) return "Non renseigné";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
}

function InfoBlock({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-2xl bg-[#f5f8f7] px-4 py-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#78908a]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#315f57]">{value || "Non renseigné"}</p>
    </div>
  );
}

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/connexion?next=/dashboard");
  }

  const { id } = await params;
  const supabase = await createClient();
  const [{ data: pet }, { data: cases }, { data: reminders }, { data: weights }] = await Promise.all([
    supabase.from("pets").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
    supabase
      .from("cases")
      .select(
        "id, status, document_type, detected_total_amount, currency, created_at, document_date, user_description, payment_status, entitlement_source, case_documents(original_filename)"
      )
      .eq("pet_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pet_reminders")
      .select("id, title, due_date, notes, completed_at")
      .eq("pet_id", id)
      .eq("user_id", user.id)
      .order("due_date", { ascending: true }),
    supabase
      .from("pet_weight_entries")
      .select("id, weight_kg, recorded_at, notes")
      .eq("pet_id", id)
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(20),
  ]);

  if (!pet || pet.archived_at) notFound();

  const upcomingReminders = (reminders ?? []).filter((reminder) => !reminder.completed_at);
  const completedReminders = (reminders ?? []).filter((reminder) => reminder.completed_at);
  const latestWeight = weights?.[0] ? Number(weights[0].weight_kg) : pet.weight_kg ? Number(pet.weight_kg) : null;
  const previousWeight = weights?.[1] ? Number(weights[1].weight_kg) : null;
  const weightDelta = latestWeight !== null && previousWeight !== null ? latestWeight - previousWeight : null;

  return (
    <main className="min-h-screen bg-[#f4f7f4] px-5 py-8 text-[#173b35] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard" className="text-sm font-extrabold text-[#45665f] hover:text-[#0c5b50]">
            ← Tous mes animaux
          </Link>
          <Link
            href={`/analyser?pet_id=${pet.id}`}
            className="rounded-full bg-[#0c5b50] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_28px_rgba(12,91,80,0.2)] hover:bg-[#084d44]"
          >
            Ajouter un document
          </Link>
        </div>

        <section className="mt-6 overflow-hidden rounded-[30px] bg-[#123f38] text-white shadow-[0_24px_70px_rgba(18,63,56,0.18)]">
          <div className="grid gap-6 px-6 py-8 sm:px-9 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold text-[#d5e4e0]">
                  {pet.species === "chien" ? "Chien" : pet.species === "chat" ? "Chat" : "Autre animal"}
                </span>
                {pet.breed && <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold text-[#d5e4e0]">{pet.breed}</span>}
              </div>
              <h1 className="mt-4 font-serif text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">{pet.name}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#c4d7d2]">
                Son dossier rassemble ses informations déclarées, ses devis, ses factures, ses rappels et l’évolution de son poids.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#a9c9c1]">Documents</p>
                <p className="mt-1 text-2xl font-extrabold">{cases?.length ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#a9c9c1]">Poids</p>
                <p className="mt-1 text-2xl font-extrabold">{latestWeight ? `${latestWeight} kg` : "—"}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#a9c9c1]">Rappels</p>
                <p className="mt-1 text-2xl font-extrabold">{upcomingReminders.length}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:items-start">
          <div className="space-y-7">
            <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.06)] sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Timeline documentaire</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38]">Son historique, dans l’ordre.</h2>

              {!cases?.length ? (
                <div className="mt-6 rounded-2xl border border-dashed border-[#cbded7] bg-[#f7faf9] px-5 py-8 text-center">
                  <p className="text-sm font-bold text-[#526f68]">Aucun document dans ce dossier.</p>
                  <Link href={`/analyser?pet_id=${pet.id}`} className="mt-4 inline-flex rounded-full bg-[#0c5b50] px-4 py-2.5 text-sm font-extrabold text-white">
                    Analyser son premier document
                  </Link>
                </div>
              ) : (
                <div className="mt-7 space-y-4">
                  {cases.map((caseRow, index) => {
                    const documents = caseRow.case_documents as unknown as Array<{ original_filename: string }> | null;
                    const amount = formatMoney(caseRow.detected_total_amount, caseRow.currency || "EUR");
                    return (
                      <div key={caseRow.id} className="relative pl-8">
                        {index < cases.length - 1 && <div className="absolute left-[10px] top-7 h-[calc(100%+16px)] w-px bg-[#d6e4df]" />}
                        <span className="absolute left-0 top-2 h-5 w-5 rounded-full border-4 border-white bg-[#0c5b50] shadow" />
                        <Link href={`/dashboard/dossiers/${caseRow.id}`} className="block rounded-2xl border border-[#dce7e2] bg-[#fbfcfc] p-5 transition hover:border-[#9dc7ba] hover:bg-white">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-extrabold text-[#204f47]">
                                {caseRow.document_type === "facture" ? "Facture vétérinaire" : "Devis vétérinaire"}
                              </p>
                              <p className="mt-1 text-xs text-[#78908a]">
                                {formatDate(caseRow.document_date || caseRow.created_at)}
                                {documents?.[0]?.original_filename ? ` · ${documents[0].original_filename}` : ""}
                              </p>
                            </div>
                            <div className="text-right">
                              {amount && <p className="text-sm font-extrabold text-[#123f38]">{amount}</p>}
                              <span className="mt-1 inline-flex rounded-full bg-[#e8f3ef] px-3 py-1 text-[11px] font-extrabold text-[#397268]">
                                {STATUS_LABELS[caseRow.status] ?? caseRow.status}
                              </span>
                            </div>
                          </div>
                          {caseRow.user_description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#647d77]">{caseRow.user_description}</p>}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.06)] sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Informations enregistrées</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38]">Une vue claire de son contexte.</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoBlock label="Naissance" value={pet.birth_date ? formatDate(pet.birth_date) : pet.approximate_age} />
                <InfoBlock label="Sexe" value={pet.sex === "male" ? "Mâle" : pet.sex === "femelle" ? "Femelle" : null} />
                <InfoBlock label="Identification" value={pet.identification_number} />
                <InfoBlock label="Stérilisation" value={pet.sterilized === true ? "Oui" : pet.sterilized === false ? "Non" : null} />
                <InfoBlock label="Allergies" value={pet.allergies} />
                <InfoBlock label="Affections / antécédents" value={pet.chronic_conditions} />
                <InfoBlock label="Traitements actuels" value={pet.current_treatments} />
                <InfoBlock label="Alimentation" value={pet.diet_notes} />
                <InfoBlock label="Comportement" value={pet.behavior_notes} />
                <InfoBlock label="Clinique habituelle" value={[pet.veterinarian_name, pet.veterinarian_phone].filter(Boolean).join(" · ")} />
                <InfoBlock label="Assurance" value={[pet.insurance_provider, pet.insurance_contract].filter(Boolean).join(" · ")} />
                <InfoBlock label="Notes" value={pet.general_notes} />
              </div>
            </section>

            <details className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.06)] sm:p-8">
              <summary className="cursor-pointer list-none">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Modifier le dossier</p>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <h2 className="font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38]">Mettre ses informations à jour</h2>
                  <span className="rounded-full bg-[#edf6f2] px-3 py-1.5 text-xs font-extrabold text-[#397268]">Ouvrir</span>
                </div>
              </summary>
              <div className="mt-7">
                <PetForm pet={pet} action={updatePetAction} submitLabel="Enregistrer les modifications" />
              </div>
            </details>
          </div>

          <aside className="space-y-7 lg:sticky lg:top-6">
            <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.08)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Suivi du poids</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="font-serif text-4xl font-semibold tracking-[-0.045em] text-[#123f38]">{latestWeight ? `${latestWeight} kg` : "—"}</p>
                  {weightDelta !== null && (
                    <p className={`mt-1 text-xs font-bold ${weightDelta > 0 ? "text-[#a56247]" : weightDelta < 0 ? "text-[#397268]" : "text-[#78908a]"}`}>
                      {weightDelta > 0 ? "+" : ""}{weightDelta.toFixed(2)} kg depuis la mesure précédente
                    </p>
                  )}
                </div>
              </div>

              <form action={addWeightAction} className="mt-5 space-y-3 rounded-2xl bg-[#f5f8f7] p-4">
                <input type="hidden" name="pet_id" value={pet.id} />
                <div className="grid grid-cols-2 gap-3">
                  <input required type="number" min="0.1" max="299" step="0.01" name="weight_kg" placeholder="Poids en kg" className="rounded-xl border border-[#ccdcd6] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#65a391]" />
                  <input required type="date" name="recorded_at" defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-xl border border-[#ccdcd6] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#65a391]" />
                </div>
                <input name="notes" placeholder="Note facultative" className="w-full rounded-xl border border-[#ccdcd6] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#65a391]" />
                <button className="w-full rounded-full bg-[#123f38] px-4 py-2.5 text-sm font-extrabold text-white">Ajouter la mesure</button>
              </form>

              {weights?.length ? (
                <div className="mt-5 space-y-2">
                  {weights.slice(0, 6).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-xl border border-[#e1eae7] px-3 py-2.5 text-sm">
                      <span className="text-[#6c837d]">{formatDate(entry.recorded_at)}</span>
                      <strong className="text-[#315f57]">{Number(entry.weight_kg)} kg</strong>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="rounded-[26px] border border-[#dce7e2] bg-white p-6 shadow-[0_14px_40px_rgba(31,78,67,0.08)]">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Rappels documentaires</p>
              <h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.035em] text-[#123f38]">Les prochaines dates utiles.</h2>

              <form action={addReminderAction} className="mt-5 space-y-3 rounded-2xl bg-[#f5f8f7] p-4">
                <input type="hidden" name="pet_id" value={pet.id} />
                <input required name="title" maxLength={180} placeholder="Ex. contrôle postopératoire" className="w-full rounded-xl border border-[#ccdcd6] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#65a391]" />
                <input required type="date" name="due_date" className="w-full rounded-xl border border-[#ccdcd6] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#65a391]" />
                <textarea name="notes" rows={2} placeholder="Précision facultative" className="w-full resize-none rounded-xl border border-[#ccdcd6] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#65a391]" />
                <button className="w-full rounded-full bg-[#123f38] px-4 py-2.5 text-sm font-extrabold text-white">Créer le rappel</button>
              </form>

              <div className="mt-5 space-y-3">
                {upcomingReminders.length ? upcomingReminders.map((reminder) => (
                  <div key={reminder.id} className="rounded-2xl border border-[#dce7e2] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-[#315f57]">{reminder.title}</p>
                        <p className="mt-1 text-xs font-bold text-[#78908a]">{formatDate(reminder.due_date)}</p>
                      </div>
                      <form action={completeReminderAction}>
                        <input type="hidden" name="pet_id" value={pet.id} />
                        <input type="hidden" name="reminder_id" value={reminder.id} />
                        <button className="rounded-full bg-[#e8f3ef] px-3 py-1.5 text-[11px] font-extrabold text-[#397268]">Fait</button>
                      </form>
                    </div>
                    {reminder.notes && <p className="mt-2 text-xs leading-5 text-[#6c837d]">{reminder.notes}</p>}
                  </div>
                )) : <p className="text-sm text-[#78908a]">Aucun rappel à venir.</p>}
              </div>

              {completedReminders.length > 0 && (
                <p className="mt-4 text-xs font-semibold text-[#8a9e99]">{completedReminders.length} rappel{completedReminders.length > 1 ? "s" : ""} terminé{completedReminders.length > 1 ? "s" : ""}</p>
              )}
            </section>

            <form action={archivePetAction} className="rounded-2xl border border-[#ecd8d1] bg-[#fff8f5] p-4">
              <input type="hidden" name="pet_id" value={pet.id} />
              <p className="text-xs leading-5 text-[#805a4c]">Archiver masque le dossier sans supprimer les documents associés.</p>
              <button className="mt-3 text-xs font-extrabold text-[#9b4f38]">Archiver ce dossier</button>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}
