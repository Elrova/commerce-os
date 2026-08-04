"use client";

import { useState } from "react";

const SUBMISSION_FALLBACK_DELAY = 8_000;

export function EbayResearchButton() {
  const [submitting, setSubmitting] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (submitting) return;

    const form = event.currentTarget.form;
    if (!form) return;

    form.requestSubmit();
    setSubmitting(true);

    window.setTimeout(() => {
      setSubmitting(false);
    }, SUBMISSION_FALLBACK_DELAY);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={submitting}
      aria-disabled={submitting}
      className="h-11 rounded-xl bg-[#20211d] px-5 text-sm font-medium text-white transition-opacity disabled:cursor-wait disabled:opacity-60"
    >
      {submitting ? "Analyse eBay en cours…" : "Analyser sur eBay"}
    </button>
  );
}
