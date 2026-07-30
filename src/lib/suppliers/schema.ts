import { z } from "zod";
import { supplierStatuses } from "@/lib/suppliers/types";

export const supplierSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(160),
  websiteUrl: z.union([z.literal(""), z.url("L’URL du site n’est pas valide.")]),
  country: z.string().trim().max(100),
  contactEmail: z.union([z.literal(""), z.email("L’adresse e-mail n’est pas valide.")]),
  minimumOrderQuantity: z.coerce.number().int().min(0).max(10_000_000),
  averageLeadTimeDays: z.coerce.number().int().min(0).max(3650),
  reliabilityScore: z.coerce.number().int().min(0).max(100),
  returnPolicy: z.string().trim().max(5000),
  status: z.enum(supplierStatuses),
  notes: z.string().trim().max(5000),
});
