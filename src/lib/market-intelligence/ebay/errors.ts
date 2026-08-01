export class EbayError extends Error { constructor(message: string, public readonly code: string) { super(message); this.name = new.target.name; } }
export class EbayConfigurationError extends EbayError { constructor(message = "La configuration eBay est incomplète.") { super(message, "EBAY_CONFIGURATION"); } }
export class EbayAuthenticationError extends EbayError { constructor(message = "eBay a refusé l’authentification.") { super(message, "EBAY_AUTHENTICATION"); } }
export class EbayRateLimitError extends EbayError { constructor(message = "La limite eBay est atteinte.") { super(message, "EBAY_RATE_LIMIT"); } }
export class EbayUnavailableError extends EbayError { constructor(message = "eBay est temporairement indisponible.") { super(message, "EBAY_UNAVAILABLE"); } }
export class EbayInvalidResponseError extends EbayError { constructor(message = "La réponse eBay est invalide.") { super(message, "EBAY_INVALID_RESPONSE"); } }
