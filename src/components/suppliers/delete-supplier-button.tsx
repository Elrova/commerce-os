"use client";

import { Trash2 } from "lucide-react";

export function DeleteSupplierButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Supprimer ce fournisseur et toutes ses offres ?")) event.preventDefault();
      }}
    >
      <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#ead8d3] bg-white px-4 text-sm font-medium text-[#8b574d]">
        <Trash2 aria-hidden="true" className="size-4" />
        Supprimer
      </button>
    </form>
  );
}
