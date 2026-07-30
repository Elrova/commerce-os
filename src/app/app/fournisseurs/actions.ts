"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/auth/current-context";
import { supplierSchema } from "@/lib/suppliers/schema";
import { createClient } from "@/lib/supabase/server";

export type SupplierActionState = {
  message?: string;
  errors?: Record<string, string[]>;
};

function parseSupplier(formData: FormData) {
  return supplierSchema.safeParse({
    name: formData.get("name"),
    websiteUrl: formData.get("websiteUrl"),
    country: formData.get("country"),
    contactEmail: formData.get("contactEmail"),
    minimumOrderQuantity: formData.get("minimumOrderQuantity"),
    averageLeadTimeDays: formData.get("averageLeadTimeDays"),
    reliabilityScore: formData.get("reliabilityScore"),
    returnPolicy: formData.get("returnPolicy"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
}

function supplierPayload(data: ReturnType<typeof supplierSchema.parse>) {
  return {
    name: data.name,
    website_url: data.websiteUrl || null,
    country: data.country || null,
    contact_email: data.contactEmail || null,
    minimum_order_quantity: data.minimumOrderQuantity,
    average_lead_time_days: data.averageLeadTimeDays,
    reliability_score: data.reliabilityScore,
    return_policy: data.returnPolicy || null,
    status: data.status,
    notes: data.notes || null,
  };
}

export async function createSupplier(
  _state: SupplierActionState,
  formData: FormData,
): Promise<SupplierActionState> {
  const parsed = parseSupplier(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({ workspace_id: workspace.id, ...supplierPayload(parsed.data) })
    .select("id")
    .single();

  if (error || !data) return { message: "Impossible de créer le fournisseur." };
  revalidatePath("/app/fournisseurs");
  redirect(`/app/fournisseurs/${data.id}`);
}

export async function updateSupplier(
  supplierId: string,
  _state: SupplierActionState,
  formData: FormData,
): Promise<SupplierActionState> {
  const parsed = parseSupplier(formData);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .update(supplierPayload(parsed.data))
    .eq("id", supplierId)
    .eq("workspace_id", workspace.id);

  if (error) return { message: "Impossible d’enregistrer les modifications." };
  revalidatePath("/app/fournisseurs");
  revalidatePath(`/app/fournisseurs/${supplierId}`);
  redirect(`/app/fournisseurs/${supplierId}`);
}

export async function deleteSupplier(supplierId: string) {
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", supplierId)
    .eq("workspace_id", workspace.id);

  if (error) throw new Error("Impossible de supprimer ce fournisseur.");
  revalidatePath("/app/fournisseurs");
  redirect("/app/fournisseurs");
}
