import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, Boxes, PackageCheck } from "lucide-react";
import { ProductGallery } from "@/components/product-intelligence/product-gallery";
import { getCurrentContext } from "@/lib/auth/current-context";
import { createClient } from "@/lib/supabase/server";

type Variant = { externalId?: string; sku?: string; label?: string; stock?: number; price?: number; attributes?: Record<string, string> };
const unavailable = "Non disponible";

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
function variantsFrom(value: unknown): Variant[] {
  return Array.isArray(value) ? value.filter((item): item is Variant => Boolean(item) && typeof item === "object") : [];
}
function objectFrom(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function display(value: unknown) {
  return value === null || value === undefined || value === "" ? unavailable : String(value);
}

export default async function SupplierProductPage({ params }: { params: Promise<{ id: string; productId: string }> }) {
  const { id, productId } = await params;
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const [{ data: integration }, { data: product }] = await Promise.all([
    supabase.from("supplier_integrations").select("id,supplier_id,suppliers(name,country)").eq("id", id).eq("workspace_id", workspace.id).maybeSingle(),
    supabase.from("supplier_catalog_products").select("*").eq("id", productId).eq("integration_id", id).eq("workspace_id", workspace.id).maybeSingle(),
  ]);
  if (!integration || !product) notFound();
  const supplier = Array.isArray(integration.suppliers) ? integration.suppliers[0] : integration.suppliers;
  const images = stringArray(product.images);
  const variants = variantsFrom(product.variants);
  const attributes = objectFrom(product.attributes);
  const sizes = [...new Set(variants.map((variant) => variant.attributes?.size ?? variant.label).filter((value): value is string => Boolean(value)))];
  const colors = [...new Set([...variants.map((variant) => variant.attributes?.color), typeof attributes.color === "string" ? attributes.color : undefined].filter((value): value is string => Boolean(value)))];
  const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: product.currency || "EUR" });
  const facts = [
    ["SKU", product.sku], ["EAN", product.ean], ["GTIN", product.gtin], ["Marque", product.brand],
    ["Catégorie", product.category], ["Fournisseur", supplier?.name], ["Pays", product.ships_from_country ?? supplier?.country],
    ["Prix HT", product.purchase_price_ex_vat == null ? null : money.format(Number(product.purchase_price_ex_vat))],
    ["Devise", product.currency], ["Stock", product.stock], ["Poids", product.weight == null ? null : `${product.weight} kg`],
    ["Dernière synchronisation", product.last_synced_at ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(product.last_synced_at)) : null],
  ];
  return <div className="mx-auto max-w-7xl"><Link href={`/app/intelligence/fournisseurs/${id}`} className="inline-flex items-center gap-2 text-sm text-[#74756e]"><ArrowLeft className="size-4" />Catalogue fournisseur</Link><div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,440px)_1fr]"><ProductGallery images={images} title={product.title} /><main><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#eef1eb] px-2.5 py-1 text-xs text-[#586451]">{product.stock_status || unavailable}</span><span className="text-xs text-[#888981]">{product.active ? "Commercialisable" : "Indisponible"}</span></div><h1 className="mt-4 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">{product.title}</h1><p className="mt-3 text-sm text-[#74756e]">{display(product.brand)} · {display(product.category)}</p><div className="mt-7 flex flex-wrap gap-3"><Link href={`/app/intelligence/fournisseurs/${id}/produits/${productId}/analyse`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#20211d] px-4 text-sm font-medium text-white"><BarChart3 className="size-4" />Analyser la rentabilité</Link>{product.product_url && <a href={product.product_url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#dedcd4] bg-white px-4 text-sm font-medium"><PackageCheck className="size-4" />Voir chez le fournisseur</a>}</div><dl className="mt-8 grid gap-3 sm:grid-cols-2">{facts.map(([label,value]) => <div key={String(label)} className="rounded-xl border border-[#e8e6df] bg-white p-4"><dt className="text-xs text-[#85867f]">{label}</dt><dd className="mt-1.5 text-sm font-medium">{display(value)}</dd></div>)}</dl></main></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]"><section className="rounded-2xl border border-[#e0ded6] bg-white p-6"><h2 className="text-lg font-medium">Description</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#62635d]">{display(product.description)}</p></section><section className="rounded-2xl border border-[#dce1d8] bg-[#eef1eb] p-6"><h2 className="text-lg font-medium">Déclinaisons</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-xs text-[#777e72]">Tailles</dt><dd className="mt-1.5">{sizes.length ? sizes.join(", ") : unavailable}</dd></div><div><dt className="text-xs text-[#777e72]">Couleurs</dt><dd className="mt-1.5">{colors.length ? colors.join(", ") : unavailable}</dd></div></dl></section></div>
    <section className="mt-6 rounded-2xl border border-[#e0ded6] bg-white p-6"><div className="flex items-center gap-2"><Boxes className="size-4" /><h2 className="text-lg font-medium">Variantes</h2></div>{variants.length === 0 ? <p className="mt-4 text-sm text-[#777870]">Non disponible</p> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b text-xs text-[#85867f]"><tr>{["Variante","SKU fournisseur","Taille","Couleur","Stock","Prix"].map((label) => <th key={label} className="px-3 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-[#efede7]">{variants.map((variant, index) => <tr key={variant.externalId ?? variant.sku ?? index}><td className="px-3 py-4">{display(variant.label)}</td><td className="px-3 py-4">{display(variant.sku)}</td><td className="px-3 py-4">{display(variant.attributes?.size)}</td><td className="px-3 py-4">{display(variant.attributes?.color)}</td><td className="px-3 py-4">{display(variant.stock)}</td><td className="px-3 py-4">{variant.price == null ? unavailable : money.format(variant.price)}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
