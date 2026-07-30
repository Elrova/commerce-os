import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createOpportunityOffer } from "@/app/app/opportunites/[id]/offres/actions";
import { OfferForm } from "@/components/suppliers/offer-form";
import { getCurrentContext } from "@/lib/auth/current-context";
import { createClient } from "@/lib/supabase/server";

export default async function NewOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const [{ data: opportunity }, { data: suppliers }] = await Promise.all([
    supabase.from("opportunities").select("id, name, recommended_sale_price").eq("id", id).eq("workspace_id", workspace.id).maybeSingle(),
    supabase.from("suppliers").select("id, name, reliability_score").eq("workspace_id", workspace.id).neq("status", "archived").order("name"),
  ]);
  if (!opportunity) notFound();

  return (
    <div className="mx-auto max-w-7xl">
      <Link href={`/app/opportunites/${id}`} className="inline-flex items-center gap-2 text-xs text-[#73746d]"><ArrowLeft className="size-3.5" />Retour à l’opportunité</Link>
      <div className="mb-8 mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#788570]">Nouvelle offre</p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em]">Ajouter un fournisseur</h1>
        <p className="mt-3 text-sm text-[#6d6e67]">{opportunity.name}</p>
      </div>
      <OfferForm
        action={createOpportunityOffer.bind(null, id)}
        suppliers={(suppliers ?? []).map((supplier) => ({ id: supplier.id, name: supplier.name, reliabilityScore: supplier.reliability_score ?? 50 }))}
        salePrice={Number(opportunity.recommended_sale_price ?? 0)}
        cancelHref={`/app/opportunites/${id}`}
      />
    </div>
  );
}
