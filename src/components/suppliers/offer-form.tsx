"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { OfferActionState } from "@/app/app/opportunites/[id]/offres/actions";
import { OfferSummary } from "@/components/suppliers/offer-summary";

type SupplierOption = {
  id: string;
  name: string;
  reliabilityScore: number;
};

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-[#dedcd4] bg-white px-3.5 text-sm outline-none focus:border-[#829078]";

function ErrorText({ errors, name }: { errors?: Record<string, string[]>; name: string }) {
  return errors?.[name]?.map((error) => <p key={error} className="mt-1 text-xs text-[#985f53]">{error}</p>);
}

export function OfferForm({
  action,
  suppliers,
  salePrice,
  cancelHref,
}: {
  action: (state: OfferActionState, formData: FormData) => Promise<OfferActionState>;
  suppliers: SupplierOption[];
  salePrice: number;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [inputs, setInputs] = useState({
    unitPrice: 0,
    shippingCost: 0,
    customsCost: 0,
    fees: 0,
    minimumOrderQuantity: 1,
    leadTimeDays: 0,
    reliabilityScore: 50,
    salePrice,
  });
  const update = (key: keyof typeof inputs, value: string) =>
    setInputs((current) => ({ ...current, [key]: Number(value) || 0 }));

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="rounded-2xl border border-[#e0ded6] bg-white p-5 sm:p-7">
        {state.message && <p role="alert" className="mb-6 rounded-xl bg-[#f5eae7] px-4 py-3 text-sm text-[#87574d]">{state.message}</p>}
        <h2 className="text-sm font-medium">Fournisseur</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Fournisseur existant
            <select
              className={inputClass}
              name="supplierId"
              defaultValue=""
              onChange={(event) => {
                const selected = suppliers.find((supplier) => supplier.id === event.target.value);
                setInputs((current) => ({ ...current, reliabilityScore: selected?.reliabilityScore ?? 50 }));
              }}
            >
              <option value="">Sélectionner…</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
            <ErrorText errors={state.errors} name="supplierId" />
          </label>
          <label className="text-xs font-medium">
            Ou créer rapidement
            <input className={inputClass} name="quickSupplierName" placeholder="Nom du nouveau fournisseur" />
            <ErrorText errors={state.errors} name="quickSupplierName" />
          </label>
          <label className="text-xs font-medium">
            URL du produit
            <input className={inputClass} name="productUrl" type="url" placeholder="https://..." />
            <ErrorText errors={state.errors} name="productUrl" />
          </label>
          <label className="text-xs font-medium">
            SKU fournisseur
            <input className={inputClass} name="supplierSku" />
          </label>
        </div>

        <div className="my-7 border-t border-[#efede7]" />
        <h2 className="text-sm font-medium">Conditions de l’offre</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {[
            ["unitPrice", "Prix unitaire"],
            ["shippingCost", "Livraison unitaire"],
            ["customsCost", "Douane unitaire"],
            ["fees", "Frais de paiement ou plateforme"],
          ].map(([name, label]) => (
            <label key={name} className="text-xs font-medium">
              {label}
              <input className={inputClass} name={name} type="number" min="0" step="0.01" defaultValue="0" required onChange={(event) => update(name as keyof typeof inputs, event.target.value)} />
              <ErrorText errors={state.errors} name={name} />
            </label>
          ))}
          <label className="text-xs font-medium">
            Prix échantillon
            <input className={inputClass} name="samplePrice" type="number" min="0" step="0.01" />
          </label>
          <label className="text-xs font-medium">
            MOQ
            <input className={inputClass} name="minimumOrderQuantity" type="number" min="1" defaultValue="1" required onChange={(event) => update("minimumOrderQuantity", event.target.value)} />
          </label>
          <label className="text-xs font-medium">
            Délai (jours)
            <input className={inputClass} name="leadTimeDays" type="number" min="0" defaultValue="0" required onChange={(event) => update("leadTimeDays", event.target.value)} />
          </label>
          <label className="text-xs font-medium">
            Stock disponible
            <input className={inputClass} name="availableStock" type="number" min="0" />
          </label>
          <label className="text-xs font-medium">
            Note de l’offre (0–5)
            <input className={inputClass} name="rating" type="number" min="0" max="5" step="0.1" onChange={(event) => update("reliabilityScore", String((Number(event.target.value) || 2.5) * 20))} />
          </label>
          <label className="text-xs font-medium">
            Dernière vérification
            <input className={inputClass} name="lastCheckedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            Notes
            <textarea className="mt-2 min-h-28 w-full rounded-xl border border-[#dedcd4] p-3.5 text-sm outline-none" name="notes" />
          </label>
          <label className="flex items-center gap-3 text-xs font-medium sm:col-span-2">
            <input name="isPreferred" type="checkbox" className="size-4 accent-[#708069]" />
            Définir comme offre préférée
          </label>
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#efede7] pt-6 sm:flex-row sm:justify-end">
          <Link href={cancelHref} className="inline-flex h-11 items-center justify-center rounded-xl border border-[#dedcd4] px-5 text-sm font-medium">Annuler</Link>
          <button disabled={pending} className="h-11 rounded-xl bg-[#20211d] px-5 text-sm font-medium text-white disabled:opacity-60">
            {pending ? "Création…" : "Créer l’offre"}
          </button>
        </div>
      </section>
      <aside className="self-start rounded-2xl border border-[#dce1d8] bg-[#eef1eb] p-5 xl:sticky xl:top-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d7b65]">Économie réelle</p>
        <p className="mt-2 text-xs leading-5 text-[#737a6e]">Calculée avec le prix de vente conseillé de l’opportunité.</p>
        <div className="mt-5"><OfferSummary inputs={inputs} /></div>
      </aside>
    </form>
  );
}
