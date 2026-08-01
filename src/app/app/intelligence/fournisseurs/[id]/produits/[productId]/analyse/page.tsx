import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleGauge } from "lucide-react";
import { getCurrentContext } from "@/lib/auth/current-context";
import { estimateProductProfitability } from "@/lib/product-intelligence/profitability";
import { createClient } from "@/lib/supabase/server";

export default async function ProductAnalysisPage({ params }: { params: Promise<{ id: string; productId: string }> }) {
  const { id, productId } = await params;
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { data: product } = await supabase.from("supplier_catalog_products").select("id,title,purchase_price_ex_vat,recommended_retail_price,shipping_cost,currency").eq("id", productId).eq("integration_id", id).eq("workspace_id", workspace.id).maybeSingle();
  if (!product) notFound();
  const analysis = estimateProductProfitability({ supplierPrice: Number(product.purchase_price_ex_vat), shippingCost: product.shipping_cost == null ? null : Number(product.shipping_cost), recommendedRetailPrice: product.recommended_retail_price == null ? null : Number(product.recommended_retail_price) });
  const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: product.currency || "EUR" });
  const blocks = [
    ["Prix fournisseur", money.format(analysis.supplierPrice), false],
    ["Prix de vente estimé", money.format(analysis.estimatedSalePrice), analysis.assumptions.salePrice],
    ["Marge brute", money.format(analysis.grossMargin), true],
    ["ROI", `${analysis.roi.toFixed(1)} %`, true],
    ["Frais marketplace", money.format(analysis.marketplaceFees), analysis.assumptions.marketplaceFees],
    ["Frais livraison", money.format(analysis.shippingFees), analysis.assumptions.shippingFees],
  ] as const;
  return <div className="mx-auto max-w-5xl"><Link href={`/app/intelligence/fournisseurs/${id}/produits/${productId}`} className="inline-flex items-center gap-2 text-sm text-[#74756e]"><ArrowLeft className="size-4" />Retour au produit</Link><header className="mt-6"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#75806e]">Product Intelligence</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.03em]">Rentabilité de {product.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#74756e]">Première lecture indicative. Aucun frais Amazon, eBay ou signal concurrentiel réel n’est encore connecté.</p></header><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{blocks.map(([label,value,placeholder]) => <section key={label} className="rounded-2xl border border-[#e0ded6] bg-white p-5"><div className="flex items-center justify-between gap-2"><p className="text-xs text-[#85867f]">{label}</p>{placeholder && <span className="rounded-full bg-[#f3eddd] px-2 py-1 text-[10px] text-[#7a673e]">Placeholder</span>}</div><p className="mt-3 text-2xl font-semibold">{value}</p></section>)}</div><section className="mt-6 rounded-2xl border border-[#dce1d8] bg-[#eef1eb] p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#20211d] text-white"><CircleGauge className="size-5" /></span><div><p className="text-xs text-[#6f786a]">Score ELROVA</p><p className="text-2xl font-semibold">{analysis.score.score}/100</p></div></div><p className="mt-4 text-sm leading-6 text-[#687064]">{analysis.score.disclaimer}</p><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{analysis.score.factors.map((factor) => <div key={factor.signal} className="rounded-xl bg-white/70 p-3"><p className="text-xs font-medium">{factor.label}</p><p className="mt-1 text-[11px] text-[#858b81]">À connecter</p></div>)}</div></section></div>;
}
