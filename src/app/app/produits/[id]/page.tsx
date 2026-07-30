import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, Bot, Box, FileText, Pencil, Send, Store } from "lucide-react";
import { archiveProduct } from "../actions";
import { DeleteProductButton } from "@/components/products/delete-product-button";
import { getCurrentContext } from "@/lib/auth/current-context";
import { productStatusLabels, type ProductStatus } from "@/lib/products/types";
import { createClient } from "@/lib/supabase/server";

const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("*").eq("id", id).eq("workspace_id", workspace.id).maybeSingle();
  if (!product) notFound();
  const [{ data: opportunity }, { data: supplier }, { data: offers }] = await Promise.all([
    product.opportunity_id ? supabase.from("opportunities").select("id,name,score").eq("id", product.opportunity_id).eq("workspace_id", workspace.id).maybeSingle() : Promise.resolve({ data: null }),
    product.supplier_id ? supabase.from("suppliers").select("id,name").eq("id", product.supplier_id).eq("workspace_id", workspace.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("supplier_offers").select("*,suppliers(id,name)").eq("product_id", id).eq("workspace_id", workspace.id).order("is_preferred", { ascending: false }),
  ]);
  const preferred = offers?.find((offer) => offer.id === product.preferred_supplier_offer_id) ?? offers?.find((offer) => offer.is_preferred);
  const metric = (label: string, value: string, hint?: string) => <div className="rounded-2xl border border-[#e0ded6] bg-white p-5"><dt className="text-xs text-[#80817a]">{label}</dt><dd className="mt-2 text-xl font-semibold">{value}</dd>{hint && <p className="mt-1 text-xs text-[#92938c]">{hint}</p>}</div>;
  return (
    <div className="mx-auto max-w-7xl">
      <Link href="/app/produits" className="inline-flex items-center gap-2 text-sm text-[#74756e]"><ArrowLeft className="size-4" />Produits</Link>
      <header className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-start"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-[-.03em]">{product.name}</h1><span className="rounded-full bg-[#eef1eb] px-3 py-1 text-xs">{productStatusLabels[product.status as ProductStatus]}</span></div><p className="mt-2 text-sm text-[#74756e]">{product.sku} · {product.category || "Sans catégorie"}</p></div><div className="flex flex-wrap gap-2"><Link href={`/app/produits/${id}/modifier`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dedcd4] px-3 text-xs font-medium"><Pencil className="size-4" />Modifier</Link><Link href={`/app/produits/${id}/fiche`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dedcd4] px-3 text-xs font-medium"><FileText className="size-4" />Préparer la fiche</Link><Link href={`/app/produits/${id}/publication`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#20211d] px-3 text-xs font-medium text-white"><Send className="size-4" />Publier</Link></div></header>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{metric("Coût complet", money.format(Number(product.total_unit_cost)), `Achat ${money.format(Number(product.purchase_price))}`)}{metric("Prix de vente", money.format(Number(product.sale_price)))}{metric("Marge brute", money.format(Number(product.margin_amount)), `${Number(product.margin_percent).toFixed(1)} %`)}{metric("ROI", `${Number(product.roi_percent).toFixed(1)} %`)}{metric("Stock", `${product.stock_quantity} unités`)}</dl>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-2xl border border-[#e0ded6] bg-white p-5 sm:p-6"><h2 className="font-medium">Structure des coûts</h2><dl className="mt-5 divide-y divide-[#efede7] text-sm">{[["Prix d’achat", product.purchase_price],["Livraison", product.shipping_cost],["Douane", product.customs_cost],["Frais", product.payment_fees]].map(([label,value]) => <div key={String(label)} className="flex justify-between py-3"><dt className="text-[#74756e]">{label}</dt><dd className="font-medium">{money.format(Number(value))}</dd></div>)}</dl></section>
        <section className="rounded-2xl border border-[#dce1d8] bg-[#eef1eb] p-5 sm:p-6"><div className="flex items-center gap-2"><Store className="size-4" /><h2 className="font-medium">Approvisionnement préféré</h2></div>{preferred ? <div className="mt-5"><p className="font-medium">{supplier?.name ?? (Array.isArray(preferred.suppliers) ? preferred.suppliers[0]?.name : preferred.suppliers?.name)}</p><p className="mt-2 text-sm text-[#687064]">{money.format(Number(preferred.unit_price))} · MOQ {preferred.minimum_order_quantity} · {preferred.lead_time_days} jours</p><p className="mt-3 text-xs text-[#81887b]">Copie traçable de l’offre sélectionnée lors de la conversion.</p></div> : <p className="mt-5 text-sm text-[#747b70]">Aucune offre fournisseur rattachée pour le moment.</p>}</section>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#e0ded6] bg-white p-6"><h2 className="font-medium">Origine & historique</h2><div className="mt-5 space-y-4 text-sm">{opportunity ? <Link href={`/app/opportunites/${opportunity.id}`} className="flex items-center gap-3 rounded-xl bg-[#f5f4ef] p-4 hover:underline"><Bot className="size-4" /><span>Opportunité : {opportunity.name} · score {opportunity.score}/100</span></Link> : <div className="flex items-center gap-3 rounded-xl bg-[#f5f4ef] p-4"><Box className="size-4" />Création manuelle</div>}<p className="text-[#777870]">Créé le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(product.created_at))}{product.converted_at ? ` · Converti le ${new Intl.DateTimeFormat("fr-FR").format(new Date(product.converted_at))}` : ""}</p></div></section>
        <section className="rounded-2xl border border-[#e0ded6] bg-white p-6"><h2 className="font-medium">Notes</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#6f706a]">{product.notes || product.description || "Aucune note pour ce produit."}</p></section>
      </div>
      <section className="mt-6 rounded-2xl border border-dashed border-[#d8d6ce] bg-white p-6"><h2 className="font-medium">État de publication</h2><p className="mt-2 text-sm text-[#777870]">Aucune fiche ni publication connectée. Le produit est prêt à entrer dans le prochain workflow.</p></section>
      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[#dedcd4] pt-6"><form action={archiveProduct.bind(null, id)}><button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dedcd4] px-3 text-xs font-medium"><Archive className="size-4" />Archiver</button></form><DeleteProductButton productId={id} /></div>
    </div>
  );
}
