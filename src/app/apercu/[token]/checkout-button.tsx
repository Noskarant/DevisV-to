"use client";

import { useState } from "react";

type Plan = "single" | "monthly" | "credit";

export function PurchaseOptions({
  token,
  creditBalance,
  subscriptionActive,
  lineCount,
}: {
  token: string;
  creditBalance: number;
  subscriptionActive: boolean;
  lineCount: number;
}) {
  const [loading, setLoading] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPlus, setShowPlus] = useState(false);

  async function startCheckout(plan: Plan) {
    setLoading(plan);
    setError(null);
    try {
      const response = await fetch("/api/public/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, plan }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "L’accès n’a pas pu être préparé.");
      window.location.assign(payload.url);
    } catch (caught) {
      setLoading(null);
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
    }
  }

  if (subscriptionActive && creditBalance > 0) {
    return (
      <div>
        <div className="rounded-2xl border border-[#a9cfc3] bg-[#eaf5f1] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">DevisVéto Plus</p>
              <p className="mt-1 text-lg font-semibold text-[#174f46]">{creditBalance} crédit{creditBalance > 1 ? "s" : ""} disponible{creditBalance > 1 ? "s" : ""}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#397268]">Inclus</span>
          </div>
          <button
            type="button"
            onClick={() => startCheckout("credit")}
            disabled={loading !== null}
            className="mt-5 w-full rounded-full bg-[#0c5b50] px-5 py-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(12,91,80,0.2)] transition hover:-translate-y-0.5 hover:bg-[#084d44] disabled:cursor-wait disabled:opacity-65"
          >
            {loading === "credit" ? "Ouverture du rapport…" : `Utiliser 1 crédit et voir les ${lineCount} explications`}
          </button>
        </div>
        <button
          type="button"
          onClick={() => startCheckout("single")}
          disabled={loading !== null}
          className="mt-3 w-full rounded-full border border-[#cbdcd6] bg-white px-5 py-3 text-sm font-semibold text-[#45665f] hover:bg-[#f1f6f4] disabled:opacity-60"
        >
          Débloquer séparément — 8,90 €
        </button>
        {error && <p className="mt-3 text-center text-xs font-semibold text-[#a34f39]">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => startCheckout("single")}
        disabled={loading !== null}
        className="w-full rounded-[22px] border-2 border-[#79ae9e] bg-[#edf7f3] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#4f9380] disabled:cursor-wait disabled:opacity-65"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5d8179]">Rapport unique</p>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#397268]">Le plus simple</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-serif text-4xl font-semibold tracking-[-0.025em] text-[#123f38]">8,90 €</span>
          <span className="text-xs font-semibold text-[#78908a]">une seule fois</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#526f68]">Toutes les explications, les contrôles factuels, les questions et le PDF privé. Aucun abonnement.</p>
        <span className="mt-5 flex w-full justify-center rounded-full bg-[#0c5b50] px-4 py-3.5 text-sm font-semibold text-white">
          {loading === "single" ? "Ouverture de Stripe…" : `Voir les ${lineCount} explications — 8,90 €`}
        </span>
      </button>

      {!subscriptionActive && (
        <div className="mt-3">
          {!showPlus ? (
            <button
              type="button"
              onClick={() => setShowPlus(true)}
              className="w-full rounded-full border border-[#d7e4df] bg-white px-5 py-3 text-sm font-semibold text-[#45665f] hover:bg-[#f5f8f7]"
            >
              J’ai plusieurs animaux ou documents — voir DevisVéto Plus
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startCheckout("monthly")}
              disabled={loading !== null}
              className="w-full rounded-[22px] border border-[#d7e4df] bg-white p-5 text-left transition hover:border-[#a9c9bf] disabled:cursor-wait disabled:opacity-65"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#78908a]">DevisVéto Plus</p>
                <span className="text-sm font-semibold text-[#123f38]">6,90 € / mois</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#647d77]">Ce rapport est inclus, puis 1 nouveau crédit chaque mois, cumulable jusqu’à 3. Résiliable à tout moment depuis les paramètres.</p>
              <span className="mt-4 flex w-full justify-center rounded-full border border-[#bfd5ce] px-4 py-3 text-sm font-semibold text-[#315f57]">
                {loading === "monthly" ? "Ouverture de Stripe…" : "Choisir DevisVéto Plus — 6,90 € / mois"}
              </span>
            </button>
          )}
        </div>
      )}

      {subscriptionActive && creditBalance === 0 && (
        <p className="mt-3 rounded-2xl bg-[#fff8f4] px-4 py-3 text-xs font-semibold leading-5 text-[#805a4c]">
          Votre abonnement est actif, mais aucun crédit n’est disponible actuellement. Le prochain crédit sera ajouté au renouvellement.
        </p>
      )}
      {error && <p className="mt-3 text-center text-xs font-semibold text-[#a34f39]">{error}</p>}
      <p className="mt-4 text-center text-[11px] leading-5 text-[#879a95]">Sécurisé par Stripe · aucune option présélectionnée</p>
    </div>
  );
}
