import Link from "next/link";
import { ArrowRight, RadioTower } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/app/page-shell";

export default function PublicationsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Diffusion" title="Publications" description="Préparez et suivez la diffusion de vos fiches produits sur les canaux connectés." />
      <div className="mt-8">
        <EmptyState icon={<RadioTower aria-hidden="true" className="size-5" />} title="Aucune publication pour le moment" description="Connectez d’abord un canal de vente, puis envoyez votre première fiche produit sans export intermédiaire." />
      </div>
      <div className="mt-4 text-center"><Link href="/app/canaux" className="inline-flex items-center gap-2 text-sm font-medium text-[#65735f]">Gérer les canaux <ArrowRight aria-hidden="true" className="size-4" /></Link></div>
    </div>
  );
}
