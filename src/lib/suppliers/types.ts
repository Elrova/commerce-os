export const supplierStatuses = [
  "prospect",
  "active",
  "paused",
  "archived",
] as const;

export type SupplierStatus = (typeof supplierStatuses)[number];

export const supplierStatusLabels: Record<SupplierStatus, string> = {
  prospect: "Prospect",
  active: "Actif",
  paused: "En pause",
  archived: "Archivé",
};

export type Supplier = {
  id: string;
  workspace_id: string;
  name: string;
  website_url: string | null;
  country: string | null;
  contact_email: string | null;
  minimum_order_quantity: number | null;
  average_lead_time_days: number | null;
  reliability_score: number | null;
  return_policy: string | null;
  status: SupplierStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierFormValues = {
  name: string;
  websiteUrl: string;
  country: string;
  contactEmail: string;
  minimumOrderQuantity: number;
  averageLeadTimeDays: number;
  reliabilityScore: number;
  returnPolicy: string;
  status: SupplierStatus;
  notes: string;
};
