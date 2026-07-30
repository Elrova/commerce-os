import { getCurrentContext } from "@/lib/auth/current-context";
import { synchronizeIntegration } from "@/lib/supplier-intelligence/integration-mutations";
import { controlledError, supplierRedirect } from "../../route-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getCurrentContext();
  const { id } = await params;
  try {
    const formData = await request.formData();
    await synchronizeIntegration(context, id, formData.get("dryRun") === "true");
    return supplierRedirect(request, `/app/intelligence/fournisseurs/${id}`, {
      success: "sync-completed",
    });
  } catch (error) {
    const code = controlledError(error, "sync-failed");
    const pathname = code === "integration-not-found"
      ? "/app/intelligence/fournisseurs"
      : `/app/intelligence/fournisseurs/${id}`;
    return supplierRedirect(request, pathname, { error: code });
  }
}
