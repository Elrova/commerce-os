const SUPABASE_URL_NAME = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_ANON_KEY_NAME = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

export type SupabaseEnvironment = {
  url: string;
  anonKey: string;
};

export function getSupabaseEnvironment(): SupabaseEnvironment {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing = [
    !url && SUPABASE_URL_NAME,
    !anonKey && SUPABASE_ANON_KEY_NAME,
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Configuration Supabase incomplète. Variables manquantes : ${missing.join(
        ", ",
      )}. Copiez .env.example vers .env.local puis renseignez-les.`,
    );
  }

  try {
    new URL(url as string);
  } catch {
    throw new Error(`${SUPABASE_URL_NAME} doit être une URL valide.`);
  }

  return { url: url as string, anonKey: anonKey as string };
}
