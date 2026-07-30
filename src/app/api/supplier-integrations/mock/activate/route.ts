import { getCurrentContext } from "@/lib/auth/current-context";
import { activateMockIntegration } from "@/lib/supplier-intelligence/integration-mutations";
import { controlledError, supplierRedirect } from "../../route-utils";

export async function POST(request: Request) {
  const context = await getCurrentContext();
  try {
    const result = await activateMockIntegration(context);
    return supplierRedirect(
      request,
      `/app/intelligence/fournisseurs/${result.integrationId}`,
      { success: result.created ? "mock-activated" : "mock-already-active" },
    );
  } catch (error) {
    return supplierRedirect(request, "/app/intelligence/fournisseurs", {
      error: controlledError(error, "activation-failed"),
    });
  }
}
