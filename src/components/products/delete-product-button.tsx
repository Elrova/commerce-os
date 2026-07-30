"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/app/produits/actions";

export function DeleteProductButton({ productId }: { productId: string }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) return (
    <form action={deleteProduct.bind(null, productId)} className="flex items-center gap-2">
      <button type="button" onClick={() => setConfirming(false)} className="h-10 rounded-xl border border-[#dedcd4] px-3 text-xs">Annuler</button>
      <button className="h-10 rounded-xl bg-[#8b554c] px-3 text-xs font-medium text-white">Confirmer</button>
    </form>
  );
  return <button type="button" onClick={() => setConfirming(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dedcd4] px-3 text-xs font-medium"><Trash2 className="size-4" />Supprimer</button>;
}
