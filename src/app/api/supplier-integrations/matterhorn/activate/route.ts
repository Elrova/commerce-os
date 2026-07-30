import { getCurrentContext } from "@/lib/auth/current-context";
import {
  activateMatterhornIntegration,
  IntegrationMutationError,
} from "@/lib/supplier-intelligence/integration-mutations";
import { controlledError, supplierRedirect } from "../../route-utils";

export async function POST(request: Request) {
  const context = await getCurrentContext();
  try {
    const result = await activateMatterhornIntegration(context);
    return supplierRedirect(
      request,
      `/app/intelligence/fournisseurs/${result.integrationId}`,
      { success: result.created ? "matterhorn-activated" : "matterhorn-already-active" },
    );
  } catch (error) {
    if (!(error instanceof IntegrationMutationError)) {
      console.error("[matterhorn-activation] unexpected failure", {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return supplierRedirect(request, "/app/intelligence/fournisseurs", {
      error: controlledError(error, "activation-failed"),
    });
  }
}
