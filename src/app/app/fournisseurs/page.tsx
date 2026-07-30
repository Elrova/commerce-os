import { Building2, Plus } from "lucide-react";
import { AppButton, PageHeader } from "@/components/app/page-shell";
import { demoSuppliers } from "@/lib/demo-data";

export default function SuppliersPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Approvisionnement" title="Fournisseurs" description="Suivez vos sources d’approvisionnement, leurs délais et les produits associés." action={<AppButton><Plus aria-hidden="true" className="mr-2 size-4" />Ajouter</AppButton>} />
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {demoSuppliers.map((supplier) => (
          <article key={supplier.name} className="flex items-start gap-5 rounded-2xl border border-[#e0ded6] bg-white p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#edf0e9] text-[#708069]"><Building2 aria-hidden="true" className="size-5" /></span>
            <div className="flex-1"><h2 className="font-medium">{supplier.name}</h2><p className="mt-1 text-sm text-[#777871]">{supplier.country}</p><div className="mt-6 flex gap-8 text-xs"><p><span className="block text-[#979891]">Délai moyen</span><span className="mt-1 block font-medium">{supplier.leadTime}</span></p><p><span className="block text-[#979891]">Produits</span><span className="mt-1 block font-medium">{supplier.products}</span></p></div></div>
          </article>
        ))}
      </div>
    </div>
  );
}
