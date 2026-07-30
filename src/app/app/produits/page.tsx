import { Plus } from "lucide-react";
import { AppButton, PageHeader, StatusPill } from "@/components/app/page-shell";
import { demoProducts } from "@/lib/demo-data";

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Catalogue" title="Produits" description="Préparez les informations commerciales, les coûts, les prix et les stocks avant publication." action={<AppButton><Plus aria-hidden="true" className="mr-2 size-4" />Nouveau produit</AppButton>} />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {demoProducts.map((product) => (
          <article key={product.sku} className="rounded-2xl border border-[#e0ded6] bg-white p-5">
            <div className="flex items-start justify-between gap-3"><span className="text-xs text-[#8a8b84]">{product.sku}</span><StatusPill tone={product.status === "Publié" ? "success" : "neutral"}>{product.status}</StatusPill></div>
            <div className="mt-8 grid h-28 place-items-center rounded-xl bg-[#f1f0ea] text-xs text-[#aaa9a2]">Aperçu produit</div>
            <h2 className="mt-5 font-medium">{product.name}</h2>
            <p className="mt-2 text-sm text-[#74756e]">{product.stock} unités disponibles</p>
          </article>
        ))}
      </div>
    </div>
  );
}
