"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ProductActionState } from "@/app/app/produits/actions";
import { calculateProductFinancials } from "@/lib/products/finance";
import { productStatusLabels, type ProductFormValues } from "@/lib/products/types";

const inputClass = "mt-2 h-11 w-full rounded-xl border border-[#dedcd4] bg-white px-3.5 text-sm outline-none transition focus:border-[#829078] focus:ring-2 focus:ring-[#829078]/15";
const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function ErrorText({ errors, name }: { errors?: Record<string, string[]>; name: string }) {
  return errors?.[name]?.map((error) => <p key={error} className="mt-1 text-xs text-[#985f53]">{error}</p>);
}

export function ProductForm({ action, initialValues, submitLabel, cancelHref }: {
  action: (state: ProductActionState, data: FormData) => Promise<ProductActionState>;
  initialValues: ProductFormValues;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [financials, setFinancials] = useState({
    purchasePrice: initialValues.purchasePrice,
    shippingCost: initialValues.shippingCost,
    customsCost: initialValues.customsCost,
    paymentFees: initialValues.paymentFees,
    salePrice: initialValues.salePrice,
  });
  const totals = calculateProductFinancials(financials);

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <section className="rounded-2xl border border-[#e0ded6] bg-white p-5 sm:p-7">
        {state.message && <p role="alert" className="mb-5 rounded-xl bg-[#f5eae7] px-4 py-3 text-sm text-[#87574d]">{state.message}</p>}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-xs font-medium text-[#50514b] sm:col-span-2">Nom
            <input className={inputClass} name="name" defaultValue={initialValues.name} required />
            <ErrorText errors={state.errors} name="name" />
          </label>
          <label className="text-xs font-medium text-[#50514b]">SKU
            <input className={inputClass} name="sku" defaultValue={initialValues.sku} required />
            <ErrorText errors={state.errors} name="sku" />
          </label>
          <label className="text-xs font-medium text-[#50514b]">Catégorie
            <input className={inputClass} name="category" defaultValue={initialValues.category} />
          </label>
          <label className="text-xs font-medium text-[#50514b]">Statut
            <select className={inputClass} name="status" defaultValue={initialValues.status}>
              {Object.entries(productStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-[#50514b]">Stock initial
            <input className={inputClass} name="stockQuantity" type="number" min="0" step="1" defaultValue={initialValues.stockQuantity} />
          </label>
          <label className="text-xs font-medium text-[#50514b] sm:col-span-2">Description
            <textarea className={`${inputClass} min-h-28 py-3`} name="description" defaultValue={initialValues.description} />
          </label>
        </div>
        <div className="my-7 border-t border-[#efede7]" />
        <h2 className="text-sm font-medium">Économie unitaire</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {([
            ["purchasePrice", "Prix d’achat"],
            ["shippingCost", "Livraison"],
            ["customsCost", "Douane"],
            ["paymentFees", "Frais de paiement"],
            ["salePrice", "Prix de vente"],
          ] as const).map(([name, label]) => (
            <label key={name} className="text-xs font-medium text-[#50514b]">{label}
              <input className={inputClass} name={name} type="number" min="0" step="0.01" defaultValue={initialValues[name]} onChange={(event) => setFinancials((current) => ({ ...current, [name]: Number(event.target.value) || 0 }))} />
              <ErrorText errors={state.errors} name={name} />
            </label>
          ))}
          <label className="text-xs font-medium text-[#50514b]">Devise
            <input className={inputClass} name="currency" maxLength={3} defaultValue={initialValues.currency} />
          </label>
        </div>
        <div className="my-7 border-t border-[#efede7]" />
        <label className="text-xs font-medium text-[#50514b]">Notes
          <textarea className={`${inputClass} min-h-28 py-3`} name="notes" defaultValue={initialValues.notes} />
        </label>
        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#efede7] pt-6 sm:flex-row sm:justify-end">
          <Link href={cancelHref} className="inline-flex h-11 items-center justify-center rounded-xl border border-[#dedcd4] px-5 text-sm font-medium">Annuler</Link>
          <button disabled={pending} className="h-11 rounded-xl bg-[#20211d] px-5 text-sm font-medium text-white disabled:opacity-60">{pending ? "Enregistrement…" : submitLabel}</button>
        </div>
      </section>
      <aside className="self-start rounded-2xl border border-[#dce1d8] bg-[#eef1eb] p-5 xl:sticky xl:top-6">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#687461]">Rentabilité calculée</p>
        <dl className="mt-5 space-y-4 text-sm">
          <div className="flex justify-between"><dt>Coût complet</dt><dd className="font-semibold">{money.format(totals.totalUnitCost)}</dd></div>
          <div className="flex justify-between"><dt>Marge brute</dt><dd className="font-semibold">{money.format(totals.marginAmount)}</dd></div>
          <div className="flex justify-between"><dt>Marge</dt><dd className="font-semibold">{totals.marginPercent.toFixed(1)} %</dd></div>
          <div className="flex justify-between"><dt>ROI</dt><dd className="font-semibold">{totals.roiPercent.toFixed(1)} %</dd></div>
        </dl>
        <p className="mt-5 text-xs leading-5 text-[#737a6e]">Ces valeurs sont recalculées côté serveur avant chaque écriture.</p>
      </aside>
    </form>
  );
}
