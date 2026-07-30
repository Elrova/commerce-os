import { normalizedSupplierProductSchema, type NormalizedSupplierProduct } from "../schemas";
import { matterhornProductSchema, type MatterhornProduct } from "./schemas";

function validUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null; }
  catch { return null; }
}
const cleanText = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const isActive = (value: MatterhornProduct["active"]) => value === true || value === 1 || String(value).toLowerCase() === "true" || String(value).toUpperCase() === "Y";

export function normalizeMatterhornProduct(input: unknown): NormalizedSupplierProduct {
  const product = matterhornProductSchema.parse(input);
  const price = product.prices.EUR;
  if (price == null) throw new Error(`Le produit Matterhorn ${product.id} ne fournit pas de prix EUR.`);
  const variants = product.variants.map((variant) => ({
    externalId: variant.variant_uid,
    sku: variant.variant_uid,
    label: variant.name,
    attributes: { size: variant.name, ...(product.color ? { color: product.color } : {}) },
    stock: variant.stock,
    price,
  }));
  const variantStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
  const stock = variants.length ? variantStock : (product.stock_total ?? 0);
  const eans = product.variants.map((variant) => variant.ean).filter((ean): ean is string => Boolean(ean));
  const imageUrls = product.images.map(validUrl).filter((url): url is string => Boolean(url));
  const productUrl = product.url ? validUrl(product.url) : null;
  return normalizedSupplierProductSchema.parse({
    externalId: product.id, supplierId: "matterhorn", sku: product.id,
    ean: eans[0] ?? null, gtin: eans[0] ?? null, brand: product.brand?.trim() || null,
    manufacturer: product.brand?.trim() || null, title: product.name.trim(),
    description: cleanText(product.description), category: product.category_name.trim() || "Sans catégorie",
    attributes: { ...(product.color ? { color: product.color } : {}), ...(product.category_path ? { categoryPath: product.category_path } : {}) },
    images: imageUrls, variants, purchasePriceExVat: price, purchasePriceIncVat: null,
    recommendedRetailPrice: null, currency: "EUR", stock,
    stockStatus: stock === 0 ? "out_of_stock" : stock <= 5 ? "low_stock" : "in_stock",
    minimumOrderQuantity: 1, weight: null, dimensions: null, shippingCost: null,
    shippingCountries: [], shipsFromCountry: null, estimatedDeliveryMinDays: null,
    estimatedDeliveryMaxDays: null, productUrl, active: isActive(product.active) && stock > 0,
    rawData: product, lastSyncedAt: new Date().toISOString(),
  });
}
