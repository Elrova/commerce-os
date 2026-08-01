import { calculateElrovaProductScore } from "./score";

export type ProductProfitabilityInput = {
  supplierPrice: number;
  shippingCost: number | null;
  recommendedRetailPrice: number | null;
};

export function estimateProductProfitability(input: ProductProfitabilityInput) {
  const supplierPrice = Math.max(0, input.supplierPrice);
  const estimatedSalePrice = input.recommendedRetailPrice ?? supplierPrice * 2;
  const shippingFees = input.shippingCost ?? 0;
  const marketplaceFees = 0;
  const grossMargin = estimatedSalePrice - supplierPrice - shippingFees - marketplaceFees;
  const invested = supplierPrice + shippingFees;

  return {
    supplierPrice,
    estimatedSalePrice,
    grossMargin,
    roi: invested > 0 ? (grossMargin / invested) * 100 : 0,
    marketplaceFees,
    shippingFees,
    score: calculateElrovaProductScore(),
    assumptions: {
      salePrice: input.recommendedRetailPrice == null,
      marketplaceFees: true,
      shippingFees: input.shippingCost == null,
    },
  };
}
