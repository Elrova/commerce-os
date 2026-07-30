"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/auth/current-context";
import { calculateProductFinancials } from "@/lib/products/finance";
import { productSchema } from "@/lib/products/schema";
import { createClient } from "@/lib/supabase/server";

export type ProductActionState = {
  message?: string;
  errors?: Record<string, string[]>;
};

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    category: formData.get("category"),
    description: formData.get("description"),
    purchasePrice: formData.get("purchasePrice"),
    shippingCost: formData.get("shippingCost"),
    customsCost: formData.get("customsCost"),
    paymentFees: formData.get("paymentFees"),
    salePrice: formData.get("salePrice"),
    stockQuantity: formData.get("stockQuantity"),
    currency: formData.get("currency"),
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
}

function productPayload(
  workspaceId: string,
  values: ReturnType<typeof productSchema.parse>,
) {
  const totals = calculateProductFinancials(values);
  return {
    workspace_id: workspaceId,
    name: values.name,
    sku: values.sku,
    category: values.category || null,
    description: values.description || null,
    purchase_price: values.purchasePrice,
    shipping_cost: values.shippingCost,
    customs_cost: values.customsCost,
    payment_fees: values.paymentFees,
    total_unit_cost: totals.totalUnitCost,
    sale_price: values.salePrice,
    margin_amount: totals.marginAmount,
    margin_percent: totals.marginPercent,
    roi_percent: totals.roiPercent,
    stock_quantity: values.stockQuantity,
    currency: values.currency,
    status: values.status,
    notes: values.notes || null,
  };
}

export async function createProduct(
  _state: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(productPayload(workspace.id, parsed.data))
    .select("id")
    .single();

  if (error || !data) {
    return { message: error?.code === "23505" ? "Ce SKU existe déjà." : "Impossible de créer le produit." };
  }
  revalidatePath("/app/produits");
  redirect(`/app/produits/${data.id}`);
}

export async function updateProduct(
  productId: string,
  _state: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const payload = productPayload(workspace.id, parsed.data);
  const { workspace_id: _, ...updates } = payload;
  void _;
  const { error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId)
    .eq("workspace_id", workspace.id);

  if (error) return { message: error.code === "23505" ? "Ce SKU existe déjà." : "Impossible d’enregistrer le produit." };
  revalidatePath("/app/produits");
  revalidatePath(`/app/produits/${productId}`);
  redirect(`/app/produits/${productId}`);
}

export async function deleteProduct(productId: string) {
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId).eq("workspace_id", workspace.id);
  if (error) throw new Error("Impossible de supprimer ce produit.");
  revalidatePath("/app/produits");
  redirect("/app/produits");
}

export async function archiveProduct(productId: string) {
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ status: "archived" }).eq("id", productId).eq("workspace_id", workspace.id);
  if (error) throw new Error("Impossible d’archiver ce produit.");
  revalidatePath(`/app/produits/${productId}`);
  revalidatePath("/app/produits");
}
