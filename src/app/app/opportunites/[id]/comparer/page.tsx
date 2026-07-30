import Link from "next/link";
import { ArrowLeft, Check, Plus, Scale, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { setPreferredOffer } from "@/app/app/opportunites/[id]/offres/actions";
import { EmptyState, PageHeader, StatusPill } from "@/components/app/page-shell";
import { getCurrentContext } from "@/lib/auth/current-context";
import { calculateSupplierOffer } from "@/lib/supplier-offers/finance";
import type { SupplierOffer } from "@/lib/supplier-offers/types";
import { createClient } from "@/lib/supabase/server";

const sortOptions = {
  score: "Meilleur compromis",
  cost: "Coût complet",
  investment: "Investissement minimal",
  margin: "Marge",
  roi: "ROI",
  leadTime: "Délai",
  reliability: "Fiabilité",
} as const;

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export default async function CompareSupplierOffersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const [{ id }, queryParams] = await Promise.all([params, searchParams]);
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const [{ data: opportunity }, { data: rawOffers, error }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id, name, recommended_sale_price")
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("supplier_offers")
      .select("*, supplier:suppliers(id, name, reliability_score)")
      .eq("opportunity_id", id)
      .eq("workspace_id", workspace.id),
  ]);
  if (!opportunity) notFound();
  if (error) throw new Error(`Impossible de charger les offres : ${error.message}`);

  const offers = ((rawOffers ?? []) as unknown as SupplierOffer[]).map((offer) => ({
    ...offer,
    calculations: calculateSupplierOffer({
      unitPrice: Number(offer.unit_price),
      shippingCost: Number(offer.shipping_cost),
      customsCost: Number(offer.customs_cost),
      fees: Number(offer.platform_or_payment_fees),
      minimumOrderQuantity: offer.minimum_order_quantity,
      leadTimeDays: offer.lead_time_days ?? 0,
      reliabilityScore: offer.supplier?.reliability_score ?? 50,
      salePrice: Number(opportunity.recommended_sale_price ?? 0),
    }),
  }));
  const sortKey = queryParams.sort && queryParams.sort in sortOptions
    ? (queryParams.sort as keyof typeof sortOptions)
    : "score";
  const valueFor = (offer: (typeof offers)[number]) => ({
    score: offer.calculations.score,
    cost: -offer.calculations.fullUnitCost,
    investment: -offer.calculations.minimumInvestment,
    margin: offer.calculations.marginPercent,
    roi: offer.calculations.roi,
    leadTime: -(offer.lead_time_days ?? 0),
    reliability: offer.supplier?.reliability_score ?? 0,
  })[sortKey];
  offers.sort((a, b) => valueFor(b) - valueFor(a));

  const minBy = (selector: (offer: (typeof offers)[number]) => number) =>
    offers.reduce((best, offer) => !best || selector(offer) < selector(best) ? offer : best, undefined as (typeof offers)[number] | undefined);
  const maxBy = (selector: (offer: (typeof offers)[number]) => number) =>
    offers.reduce((best, offer) => !best || selector(offer) > selector(best) ? offer : best, undefined as (typeof offers)[number] | undefined);
  const cheapest = minBy((offer) => offer.calculations.fullUnitCost);
  const bestRoi = maxBy((offer) => offer.calculations.roi);
  const fastest = minBy((offer) => offer.lead_time_days ?? Number.MAX_SAFE_INTEGER);
  const bestScore = maxBy((offer) => offer.calculations.score);

  return (
    <div className="mx-auto max-w-7xl">
      <Link href={`/app/opportunites/${id}`} className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-[#73746d]">
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Retour à l’opportunité
      </Link>
      <PageHeader
        eyebrow="Décision d’achat"
        title="Comparer les offres"
        description={`${opportunity.name} · Prix de vente conseillé ${currency.format(Number(opportunity.recommended_sale_price ?? 0))}`}
        action={
          <Link href={`/app/opportunites/${id}/offres/nouvelle`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#20211d] px-4 text-sm font-medium text-white">
            <Plus aria-hidden="true" className="size-4" />Ajouter une offre
          </Link>
        }
      />

      <form className="mt-6 flex justify-end">
        <select name="sort" defaultValue={sortKey} className="h-10 rounded-xl border border-[#dedcd4] bg-white px-3 text-xs">
          {Object.entries(sortOptions).map(([value, label]) => <option key={value} value={value}>Tri : {label}</option>)}
        </select>
        <button className="ml-2 h-10 rounded-xl bg-[#efeee9] px-4 text-xs font-medium">Trier</button>
      </form>

      {offers.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={<Scale className="size-5" />} title="Aucune offre à comparer" description="Ajoutez au moins une offre fournisseur directement depuis cette opportunité." />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {offers.map((offer) => {
            const badges = [
              offer.id === cheapest?.id && "Moins chère",
              offer.id === bestRoi?.id && "Meilleur ROI",
              offer.id === fastest?.id && "Meilleur délai",
              offer.id === bestScore?.id && "Meilleur compromis",
            ].filter(Boolean) as string[];
            const preferredAction = setPreferredOffer.bind(null, id, offer.id);

            return (
              <article key={offer.id} className={`rounded-2xl border bg-white p-5 sm:p-6 ${offer.is_preferred ? "border-[#8e9c86] ring-2 ring-[#8e9c86]/15" : "border-[#e0ded6]"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium">{offer.supplier?.name ?? "Fournisseur"}</h2>
                      {offer.is_preferred && <StatusPill tone="success">Préférée</StatusPill>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {badges.map((badge) => <span key={badge} className="rounded-full bg-[#f0ede2] px-2 py-1 text-[10px] font-medium text-[#736744]">{badge}</span>)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-medium">{offer.calculations.score}</p>
                    <p className="text-[10px] text-[#898a83]">Score / 100</p>
                  </div>
                </div>

                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-[#efede7] py-5 sm:grid-cols-3">
                  {[
                    ["Prix", currency.format(Number(offer.unit_price))],
                    ["Livraison", currency.format(Number(offer.shipping_cost))],
                    ["Douane", currency.format(Number(offer.customs_cost))],
                    ["Frais", currency.format(Number(offer.platform_or_payment_fees))],
                    ["Coût complet", currency.format(offer.calculations.fullUnitCost)],
                    ["MOQ", String(offer.minimum_order_quantity)],
                    ["Investissement", currency.format(offer.calculations.minimumInvestment)],
                    ["Délai", `${offer.lead_time_days ?? 0} j`],
                    ["Fiabilité", `${offer.supplier?.reliability_score ?? 0} / 100`],
                    ["Marge", `${offer.calculations.marginPercent.toFixed(1)} %`],
                    ["ROI", `${offer.calculations.roi.toFixed(1)} %`],
                    ["Vérifiée", new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(offer.last_checked_at))],
                  ].map(([label, value]) => (
                    <div key={label}><dt className="text-[10px] text-[#92938c]">{label}</dt><dd className="mt-1 text-xs font-medium">{value}</dd></div>
                  ))}
                </dl>

                <div className="mt-5">
                  <div className="flex items-center gap-2 text-xs font-medium"><Sparkles className="size-3.5 text-[#788570]" />Détail du score</div>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {offer.calculations.scoreDetails.map((criterion) => (
                      <div key={criterion.key} title={`${criterion.label}: ${criterion.value}`} className="rounded-lg bg-[#f6f5f1] p-2 text-center">
                        <p className="truncate text-[9px] text-[#898a83]">{criterion.label}</p>
                        <p className="mt-1 text-xs font-medium">{criterion.points}/{criterion.weight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <form action={preferredAction} className="mt-5 flex justify-end">
                  <button disabled={offer.is_preferred} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#dedcd4] px-3.5 text-xs font-medium disabled:bg-[#edf0e9] disabled:text-[#60705a]">
                    <Check className="size-3.5" />
                    {offer.is_preferred ? "Offre préférée" : "Choisir cette offre"}
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
