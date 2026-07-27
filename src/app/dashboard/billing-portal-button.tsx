"use client";

import { useState } from "react";

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "Portail indisponible.");
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
        onClick={openPortal}
        disabled={loading}
        className="rounded-full border border-[#bfd5ce] bg-white px-4 py-2.5 text-sm font-extrabold text-[#315f57] transition hover:bg-[#f1f7f4] disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? "Ouverture…" : "Gérer mon abonnement"}
      </button>
      {error && <p className="mt-2 text-xs font-semibold text-[#a34f39]">{error}</p>}
    </div>
  );
}
