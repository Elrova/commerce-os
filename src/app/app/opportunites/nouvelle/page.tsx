import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createOpportunity } from "@/app/app/opportunites/actions";
import { OpportunityForm } from "@/components/opportunities/opportunity-form";

export default function NewOpportunityPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/app/opportunites"
        className="inline-flex items-center gap-2 text-xs font-medium text-[#73746d]"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Opportunités
      </Link>
      <div className="mb-8 mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#788570]">
          Nouvelle analyse
        </p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
          Évaluer un produit
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6e67]">
          Posez vos hypothèses, mesurez l’économie unitaire et obtenez un score
          comparable à votre sélection.
        </p>
      </div>
      <OpportunityForm
        action={createOpportunity}
        submitLabel="Créer l’opportunité"
        cancelHref="/app/opportunites"
        initialValues={{
          name: "",
          category: "",
          sourceUrl: "",
          purchasePrice: 0,
          shippingCost: 0,
          platformFees: 0,
          salePrice: 0,
          notes: "",
          status: "draft",
        }}
      />
    </div>
  );
}
