export function calculateProductFinancials(input: {
  purchasePrice: number;
  shippingCost: number;
  customsCost: number;
  paymentFees: number;
  salePrice: number;
}) {
  const totalUnitCost =
    input.purchasePrice +
    input.shippingCost +
    input.customsCost +
    input.paymentFees;
  const marginAmount = input.salePrice - totalUnitCost;
  const marginPercent =
    input.salePrice > 0 ? (marginAmount / input.salePrice) * 100 : 0;
  const roiPercent =
    totalUnitCost > 0 ? (marginAmount / totalUnitCost) * 100 : 0;

  return {
    totalUnitCost: Number(totalUnitCost.toFixed(2)),
    marginAmount: Number(marginAmount.toFixed(2)),
    marginPercent: Number(marginPercent.toFixed(2)),
    roiPercent: Number(roiPercent.toFixed(2)),
  };
}
