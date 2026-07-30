export type OfferInputs = {
  unitPrice: number;
  shippingCost: number;
  customsCost: number;
  fees: number;
  minimumOrderQuantity: number;
  leadTimeDays: number;
  reliabilityScore: number;
  salePrice: number;
};

export type OfferScoreCriterion = {
  key: "cost" | "roi" | "leadTime" | "reliability" | "moq";
  label: string;
  value: number;
  weight: number;
  points: number;
};

const rules = [
  { key: "cost", label: "Coût complet", weight: 30 },
  { key: "roi", label: "ROI", weight: 25 },
  { key: "leadTime", label: "Délai", weight: 15 },
  { key: "reliability", label: "Fiabilité", weight: 20 },
  { key: "moq", label: "MOQ", weight: 10 },
] as const;

const safe = (value: number) =>
  Number.isFinite(value) ? Math.max(0, value) : 0;
const round = (value: number, precision = 2) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export function calculateSupplierOffer(inputs: OfferInputs) {
  const unitPrice = safe(inputs.unitPrice);
  const shippingCost = safe(inputs.shippingCost);
  const customsCost = safe(inputs.customsCost);
  const fees = safe(inputs.fees);
  const moq = Math.max(1, Math.round(safe(inputs.minimumOrderQuantity)));
  const leadTime = safe(inputs.leadTimeDays);
  const reliability = Math.min(100, safe(inputs.reliabilityScore));
  const salePrice = safe(inputs.salePrice);
  const fullUnitCost = unitPrice + shippingCost + customsCost + fees;
  const minimumInvestment = fullUnitCost * moq;
  const grossMargin = salePrice - fullUnitCost;
  const marginPercent = salePrice > 0 ? (grossMargin / salePrice) * 100 : 0;
  const roi = fullUnitCost > 0 ? (grossMargin / fullUnitCost) * 100 : 0;

  const normalized = {
    cost: salePrice > 0 ? Math.max(0, 1 - fullUnitCost / salePrice) : 0,
    roi: Math.min(1, Math.max(0, roi) / 100),
    leadTime: Math.max(0, 1 - leadTime / 90),
    reliability: reliability / 100,
    moq: Math.max(0, 1 - (moq - 1) / 499),
  };
  const scoreDetails: OfferScoreCriterion[] = rules.map((rule) => ({
    ...rule,
    value:
      rule.key === "cost"
        ? round(fullUnitCost)
        : rule.key === "roi"
          ? round(roi)
          : rule.key === "leadTime"
            ? leadTime
            : rule.key === "reliability"
              ? reliability
              : moq,
    points: round(normalized[rule.key] * rule.weight, 1),
  }));

  return {
    fullUnitCost: round(fullUnitCost),
    minimumInvestment: round(minimumInvestment),
    grossMargin: round(grossMargin),
    marginPercent: round(marginPercent),
    roi: round(roi),
    estimatedLeadTimeDays: leadTime,
    score: Math.round(scoreDetails.reduce((sum, item) => sum + item.points, 0)),
    scoreDetails,
  };
}
