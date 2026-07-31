import type { ReactElement } from "react";

export const DEFAULT_APP_URL = "https://www.devisveto.fr";

export type EmailTemplateResult = {
  subject: string;
  react: ReactElement;
  text: string;
};

export function appUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL;
  return normalizeUrl(raw, DEFAULT_APP_URL);
}

export function normalizeUrl(value: string | undefined | null, fallback: string) {
  const candidate = value?.trim() || fallback;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.protocol !== "http:") return fallback;
    return url.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export function absoluteUrl(pathOrUrl: string | undefined | null, fallbackPath = "/dashboard") {
  const base = appUrl();
  const value = pathOrUrl?.trim() || fallbackPath;

  try {
    const url = new URL(value, base);
    if (url.protocol !== "https:" && url.protocol !== "http:") return `${base}${fallbackPath}`;
    return url.toString();
  } catch {
    return `${base}${fallbackPath}`;
  }
}

export function firstNameFromEmail(email?: string | null) {
  const localPart = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!localPart) return null;
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

export function formatEuros(cents?: number | null, currency = "eur") {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return null;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function formatDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function lines(parts: Array<string | null | undefined | false>) {
  return parts.filter(Boolean).join("\n");
}
