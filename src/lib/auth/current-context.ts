import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
};

type Workspace = {
  id: string;
  name: string;
  slug: string;
};

export type CurrentContext = {
  user: {
    id: string;
    email: string;
  };
  profile: Profile;
  workspace: Workspace;
};

export const getCurrentContext = cache(async (): Promise<CurrentContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!membership) {
    throw new Error(
      "Aucun espace de travail n’est associé à ce compte. Vérifiez que la migration d’onboarding a bien été appliquée.",
    );
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("id", membership.workspace_id)
    .single();

  if (!workspace) {
    throw new Error("L’espace de travail associé est introuvable.");
  }

  return {
    user: { id: user.id, email: user.email ?? "" },
    profile: {
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    },
    workspace,
  };
});
