"use client";

import { useFormStatus } from "react-dom";

export function EbayResearchButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="h-11 rounded-xl bg-[#20211d] px-5 text-sm font-medium text-white transition-opacity disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Analyse eBay en cours…" : "Analyser sur eBay"}
    </button>
  );
}
