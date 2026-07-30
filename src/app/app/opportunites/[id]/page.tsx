import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Building2,
  Clock3,
  ExternalLink,
  Pencil,
  PackageCheck,
  Plus,
  Scale,
} from "lucide-react";
import { deleteOpportunity } from "@/app/app/opportunites/actions";
import { EmptyState, StatusPill } from "@/components/app/page-shell";
import { DeleteOpportunityButton } from "@/components/opportunities/delete-button";
import { FinancialSummary } from "@/components/opportunities/financial-summary";
import { getCurrentContext } from "@/lib/auth/current-context";
import { calculateOpportunityFinancials } from "@/lib/opportunities/finance";
import {
  opportunityStatusLabels,
  type Opportunity,
} from "@/lib/opportunities/types";
import { createClient } from "@/lib/supabase/server";

type SupplierOffer = {
  id: string;
  unit_price: number;
  shipping_cost: number;
  customs_cost: number;
  platform_or_payment_fees: number;
  minimum_order_quantity: number;
  lead_time_days: number | null;
  is_preferred: boolean;
  supplier: { name: string } | null;
};

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de charger l’opportunité : ${error.message}`);
  }
  if (!data) notFound();

  const opportunity = data as Opportunity;
  const { data: convertedProduct } = await supabase
    .from("products")
    .select("id, name")
    .eq("workspace_id", workspace.id)
    .eq("opportunity_id", id)
    .maybeSingle();
  const { data: offers, error: offersError } = await supabase
    .from("supplier_offers")
    .select(
      "id, unit_price, shipping_cost, customs_cost, platform_or_payment_fees, minimum_order_quantity, lead_time_days, is_preferred, supplier:suppliers(name)",
    )
    .eq("workspace_id", workspace.id)
    .eq("opportunity_id", id)
    .order("is_preferred", { ascending: false })
    .order("unit_price");

  if (offersError) {
    throw new Error(`Impossible de charger les offres : ${offersError.message}`);
  }
  const supplierOffers = (offers ?? []) as unknown as SupplierOffer[];

  const financials = calculateOpportunityFinancials({
    purchasePrice: Number(opportunity.estimated_purchase_price ?? 0),
    shippingCost: Number(opportunity.estimated_shipping_cost ?? 0),
    platformFees: Number(opportunity.estimated_platform_fees ?? 0),
    salePrice: Number(opportunity.recommended_sale_price ?? 0),
  });
  const deleteAction = deleteOpportunity.bind(null, opportunity.id);

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/app/opportunites"
        className="inline-flex items-center gap-2 text-xs font-medium text-[#73746d]"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Opportunités
      </Link>

      <div className="mt-5 flex flex-col gap-6 border-b border-[#e3e1da] pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone={opportunity.status === "rejected" ? "error" : opportunity.status === "draft" ? "neutral" : "success"}>
              {opportunityStatusLabels[opportunity.status]}
            </StatusPill>
            <span className="text-xs text-[#898a83]">
              {opportunity.category || "Sans catégorie"}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
            {opportunity.name}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {convertedProduct ? (
            <Link
              href={`/app/produits/${convertedProduct.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#eef1eb] px-4 text-sm font-medium text-[#586451]"
            >
              <PackageCheck aria-hidden="true" className="size-4" />
              Voir le produit créé
            </Link>
          ) : (
            <Link
              href={`/app/opportunites/${opportunity.id}/transformer`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#20211d] px-4 text-sm font-medium text-white"
            >
              <PackageCheck aria-hidden="true" className="size-4" />
              Transformer en produit
            </Link>
          )}
          <DeleteOpportunityButton action={deleteAction} />
          <Link
            href={`/app/opportunites/${opportunity.id}/modifier`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dedcd4] px-4 text-sm font-medium"
          >
            <Pencil aria-hidden="true" className="size-4" />
            Modifier
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#e0ded6] bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#788570]">Résumé</p>
                <h2 className="mt-2 text-xl font-medium">Hypothèse commerciale</h2>
              </div>
              {opportunity.source_url && (
                <a
                  href={opportunity.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#687760]"
                >
                  Voir la source
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              )}
            </div>
            <dl className="mt-7 grid gap-5 border-t border-[#efede7] pt-6 sm:grid-cols-4">
              {[
                ["Prix fournisseur", currency.format(opportunity.estimated_purchase_price ?? 0)],
                ["Livraison", currency.format(opportunity.estimated_shipping_cost ?? 0)],
                ["Commission", currency.format(opportunity.estimated_platform_fees ?? 0)],
                ["Prix conseillé", currency.format(opportunity.recommended_sale_price ?? 0)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-[#8b8c85]">{label}</dt>
                  <dd className="mt-2 text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-[#e0ded6] bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#788570]">Fournisseurs</p>
                <h2 className="mt-2 text-xl font-medium">Offres associées</h2>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/app/opportunites/${id}/comparer`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dedcd4] px-4 text-sm font-medium"
                >
                  <Scale aria-hidden="true" className="size-4" />
                  Comparer
                </Link>
                <Link
                  href={`/app/opportunites/${id}/offres/nouvelle`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#20211d] px-4 text-sm font-medium text-white"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Ajouter un fournisseur
                </Link>
              </div>
            </div>

            {supplierOffers.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  icon={<Building2 aria-hidden="true" className="size-5" />}
                  title="Aucune offre fournisseur"
                  description="Ajoutez une première offre directement à cette opportunité pour comparer les coûts réels avant de créer le produit."
                />
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-xl border border-[#ebe9e2]">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-[#f8f7f3] text-xs text-[#85867f]">
                    <tr>
                      {["Fournisseur", "Prix", "Coût complet", "MOQ", "Lead time", "Préféré"].map((heading) => (
                        <th key={heading} className="px-4 py-3 font-medium">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {supplierOffers.map((offer) => (
                      <tr key={offer.id} className="border-t border-[#efede7]">
                        <td className="px-4 py-4 font-medium">{offer.supplier?.name ?? "Fournisseur"}</td>
                        <td className="px-4 py-4">{currency.format(offer.unit_price)}</td>
                        <td className="px-4 py-4">{currency.format(Number(offer.unit_price) + Number(offer.shipping_cost) + Number(offer.customs_cost) + Number(offer.platform_or_payment_fees))}</td>
                        <td className="px-4 py-4">{offer.minimum_order_quantity}</td>
                        <td className="px-4 py-4">{offer.lead_time_days ? `${offer.lead_time_days} jours` : "—"}</td>
                        <td className="px-4 py-4">
                          {offer.is_preferred ? <StatusPill tone="success">Préférée</StatusPill> : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#e0ded6] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#788570]">Notes</p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#62635d]">
              {opportunity.notes || "Aucune note pour le moment."}
            </p>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#dce1d8] bg-[#eef1eb] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6d7b65]">Calculs</p>
            <div className="mt-4">
              <FinancialSummary
                purchasePrice={Number(opportunity.estimated_purchase_price ?? 0)}
                shippingCost={Number(opportunity.estimated_shipping_cost ?? 0)}
                platformFees={Number(opportunity.estimated_platform_fees ?? 0)}
                salePrice={Number(opportunity.recommended_sale_price ?? 0)}
                compact
              />
            </div>
            <div className="mt-5 border-t border-[#d8ddd4] pt-5">
              <p className="text-xs font-medium">Détail du score</p>
              <div className="mt-3 space-y-3">
                {financials.scoreDetails.map((criterion) => (
                  <div key={criterion.key}>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#737a6e]">{criterion.label} · {criterion.value.toFixed(1)} %</span>
                      <span className="font-medium">{criterion.points}/{criterion.weight}</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#d7ddd3]">
                      <div className="h-full rounded-full bg-[#788570]" style={{ width: `${(criterion.points / criterion.weight) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e0ded6] bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-[#20211d] text-white"><Bot aria-hidden="true" className="size-4" /></span>
              <div><p className="text-sm font-medium">Analyse IA</p><p className="text-xs text-[#8a8b84]">Bientôt disponible</p></div>
            </div>
            <p className="mt-4 text-xs leading-5 text-[#74756e]">
              L’IA synthétisera les risques, la différenciation et les prochaines actions à partir de vos données.
            </p>
          </section>

          <section className="rounded-2xl border border-[#e0ded6] bg-white p-5">
            <div className="flex items-center gap-2">
              <Clock3 aria-hidden="true" className="size-4 text-[#788570]" />
              <h2 className="text-sm font-medium">Historique</h2>
            </div>
            <ol className="mt-5 space-y-5 border-l border-[#dedcd4] pl-5">
              <li>
                <p className="text-xs font-medium">Dernière mise à jour</p>
                <time dateTime={opportunity.updated_at} className="mt-1 block text-xs text-[#898a83]">
                  {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(opportunity.updated_at))}
                </time>
              </li>
              <li>
                <p className="text-xs font-medium">Opportunité créée</p>
                <time dateTime={opportunity.created_at} className="mt-1 block text-xs text-[#898a83]">
                  {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(opportunity.created_at))}
                </time>
              </li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
