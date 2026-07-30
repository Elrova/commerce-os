import { calculateSupplierOffer } from "@/lib/supplier-offers/finance";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function OfferSummary({
  inputs,
}: {
  inputs: Parameters<typeof calculateSupplierOffer>[0];
}) {
  const result = calculateSupplierOffer(inputs);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {[
          ["Coût complet", currency.format(result.fullUnitCost)],
          ["Investissement min.", currency.format(result.minimumInvestment)],
          ["Marge estimée", currency.format(result.grossMargin)],
          ["Marge", `${result.marginPercent.toFixed(1)} %`],
          ["ROI", `${result.roi.toFixed(1)} %`],
          ["Délai estimé", `${result.estimatedLeadTimeDays} jours`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#e0e4dc] bg-white/70 p-3">
            <p className="text-[10px] text-[#858b81]">{label}</p>
            <p className="mt-1.5 text-sm font-medium">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-[#20211d] p-4 text-white">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Score offre</p>
            <p className="mt-1 text-2xl font-medium">{result.score}<span className="text-xs text-white/40"> / 100</span></p>
          </div>
          <p className="text-right text-[10px] leading-4 text-white/40">
            Coût · ROI · Délai<br />Fiabilité · MOQ
          </p>
        </div>
      </div>
    </div>
  );
}
