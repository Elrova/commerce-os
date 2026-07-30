import { z } from "zod";

const amount = z.coerce.number().min(0, "Le montant doit être positif.");

export const productSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères."),
  sku: z.string().trim().min(2, "Le SKU est requis.").max(80).transform((value) => value.toUpperCase()),
  category: z.string().trim().max(100),
  description: z.string().trim().max(4000),
  purchasePrice: amount,
  shippingCost: amount,
  customsCost: amount,
  paymentFees: amount,
  salePrice: amount,
  stockQuantity: z.coerce.number().int().min(0, "Le stock ne peut pas être négatif."),
  currency: z.string().trim().length(3, "Utilisez un code devise à 3 lettres.").transform((value) => value.toUpperCase()),
  status: z.enum(["draft", "ready", "active", "archived"]),
  notes: z.string().trim().max(4000),
});

export const conversionSchema = productSchema.extend({
  selectedOfferId: z.string().uuid().optional().or(z.literal("")),
  manualConversionConfirmed: z.coerce.boolean(),
});
