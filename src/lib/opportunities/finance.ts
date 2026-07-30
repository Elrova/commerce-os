export type FinancialInputs = {
  purchasePrice: number;
  shippingCost: number;
  platformFees: number;
  salePrice: number;
};

export type ScoreCriterion = {
  key: "margin" | "roi";
  label: string;
  value: number;
  target: number;
  weight: number;
  points: number;
};

export type OpportunityFinancials = {
  totalCost: number;
  grossMargin: number;
  marginPercent: number;
  roi: number;
  score: number;
  scoreDetails: ScoreCriterion[];
};

const scoreRules = [
  { key: "margin", label: "Marge", target: 40, weight: 50 },
  { key: "roi", label: "ROI", target: 100, weight: 50 },
] as const;

function finiteOrZero(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function calculateOpportunityFinancials(
  inputs: FinancialInputs,
): OpportunityFinancials {
  const purchasePrice = finiteOrZero(inputs.purchasePrice);
  const shippingCost = finiteOrZero(inputs.shippingCost);
  const platformFees = finiteOrZero(inputs.platformFees);
  const salePrice = finiteOrZero(inputs.salePrice);
  const totalCost = purchasePrice + shippingCost + platformFees;
  const grossMargin = salePrice - totalCost;
  const marginPercent = salePrice > 0 ? (grossMargin / salePrice) * 100 : 0;
  const roi = totalCost > 0 ? (grossMargin / totalCost) * 100 : 0;

  const values = { margin: marginPercent, roi };
  const scoreDetails = scoreRules.map((rule) => ({
    ...rule,
    value: round(values[rule.key]),
    points: round(
      Math.max(0, Math.min(1, values[rule.key] / rule.target)) * rule.weight,
      1,
    ),
  }));
  const score = Math.round(
    scoreDetails.reduce((total, criterion) => total + criterion.points, 0),
  );

  return {
    totalCost: round(totalCost),
    grossMargin: round(grossMargin),
    marginPercent: round(marginPercent),
    roi: round(roi),
    score,
    scoreDetails,
  };
}
