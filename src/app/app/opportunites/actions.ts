"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/auth/current-context";
import { calculateOpportunityFinancials } from "@/lib/opportunities/finance";
import { opportunitySchema } from "@/lib/opportunities/schema";
import { createClient } from "@/lib/supabase/server";

export type OpportunityActionState = {
  message?: string;
  errors?: Record<string, string[]>;
};

function parseFormData(formData: FormData) {
  return opportunitySchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    sourceUrl: formData.get("sourceUrl"),
    purchasePrice: formData.get("purchasePrice"),
    shippingCost: formData.get("shippingCost"),
    platformFees: formData.get("platformFees"),
    salePrice: formData.get("salePrice"),
    notes: formData.get("notes"),
    status: formData.get("status"),
  });
}

export async function createOpportunity(
  _state: OpportunityActionState,
  formData: FormData,
): Promise<OpportunityActionState> {
  const parsed = parseFormData(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const financials = calculateOpportunityFinancials(parsed.data);
  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      workspace_id: workspace.id,
      name: parsed.data.name,
      category: parsed.data.category || null,
      source_url: parsed.data.sourceUrl || null,
      estimated_purchase_price: parsed.data.purchasePrice,
      estimated_shipping_cost: parsed.data.shippingCost,
      estimated_platform_fees: parsed.data.platformFees,
      recommended_sale_price: parsed.data.salePrice,
      estimated_margin: financials.marginPercent,
      score: financials.score,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { message: "Impossible de créer l’opportunité. Réessayez." };
  }

  revalidatePath("/app/opportunites");
  redirect(`/app/opportunites/${data.id}`);
}

export async function updateOpportunity(
  opportunityId: string,
  _state: OpportunityActionState,
  formData: FormData,
): Promise<OpportunityActionState> {
  const parsed = parseFormData(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const financials = calculateOpportunityFinancials(parsed.data);
  const { error } = await supabase
    .from("opportunities")
    .update({
      name: parsed.data.name,
      category: parsed.data.category || null,
      source_url: parsed.data.sourceUrl || null,
      estimated_purchase_price: parsed.data.purchasePrice,
      estimated_shipping_cost: parsed.data.shippingCost,
      estimated_platform_fees: parsed.data.platformFees,
      recommended_sale_price: parsed.data.salePrice,
      estimated_margin: financials.marginPercent,
      score: financials.score,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
    })
    .eq("id", opportunityId)
    .eq("workspace_id", workspace.id);

  if (error) {
    return { message: "Impossible d’enregistrer les modifications." };
  }

  revalidatePath("/app/opportunites");
  revalidatePath(`/app/opportunites/${opportunityId}`);
  redirect(`/app/opportunites/${opportunityId}`);
}

export async function deleteOpportunity(opportunityId: string) {
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunities")
    .delete()
    .eq("id", opportunityId)
    .eq("workspace_id", workspace.id);

  if (error) {
    throw new Error("Impossible de supprimer cette opportunité.");
  }

  revalidatePath("/app/opportunites");
  redirect("/app/opportunites");
}
