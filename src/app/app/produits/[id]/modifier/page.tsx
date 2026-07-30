import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { updateProduct } from "../../actions";
import { ProductForm } from "@/components/products/product-form";
import { getCurrentContext } from "@/lib/auth/current-context";
import type { ProductStatus } from "@/lib/products/types";
import { createClient } from "@/lib/supabase/server";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await getCurrentContext();
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("*").eq("id", id).eq("workspace_id", workspace.id).maybeSingle();
  if (!product) notFound();
  const action = updateProduct.bind(null, id);
  return <div className="mx-auto max-w-6xl"><Link href={`/app/produits/${id}`} className="inline-flex items-center gap-2 text-sm text-[#74756e]"><ArrowLeft className="size-4" />Retour au produit</Link><h1 className="mt-5 text-3xl font-semibold tracking-[-.03em]">Modifier {product.name}</h1><div className="mt-8"><ProductForm action={action} submitLabel="Enregistrer" cancelHref={`/app/produits/${id}`} initialValues={{ name: product.name, sku: product.sku, category: product.category ?? "", description: product.description ?? "", purchasePrice: Number(product.purchase_price), shippingCost: Number(product.shipping_cost), customsCost: Number(product.customs_cost), paymentFees: Number(product.payment_fees), salePrice: Number(product.sale_price), stockQuantity: product.stock_quantity, currency: product.currency, status: product.status as ProductStatus, notes: product.notes ?? "" }} /></div></div>;
}
