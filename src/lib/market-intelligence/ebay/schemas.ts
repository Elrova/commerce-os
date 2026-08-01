import { z } from "zod";
const amountSchema = z.object({ value: z.string(), currency: z.string() }).passthrough();
const imageSchema = z.object({ imageUrl: z.string().url() }).passthrough();
const aspectSchema = z.object({ name: z.string(), value: z.string() }).passthrough();
export const ebayTokenResponseSchema = z.object({ access_token: z.string().min(1), expires_in: z.number().positive(), token_type: z.string() }).passthrough();
export const ebayItemSummarySchema = z.object({
  itemId: z.string(), legacyItemId: z.string().optional(), title: z.string(), shortDescription: z.string().optional(),
  itemWebUrl: z.string().url().optional(), image: imageSchema.optional(), additionalImages: z.array(imageSchema).optional().default([]),
  seller: z.object({ username: z.string().optional(), feedbackPercentage: z.string().optional(), feedbackScore: z.number().optional() }).passthrough().optional(),
  price: amountSchema, shippingOptions: z.array(z.object({ shippingCost: amountSchema.optional(), minEstimatedDeliveryDate: z.string().optional(), maxEstimatedDeliveryDate: z.string().optional() }).passthrough()).optional().default([]),
  condition: z.string().optional(), buyingOptions: z.array(z.string()).optional().default([]),
  categories: z.array(z.object({ categoryId: z.string(), categoryName: z.string().optional() }).passthrough()).optional().default([]),
  localizedAspects: z.array(aspectSchema).optional().default([]), itemLocation: z.object({ country: z.string().optional() }).passthrough().optional(),
  itemEndDate: z.string().optional(), estimatedAvailabilities: z.array(z.object({ estimatedAvailabilityStatus: z.string().optional() }).passthrough()).optional(),
}).passthrough();
export const ebaySearchResponseSchema = z.object({ href: z.string().optional(), total: z.number().nonnegative().optional().default(0), limit: z.number().optional(), offset: z.number().optional(), next: z.string().optional(), itemSummaries: z.array(ebayItemSummarySchema).optional().default([]) }).passthrough();
export const ebayItemResponseSchema = ebayItemSummarySchema.extend({ subtitle: z.string().optional(), returnTerms: z.object({ returnsAccepted: z.boolean().optional() }).passthrough().optional() }).passthrough();
export const normalizedMarketplaceListingSchema = z.object({
  marketplace: z.literal("ebay"), marketplaceId: z.string(), externalId: z.string(), legacyItemId: z.string().nullable(), title: z.string(), subtitle: z.string().nullable(), itemWebUrl: z.string().nullable(), imageUrl: z.string().nullable(), additionalImages: z.array(z.string()), sellerUsername: z.string().nullable(), sellerFeedbackPercentage: z.number().nullable(), sellerFeedbackScore: z.number().nullable(), price: z.number(), currency: z.string(), shippingCost: z.number().nullable(), totalDeliveredPrice: z.number().nullable(), condition: z.string().nullable(), buyingOptions: z.array(z.string()), categoryId: z.string().nullable(), categoryName: z.string().nullable(), brand: z.string().nullable(), gtin: z.string().nullable(), ean: z.string().nullable(), available: z.boolean().nullable(), estimatedDeliveryMin: z.string().nullable(), estimatedDeliveryMax: z.string().nullable(), itemLocationCountry: z.string().nullable(), returnsAccepted: z.boolean().nullable(), rawData: z.record(z.string(),z.unknown()), retrievedAt: z.string(),
});
export type EbayItemPayload = z.infer<typeof ebayItemResponseSchema>;
