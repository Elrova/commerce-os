"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { OpportunityActionState } from "@/app/app/opportunites/actions";
import { FinancialSummary } from "@/components/opportunities/financial-summary";
import {
  opportunityStatusLabels,
  type OpportunityFormValues,
} from "@/lib/opportunities/types";

const initialActionState: OpportunityActionState = {};

function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string[]>;
  name: string;
}) {
  return errors?.[name]?.map((error) => (
    <p key={error} className="mt-1.5 text-xs text-[#985f53]">
      {error}
    </p>
  ));
}

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-[#dedcd4] bg-white px-3.5 text-sm outline-none transition-colors placeholder:text-[#b0b1aa] focus:border-[#829078] focus:ring-2 focus:ring-[#829078]/15";

export function OpportunityForm({
  action,
  initialValues,
  submitLabel,
  cancelHref,
}: {
  action: (
    state: OpportunityActionState,
    formData: FormData,
  ) => Promise<OpportunityActionState>;
  initialValues: OpportunityFormValues;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialActionState,
  );
  const [financialInputs, setFinancialInputs] = useState({
    purchasePrice: initialValues.purchasePrice,
    shippingCost: initialValues.shippingCost,
    platformFees: initialValues.platformFees,
    salePrice: initialValues.salePrice,
  });

  function updateFinancialInput(
    key: keyof typeof financialInputs,
    value: string,
  ) {
    setFinancialInputs((current) => ({
      ...current,
      [key]: Number(value) || 0,
    }));
  }

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="rounded-2xl border border-[#e0ded6] bg-white p-5 sm:p-7">
        {state.message && (
          <p role="alert" className="mb-6 rounded-xl bg-[#f5eae7] px-4 py-3 text-sm text-[#87574d]">
            {state.message}
          </p>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-xs font-medium text-[#4f504a] sm:col-span-2">
            Nom du produit
            <input
              className={inputClass}
              name="name"
              defaultValue={initialValues.name}
              required
              placeholder="Ex. Lampe nomade en aluminium"
            />
            <FieldError errors={state.errors} name="name" />
          </label>
          <label className="text-xs font-medium text-[#4f504a]">
            Catégorie
            <input
              className={inputClass}
              name="category"
              defaultValue={initialValues.category}
              placeholder="Maison, accessoires…"
            />
            <FieldError errors={state.errors} name="category" />
          </label>
          <label className="text-xs font-medium text-[#4f504a]">
            Statut
            <select
              className={inputClass}
              name="status"
              defaultValue={initialValues.status}
            >
              {Object.entries(opportunityStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <FieldError errors={state.errors} name="status" />
          </label>
          <label className="text-xs font-medium text-[#4f504a] sm:col-span-2">
            URL source
            <input
              className={inputClass}
              name="sourceUrl"
              type="url"
              defaultValue={initialValues.sourceUrl}
              placeholder="https://..."
            />
            <FieldError errors={state.errors} name="sourceUrl" />
          </label>
        </div>

        <div className="my-7 border-t border-[#efede7]" />
        <h2 className="text-sm font-medium">Hypothèses financières</h2>
        <p className="mt-1 text-xs text-[#85867f]">
          Tous les montants sont exprimés en euros, par unité.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {[
            ["purchasePrice", "Prix fournisseur", "0.00"],
            ["shippingCost", "Livraison", "0.00"],
            ["platformFees", "Commission marketplace", "0.00"],
            ["salePrice", "Prix conseillé", "0.00"],
          ].map(([name, label, placeholder]) => (
            <label key={name} className="text-xs font-medium text-[#4f504a]">
              {label}
              <div className="relative">
                <input
                  className={`${inputClass} pr-10`}
                  name={name}
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    initialValues[name as keyof OpportunityFormValues] as number
                  }
                  placeholder={placeholder}
                  required
                  onChange={(event) =>
                    updateFinancialInput(
                      name as keyof typeof financialInputs,
                      event.target.value,
                    )
                  }
                />
                <span className="pointer-events-none absolute right-3.5 top-[1.15rem] text-sm text-[#95968f]">€</span>
              </div>
              <FieldError errors={state.errors} name={name} />
            </label>
          ))}
        </div>

        <div className="my-7 border-t border-[#efede7]" />
        <label className="text-xs font-medium text-[#4f504a]">
          Notes
          <textarea
            className="mt-2 min-h-36 w-full resize-y rounded-xl border border-[#dedcd4] bg-white px-3.5 py-3 text-sm leading-6 outline-none transition-colors placeholder:text-[#b0b1aa] focus:border-[#829078] focus:ring-2 focus:ring-[#829078]/15"
            name="notes"
            defaultValue={initialValues.notes}
            placeholder="Demande observée, risques, différenciation possible…"
          />
          <FieldError errors={state.errors} name="notes" />
        </label>
        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#efede7] pt-6 sm:flex-row sm:justify-end">
          <Link
            href={cancelHref}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#dedcd4] px-5 text-sm font-medium"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#20211d] px-5 text-sm font-medium text-white transition-colors hover:bg-[#383a34] disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Enregistrement…" : submitLabel}
          </button>
        </div>
      </section>

      <aside className="self-start rounded-2xl border border-[#dce1d8] bg-[#eef1eb] p-5 xl:sticky xl:top-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d7b65]">
          Décision en temps réel
        </p>
        <p className="mt-2 text-xs leading-5 text-[#737a6e]">
          Le score valorise à parts égales une marge cible de 40 % et un ROI
          cible de 100 %. Le calcul final sera refait côté serveur.
        </p>
        <div className="mt-5">
          <FinancialSummary {...financialInputs} compact />
        </div>
      </aside>
    </form>
  );
}
