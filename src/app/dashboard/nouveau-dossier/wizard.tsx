"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPetAction,
  createDraftCaseAction,
  updateSituationAction,
  updateConsentsAction,
} from "./actions";

type Step = "animal" | "situation" | "upload" | "consentement" | "apercu" | "envoi";

const STEPS: Step[] = ["animal", "situation", "upload", "consentement", "apercu", "envoi"];
const STEP_LABELS: Record<Step, string> = {
  animal: "Votre animal",
  situation: "La situation",
  upload: "Le document",
  consentement: "Consentements",
  apercu: "Aperçu gratuit",
  envoi: "Récapitulatif",
};

export function Wizard() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // form state
  const [pet, setPet] = useState({
    name: "",
    species: "chien" as "chien" | "chat" | "autre",
    sex: "inconnu" as "male" | "femelle" | "inconnu",
  });
  const [situation, setSituation] = useState({
    document_type: "devis" as const,
    emergency_context: false,
    user_description: "",
    primary_question: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [consents, setConsents] = useState({
    consent_data_processing: false,
    consent_anonymized_statistics: false,
    consent_anonymized_content: false,
  });

  const step = STEPS[stepIndex];

  async function goNext() {
    setError(null);
    setLoading(true);
    try {
      if (step === "animal") {
        const petId = await createPetAction(pet);
        const newCaseId = await createDraftCaseAction(petId);
        setCaseId(newCaseId);
      } else if (step === "situation" && caseId) {
        await updateSituationAction(caseId, situation);
      } else if (step === "upload" && caseId) {
        if (!file) throw new Error("Merci d'ajouter votre document.");
        const formData = new FormData();
        formData.append("file", file);
        formData.append("case_id", caseId);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Échec de l'envoi du document.");
      } else if (step === "consentement" && caseId) {
        if (!consents.consent_data_processing) {
          throw new Error("Le consentement au traitement du document est obligatoire.");
        }
        await updateConsentsAction(caseId, consents as { consent_data_processing: true } & typeof consents);
      } else if (step === "envoi" && caseId) {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ case_id: caseId, product_type: "single" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Échec du paiement.");
        router.push(data.url.replace(process.env.NEXT_PUBLIC_APP_URL ?? "", ""));
        return;
      }
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              i <= stepIndex ? "bg-slate-900" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <h1 className="text-xl font-semibold text-slate-900">{STEP_LABELS[step]}</h1>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6 space-y-4">
        {step === "animal" && (
          <>
            <input
              placeholder="Prénom de l'animal"
              value={pet.name}
              onChange={(e) => setPet({ ...pet, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
            />
            <select
              value={pet.species}
              onChange={(e) => setPet({ ...pet, species: e.target.value as never })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
            >
              <option value="chien">Chien</option>
              <option value="chat">Chat</option>
              <option value="autre">Autre</option>
            </select>
          </>
        )}

        {step === "situation" && (
          <>
            <select
              value={situation.document_type}
              onChange={(e) =>
                setSituation({ ...situation, document_type: e.target.value as never })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
            >
              <option value="devis">Devis</option>
              <option value="facture">Facture</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={situation.emergency_context}
                onChange={(e) =>
                  setSituation({ ...situation, emergency_context: e.target.checked })
                }
              />
              Il s&apos;agit d&apos;une urgence
            </label>
            <textarea
              placeholder="Ce que le vétérinaire vous a expliqué (facultatif)"
              value={situation.user_description}
              onChange={(e) =>
                setSituation({ ...situation, user_description: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
              rows={3}
            />
            <input
              placeholder="Votre question principale (facultatif)"
              value={situation.primary_question}
              onChange={(e) =>
                setSituation({ ...situation, primary_question: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
            />
          </>
        )}

        {step === "upload" && (
          <div>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.heic"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm"
            />
            <p className="mt-2 text-xs text-slate-500">
              Formats acceptés : PDF, JPG, PNG, HEIC — 15 Mo maximum.
            </p>
            {file && <p className="mt-2 text-sm text-slate-700">{file.name}</p>}
          </div>
        )}

        {step === "consentement" && (
          <div className="space-y-3 text-sm text-slate-700">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={consents.consent_data_processing}
                onChange={(e) =>
                  setConsents({ ...consents, consent_data_processing: e.target.checked })
                }
              />
              <span>
                J&apos;accepte que mon document soit traité pour produire l&apos;analyse
                (obligatoire).
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={consents.consent_anonymized_statistics}
                onChange={(e) =>
                  setConsents({
                    ...consents,
                    consent_anonymized_statistics: e.target.checked,
                  })
                }
              />
              <span>
                J&apos;accepte l&apos;utilisation anonymisée des informations tarifaires
                pour améliorer le service (facultatif).
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={consents.consent_anonymized_content}
                onChange={(e) =>
                  setConsents({ ...consents, consent_anonymized_content: e.target.checked })
                }
              />
              <span>
                J&apos;accepte l&apos;utilisation anonymisée de mon cas dans du contenu
                pédagogique (facultatif).
              </span>
            </label>
          </div>
        )}

        {step === "apercu" && (
          <div className="space-y-3 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">
              Votre document est en cours de lecture.
            </p>
            <p>
              L&apos;extraction complète (type d&apos;intervention, lignes détaillées) sera
              disponible une fois l&apos;analyse IA branchée. Le paiement débloque le rapport
              complet, relu par un administrateur avant envoi.
            </p>
          </div>
        )}

        {step === "envoi" && (
          <div className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <p>Analyse unique — 6,90 €</p>
            <p className="mt-1 text-xs text-slate-500">
              Après paiement, votre document est mis en analyse puis relu par un
              administrateur avant envoi.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={goNext}
        disabled={loading}
        className="mt-8 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading
          ? "Veuillez patienter..."
          : step === "envoi"
          ? "Recevoir l'explication complète — 6,90 €"
          : "Continuer"}
      </button>
    </div>
  );
}
