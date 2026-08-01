const required = ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET"];
if (process.env.EBAY_SMOKE_TEST !== "true") {
  console.log("Smoke test eBay ignoré. Définissez EBAY_SMOKE_TEST=true pour autoriser un appel sandbox explicite.");
  process.exit(0);
}
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Configuration eBay incomplète: ${missing.join(", ")}`);
if (process.env.EBAY_ENVIRONMENT === "production") throw new Error("Le smoke test refuse l'environnement production.");

const tokenResponse = await fetch("https://api.sandbox.ebay.com/identity/v1/oauth2/token", {
  method: "POST",
  headers: {
    authorization: `Basic ${Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString("base64")}`,
    "content-type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({ grant_type: "client_credentials", scope: "https://api.ebay.com/oauth/api_scope" }),
});
if (!tokenResponse.ok) throw new Error(`Authentification sandbox eBay refusée (HTTP ${tokenResponse.status}).`);
const tokenPayload = await tokenResponse.json();
if (typeof tokenPayload.access_token !== "string") throw new Error("Réponse OAuth sandbox invalide.");
const browseResponse = await fetch("https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search?q=test&limit=1", {
  headers: { authorization: `Bearer ${tokenPayload.access_token}`, "x-ebay-c-marketplace-id": process.env.EBAY_MARKETPLACE_ID || "EBAY_FR" },
});
if (!browseResponse.ok) throw new Error(`Browse sandbox eBay refusé (HTTP ${browseResponse.status}).`);
const browsePayload = await browseResponse.json();
console.log("Smoke test eBay sandbox réussi.", { resultCount: Array.isArray(browsePayload.itemSummaries) ? browsePayload.itemSummaries.length : 0 });
