import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { updateOpportunity } from "@/app/app/opportunites/actions";
import { OpportunityForm } from "@/components/opportunities/opportunity-form";
import { getCurrentContext } from "@/lib/auth/current-context";
import type { Opportunity } from "@/lib/opportunities/types";
import { createClient } from "@/lib/supabase/server";

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (!data) notFound();
  const opportunity = data as Opportunity;
  const action = updateOpportunity.bind(null, id);

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href={`/app/opportunites/${id}`}
        className="inline-flex items-center gap-2 text-xs font-medium text-[#73746d]"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Retour au détail
      </Link>
      <div className="mb-8 mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#788570]">
          Modification
        </p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
          Ajuster l’hypothèse
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6e67]">
          Toute modification financière recalcule automatiquement la marge, le
          ROI et le score ELROVA.
        </p>
      </div>
      <OpportunityForm
        action={action}
        submitLabel="Enregistrer"
        cancelHref={`/app/opportunites/${id}`}
        initialValues={{
          name: opportunity.name,
          category: opportunity.category ?? "",
          sourceUrl: opportunity.source_url ?? "",
          purchasePrice: Number(opportunity.estimated_purchase_price ?? 0),
          shippingCost: Number(opportunity.estimated_shipping_cost ?? 0),
          platformFees: Number(opportunity.estimated_platform_fees ?? 0),
          salePrice: Number(opportunity.recommended_sale_price ?? 0),
          notes: opportunity.notes ?? "",
          status: opportunity.status,
        }}
      />
    </div>
  );
}
