"use client";

import { useState } from "react";
import {
  getSignedDocumentUrl,
  updateExtractedItem,
  addExtractedItem,
  deleteExtractedItem,
  updateReport,
  addInternalComment,
  setCaseStatus,
  approveAndPublish,
} from "./actions";

type ExtractedItem = {
  id: string;
  original_label: string;
  normalized_label: string | null;
  category: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  explanation: string | null;
  confidence_score: "high" | "medium" | "low" | null;
  clarification_needed: string | null;
  display_order: number;
};

type CaseReport = {
  id: string;
  summary: string | null;
  amount_composition: string[] | null;
  price_variation_factors: string[] | null;
  questions_to_ask: string[] | null;
  limitations: string | null;
} | null;

type CaseDocument = {
  id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
};

type AuditLog = {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export function CaseEditor({
  caseRow,
  documents,
  items: initialItems,
  report: initialReport,
  logs,
}: {
  caseRow: Record<string, unknown> & { id: string; status: string };
  documents: CaseDocument[];
  items: ExtractedItem[];
  report: CaseReport;
  logs: AuditLog[];
}) {
  const [items, setItems] = useState(initialItems);
  const [report, setReport] = useState<CaseReport>(
    initialReport ?? {
      id: "",
      summary: "",
      amount_composition: [],
      price_variation_factors: [],
      questions_to_ask: [],
      limitations: "",
    }
  );
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const pet = caseRow.pets as { name: string; species: string } | null;
  const profile = caseRow.profiles as { email: string } | null;

  async function openDocument() {
    if (!documents[0]) return;
    const url = await getSignedDocumentUrl(documents[0].storage_path);
    setDocumentUrl(url);
  }

  async function handleItemChange(id: string, field: keyof ExtractedItem, value: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }

  async function saveItem(item: ExtractedItem) {
    setSaving(true);
    try {
      await updateExtractedItem(item.id, caseRow.id, {
        original_label: item.original_label,
        normalized_label: item.normalized_label ?? undefined,
        category: item.category ?? undefined,
        explanation: item.explanation ?? undefined,
        confidence_score: item.confidence_score ?? "medium",
        clarification_needed: item.clarification_needed ?? undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddItem() {
    await addExtractedItem(caseRow.id, items.length);
    location.reload();
  }

  async function handleDeleteItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    await deleteExtractedItem(id, caseRow.id);
  }

  function listToLines(list: string[] | null) {
    return (list ?? []).join("\n");
  }
  function linesToList(text: string) {
    return text.split("\n").map((l) => l.trim()).filter(Boolean);
  }

  async function saveReport() {
    if (!report) return;
    setSaving(true);
    try {
      await updateReport(caseRow.id, report.id || null, {
        summary: report.summary ?? "",
        amount_composition: report.amount_composition ?? [],
        price_variation_factors: report.price_variation_factors ?? [],
        questions_to_ask: report.questions_to_ask ?? [],
        limitations: report.limitations ?? "",
      });
    } finally {
      setSaving(false);
    }
  }

  async function submitComment() {
    if (!comment.trim()) return;
    await addInternalComment(caseRow.id, comment);
    setComment("");
    location.reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {pet?.name ?? "Animal"} — {profile?.email}
          </h1>
          <p className="text-sm text-slate-500">Statut : {caseRow.status}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCaseStatus(caseRow.id, "needs_information")}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
          >
            Demander précision au client
          </button>
          <button
            onClick={() => approveAndPublish(caseRow.id, report?.id ?? "")}
            disabled={!report?.id}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            Valider et publier
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Document original */}
        <section>
          <h2 className="text-sm font-semibold text-slate-900">Document original</h2>
          {documents.length === 0 && (
            <p className="mt-2 text-sm text-slate-500">Aucun document.</p>
          )}
          {documents[0] && !documentUrl && (
            <button
              onClick={openDocument}
              className="mt-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
            >
              Ouvrir {documents[0].original_filename}
            </button>
          )}
          {documentUrl && (
            <iframe src={documentUrl} className="mt-2 h-[600px] w-full rounded-lg border" />
          )}
        </section>

        {/* Lignes extraites */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Lignes extraites</h2>
            <button onClick={handleAddItem} className="text-xs text-slate-600 underline">
              + Ajouter une ligne
            </button>
          </div>
          <div className="mt-2 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                <input
                  value={item.original_label}
                  onChange={(e) => handleItemChange(item.id, "original_label", e.target.value)}
                  className="w-full border-b border-slate-100 pb-1 text-sm font-medium"
                />
                <input
                  value={item.category ?? ""}
                  placeholder="Catégorie"
                  onChange={(e) => handleItemChange(item.id, "category", e.target.value)}
                  className="mt-2 w-full text-xs text-slate-600"
                />
                <textarea
                  value={item.explanation ?? ""}
                  placeholder="Explication simple"
                  onChange={(e) => handleItemChange(item.id, "explanation", e.target.value)}
                  className="mt-2 w-full rounded border border-slate-100 p-1 text-xs"
                  rows={2}
                />
                <input
                  value={item.clarification_needed ?? ""}
                  placeholder="Point à clarifier (facultatif)"
                  onChange={(e) =>
                    handleItemChange(item.id, "clarification_needed", e.target.value)
                  }
                  className="mt-2 w-full text-xs text-slate-600"
                />
                <div className="mt-2 flex items-center justify-between">
                  <select
                    value={item.confidence_score ?? "medium"}
                    onChange={(e) =>
                      handleItemChange(item.id, "confidence_score", e.target.value)
                    }
                    className="text-xs"
                  >
                    <option value="high">Certitude haute</option>
                    <option value="medium">Certitude moyenne</option>
                    <option value="low">Certitude basse</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveItem(item)}
                      disabled={saving}
                      className="rounded bg-slate-900 px-2 py-1 text-xs text-white"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-600"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Rapport */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-slate-900">Rapport</h2>
        <div className="mt-3 space-y-3">
          <textarea
            value={report?.summary ?? ""}
            placeholder="Résumé (5 lignes maximum)"
            onChange={(e) => setReport((r) => (r ? { ...r, summary: e.target.value } : r))}
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
            rows={4}
          />
          <textarea
            value={listToLines(report?.amount_composition ?? [])}
            placeholder="Ce qui compose le montant (une catégorie par ligne)"
            onChange={(e) =>
              setReport((r) =>
                r ? { ...r, amount_composition: linesToList(e.target.value) } : r
              )
            }
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
            rows={4}
          />
          <textarea
            value={listToLines(report?.price_variation_factors ?? [])}
            placeholder="Ce qui peut faire varier le montant (une variable par ligne)"
            onChange={(e) =>
              setReport((r) =>
                r ? { ...r, price_variation_factors: linesToList(e.target.value) } : r
              )
            }
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
            rows={4}
          />
          <textarea
            value={listToLines(report?.questions_to_ask ?? [])}
            placeholder="Questions à poser au vétérinaire (une par ligne)"
            onChange={(e) =>
              setReport((r) => (r ? { ...r, questions_to_ask: linesToList(e.target.value) } : r))
            }
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
            rows={5}
          />
          <textarea
            value={report?.limitations ?? ""}
            placeholder="Limites de l'analyse"
            onChange={(e) => setReport((r) => (r ? { ...r, limitations: e.target.value } : r))}
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
            rows={3}
          />
          <button
            onClick={saveReport}
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Enregistrer le rapport
          </button>
        </div>
      </section>

      {/* Commentaire interne + historique */}
      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Commentaire interne</h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 p-2 text-sm"
            rows={3}
          />
          <button
            onClick={submitComment}
            className="mt-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
          >
            Ajouter
          </button>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Historique</h2>
          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto text-xs text-slate-600">
            {logs.map((log) => (
              <div key={log.id} className="border-b border-slate-100 pb-1">
                <span className="font-medium">{log.action}</span> —{" "}
                {new Date(log.created_at).toLocaleString("fr-FR")}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
