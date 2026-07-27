import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client service-role. NE JAMAIS importer côté client.
 * Utilisé uniquement dans les Route Handlers / Server Actions
 * pour les opérations qui doivent contourner la RLS (webhooks Stripe, admin).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
