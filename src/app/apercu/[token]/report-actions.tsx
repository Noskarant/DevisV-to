"use client";

import { useState } from "react";

type Copied = "all" | "priority" | "email" | null;

export function ReportActions({
  questions,
  priorityQuestions,
  emailSubject,
  emailBody,
}: {
  questions: string[];
  priorityQuestions: string[];
  emailSubject: string | null;
  emailBody: string | null;
}) {
  const [copied, setCopied] = useState<Copied>(null);

  async function copy(kind: Exclude<Copied, null>, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1800);
  }

  const formatQuestions = (items: string[]) => items.map((item, index) => `${index + 1}. ${item}`).join("\n");
  const mailHref = emailSubject && emailBody
    ? `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => copy("priority", formatQuestions(priorityQuestions))}
        className="rounded-full border border-[#b8d1c9] bg-white px-5 py-3.5 text-base font-semibold text-[#28564d] hover:bg-[#edf5f1]"
      >
        {copied === "priority" ? "3 questions copiées ✓" : "Copier les 3 questions prioritaires"}
      </button>
      <button
        type="button"
        onClick={() => copy("all", formatQuestions(questions))}
        className="rounded-full border border-[#b8d1c9] bg-white px-5 py-3.5 text-base font-semibold text-[#28564d] hover:bg-[#edf5f1]"
      >
        {copied === "all" ? "Toutes les questions copiées ✓" : "Copier toutes les questions"}
      </button>
      {emailBody && (
        <button
          type="button"
          onClick={() => copy("email", emailBody)}
          className="rounded-full border border-[#b8d1c9] bg-white px-5 py-3.5 text-base font-semibold text-[#28564d] hover:bg-[#edf5f1]"
        >
          {copied === "email" ? "E-mail copié ✓" : "Copier l’e-mail préparé"}
        </button>
      )}
      {mailHref && (
        <a
          href={mailHref}
          className="rounded-full bg-[#0c5b50] px-5 py-3.5 text-center text-base font-semibold text-white hover:bg-[#084d44]"
        >
          Ouvrir dans ma messagerie
        </a>
      )}
    </div>
  );
}
