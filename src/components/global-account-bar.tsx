import { createClient } from "@/lib/supabase/server";
import { GlobalAccountBarClient } from "./global-account-bar-client";

export async function GlobalAccountBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <GlobalAccountBarClient userEmail={user?.email ?? null} />;
}
