import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) return profile;

  // premier login : créer la ligne profile
  const { data: created } = await supabase
    .from("profiles")
    .insert({ id: user.id, email: user.email ?? "" })
    .select("*")
    .single();

  return created;
}

export async function requireUser() {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("NOT_AUTHENTICATED");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireUser();
  if (profile.role !== "admin") throw new Error("NOT_ADMIN");
  return profile;
}
