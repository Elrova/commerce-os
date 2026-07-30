export class SupplierConnectorError extends Error {
  constructor(message: string, public readonly code: string, public readonly retryable = false) { super(message); this.name = new.target.name; }
}
export class AuthenticationError extends SupplierConnectorError { constructor(message = "Authentification fournisseur refusée.") { super(message, "AUTHENTICATION_ERROR"); } }
export class RateLimitError extends SupplierConnectorError { constructor(message = "Limite de requêtes atteinte.") { super(message, "RATE_LIMIT", true); } }
export class ProductNotFoundError extends SupplierConnectorError { constructor(message = "Produit fournisseur introuvable.") { super(message, "PRODUCT_NOT_FOUND"); } }
export class OutOfStockError extends SupplierConnectorError { constructor(message = "Produit fournisseur indisponible.") { super(message, "OUT_OF_STOCK"); } }
export class PriceChangedError extends SupplierConnectorError { constructor(message = "Le prix fournisseur a changé.") { super(message, "PRICE_CHANGED"); } }
export class UnsupportedCapabilityError extends SupplierConnectorError { constructor(capability: string) { super(`Capacité non prise en charge : ${capability}.`, "UNSUPPORTED_CAPABILITY"); } }
export class SupplierUnavailableError extends SupplierConnectorError { constructor(message = "Le fournisseur est momentanément indisponible.") { super(message, "SUPPLIER_UNAVAILABLE", true); } }
export class InvalidSupplierResponseError extends SupplierConnectorError { constructor(message = "Réponse fournisseur invalide.") { super(message, "INVALID_RESPONSE"); } }
