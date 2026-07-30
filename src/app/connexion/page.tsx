import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "@/app/auth-actions";
import { AuthField, AuthNotice, SubmitButton } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    erreur?: string;
    message?: string;
    retour?: string;
  }>;
}) {
  const { erreur, message, retour } = await searchParams;

  return (
    <AuthShell
      eyebrow="Espace sécurisé"
      title="Bon retour."
      description="Connectez-vous pour reprendre le pilotage de votre activité."
    >
      <form action={signIn} className="mt-8 space-y-5">
        {erreur && <AuthNotice tone="error">{erreur}</AuthNotice>}
        {message && <AuthNotice tone="success">{message}</AuthNotice>}
        <input type="hidden" name="returnTo" value={retour ?? "/app"} />
        <AuthField
          id="email"
          label="Adresse e-mail"
          type="email"
          autoComplete="email"
          placeholder="vous@entreprise.com"
        />
        <AuthField
          id="password"
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          placeholder="8 caractères minimum"
        />
        <SubmitButton>Se connecter</SubmitButton>
      </form>
      <p className="mt-6 text-center text-xs text-[#797a73]">
        Nouveau sur Commerce OS ?{" "}
        <Link
          href="/inscription"
          className="font-medium text-[#4f5f49] hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </AuthShell>
  );
}
