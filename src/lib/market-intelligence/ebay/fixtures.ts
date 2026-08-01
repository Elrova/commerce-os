import type { NormalizedMarketplaceListing } from "./types";

export const ebayTokenFixture = {
  access_token: "fixture-application-token",
  expires_in: 7_200,
  token_type: "Application Access Token",
};

export const ebayBrowseItemFixture = {
  itemId: "v1|fixture-item|0",
  legacyItemId: "fixture-item",
  title: "Acme Robe longue SKU-42",
  itemWebUrl: "https://www.ebay.fr/itm/fixture-item",
  image: { imageUrl: "https://i.ebayimg.com/images/g/fixture/s-l500.jpg" },
  seller: { username: "fixture-seller", feedbackPercentage: "99.8", feedbackScore: 1200 },
  price: { value: "49.90", currency: "EUR" },
  shippingOptions: [{ shippingCost: { value: "4.90", currency: "EUR" } }],
  condition: "Neuf",
  buyingOptions: ["FIXED_PRICE"],
  categories: [{ categoryId: "15724", categoryName: "Robes" }],
  localizedAspects: [{ name: "Marque", value: "Acme" }, { name: "EAN", value: "1234567890123" }],
  itemLocation: { country: "FR" },
};

export const ebayBrowseResponseFixture = {
  total: 1,
  limit: 20,
  offset: 0,
  next: "https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search?offset=20",
  itemSummaries: [ebayBrowseItemFixture],
};

export function normalizedListingFixture(overrides: Partial<NormalizedMarketplaceListing> = {}): NormalizedMarketplaceListing {
  return {
    marketplace: "ebay", marketplaceId: "EBAY_FR", externalId: "fixture-item", legacyItemId: "fixture-item",
    title: "Acme Robe longue SKU-42", subtitle: null, itemWebUrl: "https://www.ebay.fr/itm/fixture-item",
    imageUrl: null, additionalImages: [], sellerUsername: "fixture-seller", sellerFeedbackPercentage: 99.8,
    sellerFeedbackScore: 1200, price: 49.9, currency: "EUR", shippingCost: 4.9, totalDeliveredPrice: 54.8,
    condition: "Neuf", buyingOptions: ["FIXED_PRICE"], categoryId: "15724", categoryName: "Robes",
    brand: "Acme", gtin: null, ean: "1234567890123", available: true, estimatedDeliveryMin: null,
    estimatedDeliveryMax: null, itemLocationCountry: "FR", returnsAccepted: null, rawData: {},
    retrievedAt: "2026-08-01T00:00:00.000Z", ...overrides,
  };
}
