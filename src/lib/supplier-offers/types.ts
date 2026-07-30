export type SupplierOffer = {
  id: string;
  workspace_id: string;
  supplier_id: string;
  opportunity_id: string | null;
  product_id: string | null;
  supplier_product_url: string | null;
  supplier_sku: string | null;
  currency: string;
  unit_price: number;
  shipping_cost: number;
  customs_cost: number;
  platform_or_payment_fees: number;
  sample_price: number | null;
  minimum_order_quantity: number;
  lead_time_days: number | null;
  available_stock: number | null;
  rating: number | null;
  last_checked_at: string;
  is_preferred: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    name: string;
    reliability_score: number | null;
  } | null;
};

export type SupplierOfferFormValues = {
  supplierId: string;
  quickSupplierName: string;
  productUrl: string;
  supplierSku: string;
  unitPrice: number;
  shippingCost: number;
  customsCost: number;
  fees: number;
  samplePrice: number;
  minimumOrderQuantity: number;
  leadTimeDays: number;
  availableStock: number;
  rating: number;
  lastCheckedAt: string;
  notes: string;
  isPreferred: boolean;
};
