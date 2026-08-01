import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { clearEbayApplicationTokenCache, getEbayApplicationToken } from "./auth";
import { EbayBrowseClient } from "./client";
import { EbayAuthenticationError, EbayConfigurationError, EbayInvalidResponseError } from "./errors";
import { ebayBrowseResponseFixture, ebayTokenFixture, normalizedListingFixture } from "./fixtures";
import { calculateEbayMetrics, createEbaySearchPlan, scoreEbayMatch } from "./marketplace-service";

const originalEnvironment = { ...process.env };
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

afterEach(() => {
  process.env = { ...originalEnvironment };
  clearEbayApplicationTokenCache();
});

describe("eBay application OAuth", () => {
  it("accepts and reuses a valid application token", async () => {
    process.env.EBAY_CLIENT_ID = "fixture-id"; process.env.EBAY_CLIENT_SECRET = "fixture-secret";
    let calls = 0;
    const fetcher: typeof fetch = async () => { calls += 1; return jsonResponse(ebayTokenFixture); };
    assert.equal(await getEbayApplicationToken(fetcher), ebayTokenFixture.access_token);
    assert.equal(await getEbayApplicationToken(fetcher), ebayTokenFixture.access_token);
    assert.equal(calls, 1);
  });

  it("renews an expired token", async () => {
    process.env.EBAY_CLIENT_ID = "fixture-id"; process.env.EBAY_CLIENT_SECRET = "fixture-secret";
    let calls = 0;
    const fetcher: typeof fetch = async () => { calls += 1; return jsonResponse({ ...ebayTokenFixture, access_token: `token-${calls}`, expires_in: 1 }); };
    assert.equal(await getEbayApplicationToken(fetcher), "token-1");
    assert.equal(await getEbayApplicationToken(fetcher), "token-2");
  });

  it("normalizes authentication failures and missing configuration", async () => {
    delete process.env.EBAY_CLIENT_ID; delete process.env.EBAY_CLIENT_SECRET;
    await assert.rejects(() => getEbayApplicationToken(), EbayConfigurationError);
    process.env.EBAY_CLIENT_ID = "fixture-id"; process.env.EBAY_CLIENT_SECRET = "fixture-secret";
    await assert.rejects(() => getEbayApplicationToken(async () => jsonResponse({}, 401)), EbayAuthenticationError);
  });
});

describe("eBay Browse", () => {
  it("validates a response and carries GTIN, pagination and marketplace headers", async () => {
    process.env.EBAY_CLIENT_ID = "fixture-id"; process.env.EBAY_CLIENT_SECRET = "fixture-secret";
    const requests: Array<{ url: string; authorization: string | null; marketplace: string | null }> = [];
    const fetcher: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes("/identity/")) return jsonResponse(ebayTokenFixture);
      const headers = new Headers(init?.headers);
      requests.push({ url, authorization: headers.get("authorization"), marketplace: headers.get("x-ebay-c-marketplace-id") });
      return jsonResponse(ebayBrowseResponseFixture);
    };
    const result = await new EbayBrowseClient(fetcher).search({ gtin: "1234567890123", limit: 20, offset: 20 });
    assert.equal(result.itemSummaries.length, 1);
    assert.match(requests[0].url, /gtin=1234567890123/); assert.match(requests[0].url, /offset=20/);
    assert.equal(requests[0].marketplace, "EBAY_FR"); assert.equal(requests[0].authorization, "Bearer fixture-application-token");
  });

  it("rejects an invalid Browse response", async () => {
    process.env.EBAY_CLIENT_ID = "fixture-id"; process.env.EBAY_CLIENT_SECRET = "fixture-secret";
    const fetcher: typeof fetch = async (input) => String(input).includes("/identity/") ? jsonResponse(ebayTokenFixture) : jsonResponse({ itemSummaries: [{ title: 42 }] });
    await assert.rejects(() => new EbayBrowseClient(fetcher).search({ keywords: "robe" }), EbayInvalidResponseError);
  });
});

describe("eBay matching and market metrics", () => {
  const product = { title: "Acme Robe longue", sku: "SKU-42", ean: "1234567890123", gtin: null, brand: "Acme", category: "Robes" };
  it("chooses GTIN first, then brand/reference, then title", () => {
    assert.equal(createEbaySearchPlan(product).strategy, "gtin");
    assert.equal(createEbaySearchPlan({ ...product, ean: null }).strategy, "brand_reference");
    assert.equal(createEbaySearchPlan({ ...product, ean: null, brand: null }).strategy, "title");
  });
  it("scores exact matches and excludes weak matches from metrics", () => {
    const exact = scoreEbayMatch(product, normalizedListingFixture());
    const weak = scoreEbayMatch(product, normalizedListingFixture({ externalId: "weak", title: "Objet sans rapport", ean: null, brand: null, categoryName: null, price: 5, totalDeliveredPrice: 5 }));
    assert.equal(exact.level, "exact"); assert.equal(weak.level, "weak");
    const metrics = calculateEbayMetrics([exact, weak]);
    assert.equal(metrics.resultCount, 2); assert.equal(metrics.reliableResultCount, 1); assert.equal(metrics.minimumPrice, 54.8);
  });
});
