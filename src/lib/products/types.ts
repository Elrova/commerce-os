export const productStatusLabels = {
  draft: "Brouillon",
  ready: "Prêt",
  active: "Actif",
  archived: "Archivé",
} as const;

export type ProductStatus = keyof typeof productStatusLabels;

export type ProductFormValues = {
  name: string;
  sku: string;
  category: string;
  description: string;
  purchasePrice: number;
  shippingCost: number;
  customsCost: number;
  paymentFees: number;
  salePrice: number;
  stockQuantity: number;
  currency: string;
  status: ProductStatus;
  notes: string;
};
