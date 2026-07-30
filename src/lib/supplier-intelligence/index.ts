import { MockEuropeanSupplierConnector } from "./mock/connector";
import { SupplierConnectorRegistry } from "./registry";

export const supplierConnectorRegistry = new SupplierConnectorRegistry()
  .register(new MockEuropeanSupplierConnector());

export * from "./connector";
export * from "./errors";
export * from "./schemas";
