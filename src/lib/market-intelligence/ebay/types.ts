export type EbayEnvironment = "sandbox" | "production";
export type EbaySearchStrategy = "gtin" | "brand_reference" | "title";
export type MarketplaceMatchLevel = "exact" | "strong" | "possible" | "weak";
export type NormalizedMarketplaceListing = {
  marketplace: "ebay"; marketplaceId: string; externalId: string; legacyItemId: string | null;
  title: string; subtitle: string | null; itemWebUrl: string | null; imageUrl: string | null;
  additionalImages: string[]; sellerUsername: string | null; sellerFeedbackPercentage: number | null;
  sellerFeedbackScore: number | null; price: number; currency: string; shippingCost: number | null;
  totalDeliveredPrice: number | null; condition: string | null; buyingOptions: string[];
  categoryId: string | null; categoryName: string | null; brand: string | null; gtin: string | null;
  ean: string | null; available: boolean | null; estimatedDeliveryMin: string | null;
  estimatedDeliveryMax: string | null; itemLocationCountry: string | null; returnsAccepted: boolean | null;
  rawData: Record<string, unknown>; retrievedAt: string;
};
export type ListingMatch = { listing: NormalizedMarketplaceListing; matchScore: number; level: MarketplaceMatchLevel; reasons: string[]; warnings: string[] };
export type EbayMarketMetrics = { resultCount: number; reliableResultCount: number; minimumPrice: number | null; medianPrice: number | null; averagePrice: number | null; maximumPrice: number | null; averageKnownShipping: number | null; freeShippingCount: number; newCount: number; usedCount: number; retrievedAt: string };
