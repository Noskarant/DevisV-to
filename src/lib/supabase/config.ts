const DEVIVETO_PROJECT_REF = "pqjyuzpxbbgjkxcqhuzi";

// L'URL publique Supabase et la clé anon sont destinées à être embarquées
// dans le navigateur. Elles sont volontairement figées ici pour éviter qu'une
// variable Vercel ancienne, entourée de guillemets ou contenant un chemin
// (/auth/v1, /rest/v1...) ne produise une URL de requête invalide.
export const supabaseUrl = `https://${DEVIVETO_PROJECT_REF}.supabase.co`;

export const supabasePublishableKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxanl1enB4YmJnamt4Y3FodXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNDY5MTksImV4cCI6MjEwMDcyMjkxOX0.O4b7zuKFltMxPbiuqjZweqnunQoSihceCScR9Xd4yrc";

export const supabaseProjectRef = DEVIVETO_PROJECT_REF;
