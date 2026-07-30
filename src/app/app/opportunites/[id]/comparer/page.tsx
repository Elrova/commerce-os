import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/page-shell";

export default async function CompareSupplierOffersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href={`/app/opportunites/${id}`}
        className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-[#73746d]"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Retour à l’opportunité
      </Link>
      <PageHeader
        eyebrow="Fournisseurs"
        title="Comparer les offres"
        description="Le point d’entrée du futur comparateur est prêt. Les critères pondérés seront développés avec le module fournisseurs."
      />
      <div className="mt-8">
        <EmptyState
          icon={<Scale aria-hidden="true" className="size-5" />}
          title="Comparateur en préparation"
          description="Ajoutez plusieurs offres fournisseur à un produit pour préparer leur comparaison détaillée."
        />
      </div>
    </div>
  );
}
