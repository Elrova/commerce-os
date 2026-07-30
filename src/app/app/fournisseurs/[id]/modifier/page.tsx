import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { updateSupplier } from "@/app/app/fournisseurs/actions";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { getCurrentContext } from "@/lib/auth/current-context";
import type { Supplier } from "@/lib/suppliers/types";
import { createClient } from "@/lib/supabase/server";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { data } = await supabase.from("suppliers").select("*").eq("id", id).eq("workspace_id", workspace.id).maybeSingle();
  if (!data) notFound();
  const supplier = data as Supplier;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href={`/app/fournisseurs/${id}`} className="inline-flex items-center gap-2 text-xs text-[#73746d]"><ArrowLeft className="size-3.5" />Retour au détail</Link>
      <div className="mb-8 mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#788570]">Modification</p>
        <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em]">{supplier.name}</h1>
      </div>
      <SupplierForm
        action={updateSupplier.bind(null, id)}
        submitLabel="Enregistrer"
        cancelHref={`/app/fournisseurs/${id}`}
        initialValues={{
          name: supplier.name,
          websiteUrl: supplier.website_url ?? "",
          country: supplier.country ?? "",
          contactEmail: supplier.contact_email ?? "",
          minimumOrderQuantity: supplier.minimum_order_quantity ?? 0,
          averageLeadTimeDays: supplier.average_lead_time_days ?? 0,
          reliabilityScore: supplier.reliability_score ?? 0,
          returnPolicy: supplier.return_policy ?? "",
          status: supplier.status,
          notes: supplier.notes ?? "",
        }}
      />
    </div>
  );
}
