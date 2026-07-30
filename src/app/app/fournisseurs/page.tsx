import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { EmptyState, PageHeader, StatusPill } from "@/components/app/page-shell";
import { getCurrentContext } from "@/lib/auth/current-context";
import {
  supplierStatusLabels,
  supplierStatuses,
  type Supplier,
  type SupplierStatus,
} from "@/lib/suppliers/types";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

type SearchParams = {
  q?: string;
  country?: string;
  status?: string;
  page?: string;
};

function pageHref(params: SearchParams, page: number) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "page") query.set(key, value);
  });
  if (page > 1) query.set("page", String(page));
  return `/app/fournisseurs${query.size ? `?${query}` : ""}`;
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const page = Math.max(1, Number(params.page) || 1);
  const status = supplierStatuses.includes(params.status as SupplierStatus)
    ? (params.status as SupplierStatus)
    : undefined;

  let query = supabase
    .from("suppliers")
    .select("*", { count: "exact" })
    .eq("workspace_id", workspace.id);
  if (params.q?.trim()) query = query.ilike("name", `%${params.q.trim()}%`);
  if (params.country) query = query.eq("country", params.country);
  if (status) query = query.eq("status", status);

  const [
    { data, count, error },
    { data: allSuppliers },
    { data: offers },
  ] = await Promise.all([
    query
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase
      .from("suppliers")
      .select("id, country, reliability_score")
      .eq("workspace_id", workspace.id),
    supabase
      .from("supplier_offers")
      .select("supplier_id, is_preferred, lead_time_days")
      .eq("workspace_id", workspace.id),
  ]);

  if (error) throw new Error(`Impossible de charger les fournisseurs : ${error.message}`);
  const suppliers = (data ?? []) as Supplier[];
  const countries = Array.from(
    new Set((allSuppliers ?? []).map((item) => item.country).filter((value): value is string => Boolean(value))),
  ).sort();
  const offerCounts = new Map<string, number>();
  (offers ?? []).forEach((offer) =>
    offerCounts.set(offer.supplier_id, (offerCounts.get(offer.supplier_id) ?? 0) + 1),
  );
  const average = (values: number[]) =>
    values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Approvisionnement"
        title="Fournisseurs"
        description="Structurez votre réseau d’approvisionnement et comparez les partenaires qui sécurisent votre marge."
        action={
          <Link href="/app/fournisseurs/nouveau" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#20211d] px-4 text-sm font-medium text-white">
            <Plus aria-hidden="true" className="size-4" />
            Nouveau fournisseur
          </Link>
        }
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Offres", String(offers?.length ?? 0)],
          ["Offres préférées", String((offers ?? []).filter((offer) => offer.is_preferred).length)],
          ["Délai moyen", `${average((offers ?? []).map((offer) => offer.lead_time_days).filter((value): value is number => value !== null))} j`],
          ["Fiabilité moyenne", `${average((allSuppliers ?? []).map((item) => item.reliability_score).filter((value): value is number => value !== null))} / 100`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#e0ded6] bg-white p-5">
            <p className="text-xs text-[#81827b]">{label}</p>
            <p className="mt-2 text-2xl font-medium tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#e0ded6] bg-white">
        <form className="flex flex-col gap-2 border-b border-[#ebe9e2] p-4 sm:flex-row">
          <label className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search aria-hidden="true" className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#92938c]" />
            <input name="q" defaultValue={params.q} placeholder="Rechercher un fournisseur…" className="h-10 w-full rounded-xl border border-[#dedcd4] pl-10 pr-3 text-sm outline-none" />
          </label>
          <select name="country" defaultValue={params.country ?? ""} className="h-10 rounded-xl border border-[#dedcd4] px-3 text-xs">
            <option value="">Tous les pays</option>
            {countries.map((country) => <option key={country}>{country}</option>)}
          </select>
          <select name="status" defaultValue={status ?? ""} className="h-10 rounded-xl border border-[#dedcd4] px-3 text-xs">
            <option value="">Tous les statuts</option>
            {supplierStatuses.map((value) => <option key={value} value={value}>{supplierStatusLabels[value]}</option>)}
          </select>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#f1f0eb] px-4 text-xs font-medium">
            <Filter aria-hidden="true" className="size-3.5" /> Filtrer
          </button>
        </form>

        {suppliers.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<Building2 aria-hidden="true" className="size-5" />}
              title="Aucun fournisseur"
              description="Ajoutez votre premier partenaire pour commencer à structurer vos offres d’approvisionnement."
            />
          </div>
        ) : (
          <div>
            {suppliers.map((supplier) => (
              <Link key={supplier.id} href={`/app/fournisseurs/${supplier.id}`} className="grid gap-3 border-b border-[#efede7] px-5 py-5 transition-colors last:border-0 hover:bg-[#fafbf8] sm:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_1fr] sm:items-center">
                <div>
                  <p className="text-sm font-medium">{supplier.name}</p>
                  <p className="mt-1 text-xs text-[#8a8b84]">{supplier.contact_email || "Aucun contact"}</p>
                </div>
                <span className="text-sm text-[#676861]">{supplier.country || "—"}</span>
                <span className="text-sm">{offerCounts.get(supplier.id) ?? 0} offres</span>
                <span className="text-sm">{supplier.average_lead_time_days ?? 0} j</span>
                <div><StatusPill tone={supplier.status === "active" ? "success" : supplier.status === "paused" ? "warning" : "neutral"}>{supplierStatusLabels[supplier.status]}</StatusPill></div>
              </Link>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-[#ebe9e2] px-5 py-4">
          <p className="text-xs text-[#85867f]">{total} fournisseur{total > 1 ? "s" : ""} · Page {page} sur {pageCount}</p>
          <div className="flex gap-2">
            <Link href={pageHref(params, Math.max(1, page - 1))} aria-disabled={page <= 1} className={`grid size-9 place-items-center rounded-xl border border-[#dedcd4] ${page <= 1 ? "pointer-events-none opacity-35" : ""}`}><ArrowLeft aria-hidden="true" className="size-4" /></Link>
            <Link href={pageHref(params, Math.min(pageCount, page + 1))} aria-disabled={page >= pageCount} className={`grid size-9 place-items-center rounded-xl border border-[#dedcd4] ${page >= pageCount ? "pointer-events-none opacity-35" : ""}`}><ArrowRight aria-hidden="true" className="size-4" /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
