import "server-only";

import type { CurrentContext } from "@/lib/auth/current-context";
import { createClient } from "@/lib/supabase/server";
import { supplierConnectorRegistry } from "./index";
import { SupplierCatalogSyncService } from "./sync-service";

type Supabase = Awaited<ReturnType<typeof createClient>>;
export type IntegrationErrorCode =
  | "matterhorn-not-configured"
  | "integration-not-found"
  | "connection-failed"
  | "sync-failed"
  | "activation-failed";

export class IntegrationMutationError extends Error {
  constructor(public readonly code: IntegrationErrorCode) {
    super(code);
  }
}

async function findIntegration(supabase: Supabase, workspaceId: string, connectorCode: string) {
  return supabase
    .from("supplier_integrations")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("connector_code", connectorCode)
    .maybeSingle();
}

async function activateConnector(
  context: CurrentContext,
  input: {
    code: "mock-eu" | "matterhorn";
    supplier: { name: string; country: string; website_url?: string; notes: string };
    environment: "mock" | "production";
    status: "ready" | "not_configured";
    credentialsReference?: string;
    configuration: Record<string, unknown>;
  },
) {
  const supabase = await createClient();
  const existing = await findIntegration(supabase, context.workspace.id, input.code);
  if (existing.data) return { integrationId: existing.data.id, created: false };

  const connector = supplierConnectorRegistry.get(input.code);
  const { data: supplier, error: supplierError } = await supabase
    .from("suppliers")
    .insert({
      workspace_id: context.workspace.id,
      name: input.supplier.name,
      country: input.supplier.country,
      website_url: input.supplier.website_url ?? null,
      status: "active",
      notes: input.supplier.notes,
    })
    .select("id")
    .single();
  if (supplierError || !supplier) throw new IntegrationMutationError("activation-failed");

  const { data: integration, error } = await supabase
    .from("supplier_integrations")
    .insert({
      workspace_id: context.workspace.id,
      supplier_id: supplier.id,
      connector_code: input.code,
      environment: input.environment,
      status: input.status,
      credentials_reference: input.credentialsReference ?? null,
      capabilities: connector.capabilities,
      configuration: input.configuration,
    })
    .select("id")
    .single();

  if (error || !integration) {
    // L’index unique (workspace_id, connector_code) arbitre les clics
    // concurrents. Le fournisseur créé par la requête perdante est nettoyé.
    await supabase
      .from("suppliers")
      .delete()
      .eq("id", supplier.id)
      .eq("workspace_id", context.workspace.id);
    const concurrent = await findIntegration(supabase, context.workspace.id, input.code);
    if (concurrent.data) return { integrationId: concurrent.data.id, created: false };
    throw new IntegrationMutationError("activation-failed");
  }
  return { integrationId: integration.id, created: true };
}

export function activateMockIntegration(context: CurrentContext) {
  return activateConnector(context, {
    code: "mock-eu",
    supplier: {
      name: "Mock European Supplier",
      country: "Union européenne",
      notes: "Fournisseur de démonstration isolé. Aucune connexion externe.",
    },
    environment: "mock",
    status: "ready",
    configuration: { fixture: true },
  });
}

export function activateMatterhornIntegration(context: CurrentContext) {
  if (!process.env.MATTERHORN_API_KEY || !supplierConnectorRegistry.has("matterhorn")) {
    throw new IntegrationMutationError("matterhorn-not-configured");
  }
  return activateConnector(context, {
    code: "matterhorn",
    supplier: {
      name: "Matterhorn",
      country: "Pologne",
      website_url: "https://matterhorn-wholesale.com",
      notes: "Intégration API officielle Matterhorn.",
    },
    environment: "production",
    status: "not_configured",
    credentialsReference: "env:MATTERHORN_API_KEY",
    configuration: {
      maxProducts: Number(process.env.MATTERHORN_SYNC_MAX_PRODUCTS ?? 100),
    },
  });
}

async function getWorkspaceIntegration(
  context: CurrentContext,
  integrationId: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_integrations")
    .select("id,supplier_id,connector_code")
    .eq("id", integrationId)
    .eq("workspace_id", context.workspace.id)
    .maybeSingle();
  if (!data) throw new IntegrationMutationError("integration-not-found");
  return { supabase, integration: data };
}

export async function testIntegrationConnection(
  context: CurrentContext,
  integrationId: string,
) {
  const { supabase, integration } = await getWorkspaceIntegration(context, integrationId);
  if (!supplierConnectorRegistry.has(integration.connector_code)) {
    throw new IntegrationMutationError(
      integration.connector_code === "matterhorn"
        ? "matterhorn-not-configured"
        : "connection-failed",
    );
  }
  const connector = supplierConnectorRegistry.get(integration.connector_code);
  const result = await new SupplierCatalogSyncService(supabase).testIntegration(connector);
  const { error } = await supabase
    .from("supplier_integrations")
    .update({
      status: result.success ? "ready" : "error",
      last_connection_test_at: result.testedAt,
      last_error: result.success ? null : { code: "connection-failed" },
    })
    .eq("id", integrationId)
    .eq("workspace_id", context.workspace.id);
  if (error || !result.success) throw new IntegrationMutationError("connection-failed");
}

export async function synchronizeIntegration(
  context: CurrentContext,
  integrationId: string,
  dryRun: boolean,
) {
  const { supabase, integration } = await getWorkspaceIntegration(context, integrationId);
  if (!supplierConnectorRegistry.has(integration.connector_code)) {
    throw new IntegrationMutationError(
      integration.connector_code === "matterhorn"
        ? "matterhorn-not-configured"
        : "sync-failed",
    );
  }
  const connector = supplierConnectorRegistry.get(integration.connector_code);
  await supabase
    .from("supplier_integrations")
    .update({ status: "syncing" })
    .eq("id", integrationId)
    .eq("workspace_id", context.workspace.id);
  try {
    await new SupplierCatalogSyncService(supabase).sync(
      {
        workspaceId: context.workspace.id,
        supplierId: integration.supplier_id,
        integrationId,
        connector,
      },
      { dryRun, pageSize: 5, concurrency: 3, maxRetries: 2 },
    );
  } catch {
    await supabase
      .from("supplier_integrations")
      .update({ status: "error", last_error: { code: "sync-failed" } })
      .eq("id", integrationId)
      .eq("workspace_id", context.workspace.id);
    throw new IntegrationMutationError("sync-failed");
  }
}
