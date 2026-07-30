import { getCurrentContext } from "@/lib/auth/current-context";
import { testIntegrationConnection } from "@/lib/supplier-intelligence/integration-mutations";
import { controlledError, supplierRedirect } from "../../route-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getCurrentContext();
  const { id } = await params;
  try {
    await testIntegrationConnection(context, id);
    return supplierRedirect(request, `/app/intelligence/fournisseurs/${id}`, {
      success: "connection-tested",
    });
  } catch (error) {
    const code = controlledError(error, "connection-failed");
    const pathname = code === "integration-not-found"
      ? "/app/intelligence/fournisseurs"
      : `/app/intelligence/fournisseurs/${id}`;
    return supplierRedirect(request, pathname, { error: code });
  }
}
