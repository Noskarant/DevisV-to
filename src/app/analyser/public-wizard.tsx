"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Species = "chien" | "chat" | "autre";
type DocumentType = "devis" | "facture";

type InitialPet = {
  id: string;
  name: string;
  species: Species;
  email?: string | null;
};

const steps = ["Le document", "Votre animal", "Votre email"];
const processingLabels = [
  "Lecture du document",
  "Repérage des prestations",
  "Explication des premières lignes",
  "Préparation des questions utiles",
  "Création de votre aperçu privé",
];

function FileIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" viewBox="0 0 24 24" fill="none">
      <path d="M6 3.5h8l4 4V20H6V3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3.5V8h4M9 12h6M9 15.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function PublicWizard({ initialPet = null }: { initialPet?: InitialPet | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [petName, setPetName] = useState(initialPet?.name ?? "");
  const [species, setSpecies] = useState<Species>(initialPet?.species ?? "chien");
  const [documentType, setDocumentType] = useState<DocumentType>("devis");
  const [emergency, setEmergency] = useState(false);
  const [description, setDescription] = useState("");
  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState(initialPet?.email ?? "");
  const [consent, setConsent] = useState(false);
  const [statisticsConsent, setStatisticsConsent] = useState(false);
  const [contentConsent, setContentConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(0);

  function selectFile(selected?: File) {
    setError(null);
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) {
      setError("Choisissez un document de moins de 10 Mo.");
      return;
    }
    setFile(selected);
  }

  function nextStep() {
    setError(null);
    if (step === 0 && !file) {
      setError("Ajoutez le devis ou la facture pour continuer.");
      return;
    }
    if (step === 1 && !petName.trim()) {
      setError("Indiquez le nom de votre animal.");
      return;
    }
    setStep((current) => Math.min(current + 1, 2));
  }

  async function submit() {
    setError(null);
    if (!file || !petName.trim()) return;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Saisissez une adresse email valide.");
      return;
    }
    if (!consent) {
      setError("Autorisez la lecture du document pour créer votre aperçu.");
      return;
    }

    setProcessing(true);
    setProcessingIndex(0);
    const timer = window.setInterval(() => {
      setProcessingIndex((current) => Math.min(current + 1, processingLabels.length - 1));
    }, 1400);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", email.trim());
      formData.append("pet_name", petName.trim());
      formData.append("species", species);
      formData.append("document_type", documentType);
      formData.append("emergency_context", String(emergency));
      formData.append("user_description", description.trim());
      formData.append("primary_question", question.trim());
      formData.append("consent_data_processing", String(consent));
      formData.append("consent_anonymized_statistics", String(statisticsConsent));
      formData.append("consent_anonymized_content", String(contentConsent));
      if (initialPet?.id) formData.append("pet_id", initialPet.id);

      const response = await fetch("/api/public/analyse", { method: "POST", body: formData });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "Votre aperçu n’a pas pu être préparé.");
      window.clearInterval(timer);
      router.push(payload.url);
    } catch (caught) {
      window.clearInterval(timer);
      setProcessing(false);
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue. Réessayez dans quelques instants.");
    }
  }

  if (processing) {
    return (
      <div className="flex min-h-[560px] flex-col items-center justify-center px-2 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#e7f3ee] text-[#0c5b50]">
          <div className="absolute inset-0 animate-ping rounded-full border border-[#83b9aa]/40" />
          <FileIcon />
        </div>
        <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.15em] text-[#5d8179]">Votre aperçu se prépare</p>
        <h2 className="mt-3 font-serif text-3xl font-semibold tracking-[-0.035em] text-[#123f38] sm:text-4xl">
          Nous rendons le document de {petName} plus facile à comprendre.
        </h2>
        <p className="mt-4 max-w-md text-sm leading-6 text-[#6c837d]">
          Les éléments incertains restent clairement signalés. Aucune conclusion médicale n’est ajoutée.
        </p>

        <div className="mt-9 w-full max-w-md space-y-3 text-left">
          {processingLabels.map((label, index) => {
            const completed = index < processingIndex;
            const active = index === processingIndex;
            return (
              <div key={label} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                active
                  ? "border-[#9bcabc] bg-[#edf7f3] text-[#174f46]"
                  : completed
                    ? "border-[#e1ece8] bg-white text-[#4e7169]"
                    : "border-transparent bg-[#f6f8f7] text-[#9aaba7]"
              }`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  completed ? "bg-[#0c5b50] text-white" : active ? "bg-white text-[#0c5b50]" : "bg-[#e7ecea]"
                }`}>
                  {completed ? "✓" : index + 1}
                </span>
                {label}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const primaryLabel = step === 0
    ? "Continuer avec ce document"
    : step === 1
      ? "Continuer vers l’aperçu"
      : "Voir mon aperçu gratuit";

  return (
    <div>
      {initialPet && (
        <div className="mb-7 flex items-center justify-between gap-4 rounded-2xl border border-[#bcd8ce] bg-[#edf7f3] px-4 py-3.5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5d8179]">Ajouté à la fiche de</p>
            <p className="mt-1 text-sm font-extrabold text-[#174f46]">{initialPet.name}</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-[#397268]">Suivi activé</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {steps.map((label, index) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
              index <= step ? "bg-[#0c5b50] text-white" : "bg-[#edf1ef] text-[#8ba09b]"
            }`}>
              {index + 1}
            </span>
            <span className={`hidden text-xs font-bold sm:block ${index <= step ? "text-[#315f57]" : "text-[#9aaba7]"}`}>
              {label}
            </span>
            {index < steps.length - 1 && <span className="ml-auto hidden h-px flex-1 bg-[#dce7e2] sm:block" />}
          </div>
        ))}
      </div>

      <div className="mt-9">
        {step === 0 && (
          <section>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Étape 1 sur 3</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38] sm:text-4xl">Ajoutez le devis ou la facture.</h2>
            <p className="mt-3 text-sm leading-6 text-[#6c837d]">Une photo nette ou le PDF transmis par la clinique suffit.</p>

            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,application/pdf,image/jpeg,image/png,image/heic" className="hidden" onChange={(event) => selectFile(event.target.files?.[0])} />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                selectFile(event.dataTransfer.files?.[0]);
              }}
              className="mt-7 flex w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#b9d4ca] bg-[#f5faf8] px-6 py-12 text-center transition hover:border-[#72a998] hover:bg-[#eff8f4]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#0c5b50] shadow-sm"><FileIcon /></span>
              <span className="mt-4 text-base font-extrabold text-[#174f46]">{file ? "Choisir un autre document" : "Choisir ou déposer le document"}</span>
              <span className="mt-1 text-xs text-[#78908a]">PDF, JPG, PNG ou HEIC · 10 Mo maximum</span>
            </button>

            {file && (
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#dce9e4] bg-white px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#244f47]">{file.name}</p>
                  <p className="mt-0.5 text-xs text-[#829791]">{formatFileSize(file.size)}</p>
                </div>
                <span className="ml-3 rounded-full bg-[#e6f3ee] px-3 py-1 text-xs font-bold text-[#397268]">Prêt à lire</span>
              </div>
            )}
            <p className="mt-4 text-center text-xs leading-5 text-[#879a95]">Document privé · Informations sensibles retirées avant l’analyse textuelle</p>
          </section>
        )}

        {step === 1 && (
          <section>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Étape 2 sur 3</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38] sm:text-4xl">Parlez-nous simplement de votre animal.</h2>
            <p className="mt-3 text-sm leading-6 text-[#6c837d]">Son nom suffit pour personnaliser l’aperçu. Les autres précisions sont facultatives.</p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-bold text-[#315f57]">Nom de votre animal</span>
                <input value={petName} onChange={(event) => setPetName(event.target.value)} readOnly={Boolean(initialPet)} placeholder="Ex. Nala" className="mt-2 w-full rounded-2xl border border-[#ccdcd6] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#65a391] focus:ring-4 focus:ring-[#dff0ea] read-only:bg-[#f2f6f4]" />
              </label>
              <label>
                <span className="text-sm font-bold text-[#315f57]">Animal</span>
                <select value={species} onChange={(event) => setSpecies(event.target.value as Species)} disabled={Boolean(initialPet)} className="mt-2 w-full rounded-2xl border border-[#ccdcd6] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#65a391] focus:ring-4 focus:ring-[#dff0ea] disabled:bg-[#f2f6f4]">
                  <option value="chien">Chien</option><option value="chat">Chat</option><option value="autre">Autre</option>
                </select>
              </label>
              <label>
                <span className="text-sm font-bold text-[#315f57]">Document</span>
                <select value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentType)} className="mt-2 w-full rounded-2xl border border-[#ccdcd6] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#65a391] focus:ring-4 focus:ring-[#dff0ea]">
                  <option value="devis">Devis</option><option value="facture">Facture</option>
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-bold text-[#315f57]">Ce que la clinique vous a expliqué <span className="font-normal text-[#8a9e99]">(facultatif)</span></span>
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Ex. intervention prévue la semaine prochaine, avec anesthésie et surveillance…" className="mt-2 w-full resize-none rounded-2xl border border-[#ccdcd6] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#65a391] focus:ring-4 focus:ring-[#dff0ea]" />
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-bold text-[#315f57]">La question que vous voulez poser en priorité <span className="font-normal text-[#8a9e99]">(facultatif)</span></span>
                <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ex. que comprend exactement la ligne anesthésie ?" className="mt-2 w-full rounded-2xl border border-[#ccdcd6] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#65a391] focus:ring-4 focus:ring-[#dff0ea]" />
              </label>
              <label className="sm:col-span-2 flex items-start gap-3 rounded-2xl bg-[#fff8f4] px-4 py-3.5 text-sm text-[#715247]">
                <input type="checkbox" checked={emergency} onChange={(event) => setEmergency(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#c9684f]" />
                <span><strong>L’état de mon animal nécessite une réponse rapide.</strong> DevisVéto n’évalue pas l’urgence : contactez directement une clinique et ne retardez pas les soins.</span>
              </label>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Étape 3 sur 3</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38] sm:text-4xl">Recevez votre aperçu privé.</h2>
            <p className="mt-3 text-sm leading-6 text-[#6c837d]">Il s’affichera immédiatement. Nous vous enverrons aussi un lien pour le retrouver facilement.</p>

            <label className="mt-7 block">
              <span className="text-sm font-bold text-[#315f57]">Votre adresse email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} readOnly={Boolean(initialPet?.email)} placeholder="vous@exemple.fr" className="mt-2 w-full rounded-2xl border border-[#ccdcd6] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#65a391] focus:ring-4 focus:ring-[#dff0ea] read-only:bg-[#f2f6f4]" />
            </label>

            <div className="mt-5 space-y-3 text-sm leading-6 text-[#5d7771]">
              <label className="flex items-start gap-3 rounded-2xl border border-[#bcd8ce] bg-[#f5faf8] px-4 py-3.5">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[#0c5b50]" />
                <span>J’autorise DevisVéto à lire ce document pour préparer mon aperçu et mon rapport <strong>(obligatoire)</strong>.</span>
              </label>
              <details className="rounded-2xl border border-[#e2eae7] px-4 py-3.5">
                <summary className="cursor-pointer font-bold text-[#45665f]">Aider à améliorer DevisVéto <span className="font-normal text-[#8a9e99]">(facultatif)</span></summary>
                <div className="mt-4 space-y-3">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked={statisticsConsent} onChange={(event) => setStatisticsConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[#0c5b50]" />
                    <span>J’autorise l’utilisation d’informations anonymisées pour améliorer le service.</span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked={contentConsent} onChange={(event) => setContentConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[#0c5b50]" />
                    <span>J’autorise l’utilisation anonymisée de ce cas dans du contenu pédagogique.</span>
                  </label>
                </div>
              </details>
            </div>
          </section>
        )}
      </div>

      {error && <div className="mt-5 rounded-2xl border border-[#f0c9bc] bg-[#fff6f2] px-4 py-3 text-sm font-semibold text-[#93462f]">{error}</div>}

      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <button type="button" onClick={() => { setError(null); setStep((current) => current - 1); }} className="rounded-full border border-[#cddbd6] px-5 py-3 text-sm font-bold text-[#45665f] hover:bg-[#f1f6f4]">Retour</button>
        )}
        <button type="button" onClick={step === 2 ? submit : nextStep} className="flex-1 rounded-full bg-[#0c5b50] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_28px_rgba(12,91,80,0.2)] transition hover:-translate-y-0.5 hover:bg-[#084d44]">
          {primaryLabel}
        </button>
      </div>
      <p className="mt-4 text-center text-xs leading-5 text-[#879a95]">Première lecture offerte · Rapport complet 8,90 € · DevisVéto Plus 6,90 €/mois</p>
    </div>
  );
}
