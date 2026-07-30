import { z } from "zod";

export const supplierCapabilitiesSchema = z.object({
  catalog: z.boolean(), search: z.boolean(), stock: z.boolean(), prices: z.boolean(),
  shippingQuote: z.boolean(), orderCreation: z.boolean(), orderCancellation: z.boolean(),
  tracking: z.boolean(), returns: z.boolean(), webhooks: z.boolean(),
  neutralPackaging: z.boolean(), marketplaceCompatible: z.boolean(),
});

const moneySchema = z.number().nonnegative();
const dimensionsSchema = z.object({ length: z.number().nonnegative(), width: z.number().nonnegative(), height: z.number().nonnegative(), unit: z.enum(["cm", "mm"]) });
export const normalizedSupplierProductSchema = z.object({
  externalId: z.string().min(1), supplierId: z.string().min(1), sku: z.string().min(1),
  ean: z.string().nullable(), gtin: z.string().nullable(), brand: z.string().nullable(),
  manufacturer: z.string().nullable(), title: z.string().min(1), description: z.string(),
  category: z.string(), attributes: z.record(z.string(), z.unknown()), images: z.array(z.string()),
  variants: z.array(z.object({ externalId: z.string(), sku: z.string(), label: z.string(), attributes: z.record(z.string(), z.string()), stock: z.number().int().nonnegative(), price: moneySchema })),
  purchasePriceExVat: moneySchema, purchasePriceIncVat: moneySchema.nullable(),
  recommendedRetailPrice: moneySchema.nullable(), currency: z.string().length(3),
  stock: z.number().int().nonnegative(), stockStatus: z.enum(["in_stock", "low_stock", "out_of_stock", "backorder"]),
  minimumOrderQuantity: z.number().int().positive(), weight: z.number().nonnegative().nullable(),
  dimensions: dimensionsSchema.nullable(), shippingCost: moneySchema.nullable(),
  shippingCountries: z.array(z.string().length(2)), shipsFromCountry: z.string().length(2).nullable(),
  estimatedDeliveryMinDays: z.number().int().nonnegative().nullable(),
  estimatedDeliveryMaxDays: z.number().int().nonnegative().nullable(),
  productUrl: z.string().nullable(), active: z.boolean(), rawData: z.record(z.string(), z.unknown()),
  lastSyncedAt: z.string().datetime(),
});

export const supplierOrderItemSchema = z.object({ externalProductId: z.string(), sku: z.string(), quantity: z.number().int().positive(), unitPrice: moneySchema });
export const supplierOrderSchema = z.object({ id: z.string(), externalReference: z.string(), status: z.enum(["pending", "accepted", "processing", "shipped", "cancelled", "failed"]), currency: z.string().length(3), total: moneySchema, items: z.array(supplierOrderItemSchema), createdAt: z.string().datetime() });
export const supplierTrackingSchema = z.object({ orderId: z.string(), carrier: z.string().nullable(), trackingNumber: z.string().nullable(), trackingUrl: z.string().nullable(), status: z.string(), updatedAt: z.string().datetime() });
export const supplierShippingQuoteSchema = z.object({ country: z.string().length(2), amount: moneySchema, currency: z.string().length(3), minDays: z.number().int().nonnegative(), maxDays: z.number().int().nonnegative(), service: z.string() });
export const supplierCategorySchema = z.object({ id: z.string(), name: z.string(), parentId: z.string().nullable() });
export const supplierConnectionTestSchema = z.object({ success: z.boolean(), latencyMs: z.number().nonnegative(), message: z.string(), testedAt: z.string().datetime() });

export type SupplierCapabilities = z.infer<typeof supplierCapabilitiesSchema>;
export type NormalizedSupplierProduct = z.infer<typeof normalizedSupplierProductSchema>;
export type SupplierOrderItem = z.infer<typeof supplierOrderItemSchema>;
export type SupplierOrder = z.infer<typeof supplierOrderSchema>;
export type SupplierTracking = z.infer<typeof supplierTrackingSchema>;
export type SupplierShippingQuote = z.infer<typeof supplierShippingQuoteSchema>;
export type SupplierCategory = z.infer<typeof supplierCategorySchema>;
export type SupplierConnectionTest = z.infer<typeof supplierConnectionTestSchema>;
