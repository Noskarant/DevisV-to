import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function GlobalAccountBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="sticky top-0 z-[100] border-b border-[#dbe6e2] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-11 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8">
        <p className="truncate text-xs font-semibold text-[#5e7871]">
          {user ? "Vos animaux et vos analyses restent enregistrés dans votre espace." : "Retrouvez vos animaux et vos analyses depuis votre espace privé."}
        </p>
        <Link
          href={user ? "/dashboard" : "/connexion"}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#e8f3ef] px-3.5 py-1.5 text-xs font-semibold text-[#205b51] transition hover:bg-[#dcece6]"
        >
          <span className="h-2 w-2 rounded-full bg-[#0c6a5d]" />
          Mon espace
          {user && <span className="hidden max-w-44 truncate text-[#668079] md:inline">· {user.email}</span>}
        </Link>
      </div>
    </div>
  );
}
