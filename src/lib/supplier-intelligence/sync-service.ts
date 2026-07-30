import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupplierConnector } from "./connector";
import { normalizedSupplierProductSchema, type NormalizedSupplierProduct } from "./schemas";

type SyncOptions = { dryRun?: boolean; pageSize?: number; concurrency?: number; maxRetries?: number; resumeCursor?: string };
type SyncIssue = { externalId?: string; message: string };
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function withRetry<T>(operation: () => Promise<T>, maxRetries: number) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try { return await operation(); } catch (error) { lastError = error; if (attempt < maxRetries) await wait(150 * 2 ** attempt); }
  }
  throw lastError;
}

function toRow(product: NormalizedSupplierProduct, context: { workspaceId: string; supplierId: string; integrationId: string }) {
  return {
    workspace_id: context.workspaceId, supplier_id: context.supplierId, integration_id: context.integrationId,
    external_id: product.externalId, sku: product.sku, ean: product.ean, gtin: product.gtin,
    brand: product.brand, manufacturer: product.manufacturer, title: product.title, description: product.description,
    category: product.category, images: product.images, attributes: product.attributes, variants: product.variants,
    purchase_price_ex_vat: product.purchasePriceExVat, purchase_price_inc_vat: product.purchasePriceIncVat,
    recommended_retail_price: product.recommendedRetailPrice, shipping_cost: product.shippingCost,
    currency: product.currency, stock: product.stock, stock_status: product.stockStatus, moq: product.minimumOrderQuantity,
    weight: product.weight, dimensions: product.dimensions, shipping_countries: product.shippingCountries,
    ships_from_country: product.shipsFromCountry, delivery_min_days: product.estimatedDeliveryMinDays,
    delivery_max_days: product.estimatedDeliveryMaxDays, product_url: product.productUrl, raw_data: product.rawData,
    active: product.active, last_synced_at: product.lastSyncedAt,
  };
}

export class SupplierCatalogSyncService {
  constructor(private readonly supabase: SupabaseClient) {}
  async testIntegration(connector: SupplierConnector) { return connector.testConnection(); }
  async sync(context: { workspaceId: string; supplierId: string; integrationId: string; connector: SupplierConnector }, options: SyncOptions = {}) {
    const dryRun = options.dryRun ?? false;
    const issues: SyncIssue[] = [];
    const counters = { read: 0, created: 0, updated: 0, failed: 0 };
    const { data: run, error: runError } = await this.supabase.from("supplier_sync_runs").insert({ workspace_id: context.workspaceId, integration_id: context.integrationId, sync_type: "catalog", status: dryRun ? "dry_run" : "running", metadata: { dryRun, resumeCursor: options.resumeCursor ?? null } }).select("id").single();
    if (runError || !run) throw new Error("Impossible d’ouvrir le rapport de synchronisation.");
    let cursor: string | null = options.resumeCursor ?? null;
    try {
      do {
        const page = await withRetry(() => context.connector.getProductsPage({ cursor: cursor ?? undefined, limit: options.pageSize ?? 10 }), options.maxRetries ?? 2);
        counters.read += page.products.length;
        const chunks = Array.from({ length: Math.ceil(page.products.length / (options.concurrency ?? 4)) }, (_, index) => page.products.slice(index * (options.concurrency ?? 4), (index + 1) * (options.concurrency ?? 4)));
        for (const chunk of chunks) await Promise.all(chunk.map(async (rawProduct) => {
          try {
            const product = normalizedSupplierProductSchema.parse(rawProduct);
            if (dryRun) return;
            const { data: existing } = await this.supabase.from("supplier_catalog_products").select("id").eq("integration_id", context.integrationId).eq("external_id", product.externalId).maybeSingle();
            const { error } = await this.supabase.from("supplier_catalog_products").upsert(toRow(product, context), { onConflict: "integration_id,external_id" });
            if (error) throw error;
            if (existing) counters.updated++; else counters.created++;
          } catch (error) {
            counters.failed++;
            issues.push({ externalId: rawProduct.externalId, message: error instanceof Error ? error.message : "Erreur inconnue" });
          }
        }));
        cursor = page.nextCursor;
      } while (cursor);
      const status = counters.failed ? "partial" : dryRun ? "dry_run" : "completed";
      await this.supabase.from("supplier_sync_runs").update({ status, finished_at: new Date().toISOString(), products_read: counters.read, products_created: counters.created, products_updated: counters.updated, products_failed: counters.failed, error_summary: issues, metadata: { dryRun, resumeCursor: cursor } }).eq("id", run.id).eq("workspace_id", context.workspaceId);
      if (!dryRun) await this.supabase.from("supplier_integrations").update({ status: counters.failed ? "error" : "ready", last_successful_sync_at: new Date().toISOString(), last_error: counters.failed ? issues : null }).eq("id", context.integrationId).eq("workspace_id", context.workspaceId);
      return { runId: run.id, status, ...counters, issues };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      await this.supabase.from("supplier_sync_runs").update({ status: "failed", finished_at: new Date().toISOString(), products_read: counters.read, products_failed: counters.failed + 1, error_summary: [...issues, { message }] }).eq("id", run.id).eq("workspace_id", context.workspaceId);
      throw error;
    }
  }
}
