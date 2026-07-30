import { z } from "zod";

const money = z.coerce.number().min(0).max(10_000_000);
const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().min(0).optional(),
);

export const supplierOfferSchema = z
  .object({
    supplierId: z.union([z.literal(""), z.uuid()]),
    quickSupplierName: z.string().trim().max(160),
    productUrl: z.union([z.literal(""), z.url("L’URL produit n’est pas valide.")]),
    supplierSku: z.string().trim().max(160),
    unitPrice: money,
    shippingCost: money,
    customsCost: money,
    fees: money,
    samplePrice: optionalNumber,
    minimumOrderQuantity: z.coerce.number().int().min(1).max(10_000_000),
    leadTimeDays: z.coerce.number().int().min(0).max(3650),
    availableStock: optionalNumber.pipe(z.number().int().optional()),
    rating: optionalNumber.pipe(z.number().max(5).optional()),
    lastCheckedAt: z.iso.date(),
    notes: z.string().trim().max(5000),
    isPreferred: z.boolean(),
  })
  .refine((data) => Boolean(data.supplierId) !== Boolean(data.quickSupplierName), {
    path: ["supplierId"],
    message: "Sélectionnez un fournisseur ou créez-en un rapidement.",
  });
