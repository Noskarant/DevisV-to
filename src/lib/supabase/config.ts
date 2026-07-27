const DEVIVETO_PROJECT_REF = "pqjyuzpxbbgjkxcqhuzi";
const DEVIVETO_PROJECT_URL = `https://${DEVIVETO_PROJECT_REF}.supabase.co`;

// Une clé publishable Supabase est conçue pour être embarquée dans le client.
// Cette valeur de secours empêche un ancien projet Vercel ou une variable absente
// de rediriger silencieusement les connexions vers une autre base.
const DEVIVETO_PUBLISHABLE_KEY = "sb_publishable_s1dHw_pR9pCfbY3bndccKw_FmH28T7r";

const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const configuredKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();

const configuredProjectRef = configuredUrl
  ? configuredUrl.replace(/^https?:\/\//, "").split(".")[0]
  : null;

const configurationTargetsDevisVeto = configuredProjectRef === DEVIVETO_PROJECT_REF;

export const supabaseUrl = configurationTargetsDevisVeto
  ? configuredUrl!
  : DEVIVETO_PROJECT_URL;

export const supabasePublishableKey =
  configurationTargetsDevisVeto && configuredKey
    ? configuredKey
    : DEVIVETO_PUBLISHABLE_KEY;

export const supabaseProjectRef = DEVIVETO_PROJECT_REF;
