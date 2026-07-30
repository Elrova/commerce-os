export type MarketplaceCode = "amazon-fr" | "ebay-fr" | "direct";
export type EstimateSource = "configured_estimate" | "official_api";
export type MarketplaceFeeConfig = { label: string; percentage: number; fixedFee: number; vatRate: number; source: EstimateSource };
export const marketplaceFeeConfigs: Record<MarketplaceCode, MarketplaceFeeConfig> = {
  "amazon-fr": { label: "Amazon France", percentage: 15, fixedFee: 0, vatRate: 20, source: "configured_estimate" },
  "ebay-fr": { label: "eBay France", percentage: 12, fixedFee: 0.35, vatRate: 20, source: "configured_estimate" },
  direct: { label: "Boutique directe", percentage: 2.9, fixedFee: 0.3, vatRate: 20, source: "configured_estimate" },
};
export function calculateMarketplaceProfitability(input: { productCostExVat: number; shippingCostExVat: number; salePriceIncVat: number; marketplace: MarketplaceCode; quantity?: number }, override?: Partial<MarketplaceFeeConfig>) {
  const config = { ...marketplaceFeeConfigs[input.marketplace], ...override };
  const quantity = input.quantity ?? 1;
  const vat = input.salePriceIncVat - input.salePriceIncVat / (1 + config.vatRate / 100);
  const marketplaceFees = input.salePriceIncVat * config.percentage / 100;
  const totalCost = input.productCostExVat + input.shippingCostExVat + marketplaceFees + config.fixedFee + vat;
  const grossMargin = input.salePriceIncVat - input.productCostExVat - input.shippingCostExVat;
  const netMargin = input.salePriceIncVat - totalCost;
  const marginPercent = input.salePriceIncVat > 0 ? netMargin / input.salePriceIncVat * 100 : 0;
  const invested = input.productCostExVat + input.shippingCostExVat;
  const roi = invested > 0 ? netMargin / invested * 100 : 0;
  const variableRate = (config.percentage + config.vatRate) / 100;
  const minimumSalePrice = (input.productCostExVat + input.shippingCostExVat + config.fixedFee) / Math.max(0.01, 1 - variableRate);
  return { productCost: input.productCostExVat, shippingCost: input.shippingCostExVat, vat, marketplaceFees, fixedFees: config.fixedFee, grossMargin, estimatedNetMargin: netMargin, marginPercent, roi, requiredCash: invested * quantity, minimumSalePrice, recommendedSalePrice: minimumSalePrice / 0.8, feeSource: config.source, feeLabel: config.label };
}
