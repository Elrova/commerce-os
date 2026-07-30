"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/auth/current-context";
import { supplierConnectorRegistry } from "@/lib/supplier-intelligence";
import { SupplierCatalogSyncService } from "@/lib/supplier-intelligence/sync-service";
import { createClient } from "@/lib/supabase/server";

export async function activateMockConnector() {
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const connector = supplierConnectorRegistry.get("mock-eu");
  const existing = await supabase.from("supplier_integrations").select("id").eq("workspace_id", workspace.id).eq("connector_code", connector.code).maybeSingle();
  if (existing.data) redirect(`/app/intelligence/fournisseurs/${existing.data.id}`);
  const { data: supplier, error: supplierError } = await supabase.from("suppliers").insert({ workspace_id: workspace.id, name: connector.name, country: "Union européenne", status: "active", notes: "Fournisseur de démonstration isolé. Aucune connexion externe." }).select("id").single();
  if (supplierError || !supplier) throw new Error("Impossible de créer le fournisseur de démonstration.");
  const { data: integration, error } = await supabase.from("supplier_integrations").insert({ workspace_id: workspace.id, supplier_id: supplier.id, connector_code: connector.code, environment: "mock", status: "ready", capabilities: connector.capabilities, configuration: { fixture: true } }).select("id").single();
  if (error || !integration) throw new Error("Impossible d’activer le connecteur mock.");
  revalidatePath("/app/intelligence/fournisseurs");
  redirect(`/app/intelligence/fournisseurs/${integration.id}`);
}

async function getAuthorizedIntegration(integrationId: string) {
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { data } = await supabase.from("supplier_integrations").select("id,supplier_id,connector_code").eq("id", integrationId).eq("workspace_id", workspace.id).maybeSingle();
  if (!data) throw new Error("Intégration introuvable.");
  return { workspace, supabase, integration: data };
}

export async function testSupplierConnection(integrationId: string) {
  const { workspace, supabase, integration } = await getAuthorizedIntegration(integrationId);
  const connector = supplierConnectorRegistry.get(integration.connector_code);
  const result = await new SupplierCatalogSyncService(supabase).testIntegration(connector);
  await supabase.from("supplier_integrations").update({ status: result.success ? "ready" : "error", last_connection_test_at: result.testedAt, last_error: result.success ? null : { message: result.message } }).eq("id", integrationId).eq("workspace_id", workspace.id);
  revalidatePath(`/app/intelligence/fournisseurs/${integrationId}`);
  revalidatePath("/app/intelligence/fournisseurs");
}

export async function syncSupplierCatalog(integrationId: string, formData: FormData) {
  const { workspace, supabase, integration } = await getAuthorizedIntegration(integrationId);
  const connector = supplierConnectorRegistry.get(integration.connector_code);
  await supabase.from("supplier_integrations").update({ status: "syncing" }).eq("id", integrationId).eq("workspace_id", workspace.id);
  await new SupplierCatalogSyncService(supabase).sync({ workspaceId: workspace.id, supplierId: integration.supplier_id, integrationId, connector }, { dryRun: formData.get("dryRun") === "true", pageSize: 5, concurrency: 3, maxRetries: 2 });
  revalidatePath(`/app/intelligence/fournisseurs/${integrationId}`);
  revalidatePath("/app/intelligence/fournisseurs");
}
