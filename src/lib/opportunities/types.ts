export const opportunityStatuses = [
  "draft",
  "qualified",
  "rejected",
  "converted",
] as const;

export type OpportunityStatus = (typeof opportunityStatuses)[number];

export type Opportunity = {
  id: string;
  workspace_id: string;
  name: string;
  category: string | null;
  source_url: string | null;
  estimated_purchase_price: number | null;
  estimated_shipping_cost: number | null;
  estimated_platform_fees: number | null;
  recommended_sale_price: number | null;
  estimated_margin: number | null;
  score: number | null;
  status: OpportunityStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OpportunityFormValues = {
  name: string;
  category: string;
  sourceUrl: string;
  purchasePrice: number;
  shippingCost: number;
  platformFees: number;
  salePrice: number;
  notes: string;
  status: OpportunityStatus;
};

export const opportunityStatusLabels: Record<OpportunityStatus, string> = {
  draft: "Brouillon",
  qualified: "Qualifiée",
  rejected: "Écartée",
  converted: "Convertie",
};
