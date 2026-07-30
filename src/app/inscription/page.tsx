import type { Metadata } from "next";
import Link from "next/link";
import { signUp } from "@/app/auth-actions";
import { AuthField, AuthNotice, SubmitButton } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Inscription" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <AuthShell
      eyebrow="Créer votre espace"
      title="Lancez votre commerce."
      description="Votre premier espace ELROVA Store sera créé automatiquement."
    >
      <form action={signUp} className="mt-8 space-y-5">
        {erreur && <AuthNotice tone="error">{erreur}</AuthNotice>}
        <AuthField
          id="fullName"
          label="Nom complet"
          autoComplete="name"
          placeholder="Votre nom"
        />
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
          autoComplete="new-password"
          placeholder="8 caractères minimum"
        />
        <SubmitButton>Créer mon espace</SubmitButton>
      </form>
      <p className="mt-6 text-center text-xs text-[#797a73]">
        Vous avez déjà un compte ?{" "}
        <Link
          href="/connexion"
          className="font-medium text-[#4f5f49] hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </AuthShell>
  );
}
