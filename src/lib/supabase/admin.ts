import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

/**
 * Client service-role. NE JAMAIS importer côté client.
 * Utilisé uniquement dans les Route Handlers / Server Actions
 * pour les opérations qui doivent contourner la RLS (webhooks Stripe, admin).
 */
export function createAdminClient() {
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY_MISSING");
  }

  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
