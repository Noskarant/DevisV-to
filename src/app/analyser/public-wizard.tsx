"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Species = "chien" | "chat" | "autre";
type DocumentType = "devis" | "facture";

const steps = ["Le document", "Votre animal", "Vos coordonnées"];
const processingLabels = [
  "Lecture du document",
  "Identification des prestations",
  "Organisation des différents postes",
  "Préparation des points à clarifier",
  "Création de votre aperçu",
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

export function PublicWizard() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState<Species>("chien");
  const [documentType, setDocumentType] = useState<DocumentType>("devis");
  const [emergency, setEmergency] = useState(false);
  const [description, setDescription] = useState("");
  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState("");
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
      setError("Le document doit faire moins de 10 Mo.");
      return;
    }
    setFile(selected);
  }

  function nextStep() {
    setError(null);
    if (step === 0 && !file) {
      setError("Ajoutez votre devis ou votre facture pour continuer.");
      return;
    }
    if (step === 1 && !petName.trim()) {
      setError("Indiquez le prénom de votre animal.");
      return;
    }
    setStep((current) => Math.min(current + 1, 2));
  }

  async function submit() {
    setError(null);
    if (!file || !petName.trim()) return;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Indiquez une adresse email valide.");
      return;
    }
    if (!consent) {
      setError("Vous devez accepter le traitement du document pour obtenir l’aperçu.");
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

      const response = await fetch("/api/public/analyse", { method: "POST", body: formData });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "L’aperçu n’a pas pu être préparé.");
      router.push(payload.url);
    } catch (caught) {
      window.clearInterval(timer);
      setProcessing(false);
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
    }
  }

  if (processing) {
    return (
      <div className="flex min-h-[560px] flex-col items-center justify-center px-2 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#e7f3ee] text-[#0c5b50]">
          <div className="absolute inset-0 animate-ping rounded-full border border-[#83b9aa]/40" />
          <FileIcon />
        </div>
        <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.15em] text-[#5d8179]">Aperçu en préparation</p>
        <h2 className="mt-3 font-serif text-3xl font-semibold tracking-[-0.035em] text-[#123f38] sm:text-4xl">
          Nous préparons une lecture claire du document de {petName}.
        </h2>
        <p className="mt-4 max-w-md text-sm leading-6 text-[#6c837d]">
          Aucune conclusion médicale ne sera formulée. Les incertitudes resteront visibles et ne seront jamais complétées au hasard.
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

  return (
    <div>
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
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38] sm:text-4xl">
              Ajoutez votre document.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#6c837d]">Une photo nette ou le PDF transmis par la clinique suffit.</p>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.heic,application/pdf,image/jpeg,image/png,image/heic"
              className="hidden"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
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
              <span className="mt-4 text-base font-extrabold text-[#174f46]">{file ? "Changer de document" : "Choisir ou déposer le document"}</span>
              <span className="mt-1 text-xs text-[#78908a]">PDF, JPG, PNG ou HEIC · 10 Mo maximum</span>
            </button>

            {file && (
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#dce9e4] bg-white px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#244f47]">{file.name}</p>
                  <p className="mt-0.5 text-xs text-[#829791]">{formatFileSize(file.size)}</p>
                </div>
                <span className="ml-3 rounded-full bg-[#e6f3ee] px-3 py-1 text-xs font-bold text-[#397268]">Prêt</span>
              </div>
            )}
          </section>
        )}

        {step === 1 && (
          <section>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Étape 2 sur 3</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38] sm:text-4xl">Quelques éléments de contexte.</h2>
            <p className="mt-3 text-sm leading-6 text-[#6c837d]">Ils permettent de personnaliser les explications sans interpréter la décision médicale.</p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-bold text-[#315f57]">Prénom de l’animal</span>
                <input value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="Ex. Nala" className="mt-2 w-full rounded-2xl border border-[#ccdcd6] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#65a391] focus:ring-4 focus:ring-[#dff0ea]" />
              </label>
              <label>
                <span className="text-sm font-bold text-[#315f57]">Animal</span>
                <select value={species} onChange={(e) => setSpecies(e.target.value as Species)} className="mt-2 w-full rounded-2xl border border-[#ccdcd6] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#65a391] focus:ring-4 focus:ring-[#dff0ea]">
                  <option value="chien">Chien</option><option value="chat">Chat</option><option value="autre">Autre</option>
                </select>
              </label>
              <label>
                <span className="text-sm font-bold text-[#315f57]">Type de document</span>
                <select value={documentType} onChange={(e) => setDocumentType(e.target.value as DocumentType)} className="mt-2 w-full rounded-2xl border border-[#ccdcd6] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#65a391] focus:ring-4 focus:ring-[#dff0ea]">
                  <option value="devis">Devis</option><option value="facture">Facture</option>
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-bold text-[#315f57]">Ce que le vétérinaire vous a expliqué <span className="font-normal text-[#8a9e99]">(facultatif)</span></span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Ex. intervention prévue la semaine prochaine, avec anesthésie et surveillance…" className="mt-2 w-full resize-none rounded-2xl border border-[#ccdcd6] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#65a391] focus:ring-4 focus:ring-[#dff0ea]" />
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-bold text-[#315f57]">Votre question principale <span className="font-normal text-[#8a9e99]">(facultatif)</span></span>
                <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ex. qu’est-ce qui est inclus dans l’anesthésie ?" className="mt-2 w-full rounded-2xl border border-[#ccdcd6] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#65a391] focus:ring-4 focus:ring-[#dff0ea]" />
              </label>
              <label className="sm:col-span-2 flex items-start gap-3 rounded-2xl bg-[#fff8f4] px-4 py-3.5 text-sm text-[#715247]">
                <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#c9684f]" />
                <span><strong>Il s’agit d’une urgence.</strong> Cette information ajoute un rappel prioritaire de ne pas retarder les soins.</span>
              </label>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5d8179]">Étape 3 sur 3</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.04em] text-[#123f38] sm:text-4xl">Où envoyer votre lien privé ?</h2>
            <p className="mt-3 text-sm leading-6 text-[#6c837d]">L’aperçu s’affiche immédiatement et vous recevez aussi son lien par email. Aucun mot de passe n’est demandé.</p>

            <label className="mt-7 block">
              <span className="text-sm font-bold text-[#315f57]">Adresse email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.fr" className="mt-2 w-full rounded-2xl border border-[#ccdcd6] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#65a391] focus:ring-4 focus:ring-[#dff0ea]" />
            </label>

            <div className="mt-5 space-y-3 text-sm leading-6 text-[#5d7771]">
              <label className="flex items-start gap-3 rounded-2xl border border-[#dce7e2] px-4 py-3.5">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#0c5b50]" />
                <span>J’accepte le traitement du document afin de produire mon aperçu et mon rapport <strong>(obligatoire)</strong>.</span>
              </label>
              <label className="flex items-start gap-3 px-4 py-1">
                <input type="checkbox" checked={statisticsConsent} onChange={(e) => setStatisticsConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#0c5b50]" />
                <span>J’accepte l’utilisation anonymisée des informations pour améliorer le service <strong>(facultatif)</strong>.</span>
              </label>
              <label className="flex items-start gap-3 px-4 py-1">
                <input type="checkbox" checked={contentConsent} onChange={(e) => setContentConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#0c5b50]" />
                <span>J’accepte l’utilisation anonymisée de ce cas dans du contenu pédagogique <strong>(facultatif)</strong>.</span>
              </label>
            </div>
          </section>
        )}
      </div>

      {error && <div className="mt-5 rounded-2xl border border-[#f0c9bc] bg-[#fff6f2] px-4 py-3 text-sm font-semibold text-[#93462f]">{error}</div>}

      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <button type="button" onClick={() => { setError(null); setStep((current) => current - 1); }} className="rounded-full border border-[#cddbd6] px-5 py-3 text-sm font-bold text-[#45665f] hover:bg-[#f1f6f4]">
            Retour
          </button>
        )}
        <button type="button" onClick={step === 2 ? submit : nextStep} className="flex-1 rounded-full bg-[#0c5b50] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_28px_rgba(12,91,80,0.2)] transition hover:-translate-y-0.5 hover:bg-[#084d44]">
          {step === 2 ? "Créer mon aperçu gratuit" : "Continuer"}
        </button>
      </div>
      <p className="mt-4 text-center text-xs leading-5 text-[#879a95]">Aperçu gratuit · Rapport complet à 6,90 € · Aucun abonnement</p>
    </div>
  );
}
