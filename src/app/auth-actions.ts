"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email();
const passwordSchema = z.string().min(8).max(128);
const fullNameSchema = z.string().trim().min(2).max(100);

function authRedirect(
  pathname: "/connexion" | "/inscription",
  type: "erreur" | "message",
  message: string,
): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`${pathname}?${params.toString()}`);
}

export async function signIn(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  const requestedReturnTo = formData.get("returnTo");
  const returnTo =
    typeof requestedReturnTo === "string" &&
    requestedReturnTo.startsWith("/app")
      ? requestedReturnTo
      : "/app";

  if (!email.success || !password.success) {
    authRedirect(
      "/connexion",
      "erreur",
      "Vérifiez votre adresse e-mail et votre mot de passe.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: password.data,
  });

  if (error) {
    authRedirect(
      "/connexion",
      "erreur",
      "Connexion impossible. Vérifiez vos identifiants.",
    );
  }

  redirect(returnTo);
}

export async function signUp(formData: FormData) {
  const fullName = fullNameSchema.safeParse(formData.get("fullName"));
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));

  if (!fullName.success || !email.success || !password.success) {
    authRedirect(
      "/inscription",
      "erreur",
      "Renseignez un nom, une adresse e-mail valide et un mot de passe d’au moins 8 caractères.",
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
    options: {
      data: { full_name: fullName.data },
    },
  });

  if (error) {
    authRedirect(
      "/inscription",
      "erreur",
      "Création du compte impossible. Cette adresse est peut-être déjà utilisée.",
    );
  }

  if (!data.session) {
    authRedirect(
      "/connexion",
      "message",
      "Compte créé. Confirmez votre adresse e-mail avant de vous connecter.",
    );
  }

  redirect("/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
