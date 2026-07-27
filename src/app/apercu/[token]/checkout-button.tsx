"use client";

import { useState } from "react";

export function CheckoutButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/public/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "Le paiement n’a pas pu être préparé.");
      window.location.assign(payload.url);
    } catch (caught) {
      setLoading(false);
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="w-full rounded-full bg-[#0c5b50] px-5 py-4 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(12,91,80,0.23)] transition hover:-translate-y-0.5 hover:bg-[#084d44] disabled:cursor-wait disabled:opacity-65"
      >
        {loading ? "Redirection vers le paiement…" : "Débloquer le rapport complet — 6,90 €"}
      </button>
      {error && <p className="mt-3 text-center text-xs font-semibold text-[#a34f39]">{error}</p>}
    </div>
  );
}
