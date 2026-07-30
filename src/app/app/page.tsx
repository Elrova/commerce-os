import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  Layers3,
  PackageSearch,
  ShoppingBag,
} from "lucide-react";
import { PageHeader, StatusPill } from "@/components/app/page-shell";

const workflow = [
  {
    href: "/app/opportunites",
    label: "Trouver quoi vendre",
    detail: "3 pistes à qualifier",
    icon: PackageSearch,
  },
  {
    href: "/app/fournisseurs",
    label: "Identifier où l’acheter",
    detail: "2 fournisseurs suivis",
    icon: Building2,
  },
  {
    href: "/app/produits",
    label: "Préparer la fiche",
    detail: "1 produit prêt",
    icon: Boxes,
  },
  {
    href: "/app/publications",
    label: "Publier",
    detail: "Canal à connecter",
    icon: Layers3,
  },
  {
    href: "/app/commandes",
    label: "Traiter les commandes",
    detail: "1 commande en attente",
    icon: ShoppingBag,
  },
  {
    href: "/app/analyses",
    label: "Analyser la rentabilité",
    detail: "Marge nette 28,6 %",
    icon: BarChart3,
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Vue d’ensemble"
        title="Bonjour, construisons le prochain produit rentable."
        description="Une lecture rapide des actions qui rapprochent ELROVA de sa prochaine vente."
        action={
          <Link
            href="/app/opportunites"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#20211d] px-4 text-sm font-medium text-white"
          >
            Nouvelle opportunité
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        }
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Chiffre d’affaires", "1 842 €", "+18,4 %"],
          ["Marge nette", "527 €", "28,6 %"],
          ["Commandes", "24", "1 à traiter"],
          ["Stock valorisé", "3 960 €", "244 unités"],
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-2xl border border-[#e0ded6] bg-white p-5">
            <p className="text-xs text-[#777871]">{label}</p>
            <p className="mt-3 text-2xl font-medium tracking-[-0.03em]">{value}</p>
            <p className="mt-2 text-xs text-[#788570]">{note}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-[#e0ded6] bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#788570]">
              Boucle opérationnelle
            </p>
            <h2 className="mt-2 text-xl font-medium tracking-tight">
              De l’idée à la marge
            </h2>
          </div>
          <StatusPill tone="warning">1 action prioritaire</StatusPill>
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workflow.map(({ href, label, detail, icon: Icon }, index) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-xl border border-[#ebe9e2] bg-[#faf9f5] p-4 transition-colors hover:border-[#cfd5ca] hover:bg-[#f3f5ef]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#6f7f67] shadow-sm">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] text-[#a0a19a]">
                  ÉTAPE {index + 1}
                </span>
                <span className="mt-1 block text-sm font-medium">{label}</span>
                <span className="mt-1 block text-xs text-[#7a7b74]">{detail}</span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-4 text-[#bbbcb5] transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
