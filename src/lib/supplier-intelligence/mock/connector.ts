import type { CreateSupplierOrderInput, ProductSearch, SupplierConnector } from "../connector";
import { ProductNotFoundError, OutOfStockError } from "../errors";
import { normalizedSupplierProductSchema, supplierConnectionTestSchema, supplierOrderSchema, supplierShippingQuoteSchema, supplierTrackingSchema } from "../schemas";
import { mockEuropeanProducts } from "./products";

export class MockEuropeanSupplierConnector implements SupplierConnector {
  readonly code = "mock-eu";
  readonly name = "Mock European Supplier";
  readonly environment = "mock" as const;
  readonly capabilities = { catalog: true, search: true, stock: true, prices: true, shippingQuote: true, orderCreation: true, orderCancellation: true, tracking: true, returns: true, webhooks: false, neutralPackaging: true, marketplaceCompatible: true };
  async testConnection() { return supplierConnectionTestSchema.parse({ success: true, latencyMs: 24, message: "Connecteur de démonstration disponible.", testedAt: new Date().toISOString() }); }
  async getSupplierMetadata() { return { name: this.name, country: "EU", website: null }; }
  async searchProducts(input: ProductSearch) {
    const query = input.query?.toLowerCase();
    const filtered = mockEuropeanProducts.filter((product) => (!query || [product.title, product.sku, product.ean, product.gtin, product.brand, product.category].some((value) => value?.toLowerCase().includes(query))) && (!input.category || product.category === input.category));
    return this.page(filtered, input.cursor, input.limit);
  }
  async getProduct(externalId: string) { const product = mockEuropeanProducts.find((item) => item.externalId === externalId); if (!product) throw new ProductNotFoundError(); return normalizedSupplierProductSchema.parse(product); }
  async getProductsPage(input: { cursor?: string; limit?: number }) { return this.page(mockEuropeanProducts, input.cursor, input.limit); }
  async getCategories() { return [...new Set(mockEuropeanProducts.map((item) => item.category))].map((name) => ({ id: name.toLowerCase().replaceAll(" ", "-"), name, parentId: null })); }
  async getStock(externalId: string) { return (await this.getProduct(externalId)).stock; }
  async getPrice(externalId: string) { const product = await this.getProduct(externalId); return { amount: product.purchasePriceExVat, currency: product.currency }; }
  async estimateShipping(externalId: string, country: string, quantity: number) { const product = await this.getProduct(externalId); return supplierShippingQuoteSchema.parse({ country, amount: (product.shippingCost ?? 0) * quantity, currency: product.currency, minDays: product.estimatedDeliveryMinDays ?? 2, maxDays: product.estimatedDeliveryMaxDays ?? 7, service: "Livraison UE standard" }); }
  async createOrder(input: CreateSupplierOrderInput) { const products = await Promise.all(input.items.map(async (item) => ({ product: await this.getProduct(item.externalProductId), quantity: item.quantity }))); if (products.some(({ product, quantity }) => product.stock < quantity)) throw new OutOfStockError(); return supplierOrderSchema.parse({ id: `mock-order-${Date.now()}`, externalReference: input.reference, status: "accepted", currency: "EUR", total: products.reduce((sum, { product, quantity }) => sum + product.purchasePriceExVat * quantity, 0), items: products.map(({ product, quantity }) => ({ externalProductId: product.externalId, sku: product.sku, quantity, unitPrice: product.purchasePriceExVat })), createdAt: new Date().toISOString() }); }
  async getOrder(orderId: string) { return supplierOrderSchema.parse({ id: orderId, externalReference: "ELROVA-DEMO", status: "processing", currency: "EUR", total: 42, items: [], createdAt: new Date().toISOString() }); }
  async cancelOrder(orderId: string) { return { ...(await this.getOrder(orderId)), status: "cancelled" as const }; }
  async getTracking(orderId: string) { return supplierTrackingSchema.parse({ orderId, carrier: "Mock Parcel EU", trackingNumber: "MOCK123456", trackingUrl: null, status: "in_transit", updatedAt: new Date().toISOString() }); }
  async getReturnsInformation() { return { summary: "Retour de démonstration sous 30 jours.", url: null }; }
  async healthCheck() { return { healthy: true, checkedAt: new Date().toISOString() }; }
  private page(products: typeof mockEuropeanProducts, cursor?: string, limit = 10) { const start = Math.max(0, Number(cursor) || 0); const page = products.slice(start, start + limit).map((item) => normalizedSupplierProductSchema.parse(item)); return { products: page, nextCursor: start + limit < products.length ? String(start + limit) : null, total: products.length }; }
}
