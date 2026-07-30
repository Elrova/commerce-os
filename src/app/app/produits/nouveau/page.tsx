import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createProduct } from "../actions";
import { ProductForm } from "@/components/products/product-form";

export default function NewProductPage() {
  return <div className="mx-auto max-w-6xl"><Link href="/app/produits" className="inline-flex items-center gap-2 text-sm text-[#74756e]"><ArrowLeft className="size-4" />Produits</Link><h1 className="mt-5 text-3xl font-semibold tracking-[-.03em]">Nouveau produit</h1><p className="mt-2 text-sm text-[#74756e]">Créez une référence manuelle indépendante d’une opportunité.</p><div className="mt-8"><ProductForm action={createProduct} submitLabel="Créer le produit" cancelHref="/app/produits" initialValues={{ name: "", sku: "", category: "", description: "", purchasePrice: 0, shippingCost: 0, customsCost: 0, paymentFees: 0, salePrice: 0, stockQuantity: 0, currency: "EUR", status: "draft", notes: "" }} /></div></div>;
}
