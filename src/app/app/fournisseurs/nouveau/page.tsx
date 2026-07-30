import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupplier } from "@/app/app/fournisseurs/actions";
import { SupplierForm } from "@/components/suppliers/supplier-form";

export default function NewSupplierPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/app/fournisseurs" className="inline-flex items-center gap-2 text-xs text-[#73746d]"><ArrowLeft className="size-3.5" />Fournisseurs</Link>
      <div className="mb-8 mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#788570]">Nouveau partenaire</p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em]">Créer un fournisseur</h1>
      </div>
      <SupplierForm
        action={createSupplier}
        submitLabel="Créer le fournisseur"
        cancelHref="/app/fournisseurs"
        initialValues={{ name: "", websiteUrl: "", country: "", contactEmail: "", minimumOrderQuantity: 1, averageLeadTimeDays: 0, reliabilityScore: 50, returnPolicy: "", status: "prospect", notes: "" }}
      />
    </div>
  );
}
