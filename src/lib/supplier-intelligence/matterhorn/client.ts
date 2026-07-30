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
    if (response.status === 401 || response.status === 403) throw new AuthenticationError("Matterhorn a refusé l’authentification.");
    if (response.status === 404) throw new ProductNotFoundError("Ressource Matterhorn introuvable.");
    if (response.status === 429) throw new RateLimitError("Matterhorn limite temporairement les requêtes.");
    if (response.status >= 500) throw new SupplierUnavailableError("Matterhorn est momentanément indisponible.");
    if (!response.ok) throw new InvalidSupplierResponseError(`Matterhorn a répondu avec le statut HTTP ${response.status}.`);
    try { return await response.json() as unknown; }
    catch { throw new InvalidSupplierResponseError("Matterhorn a renvoyé une réponse JSON illisible."); }
  }
}

export const matterhornBaseUrl = BASE_URL;
