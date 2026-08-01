import "server-only";

import type { z } from "zod";
import type { ProductPage, ProductSearch, SupplierConnector } from "../connector";
import { InvalidSupplierResponseError } from "../errors";
import { supplierConnectionTestSchema, type NormalizedSupplierProduct } from "../schemas";
import { MatterhornClient } from "./client";
import { normalizeMatterhornProduct } from "./normalize";
import { matterhornDictionaryResponseSchema, matterhornProductSchema, matterhornProductsResponseSchema } from "./schemas";

type MatterhornCursor = { page: number; imported: number; lastUpdate?: string };
const parseLimit = () => {
  const configured = Number(process.env.MATTERHORN_SYNC_MAX_PRODUCTS ?? 100);
  return Number.isFinite(configured) ? Math.max(1, Math.min(1000, Math.floor(configured))) : 100;
};
const encodeCursor = (cursor: MatterhornCursor) => Buffer.from(JSON.stringify(cursor)).toString("base64url");
const decodeCursor = (cursor?: string): MatterhornCursor => {
  if (!cursor) return { page: 1, imported: 0 };
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as MatterhornCursor;
    if (!Number.isInteger(parsed.page) || parsed.page < 1 || !Number.isInteger(parsed.imported) || parsed.imported < 0) throw new Error();
    return parsed;
  } catch { throw new InvalidSupplierResponseError("Curseur de pagination Matterhorn invalide."); }
};
function parseExternal<T>(
  schema: z.ZodType<T>,
  payload: unknown,
  options: { diagnoseMismatch?: boolean } = {},
): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    if (options.diagnoseMismatch) {
      logSchemaMismatch(payload, result.error.issues);
    }
    throw new InvalidSupplierResponseError("La réponse Matterhorn ne respecte pas le format attendu.");
  }
  return result.data;
}

function logSchemaMismatch(
  payload: unknown,
  issues: readonly z.core.$ZodIssue[],
) {
  const isArray = Array.isArray(payload);
  const isObject = payload !== null && typeof payload === "object" && !isArray;
  const firstItem = isArray ? payload[0] : undefined;

  console.error("[matterhorn] response schema mismatch", {
    payloadType: payload === null
      ? "null"
      : isArray
        ? "array"
        : isObject
          ? "object"
          : "string",
    topLevelKeys: isObject
      ? Object.keys(payload as Record<string, unknown>).slice(0, 25)
      : [],
    arrayLength: isArray ? payload.length : undefined,
    firstItemKeys:
      firstItem !== null &&
      typeof firstItem === "object" &&
      !Array.isArray(firstItem)
        ? Object.keys(firstItem as Record<string, unknown>).slice(0, 25)
        : [],
    zodIssues: issues.slice(0, 10).map((issue) => ({
      path: issue.path.map(String),
      code: issue.code,
    })),
  });

  issues.slice(0, 10).forEach((issue) => {
    console.error("[matterhorn] invalid field", {
      path: issue.path.map((segment) =>
        typeof segment === "number" ? segment : String(segment),
      ),
      expected: "expected" in issue ? String(issue.expected) : "unknown",
      received: describePayloadType(valueAtPath(payload, issue.path)),
      code: issue.code,
    });
  });
}

function valueAtPath(payload: unknown, path: readonly PropertyKey[]) {
  let current = payload;
  for (const segment of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<PropertyKey, unknown>)[segment];
  }
  return current;
}

function describePayloadType(value: unknown) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

export class MatterhornSupplierConnector implements SupplierConnector {
  readonly code = "matterhorn";
  readonly name = "Matterhorn";
  readonly environment = "production" as const;
  readonly capabilities = {
    catalog: true, search: true, stock: true, prices: true, shippingQuote: false,
    orderCreation: false, orderCancellation: false, tracking: false, returns: false,
    webhooks: false, neutralPackaging: false, marketplaceCompatible: false,
  };
  constructor(private readonly client = new MatterhornClient()) {}
  async testConnection() {
    const started = Date.now();
    try {
      const payload = await this.client.get("ITEMS/", { page: 1, limit: 1 });
      parseExternal(matterhornProductsResponseSchema, payload, {
        diagnoseMismatch: true,
      });
      return supplierConnectionTestSchema.parse({ success: true, latencyMs: Date.now() - started, message: "Connexion Matterhorn validée.", testedAt: new Date().toISOString() });
    } catch (error) {
      return supplierConnectionTestSchema.parse({ success: false, latencyMs: Date.now() - started, message: error instanceof Error ? error.message : "Échec de connexion Matterhorn.", testedAt: new Date().toISOString() });
    }
  }
  async healthCheck() { const result = await this.testConnection(); return { healthy: result.success, checkedAt: result.testedAt }; }
  async getSupplierMetadata() { return { name: "Matterhorn", country: "PL", website: "https://matterhorn-wholesale.com" }; }
  async getProductsPage(input: { cursor?: string; limit?: number }): Promise<ProductPage> {
    const cursor = decodeCursor(input.cursor);
    const maximum = parseLimit();
    const remaining = maximum - cursor.imported;
    if (remaining <= 0) return { products: [], nextCursor: null, total: maximum };
    const limit = Math.min(Math.max(1, input.limit ?? 100), 1000, remaining);
    const payload = await this.client.get("ITEMS/", { page: cursor.page, limit, last_update: cursor.lastUpdate });
    const externalProducts = parseExternal(matterhornProductsResponseSchema, payload);
    const products = externalProducts.map((product) => {
      try { return normalizeMatterhornProduct(product); }
      catch { throw new InvalidSupplierResponseError(`Le produit Matterhorn ${product.id} ne peut pas être normalisé.`); }
    });
    const imported = cursor.imported + products.length;
    return { products, nextCursor: products.length === limit && imported < maximum ? encodeCursor({ ...cursor, page: cursor.page + 1, imported }) : null, total: imported };
  }
  async searchProducts(input: ProductSearch): Promise<ProductPage> {
    const page = await this.getProductsPage({ cursor: input.cursor, limit: input.limit });
    const query = input.query?.trim().toLowerCase();
    return { ...page, products: page.products.filter((product) => (!query || [product.title, product.sku, product.ean, product.gtin, product.brand, product.category].some((value) => value?.toLowerCase().includes(query))) && (!input.category || product.category === input.category)) };
  }
  async getProduct(externalId: string) {
    const payload = await this.client.get(`ITEMS/${encodeURIComponent(externalId)}`);
    const externalProduct = parseExternal(matterhornProductSchema, payload);
    try { return normalizeMatterhornProduct(externalProduct); }
    catch { throw new InvalidSupplierResponseError(`Le produit Matterhorn ${externalProduct.id} ne peut pas être normalisé.`); }
  }
  async getCategories() {
    const payload = await this.client.get("DICTIONARIES/CATEGORIES");
    return parseExternal(matterhornDictionaryResponseSchema, payload).map((category) => ({ id: category.id, name: category.name, parentId: category.parent_id ?? null }));
  }
  async getStock(externalId: string) { return (await this.getProduct(externalId)).stock; }
  async getPrice(externalId: string) { const product = await this.getProduct(externalId); return { amount: product.purchasePriceExVat, currency: product.currency }; }
}

export const matterhornPagination = { encodeCursor, decodeCursor };
export type { NormalizedSupplierProduct };
