import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ConversionForm, type ConversionOffer } from "@/components/products/conversion-form";
import { getCurrentContext } from "@/lib/auth/current-context";
import { createClient } from "@/lib/supabase/server";
import { convertOpportunity } from "./actions";

export default async function ConvertOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const [{ data: opportunity }, { data: offers }, { data: existingProduct }] = await Promise.all([
    supabase.from("opportunities").select("*").eq("id", id).eq("workspace_id", workspace.id).maybeSingle(),
    supabase.from("supplier_offers").select("id,unit_price,shipping_cost,customs_cost,platform_or_payment_fees,minimum_order_quantity,lead_time_days,is_preferred,suppliers(name)").eq("opportunity_id", id).eq("workspace_id", workspace.id).order("is_preferred", { ascending: false }),
    supabase.from("products").select("id,name").eq("opportunity_id", id).eq("workspace_id", workspace.id).maybeSingle(),
  ]);
  if (!opportunity) notFound();
  if (existingProduct) return <div className="mx-auto max-w-2xl rounded-2xl border border-[#dce1d8] bg-[#eef1eb] p-8 text-center"><h1 className="text-2xl font-semibold">Opportunité déjà convertie</h1><p className="mt-3 text-sm text-[#747b70]">Le produit « {existingProduct.name} » existe déjà. Une seconde conversion est bloquée.</p><Link href={`/app/produits/${existingProduct.id}`} className="mt-6 inline-flex rounded-xl bg-[#20211d] px-5 py-3 text-sm font-medium text-white">Voir le produit</Link></div>;
  const normalizedOffers: ConversionOffer[] = (offers ?? []).map((offer) => {
    const supplier = Array.isArray(offer.suppliers) ? offer.suppliers[0] : offer.suppliers;
    return { id: offer.id, supplierName: supplier?.name ?? "Fournisseur", unitPrice: Number(offer.unit_price), shippingCost: Number(offer.shipping_cost), customsCost: Number(offer.customs_cost), fees: Number(offer.platform_or_payment_fees), moq: offer.minimum_order_quantity, leadTimeDays: offer.lead_time_days, preferred: offer.is_preferred };
  });
  const action = convertOpportunity.bind(null, id);
  return <div className="mx-auto max-w-7xl"><Link href={`/app/opportunites/${id}`} className="inline-flex items-center gap-2 text-sm text-[#74756e]"><ArrowLeft className="size-4" />Retour à l’opportunité</Link><header className="mt-5 border-b border-[#e3e1da] pb-7"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#75806e]">Conversion contrôlée</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.03em]">Transformer {opportunity.name}</h1><p className="mt-2 text-sm text-[#74756e]">Validez l’approvisionnement et les données commerciales avant de créer le produit.</p></header><div className="mt-7"><ConversionForm action={action} offers={normalizedOffers} opportunityScore={opportunity.score} cancelHref={`/app/opportunites/${id}`} initialValues={{ name: opportunity.name, sku: `ELR-${id.slice(0,8).toUpperCase()}`, category: opportunity.category ?? "", description: opportunity.notes ?? "", purchasePrice: Number(opportunity.estimated_purchase_price), shippingCost: Number(opportunity.estimated_shipping_cost), customsCost: 0, paymentFees: Number(opportunity.estimated_platform_fees), salePrice: Number(opportunity.recommended_sale_price), stockQuantity: 0, currency: "EUR", status: "draft", notes: opportunity.notes ?? "" }} /></div></div>;
}
