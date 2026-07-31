import "server-only";

import { AuthenticationError, InvalidSupplierResponseError, ProductNotFoundError, RateLimitError, SupplierUnavailableError } from "../errors";

const BASE_URL = "https://matterhorn-wholesale.com/B2BAPI";

export class MatterhornClient {
  constructor(
    private readonly apiKey = process.env.MATTERHORN_API_KEY,
    private readonly timeoutMs = 15_000,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    if (!apiKey) throw new AuthenticationError("MATTERHORN_API_KEY n’est pas configurée côté serveur.");
  }

  async get(path: string, parameters: Record<string, string | number | undefined> = {}) {
    const endpoint = path.split("/").filter(Boolean)[0] ?? "UNKNOWN";
    const url = new URL(`${BASE_URL}/${path.replace(/^\/+/, "")}`);
    Object.entries(parameters).forEach(([key, value]) => { if (value !== undefined) url.searchParams.set(key, String(value)); });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetcher(url, {
        method: "GET",
        headers: { accept: "application/json", Authorization: this.apiKey as string, "user-agent": "ELROVA-Commerce-OS/1.0" },
        signal: controller.signal,
        cache: "no-store",
      });
    } catch {
      throw new SupplierUnavailableError("Matterhorn ne répond pas actuellement.");
    } finally {
      clearTimeout(timeout);
    }
    if (response.status === 401 || response.status === 403) {
      logRequestFailure(response.status, "authentication", endpoint);
      throw new AuthenticationError("Matterhorn a refusé l’authentification.");
    }
    if (response.status === 404) {
      logRequestFailure(response.status, "not-found", endpoint);
      throw new ProductNotFoundError("Ressource Matterhorn introuvable.");
    }
    if (response.status === 429) {
      logRequestFailure(response.status, "rate-limit", endpoint);
      throw new RateLimitError("Matterhorn limite temporairement les requêtes.");
    }
    if (response.status >= 500) {
      logRequestFailure(response.status, "supplier-unavailable", endpoint);
      throw new SupplierUnavailableError("Matterhorn est momentanément indisponible.");
    }
    if (!response.ok) {
      logRequestFailure(response.status, "unexpected-http-status", endpoint);
      throw new InvalidSupplierResponseError(`Matterhorn a répondu avec le statut HTTP ${response.status}.`);
    }
    try { return await response.json() as unknown; }
    catch { throw new InvalidSupplierResponseError("Matterhorn a renvoyé une réponse JSON illisible."); }
  }
}

export const matterhornBaseUrl = BASE_URL;

function logRequestFailure(status: number, category: string, endpoint: string) {
  console.error("[matterhorn] request failed", {
    status,
    category,
    endpoint,
  });
}
