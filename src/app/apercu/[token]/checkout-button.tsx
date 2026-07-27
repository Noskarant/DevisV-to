"use client";

import { useState } from "react";

type Plan = "single" | "monthly" | "credit";

export function PurchaseOptions({
  token,
  creditBalance,
  subscriptionActive,
}: {
  token: string;
  creditBalance: number;
  subscriptionActive: boolean;
}) {
  const [loading, setLoading] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      if (!response.ok || !payload.url) throw new Error(payload.error || "Le paiement n’a pas pu être préparé.");
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
              <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5d8179]">DevisVéto Plus</p>
              <p className="mt-1 text-lg font-extrabold text-[#174f46]">{creditBalance} crédit{creditBalance > 1 ? "s" : ""} disponible{creditBalance > 1 ? "s" : ""}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-[#397268]">Inclus</span>
          </div>
          <button
            type="button"
            onClick={() => startCheckout("credit")}
            disabled={loading !== null}
            className="mt-5 w-full rounded-full bg-[#0c5b50] px-5 py-4 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(12,91,80,0.2)] transition hover:-translate-y-0.5 hover:bg-[#084d44] disabled:cursor-wait disabled:opacity-65"
          >
            {loading === "credit" ? "Activation du rapport…" : "Utiliser 1 crédit pour ce rapport"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => startCheckout("single")}
          disabled={loading !== null}
          className="mt-3 w-full rounded-full border border-[#cbdcd6] bg-white px-5 py-3 text-sm font-extrabold text-[#45665f] hover:bg-[#f1f6f4] disabled:opacity-60"
        >
          Payer séparément — 8,90 €
        </button>
        {error && <p className="mt-3 text-center text-xs font-semibold text-[#a34f39]">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {!subscriptionActive && (
          <button
            type="button"
            onClick={() => startCheckout("monthly")}
            disabled={loading !== null}
            className="relative w-full overflow-hidden rounded-[22px] border-2 border-[#79ae9e] bg-[#edf7f3] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#4f9380] disabled:cursor-wait disabled:opacity-65"
          >
            <span className="absolute right-3 top-3 rounded-full bg-[#0c5b50] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white">Recommandé</span>
            <p className="pr-24 text-xs font-extrabold uppercase tracking-[0.13em] text-[#5d8179]">DevisVéto Plus</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-4xl font-semibold tracking-[-0.05em] text-[#123f38]">6,90 €</span>
              <span className="text-xs font-bold text-[#78908a]">par mois</span>
            </div>
            <p className="mt-3 text-sm font-extrabold text-[#315f57]">Ce rapport est inclus immédiatement.</p>
            <ul className="mt-4 space-y-2 text-xs font-semibold leading-5 text-[#526f68]">
              <li>✓ 1 nouveau crédit d’analyse chaque mois</li>
              <li>✓ Crédits cumulables jusqu’à 3</li>
              <li>✓ Tous les animaux de votre foyer</li>
              <li>✓ Dossiers, timelines, poids et rappels</li>
              <li>✓ Résiliable à tout moment</li>
            </ul>
            <span className="mt-5 flex w-full justify-center rounded-full bg-[#0c5b50] px-4 py-3 text-sm font-extrabold text-white">
              {loading === "monthly" ? "Redirection vers le paiement…" : "Choisir DevisVéto Plus"}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => startCheckout("single")}
          disabled={loading !== null}
          className="w-full rounded-[22px] border border-[#d7e4df] bg-white p-5 text-left transition hover:border-[#a9c9bf] disabled:cursor-wait disabled:opacity-65"
        >
          <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#78908a]">Analyse unique</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-4xl font-semibold tracking-[-0.05em] text-[#123f38]">8,90 €</span>
            <span className="text-xs font-bold text-[#78908a]">une seule fois</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#647d77]">Ce rapport complet, sans abonnement ni renouvellement.</p>
          <span className="mt-4 flex w-full justify-center rounded-full border border-[#bfd5ce] px-4 py-3 text-sm font-extrabold text-[#315f57]">
            {loading === "single" ? "Redirection…" : "Acheter cette analyse"}
          </span>
        </button>
      </div>

      {subscriptionActive && creditBalance === 0 && (
        <p className="mt-3 rounded-2xl bg-[#fff8f4] px-4 py-3 text-xs font-semibold leading-5 text-[#805a4c]">
          Votre abonnement est actif, mais aucun crédit n’est disponible actuellement. Le prochain crédit sera ajouté au renouvellement.
        </p>
      )}
      {error && <p className="mt-3 text-center text-xs font-semibold text-[#a34f39]">{error}</p>}
      <p className="mt-4 text-center text-[11px] leading-5 text-[#879a95]">Paiement sécurisé Stripe · aucune option précochée</p>
    </div>
  );
}
