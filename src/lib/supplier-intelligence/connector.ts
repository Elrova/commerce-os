import type { NormalizedSupplierProduct, SupplierCapabilities, SupplierCategory, SupplierConnectionTest, SupplierOrder, SupplierShippingQuote, SupplierTracking } from "./schemas";

export type ConnectorEnvironment = "mock" | "sandbox" | "production" | "disabled";
export type ProductPage = { products: NormalizedSupplierProduct[]; nextCursor: string | null; total: number };
export type ProductSearch = { query?: string; category?: string; cursor?: string; limit?: number };
export type CreateSupplierOrderInput = { reference: string; items: { externalProductId: string; quantity: number }[]; shippingCountry: string };

export interface SupplierConnector {
  readonly code: string;
  readonly name: string;
  readonly environment: ConnectorEnvironment;
  readonly capabilities: SupplierCapabilities;
  testConnection(): Promise<SupplierConnectionTest>;
  getSupplierMetadata(): Promise<{ name: string; country: string; website: string | null }>;
  searchProducts(input: ProductSearch): Promise<ProductPage>;
  getProduct(externalId: string): Promise<NormalizedSupplierProduct>;
  getProductsPage(input: { cursor?: string; limit?: number }): Promise<ProductPage>;
  getCategories(): Promise<SupplierCategory[]>;
  getStock?(externalId: string): Promise<number>;
  getPrice?(externalId: string): Promise<{ amount: number; currency: string }>;
  estimateShipping?(externalId: string, country: string, quantity: number): Promise<SupplierShippingQuote>;
  createOrder?(input: CreateSupplierOrderInput): Promise<SupplierOrder>;
  getOrder?(orderId: string): Promise<SupplierOrder>;
  cancelOrder?(orderId: string): Promise<SupplierOrder>;
  getTracking?(orderId: string): Promise<SupplierTracking>;
  getReturnsInformation?(): Promise<{ summary: string; url: string | null }>;
  healthCheck(): Promise<{ healthy: boolean; checkedAt: string }>;
}
