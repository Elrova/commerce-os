import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { EbayAuthenticationError, EbayConfigurationError, EbayInvalidResponseError, EbayUnavailableError } from "./errors";
import { ebayTokenResponseSchema } from "./schemas";
import type { EbayEnvironment } from "./types";

const APP_SCOPE = "https://api.ebay.com/oauth/api_scope";
export const EBAY_SELLER_SCOPES = ["https://api.ebay.com/oauth/api_scope/sell.account", "https://api.ebay.com/oauth/api_scope/sell.inventory", "https://api.ebay.com/oauth/api_scope/sell.fulfillment"] as const;
type CachedToken = { value: string; expiresAt: number };
let applicationToken: CachedToken | null = null;
export function getEbayEnvironment(): EbayEnvironment { return process.env.EBAY_ENVIRONMENT === "production" ? "production" : "sandbox"; }
export function ebayHosts() { const production = getEbayEnvironment() === "production"; return { api: production ? "https://api.ebay.com" : "https://api.sandbox.ebay.com", auth: production ? "https://auth.ebay.com" : "https://auth.sandbox.ebay.com" }; }
function credentials() { const clientId = process.env.EBAY_CLIENT_ID, clientSecret = process.env.EBAY_CLIENT_SECRET; if (!clientId || !clientSecret) throw new EbayConfigurationError(); return { clientId, clientSecret }; }
export async function getEbayApplicationToken(fetcher: typeof fetch = fetch) {
  if (applicationToken && applicationToken.expiresAt > Date.now() + 60_000) return applicationToken.value;
  const { clientId, clientSecret } = credentials();
  let response: Response;
  try { response = await fetcher(`${ebayHosts().api}/identity/v1/oauth2/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}` }, body: new URLSearchParams({ grant_type: "client_credentials", scope: APP_SCOPE }), cache: "no-store" }); }
  catch { throw new EbayUnavailableError(); }
  if (response.status === 401 || response.status === 403) throw new EbayAuthenticationError();
  if (!response.ok) throw new EbayUnavailableError(`Le service OAuth eBay a répondu HTTP ${response.status}.`);
  const parsed = ebayTokenResponseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new EbayInvalidResponseError("La réponse OAuth eBay est invalide.");
  applicationToken = { value: parsed.data.access_token, expiresAt: Date.now() + parsed.data.expires_in * 1000 };
  return applicationToken.value;
}
export function clearEbayApplicationTokenCache() { applicationToken = null; }
type OAuthState = { workspaceId: string; userId: string; nonce: string; expiresAt: number };
export function createEbayOAuthState(input: Omit<OAuthState, "nonce" | "expiresAt">) { const secret = credentials().clientSecret; const payload: OAuthState = { ...input, nonce: randomBytes(18).toString("base64url"), expiresAt: Date.now() + 10 * 60_000 }; const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url"); const signature = createHmac("sha256", secret).update(encoded).digest("base64url"); return `${encoded}.${signature}`; }
export function verifyEbayOAuthState(state: string): OAuthState { const secret = credentials().clientSecret; const [encoded, signature] = state.split("."); if (!encoded || !signature) throw new EbayAuthenticationError("État OAuth eBay invalide."); const expected = createHmac("sha256", secret).update(encoded).digest(); const received = Buffer.from(signature, "base64url"); if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new EbayAuthenticationError("Signature OAuth eBay invalide."); const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OAuthState; if (!payload.workspaceId || !payload.userId || payload.expiresAt < Date.now()) throw new EbayAuthenticationError("État OAuth eBay expiré."); return payload; }
export function createEbayUserConsentUrl(state: string) { const { clientId } = credentials(); const ruName = process.env.EBAY_RU_NAME; if (!ruName) throw new EbayConfigurationError("EBAY_RU_NAME est absent."); const url = new URL("/oauth2/authorize", ebayHosts().auth); url.search = new URLSearchParams({ client_id: clientId, response_type: "code", redirect_uri: ruName, scope: EBAY_SELLER_SCOPES.join(" "), state }).toString(); return url; }
