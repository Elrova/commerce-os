"use server";

import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/auth/current-context";
import { conversionSchema } from "@/lib/products/schema";
import { createClient } from "@/lib/supabase/server";
import type { ProductActionState } from "@/app/app/produits/actions";

export async function convertOpportunity(
  opportunityId: string,
  _state: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsed = conversionSchema.safeParse({
    name: formData.get("name"), sku: formData.get("sku"), category: formData.get("category"),
    description: formData.get("description"), purchasePrice: formData.get("purchasePrice"),
    shippingCost: formData.get("shippingCost"), customsCost: formData.get("customsCost"),
    paymentFees: formData.get("paymentFees"), salePrice: formData.get("salePrice"),
    stockQuantity: formData.get("stockQuantity"), currency: formData.get("currency"),
    status: formData.get("status"), notes: formData.get("notes"),
    selectedOfferId: formData.get("selectedOfferId"),
    manualConversionConfirmed: formData.get("manualConversionConfirmed") === "on",
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  if (!parsed.data.selectedOfferId && !parsed.data.manualConversionConfirmed) {
    return { errors: { manualConversionConfirmed: ["Confirmez explicitement la conversion sans offre fournisseur."] } };
  }
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("convert_opportunity_to_product", {
    target_workspace_id: workspace.id,
    target_opportunity_id: opportunityId,
    selected_offer_id: parsed.data.selectedOfferId || null,
    product_name: parsed.data.name,
    product_sku: parsed.data.sku,
    product_category: parsed.data.category,
    product_description: parsed.data.description,
    product_status: parsed.data.status,
    product_purchase_price: parsed.data.purchasePrice,
    product_shipping_cost: parsed.data.shippingCost,
    product_customs_cost: parsed.data.customsCost,
    product_payment_fees: parsed.data.paymentFees,
    product_sale_price: parsed.data.salePrice,
    product_stock_quantity: parsed.data.stockQuantity,
    product_currency: parsed.data.currency,
    product_notes: parsed.data.notes,
    manual_conversion_confirmed: parsed.data.manualConversionConfirmed,
  });
  if (error || !data) {
    const alreadyConverted = error?.message.toLowerCase().includes("already converted");
    return { message: alreadyConverted ? "Cette opportunité a déjà été convertie." : "La conversion n’a pas pu être finalisée. Vérifiez le SKU et l’offre sélectionnée." };
  }
  redirect(`/app/produits/${data}`);
}
