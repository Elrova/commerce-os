import { MockEuropeanSupplierConnector } from "./mock/connector";
import { MatterhornSupplierConnector } from "./matterhorn/connector";
import { SupplierConnectorRegistry } from "./registry";

export const supplierConnectorRegistry = new SupplierConnectorRegistry()
  .register(new MockEuropeanSupplierConnector());

if (process.env.MATTERHORN_API_KEY) {
  supplierConnectorRegistry.register(new MatterhornSupplierConnector());
}

export * from "./connector";
export * from "./errors";
export * from "./schemas";
