"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/auth/current-context";
import { calculateSupplierOffer } from "@/lib/supplier-offers/finance";
import { supplierOfferSchema } from "@/lib/supplier-offers/schema";
import { createClient } from "@/lib/supabase/server";

export type OfferActionState = {
  message?: string;
  errors?: Record<string, string[]>;
};

export async function createOpportunityOffer(
  opportunityId: string,
  _state: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const parsed = supplierOfferSchema.safeParse({
    supplierId: formData.get("supplierId"),
    quickSupplierName: formData.get("quickSupplierName"),
    productUrl: formData.get("productUrl"),
    supplierSku: formData.get("supplierSku"),
    unitPrice: formData.get("unitPrice"),
    shippingCost: formData.get("shippingCost"),
    customsCost: formData.get("customsCost"),
    fees: formData.get("fees"),
    samplePrice: formData.get("samplePrice"),
    minimumOrderQuantity: formData.get("minimumOrderQuantity"),
    leadTimeDays: formData.get("leadTimeDays"),
    availableStock: formData.get("availableStock"),
    rating: formData.get("rating"),
    lastCheckedAt: formData.get("lastCheckedAt"),
    notes: formData.get("notes"),
    isPreferred: formData.get("isPreferred") === "on",
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, recommended_sale_price")
    .eq("id", opportunityId)
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (!opportunity) return { message: "Cette opportunité est introuvable." };

  let supplierId = parsed.data.supplierId;
  if (supplierId) {
    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id, reliability_score")
      .eq("id", supplierId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (!supplier) return { message: "Ce fournisseur n’appartient pas à votre workspace." };
  } else {
    const { data: newSupplier, error: supplierError } = await supabase
      .from("suppliers")
      .insert({
        workspace_id: workspace.id,
        name: parsed.data.quickSupplierName,
        minimum_order_quantity: parsed.data.minimumOrderQuantity,
        average_lead_time_days: parsed.data.leadTimeDays,
        reliability_score: parsed.data.rating
          ? Math.round(parsed.data.rating * 20)
          : 50,
        status: "prospect",
      })
      .select("id")
      .single();
    if (supplierError || !newSupplier) {
      return { message: "Impossible de créer le fournisseur rapide." };
    }
    supplierId = newSupplier.id;
  }

  calculateSupplierOffer({
    unitPrice: parsed.data.unitPrice,
    shippingCost: parsed.data.shippingCost,
    customsCost: parsed.data.customsCost,
    fees: parsed.data.fees,
    minimumOrderQuantity: parsed.data.minimumOrderQuantity,
    leadTimeDays: parsed.data.leadTimeDays,
    reliabilityScore: (parsed.data.rating ?? 2.5) * 20,
    salePrice: Number(opportunity.recommended_sale_price ?? 0),
  });

  const { data: offer, error } = await supabase
    .from("supplier_offers")
    .insert({
      workspace_id: workspace.id,
      supplier_id: supplierId,
      opportunity_id: opportunityId,
      product_id: null,
      supplier_product_url: parsed.data.productUrl || null,
      supplier_sku: parsed.data.supplierSku || null,
      currency: "EUR",
      unit_price: parsed.data.unitPrice,
      shipping_cost: parsed.data.shippingCost,
      customs_cost: parsed.data.customsCost,
      platform_or_payment_fees: parsed.data.fees,
      sample_price: parsed.data.samplePrice ?? null,
      minimum_order_quantity: parsed.data.minimumOrderQuantity,
      lead_time_days: parsed.data.leadTimeDays,
      available_stock: parsed.data.availableStock ?? null,
      rating: parsed.data.rating ?? null,
      last_checked_at: new Date(`${parsed.data.lastCheckedAt}T12:00:00Z`).toISOString(),
      is_preferred: false,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (error || !offer) return { message: "Impossible de créer l’offre fournisseur." };

  if (parsed.data.isPreferred) {
    const { error: preferredError } = await supabase.rpc(
      "set_preferred_supplier_offer",
      { target_offer_id: offer.id, target_workspace_id: workspace.id },
    );
    if (preferredError) {
      return {
        message:
          "L’offre a été créée, mais elle n’a pas pu être définie comme préférée.",
      };
    }
  }

  revalidatePath(`/app/opportunites/${opportunityId}`);
  revalidatePath(`/app/opportunites/${opportunityId}/comparer`);
  revalidatePath("/app/fournisseurs");
  redirect(`/app/opportunites/${opportunityId}/comparer`);
}

export async function setPreferredOffer(opportunityId: string, offerId: string) {
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { data: offer } = await supabase
    .from("supplier_offers")
    .select("id")
    .eq("id", offerId)
    .eq("opportunity_id", opportunityId)
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (!offer) throw new Error("Offre fournisseur introuvable.");

  const { error } = await supabase.rpc("set_preferred_supplier_offer", {
    target_offer_id: offerId,
    target_workspace_id: workspace.id,
  });
  if (error) throw new Error("Impossible de définir cette offre comme préférée.");

  revalidatePath(`/app/opportunites/${opportunityId}`);
  revalidatePath(`/app/opportunites/${opportunityId}/comparer`);
}
