import type { ConnectorEnvironment, SupplierConnector } from "./connector";

export class SupplierConnectorRegistry {
  private readonly connectors = new Map<string, SupplierConnector>();
  register(connector: SupplierConnector) { if (this.connectors.has(connector.code)) throw new Error(`Connecteur déjà enregistré : ${connector.code}`); this.connectors.set(connector.code, connector); return this; }
  get(code: string) { const connector = this.connectors.get(code); if (!connector) throw new Error(`Connecteur fournisseur inconnu : ${code}`); return connector; }
  has(code: string) { return this.connectors.has(code); }
  list(environment?: ConnectorEnvironment) { return [...this.connectors.values()].filter((connector) => !environment || connector.environment === environment); }
  capabilities(code: string) { return this.get(code).capabilities; }
}
