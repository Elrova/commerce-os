export interface SupplierSecretStore { get(reference: string): Promise<string | null>; }
export class EnvironmentSupplierSecretStore implements SupplierSecretStore {
  async get(reference: string) { return process.env[reference] ?? null; }
}
export class UnconfiguredVaultSecretStore implements SupplierSecretStore {
  async get(reference: string): Promise<string | null> {
    void reference;
    throw new Error("Aucun coffre de secrets n’est configuré.");
  }
}
