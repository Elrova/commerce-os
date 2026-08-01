export const ebayFeeEstimateV1 = { version: "2026-08-v1", variableRate: 0.13, fixedFee: 0.35, source: "ELROVA_ESTIMATE" as const };
export function calculateEbayObservedProfitability(input: { reliableCount: number; medianPrice: number | null; minimumPrice: number | null; maximumPrice: number | null; supplierCost: number; supplierShipping: number | null }) {
  if (input.reliableCount < 3 || input.medianPrice == null) return null;
  const cautiousSalePrice = input.medianPrice * .95;
  const supplierShipping = input.supplierShipping ?? 0;
  const ebayFees = cautiousSalePrice * ebayFeeEstimateV1.variableRate + ebayFeeEstimateV1.fixedFee;
  const margin = cautiousSalePrice - input.supplierCost - supplierShipping - ebayFees;
  const invested = input.supplierCost + supplierShipping;
  return { observedMarketPrice: input.medianPrice, range: [input.minimumPrice,input.maximumPrice] as const, cautiousSalePrice, ebayFees, grossMargin: margin, roi: invested > 0 ? margin/invested*100 : 0, confidence: input.reliableCount >= 10 ? "élevée" : "moyenne", feeConfiguration: ebayFeeEstimateV1, sources: { supplierCost: "SUPPLIER_VERIFIED", supplierShipping: input.supplierShipping == null ? "MISSING" : "SUPPLIER_VERIFIED", marketPrice: "EBAY_VERIFIED", fees: "ELROVA_ESTIMATE" } };
}
