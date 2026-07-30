import { getCurrentContext } from "@/lib/auth/current-context";
import { activateMatterhornIntegration } from "@/lib/supplier-intelligence/integration-mutations";
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
    return supplierRedirect(request, "/app/intelligence/fournisseurs", {
      error: controlledError(error, "activation-failed"),
    });
  }
}
