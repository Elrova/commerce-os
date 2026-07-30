"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ProductActionState } from "@/app/app/produits/actions";
import { calculateProductFinancials } from "@/lib/products/finance";
import { productStatusLabels, type ProductFormValues } from "@/lib/products/types";

export type ConversionOffer = { id: string; supplierName: string; unitPrice: number; shippingCost: number; customsCost: number; fees: number; moq: number; leadTimeDays: number | null; preferred: boolean };
const input = "mt-2 h-11 w-full rounded-xl border border-[#dedcd4] bg-white px-3.5 text-sm outline-none focus:border-[#829078] focus:ring-2 focus:ring-[#829078]/15";
const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function ConversionForm({ action, initialValues, offers, opportunityScore, cancelHref }: {
  action: (state: ProductActionState, data: FormData) => Promise<ProductActionState>;
  initialValues: ProductFormValues;
  offers: ConversionOffer[];
  opportunityScore: number;
  cancelHref: string;
}) {
  const preferred = offers.find((offer) => offer.preferred);
  const [state, formAction, pending] = useActionState(action, {});
  const [selectedId, setSelectedId] = useState(preferred?.id ?? "");
  const selected = offers.find((offer) => offer.id === selectedId);
  const [values, setValues] = useState({ purchasePrice: selected?.unitPrice ?? initialValues.purchasePrice, shippingCost: selected?.shippingCost ?? initialValues.shippingCost, customsCost: selected?.customsCost ?? 0, paymentFees: selected?.fees ?? initialValues.paymentFees, salePrice: initialValues.salePrice });
  const totals = useMemo(() => calculateProductFinancials(values), [values]);
  function chooseOffer(id: string) {
    setSelectedId(id);
    const offer = offers.find((item) => item.id === id);
    if (offer) setValues((current) => ({ ...current, purchasePrice: offer.unitPrice, shippingCost: offer.shippingCost, customsCost: offer.customsCost, paymentFees: offer.fees }));
  }
  return <form action={formAction} className="grid gap-6 xl:grid-cols-[1fr_360px]">
    <section className="rounded-2xl border border-[#e0ded6] bg-white p-5 sm:p-7">
      {state.message && <p role="alert" className="mb-5 rounded-xl bg-[#f5eae7] p-4 text-sm text-[#87574d]">{state.message}</p>}
      {!preferred && <div className="mb-6 flex gap-3 rounded-xl border border-[#e9d9af] bg-[#fff9e9] p-4"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#9b7627]" /><div><p className="text-sm font-medium">Aucune offre préférée</p><p className="mt-1 text-xs leading-5 text-[#75684b]">Choisissez une offre existante ci-dessous, ou confirmez une conversion manuelle.</p></div></div>}
      <h2 className="text-sm font-medium">Source fournisseur</h2>
      <label className="mt-4 block text-xs font-medium text-[#50514b]">Offre à conserver
        <select className={input} name="selectedOfferId" value={selectedId} onChange={(event) => chooseOffer(event.target.value)}><option value="">Conversion manuelle — aucune offre</option>{offers.map((offer) => <option key={offer.id} value={offer.id}>{offer.supplierName} · {money.format(offer.unitPrice)}{offer.preferred ? " · préférée" : ""}</option>)}</select>
      </label>
      {selected && <div className="mt-3 grid gap-2 rounded-xl bg-[#f5f4ef] p-4 text-xs sm:grid-cols-3"><span>MOQ <b>{selected.moq}</b></span><span>Délai <b>{selected.leadTimeDays ? `${selected.leadTimeDays} j` : "Non renseigné"}</b></span><span>Fournisseur <b>{selected.supplierName}</b></span></div>}
      {!selectedId && <label className="mt-4 flex items-start gap-3 rounded-xl border border-[#e2ded2] p-4 text-xs leading-5"><input className="mt-1" type="checkbox" name="manualConversionConfirmed" /><span>Je confirme vouloir créer ce produit sans offre fournisseur. Les coûts renseignés ci-dessous seront utilisés comme référence manuelle.</span></label>}
      {state.errors?.manualConversionConfirmed?.map((error) => <p key={error} className="mt-2 text-xs text-[#985f53]">{error}</p>)}
      <div className="my-7 border-t border-[#efede7]" />
      <h2 className="text-sm font-medium">Préparation du produit</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-medium sm:col-span-2">Nom<input className={input} name="name" defaultValue={initialValues.name} /></label>
        <label className="text-xs font-medium">SKU<input className={input} name="sku" defaultValue={initialValues.sku} /></label>
        <label className="text-xs font-medium">Catégorie<input className={input} name="category" defaultValue={initialValues.category} /></label>
        <label className="text-xs font-medium">Statut<select className={input} name="status" defaultValue="draft">{Object.entries(productStatusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-xs font-medium">Stock initial<input className={input} name="stockQuantity" type="number" min="0" defaultValue={selected?.moq ?? 0} /></label>
        <label className="text-xs font-medium sm:col-span-2">Description<textarea className={`${input} min-h-28 py-3`} name="description" defaultValue={initialValues.description} /></label>
        {([["purchasePrice","Prix d’achat"],["shippingCost","Livraison"],["customsCost","Douane"],["paymentFees","Frais"],["salePrice","Prix de vente"]] as const).map(([name,label]) => <label key={name} className="text-xs font-medium">{label}<input className={input} name={name} type="number" min="0" step=".01" value={values[name]} onChange={(event) => setValues((current) => ({ ...current, [name]: Number(event.target.value) || 0 }))} /></label>)}
        <label className="text-xs font-medium">Devise<input className={input} name="currency" defaultValue="EUR" maxLength={3} /></label>
        <label className="text-xs font-medium sm:col-span-2">Notes<textarea className={`${input} min-h-24 py-3`} name="notes" defaultValue={initialValues.notes} /></label>
      </div>
      {state.errors && <div role="alert" className="mt-5 rounded-xl bg-[#f5eae7] p-4 text-xs text-[#87574d]">Certains champs sont invalides. Vérifiez les valeurs saisies.</div>}
      <div className="mt-7 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end"><Link href={cancelHref} className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm">Annuler</Link><button disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#20211d] px-5 text-sm font-medium text-white disabled:opacity-60"><CheckCircle2 className="size-4" />{pending ? "Conversion…" : "Confirmer la conversion"}</button></div>
    </section>
    <aside className="self-start rounded-2xl border border-[#dce1d8] bg-[#eef1eb] p-5 xl:sticky xl:top-6"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#687461]">Décision finale</p><div className="mt-5 grid grid-cols-2 gap-3">{[["Coût complet",money.format(totals.totalUnitCost)],["Marge",`${totals.marginPercent.toFixed(1)} %`],["ROI",`${totals.roiPercent.toFixed(1)} %`],["Score ELROVA",`${opportunityScore}/100`]].map(([label,value]) => <div key={label} className="rounded-xl bg-white/70 p-3"><p className="text-[11px] text-[#777e72]">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div><p className="mt-5 text-xs leading-5 text-[#737a6e]">La conversion crée le produit, copie l’offre choisie et clôt l’opportunité dans une seule transaction.</p></aside>
  </form>;
}
