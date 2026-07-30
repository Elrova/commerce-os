export type SalesChannel =
  | "shopify"
  | "amazon"
  | "ebay"
  | "etsy"
  | "woocommerce";

export type ChannelConnectionStatus =
  | "not_connected"
  | "connection_required"
  | "connected"
  | "error";

export type ListingStatus =
  | "draft"
  | "ready"
  | "publishing"
  | "published"
  | "paused"
  | "error";

export interface ChannelCapabilities {
  importListings: boolean;
  publishListings: boolean;
  orders: boolean;
  inventory: boolean;
  pricing: boolean;
}

export interface ChannelConnection {
  id: string;
  channel: SalesChannel;
  status: ChannelConnectionStatus;
  sellerAccount?: string;
  lastSyncedAt?: string;
  capabilities: ChannelCapabilities;
}

export type SyncJobType =
  | "listings_import"
  | "listing_publish"
  | "orders_import"
  | "inventory_update"
  | "price_update";

export type SyncJobStatus = "queued" | "running" | "completed" | "failed";

export interface SyncError {
  code: string;
  message: string;
  occurredAt: string;
  retryable: boolean;
  externalReference?: string;
}

export interface SyncJob {
  id: string;
  connectionId: string;
  type: SyncJobType;
  status: SyncJobStatus;
  startedAt: string;
  completedAt?: string;
  processedItems: number;
  errors: SyncError[];
}

export interface ChannelCredentials {
  values: Readonly<Record<string, string>>;
}

export interface ChannelAccount {
  externalId: string;
  displayName: string;
}

export interface ExternalListing {
  externalId: string;
  sku: string;
  title: string;
  status: ListingStatus;
  price: number;
  currency: string;
  stock: number;
}

export interface PublishProductInput {
  internalProductId: string;
  sku: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
}

export interface ExternalOrder {
  externalId: string;
  orderedAt: string;
  status: string;
  total: number;
  currency: string;
}

export interface SalesChannelConnector {
  readonly channel: SalesChannel;
  readonly capabilities: ChannelCapabilities;
  connect(credentials: ChannelCredentials): Promise<ChannelAccount>;
  testConnection(connection: ChannelConnection): Promise<boolean>;
  importListings(connection: ChannelConnection): Promise<ExternalListing[]>;
  publishProduct(
    connection: ChannelConnection,
    product: PublishProductInput,
  ): Promise<ExternalListing>;
  updateProduct(
    connection: ChannelConnection,
    listingId: string,
    product: PublishProductInput,
  ): Promise<ExternalListing>;
  importOrders(connection: ChannelConnection): Promise<ExternalOrder[]>;
  updateStock(
    connection: ChannelConnection,
    listingId: string,
    quantity: number,
  ): Promise<void>;
  updatePrice(
    connection: ChannelConnection,
    listingId: string,
    price: number,
    currency: string,
  ): Promise<void>;
  getErrors(connection: ChannelConnection): Promise<SyncError[]>;
}
