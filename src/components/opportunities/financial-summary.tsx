import { calculateOpportunityFinancials } from "@/lib/opportunities/finance";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function FinancialSummary({
  purchasePrice,
  shippingCost,
  platformFees,
  salePrice,
  compact = false,
}: {
  purchasePrice: number;
  shippingCost: number;
  platformFees: number;
  salePrice: number;
  compact?: boolean;
}) {
  const financials = calculateOpportunityFinancials({
    purchasePrice,
    shippingCost,
    platformFees,
    salePrice,
  });

  return (
    <div>
      <div className={`grid gap-3 ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
        {[
          ["Coût total", currencyFormatter.format(financials.totalCost)],
          ["Marge brute", currencyFormatter.format(financials.grossMargin)],
          ["Marge", `${financials.marginPercent.toFixed(1)} %`],
          ["ROI", `${financials.roi.toFixed(1)} %`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-[#e7e5de] bg-white/70 p-3.5"
          >
            <p className="text-[11px] text-[#898a83]">{label}</p>
            <p className="mt-1.5 text-base font-medium tracking-tight">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-[#20211d] p-4 text-white">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
              Score ELROVA
            </p>
            <p className="mt-1 text-2xl font-medium">{financials.score}<span className="text-sm text-white/35"> / 100</span></p>
          </div>
          <div className="flex gap-4 text-right">
            {financials.scoreDetails.map((criterion) => (
              <div key={criterion.key}>
                <p className="text-[10px] text-white/40">{criterion.label}</p>
                <p className="mt-1 text-xs font-medium">
                  {criterion.points}/{criterion.weight}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#aeba9f] transition-[width] duration-300"
            style={{ width: `${financials.score}%` }}
          />
        </div>
      </div>
    </div>
  );
}
