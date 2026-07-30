import Link from "next/link";
import { ArrowUpDown, PackageOpen, Plus, Search } from "lucide-react";
import { getCurrentContext } from "@/lib/auth/current-context";
import { productStatusLabels, type ProductStatus } from "@/lib/products/types";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;
const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default async function ProductsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  const status = typeof params.status === "string" ? params.status : "";
  const sort = typeof params.sort === "string" ? params.sort : "date";
  const page = Math.max(1, Number(params.page) || 1);
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();

  let query = supabase.from("products")
    .select("id,name,sku,category,total_unit_cost,sale_price,margin_percent,stock_quantity,status,opportunity_id,created_at,opportunities(name)", { count: "exact" })
    .eq("workspace_id", workspace.id);
  if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  if (category) query = query.eq("category", category);
  if (status) query = query.eq("status", status);
  const sortMap = { name: "name", margin: "margin_percent", stock: "stock_quantity", date: "created_at" } as const;
  query = query.order(sortMap[sort as keyof typeof sortMap] ?? "created_at", { ascending: sort === "name" })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const [{ data: products, count }, { data: categoryRows }] = await Promise.all([
    query,
    supabase.from("products").select("category").eq("workspace_id", workspace.id).not("category", "is", null),
  ]);
  const categories = [...new Set((categoryRows ?? []).map((row) => row.category).filter(Boolean))] as string[];
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const makeHref = (nextPage: number) => {
    const values = new URLSearchParams();
    if (search) values.set("q", search);
    if (category) values.set("category", category);
    if (status) values.set("status", status);
    if (sort) values.set("sort", sort);
    values.set("page", String(nextPage));
    return `/app/produits?${values}`;
  };

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#75806e]">Catalogue</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.03em]">Produits</h1><p className="mt-2 max-w-2xl text-sm text-[#74756e]">Transformez les opportunités retenues en catalogue commercial pilotable.</p></div>
        <Link href="/app/produits/nouveau" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#20211d] px-4 text-sm font-medium text-white"><Plus className="size-4" />Nouveau produit</Link>
      </header>
      <form className="mt-8 grid gap-3 rounded-2xl border border-[#e0ded6] bg-white p-4 lg:grid-cols-[1fr_190px_170px_170px_auto]">
        <label className="relative"><span className="sr-only">Rechercher</span><Search className="absolute left-3 top-3 size-4 text-[#989990]" /><input name="q" defaultValue={search} placeholder="Nom ou SKU…" className="h-10 w-full rounded-xl border border-[#dedcd4] pl-9 pr-3 text-sm outline-none" /></label>
        <select name="category" defaultValue={category} aria-label="Catégorie" className="h-10 rounded-xl border border-[#dedcd4] px-3 text-sm"><option value="">Toutes catégories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
        <select name="status" defaultValue={status} aria-label="Statut" className="h-10 rounded-xl border border-[#dedcd4] px-3 text-sm"><option value="">Tous statuts</option>{Object.entries(productStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select name="sort" defaultValue={sort} aria-label="Tri" className="h-10 rounded-xl border border-[#dedcd4] px-3 text-sm"><option value="date">Plus récents</option><option value="name">Nom</option><option value="margin">Marge</option><option value="stock">Stock</option></select>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#eef1eb] px-4 text-sm font-medium"><ArrowUpDown className="size-4" />Appliquer</button>
      </form>
      {!products?.length ? (
        <div className="mt-5 grid min-h-72 place-items-center rounded-2xl border border-dashed border-[#d8d6ce] bg-white p-8 text-center"><div><PackageOpen className="mx-auto size-8 text-[#8d9686]" /><h2 className="mt-4 font-medium">Aucun produit dans cette vue</h2><p className="mt-2 text-sm text-[#7b7c75]">Convertissez une opportunité ou créez votre premier produit manuellement.</p></div></div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[#e0ded6] bg-white">
          <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-[#f5f4ef] text-xs text-[#777870]"><tr>{["Produit","Catégorie","Coût total","Prix","Marge","Stock","Statut","Origine","Créé"].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-[#efede7]">{products.map((product) => {
              const opportunity = Array.isArray(product.opportunities) ? product.opportunities[0] : product.opportunities;
              return <tr key={product.id} className="hover:bg-[#faf9f6]"><td className="px-4 py-4"><Link href={`/app/produits/${product.id}`} className="font-medium hover:underline">{product.name}</Link><p className="mt-1 text-xs text-[#8a8b84]">{product.sku}</p></td><td className="px-4 py-4">{product.category || "—"}</td><td className="px-4 py-4">{money.format(Number(product.total_unit_cost))}</td><td className="px-4 py-4">{money.format(Number(product.sale_price))}</td><td className="px-4 py-4 font-medium">{Number(product.margin_percent).toFixed(1)} %</td><td className="px-4 py-4">{product.stock_quantity}</td><td className="px-4 py-4"><span className="rounded-full bg-[#eef1eb] px-2.5 py-1 text-xs">{productStatusLabels[product.status as ProductStatus]}</span></td><td className="max-w-40 truncate px-4 py-4 text-xs">{opportunity?.name ?? "Création manuelle"}</td><td className="px-4 py-4 text-xs">{new Intl.DateTimeFormat("fr-FR").format(new Date(product.created_at))}</td></tr>;
            })}</tbody></table></div>
        </div>
      )}
      <nav aria-label="Pagination" className="mt-5 flex items-center justify-between text-sm"><span className="text-[#777870]">{count ?? 0} produit{count === 1 ? "" : "s"}</span><div className="flex gap-2"><Link aria-disabled={page <= 1} href={makeHref(Math.max(1, page - 1))} className={`rounded-xl border px-3 py-2 ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}>Précédent</Link><span className="px-2 py-2">{page} / {pageCount}</span><Link aria-disabled={page >= pageCount} href={makeHref(Math.min(pageCount, page + 1))} className={`rounded-xl border px-3 py-2 ${page >= pageCount ? "pointer-events-none opacity-40" : ""}`}>Suivant</Link></div></nav>
    </div>
  );
}
