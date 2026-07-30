import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  ExternalLink,
  Mail,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { deleteSupplier } from "@/app/app/fournisseurs/actions";
import { StatusPill } from "@/components/app/page-shell";
import { DeleteSupplierButton } from "@/components/suppliers/delete-supplier-button";
import { getCurrentContext } from "@/lib/auth/current-context";
import type { SupplierOffer } from "@/lib/supplier-offers/types";
import {
  supplierStatusLabels,
  type Supplier,
} from "@/lib/suppliers/types";
import { createClient } from "@/lib/supabase/server";

type DetailedOffer = SupplierOffer & {
  opportunity: { id: string; name: string } | null;
  product: { id: string; name: string } | null;
};

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const [{ data, error }, { data: offerRows }] = await Promise.all([
    supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("supplier_offers")
      .select(
        "*, opportunity:opportunities(id, name), product:products(id, name)",
      )
      .eq("supplier_id", id)
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false }),
  ]);
  if (error) throw new Error(`Impossible de charger le fournisseur : ${error.message}`);
  if (!data) notFound();
  const supplier = data as Supplier;
  const offers = (offerRows ?? []) as unknown as DetailedOffer[];
  const opportunityOffers = offers.filter((offer) => offer.opportunity);
  const productOffers = offers.filter((offer) => offer.product);

  return (
    <div className="mx-auto max-w-7xl">
      <Link href="/app/fournisseurs" className="inline-flex items-center gap-2 text-xs text-[#73746d]"><ArrowLeft className="size-3.5" />Fournisseurs</Link>
      <div className="mt-5 flex flex-col gap-6 border-b border-[#e3e1da] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <StatusPill tone={supplier.status === "active" ? "success" : supplier.status === "paused" ? "warning" : "neutral"}>{supplierStatusLabels[supplier.status]}</StatusPill>
          <h1 className="mt-4 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">{supplier.name}</h1>
          <p className="mt-2 text-sm text-[#74756e]">{supplier.country || "Pays non renseigné"}</p>
        </div>
        <div className="flex gap-2">
          <DeleteSupplierButton action={deleteSupplier.bind(null, id)} />
          <Link href={`/app/fournisseurs/${id}/modifier`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#20211d] px-4 text-sm font-medium text-white"><Pencil className="size-4" />Modifier</Link>
        </div>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#e0ded6] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#788570]">Informations générales</p>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Contact", supplier.contact_email || "—"],
                ["MOQ par défaut", String(supplier.minimum_order_quantity ?? 0)],
                ["Délai moyen", `${supplier.average_lead_time_days ?? 0} jours`],
                ["Fiabilité", `${supplier.reliability_score ?? 0} / 100`],
              ].map(([label, value]) => <div key={label}><dt className="text-xs text-[#8a8b84]">{label}</dt><dd className="mt-2 text-sm font-medium">{value}</dd></div>)}
            </dl>
            <div className="mt-6 flex flex-wrap gap-3 border-t border-[#efede7] pt-5">
              {supplier.website_url && <a href={supplier.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-medium text-[#64725d]"><ExternalLink className="size-3.5" />Site web</a>}
              {supplier.contact_email && <a href={`mailto:${supplier.contact_email}`} className="inline-flex items-center gap-2 text-xs font-medium text-[#64725d]"><Mail className="size-3.5" />Contacter</a>}
            </div>
          </section>

          <section className="rounded-2xl border border-[#e0ded6] bg-white p-6">
            <div className="flex items-end justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#788570]">Offres</p><h2 className="mt-2 text-xl font-medium">Toutes les offres</h2></div>
              <span className="text-xs text-[#85867f]">{offers.length} au total</span>
            </div>
            {offers.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-[#d9d7cf] p-8 text-center text-sm text-[#7d7e77]">Aucune offre associée.</p>
            ) : (
              <div className="mt-6 divide-y divide-[#efede7] rounded-xl border border-[#ebe9e2]">
                {offers.map((offer) => {
                  const target = offer.opportunity ?? offer.product;
                  const href = offer.opportunity
                    ? `/app/opportunites/${offer.opportunity.id}`
                    : `/app/produits`;
                  return (
                    <Link key={offer.id} href={href} className="grid gap-2 p-4 hover:bg-[#fafbf8] sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-6">
                      <div><p className="text-sm font-medium">{target?.name ?? "Cible supprimée"}</p><p className="mt-1 text-xs text-[#898a83]">{offer.opportunity ? "Opportunité" : "Produit"}</p></div>
                      <span className="text-sm">{currency.format(Number(offer.unit_price))}</span>
                      <span className="text-xs text-[#74756e]">MOQ {offer.minimum_order_quantity}</span>
                      {offer.is_preferred ? <StatusPill tone="success">Préférée</StatusPill> : <span />}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#e0ded6] bg-white p-6">
              <h2 className="text-sm font-medium">Politique de retour</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#696a64]">{supplier.return_policy || "Non renseignée."}</p>
            </section>
            <section className="rounded-2xl border border-[#e0ded6] bg-white p-6">
              <h2 className="text-sm font-medium">Notes</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#696a64]">{supplier.notes || "Aucune note."}</p>
            </section>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Opportunités", opportunityOffers.length],
              ["Produits", productOffers.length],
              ["Préférées", offers.filter((offer) => offer.is_preferred).length],
              ["Offres", offers.length],
            ].map(([label, value]) => <div key={label} className="rounded-xl border border-[#e0ded6] bg-white p-4"><p className="text-[10px] text-[#898a83]">{label}</p><p className="mt-2 text-xl font-medium">{value}</p></div>)}
          </div>
          <section className="rounded-2xl border border-[#dce1d8] bg-[#eef1eb] p-5">
            <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-[#697862]" /><div><p className="text-sm font-medium">Fiabilité</p><p className="text-xs text-[#7d8478]">Évaluation interne</p></div></div>
            <p className="mt-5 text-3xl font-medium">{supplier.reliability_score ?? 0}<span className="text-sm text-[#8a9285]"> / 100</span></p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#d5dcd1]"><div className="h-full rounded-full bg-[#788570]" style={{ width: `${supplier.reliability_score ?? 0}%` }} /></div>
          </section>
          <section className="rounded-2xl border border-[#e0ded6] bg-white p-5">
            <div className="flex items-center gap-2"><Clock3 className="size-4 text-[#788570]" /><h2 className="text-sm font-medium">Activité récente</h2></div>
            <ol className="mt-5 space-y-4 border-l border-[#dedcd4] pl-5">
              {offers.slice(0, 4).map((offer) => <li key={offer.id}><p className="text-xs font-medium">Offre {offer.is_preferred ? "préférée" : "mise à jour"}</p><time className="mt-1 block text-[10px] text-[#898a83]">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(offer.updated_at))}</time></li>)}
              <li><p className="text-xs font-medium">Fournisseur créé</p><time className="mt-1 block text-[10px] text-[#898a83]">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(supplier.created_at))}</time></li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
