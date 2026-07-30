import { Plus, TrendingUp } from "lucide-react";
import { AppButton, PageHeader, StatusPill } from "@/components/app/page-shell";
import { demoOpportunities } from "@/lib/demo-data";

export default function OpportunitiesPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Sourcing"
        title="Opportunités"
        description="Centralisez les signaux marché, estimez la rentabilité et choisissez les produits à approfondir."
        action={<AppButton><Plus aria-hidden="true" className="mr-2 size-4" />Ajouter une piste</AppButton>}
      />
      <div className="mt-8 overflow-hidden rounded-2xl border border-[#e0ded6] bg-white">
        <div className="grid grid-cols-[1fr_auto] border-b border-[#ebe9e2] px-5 py-4 text-xs text-[#85867f] sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <span>Produit</span><span className="hidden sm:block">Signal</span><span className="hidden sm:block">Marge estimée</span><span>Étape</span>
        </div>
        {demoOpportunities.map((item) => (
          <div key={item.name} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[#f0eee8] px-5 py-5 last:border-0 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div><p className="text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-[#8a8b84] sm:hidden">{item.signal} · {item.margin}</p></div>
            <span className="hidden text-sm text-[#696a64] sm:block">{item.signal}</span>
            <span className="hidden text-sm font-medium sm:block">{item.margin}</span>
            <StatusPill tone={item.stage === "Calcul terminé" ? "success" : "neutral"}>{item.stage}</StatusPill>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-[#85867f]">
        <TrendingUp aria-hidden="true" className="size-4 text-[#788570]" />
        Les données sont locales et servent uniquement à valider le flux de travail.
      </div>
    </div>
  );
}
