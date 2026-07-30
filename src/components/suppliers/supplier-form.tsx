"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { SupplierActionState } from "@/app/app/fournisseurs/actions";
import {
  supplierStatusLabels,
  type SupplierFormValues,
} from "@/lib/suppliers/types";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-[#dedcd4] bg-white px-3.5 text-sm outline-none focus:border-[#829078] focus:ring-2 focus:ring-[#829078]/15";

function ErrorText({
  errors,
  name,
}: {
  errors?: Record<string, string[]>;
  name: string;
}) {
  return errors?.[name]?.map((error) => (
    <p key={error} className="mt-1.5 text-xs text-[#985f53]">{error}</p>
  ));
}

export function SupplierForm({
  action,
  initialValues,
  submitLabel,
  cancelHref,
}: {
  action: (
    state: SupplierActionState,
    formData: FormData,
  ) => Promise<SupplierActionState>;
  initialValues: SupplierFormValues;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="rounded-2xl border border-[#e0ded6] bg-white p-5 sm:p-7">
      {state.message && (
        <p role="alert" className="mb-6 rounded-xl bg-[#f5eae7] px-4 py-3 text-sm text-[#87574d]">{state.message}</p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-medium sm:col-span-2">
          Nom
          <input className={inputClass} name="name" defaultValue={initialValues.name} required />
          <ErrorText errors={state.errors} name="name" />
        </label>
        <label className="text-xs font-medium">
          Site web
          <input className={inputClass} name="websiteUrl" type="url" defaultValue={initialValues.websiteUrl} placeholder="https://..." />
          <ErrorText errors={state.errors} name="websiteUrl" />
        </label>
        <label className="text-xs font-medium">
          E-mail
          <input className={inputClass} name="contactEmail" type="email" defaultValue={initialValues.contactEmail} />
          <ErrorText errors={state.errors} name="contactEmail" />
        </label>
        <label className="text-xs font-medium">
          Pays
          <input className={inputClass} name="country" defaultValue={initialValues.country} />
          <ErrorText errors={state.errors} name="country" />
        </label>
        <label className="text-xs font-medium">
          Statut
          <select className={inputClass} name="status" defaultValue={initialValues.status}>
            {Object.entries(supplierStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium">
          MOQ par défaut
          <input className={inputClass} name="minimumOrderQuantity" type="number" min="0" defaultValue={initialValues.minimumOrderQuantity} required />
          <ErrorText errors={state.errors} name="minimumOrderQuantity" />
        </label>
        <label className="text-xs font-medium">
          Délai moyen (jours)
          <input className={inputClass} name="averageLeadTimeDays" type="number" min="0" defaultValue={initialValues.averageLeadTimeDays} required />
          <ErrorText errors={state.errors} name="averageLeadTimeDays" />
        </label>
        <label className="text-xs font-medium sm:col-span-2">
          Score de fiabilité
          <div className="mt-2 flex items-center gap-4">
            <input className="h-2 flex-1 accent-[#708069]" name="reliabilityScore" type="range" min="0" max="100" defaultValue={initialValues.reliabilityScore} />
            <span className="text-xs text-[#777871]">0–100</span>
          </div>
        </label>
        <label className="text-xs font-medium sm:col-span-2">
          Politique de retour
          <textarea className="mt-2 min-h-28 w-full rounded-xl border border-[#dedcd4] p-3.5 text-sm outline-none focus:border-[#829078]" name="returnPolicy" defaultValue={initialValues.returnPolicy} />
        </label>
        <label className="text-xs font-medium sm:col-span-2">
          Notes
          <textarea className="mt-2 min-h-32 w-full rounded-xl border border-[#dedcd4] p-3.5 text-sm outline-none focus:border-[#829078]" name="notes" defaultValue={initialValues.notes} />
        </label>
      </div>
      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#efede7] pt-6 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className="inline-flex h-11 items-center justify-center rounded-xl border border-[#dedcd4] px-5 text-sm font-medium">Annuler</Link>
        <button disabled={pending} className="h-11 rounded-xl bg-[#20211d] px-5 text-sm font-medium text-white disabled:opacity-60">
          {pending ? "Enregistrement…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
