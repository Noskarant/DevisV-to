"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function MailIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="4" width="15" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 6 6 4.5L16 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function translateAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("rate limit")) {
    return "Trop de liens ont été demandés récemment. Patientez une minute avant de réessayer.";
  }
  if (normalized.includes("signup") && normalized.includes("disabled")) {
    return "La création de compte est temporairement désactivée.";
  }
  if (normalized.includes("error sending") || normalized.includes("smtp")) {
    return "Le serveur d’authentification n’a pas réussi à envoyer l’email. Vérifiez la configuration SMTP.";
  }
  if (normalized.includes("invalid api key") || normalized.includes("apikey")) {
    return "La configuration Supabase du site est invalide. Rechargez la page après le nouveau déploiement.";
  }
  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "Le site n’arrive pas à joindre le serveur de connexion. Vérifiez votre réseau puis réessayez.";
  }

  return `La connexion n’a pas pu être lancée : ${message}`;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error("[DevisVeto auth] magic link refused", {
          name: error.name,
          message: error.message,
          status: error.status,
        });
        setErrorMessage(translateAuthError(error.message));
        setStatus("error");
        return;
      }

      setStatus("sent");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      console.error("[DevisVeto auth] magic link failed", error);
      setErrorMessage(translateAuthError(message));
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-8 rounded-[22px] border border-[#bcded2] bg-[#edf8f4] p-5 text-[#245e53]">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#0c6b5e] shadow-sm">
            <MailIcon />
          </span>
          <div>
            <p className="font-extrabold">Consultez votre boîte mail</p>
            <p className="mt-1 text-sm leading-6 text-[#4e756d]">
              Un lien de connexion a été envoyé à <strong className="font-bold text-[#245e53]">{email}</strong>. Il peut mettre quelques instants à arriver.
            </p>
            <p className="mt-2 text-xs leading-5 text-[#64867f]">
              Première visite ? Votre compte DevisVéto vient d’être créé automatiquement.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <label htmlFor="email" className="text-sm font-extrabold text-[#244941]">
        Adresse email
      </label>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#78908b]">
          <MailIcon />
        </span>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="vous@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-14 w-full rounded-2xl border border-[#cddbd6] bg-white pl-12 pr-4 text-base text-[#173f38] shadow-sm transition placeholder:text-[#a1b0ac] focus:border-[#4e9083] focus:outline-none focus:ring-4 focus:ring-[#cfe8df]/70"
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#0c5b50] px-5 text-sm font-extrabold text-white shadow-[0_14px_35px_rgba(12,91,80,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#084d44] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
      >
        {status === "sending" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Envoi du lien…
          </>
        ) : (
          <>
            Recevoir mon lien de connexion
            <ArrowIcon />
          </>
        )}
      </button>
      {status === "error" && (
        <p className="mt-4 rounded-xl bg-[#fff6f2] px-4 py-3 text-sm font-medium leading-6 text-[#93462f]">
          {errorMessage}
        </p>
      )}
      <p className="mt-3 text-center text-xs leading-5 text-[#78908b]">
        Aucune inscription séparée : si votre adresse est nouvelle, le compte est créé avec ce lien.
      </p>
    </form>
  );
}
