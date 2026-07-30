import Link from "next/link";
import { ArrowLeft, ArrowRight, Filter, Plus, Target } from "lucide-react";
import { EmptyState, PageHeader, StatusPill } from "@/components/app/page-shell";
import { OpportunitySearch } from "@/components/opportunities/search-input";
import { getCurrentContext } from "@/lib/auth/current-context";
import {
  opportunityStatusLabels,
  opportunityStatuses,
  type Opportunity,
  type OpportunityStatus,
} from "@/lib/opportunities/types";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;
const sortOptions = {
  score: { column: "score", ascending: false, label: "Score" },
  date: { column: "created_at", ascending: false, label: "Date" },
  name: { column: "name", ascending: true, label: "Nom" },
  margin: { column: "estimated_margin", ascending: false, label: "Marge" },
} as const;

type SearchParams = {
  q?: string;
  category?: string;
  status?: string;
  minScore?: string;
  sort?: string;
  page?: string;
};

function statusTone(status: OpportunityStatus) {
  if (status === "qualified" || status === "converted") return "success";
  if (status === "rejected") return "error";
  return "neutral";
}

function buildPageHref(params: SearchParams, page: number) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "page") search.set(key, value);
  });
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/app/opportunites?${query}` : "/app/opportunites";
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const minScore = Math.min(
    100,
    Math.max(0, Number.parseInt(params.minScore ?? "0", 10) || 0),
  );
  const status = opportunityStatuses.includes(
    params.status as OpportunityStatus,
  )
    ? (params.status as OpportunityStatus)
    : undefined;
  const sortKey = params.sort && params.sort in sortOptions
    ? (params.sort as keyof typeof sortOptions)
    : "score";
  const sort = sortOptions[sortKey];

  let query = supabase
    .from("opportunities")
    .select("*", { count: "exact" })
    .eq("workspace_id", workspace.id);

  if (params.q?.trim()) {
    query = query.ilike("name", `%${params.q.trim()}%`);
  }
  if (params.category) query = query.eq("category", params.category);
  if (status) query = query.eq("status", status);
  if (minScore > 0) query = query.gte("score", minScore);

  const [{ data, count, error }, { data: categoryRows }] = await Promise.all([
    query
      .order(sort.column, { ascending: sort.ascending, nullsFirst: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase
      .from("opportunities")
      .select("category")
      .eq("workspace_id", workspace.id)
      .not("category", "is", null)
      .order("category"),
  ]);

  if (error) {
    throw new Error(`Impossible de charger les opportunités : ${error.message}`);
  }

  const opportunities = (data ?? []) as Opportunity[];
  const categories = Array.from(
    new Set(
      (categoryRows ?? [])
        .map((row) => row.category)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(
    params.q || params.category || status || minScore || params.sort,
  );
  const currency = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Sourcing"
        title="Opportunités"
        description="Comparez vos hypothèses et concentrez-vous sur les produits qui méritent une vraie validation."
        action={
          <Link
            href="/app/opportunites/nouvelle"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#20211d] px-4 text-sm font-medium text-white"
          >
            <Plus aria-hidden="true" className="size-4" />
            Nouvelle opportunité
          </Link>
        }
      />

      <div className="mt-8 rounded-2xl border border-[#e0ded6] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#ebe9e2] p-4 sm:flex-row">
          <OpportunitySearch />
          <form className="flex flex-1 flex-wrap gap-2 sm:justify-end">
            {params.q && <input type="hidden" name="q" value={params.q} />}
            <select
              name="category"
              defaultValue={params.category ?? ""}
              aria-label="Filtrer par catégorie"
              className="h-10 min-w-36 rounded-xl border border-[#dedcd4] bg-white px-3 text-xs outline-none"
            >
              <option value="">Toutes catégories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={status ?? ""}
              aria-label="Filtrer par statut"
              className="h-10 rounded-xl border border-[#dedcd4] bg-white px-3 text-xs outline-none"
            >
              <option value="">Tous statuts</option>
              {opportunityStatuses.map((value) => (
                <option key={value} value={value}>
                  {opportunityStatusLabels[value]}
                </option>
              ))}
            </select>
            <select
              name="minScore"
              defaultValue={minScore || ""}
              aria-label="Score minimum"
              className="h-10 rounded-xl border border-[#dedcd4] bg-white px-3 text-xs outline-none"
            >
              <option value="">Score min.</option>
              {[25, 50, 70, 85].map((value) => (
                <option key={value} value={value}>{value}+</option>
              ))}
            </select>
            <select
              name="sort"
              defaultValue={sortKey}
              aria-label="Trier les opportunités"
              className="h-10 rounded-xl border border-[#dedcd4] bg-white px-3 text-xs outline-none"
            >
              {Object.entries(sortOptions).map(([value, option]) => (
                <option key={value} value={value}>Tri : {option.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d8d6ce] bg-[#f5f4ef] px-3.5 text-xs font-medium"
            >
              <Filter aria-hidden="true" className="size-3.5" />
              Appliquer
            </button>
          </form>
        </div>

        {opportunities.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<Target aria-hidden="true" className="size-5" />}
              title={hasFilters ? "Aucun résultat" : "Votre sélection commence ici"}
              description={
                hasFilters
                  ? "Aucune opportunité ne correspond à ces critères. Ajustez les filtres."
                  : "Ajoutez un premier produit pour calculer sa marge, son ROI et son score ELROVA."
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.7fr_1fr_1fr_0.8fr_0.7fr_1fr_1fr] gap-4 border-b border-[#ebe9e2] px-5 py-3 text-[11px] uppercase tracking-[0.08em] text-[#92938c] lg:grid">
              <span>Nom</span><span>Catégorie</span><span>Prix conseillé</span>
              <span>Marge</span><span>Score</span><span>Statut</span><span>Création</span>
            </div>
            <div>
              {opportunities.map((opportunity) => (
                <Link
                  key={opportunity.id}
                  href={`/app/opportunites/${opportunity.id}`}
                  className="group grid gap-3 border-b border-[#efede7] px-5 py-5 transition-colors last:border-0 hover:bg-[#fafbf8] lg:grid-cols-[1.7fr_1fr_1fr_0.8fr_0.7fr_1fr_1fr] lg:items-center lg:gap-4"
                >
                  <div>
                    <p className="text-sm font-medium group-hover:text-[#53664d]">
                      {opportunity.name}
                    </p>
                    <p className="mt-1 text-xs text-[#8b8c85] lg:hidden">
                      {opportunity.category || "Sans catégorie"}
                    </p>
                  </div>
                  <span className="hidden text-sm text-[#6f7069] lg:block">
                    {opportunity.category || "—"}
                  </span>
                  <span className="hidden text-sm font-medium lg:block">
                    {currency.format(opportunity.recommended_sale_price ?? 0)}
                  </span>
                  <div className="flex items-center justify-between lg:block">
                    <span className="text-xs text-[#8b8c85] lg:hidden">Marge estimée</span>
                    <span className="text-sm font-medium">
                      {(opportunity.estimated_margin ?? 0).toFixed(1)} %
                    </span>
                  </div>
                  <div className="flex items-center justify-between lg:block">
                    <span className="text-xs text-[#8b8c85] lg:hidden">Score ELROVA</span>
                    <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#edf0e9] text-xs font-semibold text-[#586752]">
                      {opportunity.score ?? 0}
                    </span>
                  </div>
                  <div>
                    <StatusPill tone={statusTone(opportunity.status)}>
                      {opportunityStatusLabels[opportunity.status]}
                    </StatusPill>
                  </div>
                  <time
                    dateTime={opportunity.created_at}
                    className="hidden text-xs text-[#7e7f78] lg:block"
                  >
                    {new Intl.DateTimeFormat("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(opportunity.created_at))}
                  </time>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center justify-between border-t border-[#ebe9e2] px-5 py-4">
          <p className="text-xs text-[#85867f]">
            {total} opportunité{total > 1 ? "s" : ""} · Page {Math.min(page, pageCount)} sur {pageCount}
          </p>
          <div className="flex gap-2">
            <Link
              href={buildPageHref(params, Math.max(1, page - 1))}
              aria-disabled={page <= 1}
              className={`grid size-9 place-items-center rounded-xl border border-[#dedcd4] ${page <= 1 ? "pointer-events-none opacity-35" : "hover:bg-[#f5f4ef]"}`}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href={buildPageHref(params, Math.min(pageCount, page + 1))}
              aria-disabled={page >= pageCount}
              className={`grid size-9 place-items-center rounded-xl border border-[#dedcd4] ${page >= pageCount ? "pointer-events-none opacity-35" : "hover:bg-[#f5f4ef]"}`}
            >
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
