import { z } from "zod";
import { opportunityStatuses } from "@/lib/opportunities/types";

const moneyField = z.coerce
  .number({ error: "Saisissez un montant valide." })
  .min(0, "Le montant ne peut pas être négatif.")
  .max(10_000_000, "Le montant est trop élevé.");

export const opportunitySchema = z
  .object({
    name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(160),
    category: z.string().trim().max(100),
    sourceUrl: z
      .union([z.literal(""), z.url("L’URL source n’est pas valide.")])
      .transform((value) => value.trim()),
    purchasePrice: moneyField,
    shippingCost: moneyField,
    platformFees: moneyField,
    salePrice: moneyField,
    notes: z.string().trim().max(5000, "Les notes sont trop longues."),
    status: z.enum(opportunityStatuses),
  })
  .refine(
    ({ salePrice }) => salePrice > 0,
    { path: ["salePrice"], message: "Le prix conseillé doit être supérieur à zéro." },
  );
