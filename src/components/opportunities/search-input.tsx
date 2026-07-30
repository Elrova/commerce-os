"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useTransition } from "react";

export function OpportunitySearch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function search(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  return (
    <label className="relative block min-w-0 flex-1 sm:max-w-sm">
      <span className="sr-only">Rechercher une opportunité</span>
      <Search
        aria-hidden="true"
        className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#90918a]"
      />
      <input
        type="search"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(event) => search(event.target.value)}
        placeholder="Rechercher…"
        className="h-10 w-full rounded-xl border border-[#dedcd4] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#829078]"
      />
      {pending && (
        <span className="absolute right-3 top-1/2 size-1.5 -translate-y-1/2 animate-pulse rounded-full bg-[#788570]" />
      )}
    </label>
  );
}
