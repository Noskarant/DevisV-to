"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function GlobalAccountBarClient({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const hideLocalAccountLink = pathname === "/" || pathname === "/analyser" || pathname.startsWith("/analyser?");

  useEffect(() => {
    const match = pathname.match(/^\/dashboard\/dossiers\/([0-9a-f-]{36})$/i);
    if (!userEmail || !match) return;

    const controller = new AbortController();
    fetch(`/api/account/cases/${match[1]}/access`, {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { url?: string };
      })
      .then((payload) => {
        if (payload?.url && payload.url !== pathname) router.replace(payload.url);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("[ACCOUNT_CASE_REDIRECT]", error);
      });

    return () => controller.abort();
  }, [pathname, router, userEmail]);

  return (
    <>
      {hideLocalAccountLink && (
        <style>{`header a[href="/connexion"], header a[href="/dashboard"] { display: none !important; }`}</style>
      )}
      <div className="sticky top-0 z-[100] border-b border-[#dbe6e2] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-11 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8">
          <p className="truncate text-xs font-semibold text-[#5e7871]">
            {userEmail
              ? "Vos animaux et vos analyses sont enregistrés dans votre espace."
              : "Retrouvez vos animaux et vos analyses depuis votre espace privé."}
          </p>
          <Link
            data-global-account-link
            href={userEmail ? "/dashboard" : "/connexion"}
            className="inline-flex shrink-0 items-center rounded-full border border-[#d4e4de] bg-[#f1f7f4] px-3.5 py-1.5 text-xs font-semibold text-[#205b51] transition hover:bg-[#e5f1ed]"
          >
            Mon espace
            {userEmail && <span className="hidden max-w-44 truncate text-[#668079] md:inline"> · {userEmail}</span>}
          </Link>
        </div>
      </div>
    </>
  );
}
