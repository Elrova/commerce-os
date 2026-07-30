import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  Building2,
  ChevronDown,
  CircleGauge,
  ClipboardList,
  Layers3,
  PackageSearch,
  PlugZap,
  Settings2,
  ShoppingBag,
} from "lucide-react";
import { signOut } from "@/app/auth-actions";
import { getCurrentContext } from "@/lib/auth/current-context";

export const metadata: Metadata = {
  title: "Commerce OS",
  description: "Pilotez les opérations commerciales d’ELROVA.",
};

const navigation = [
  { href: "/app", label: "Vue d’ensemble", icon: CircleGauge },
  { href: "/app/opportunites", label: "Opportunités", icon: PackageSearch },
  { href: "/app/produits", label: "Produits", icon: Boxes },
  { href: "/app/fournisseurs", label: "Fournisseurs", icon: Building2 },
  { href: "/app/publications", label: "Publications", icon: Layers3 },
  { href: "/app/commandes", label: "Commandes", icon: ShoppingBag },
  { href: "/app/analyses", label: "Analyses", icon: BarChart3 },
  { href: "/app/canaux", label: "Canaux de vente", icon: PlugZap },
];

export default async function CommerceAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { profile, user, workspace } = await getCurrentContext();
  const displayName = profile.full_name || user.email || "Fondateur";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f5f4ef] text-[#20211d] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="border-b border-[#e1dfd7] bg-[#1d1e1a] text-white lg:fixed lg:inset-y-0 lg:w-[248px] lg:border-b-0 lg:border-r lg:border-white/[0.07]">
        <div className="flex h-16 items-center justify-between px-5 lg:h-20">
          <Link
            href="/app"
            className="flex items-center gap-3"
            aria-label="ELROVA Commerce OS"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-[#dce4d5] text-[#273024]">
              <ClipboardList aria-hidden="true" className="size-4" />
            </span>
            <span>
              <span className="block text-xs font-semibold tracking-[0.18em]">
                ELROVA
              </span>
              <span className="mt-0.5 block text-[10px] text-white/45">
                Commerce OS
              </span>
            </span>
          </Link>
          <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/45">
            V1
          </span>
        </div>

        <nav
          aria-label="Navigation Commerce OS"
          className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0"
        >
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/62 transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:absolute lg:inset-x-3 lg:bottom-4 lg:block">
          <Link
            href="/app/parametres"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/62 transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            <Settings2 aria-hidden="true" className="size-4" />
            Paramètres
          </Link>
          <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.035] p-3">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-[#6f7f67] text-xs font-semibold">
                {initials}
              </span>
              <div>
                <p className="max-w-32 truncate text-xs font-medium">{displayName}</p>
                <p className="mt-0.5 max-w-32 truncate text-[10px] text-white/40">{workspace.name}</p>
              </div>
            </div>
            <ChevronDown aria-hidden="true" className="size-3.5 text-white/35" />
            </div>
            <form action={signOut} className="mt-3 border-t border-white/[0.07] pt-3">
              <button type="submit" className="text-[11px] text-white/45 transition-colors hover:text-white">
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="lg:col-start-2">
        <header className="flex h-16 items-center justify-between border-b border-[#e1dfd7] bg-[#f5f4ef]/90 px-5 backdrop-blur sm:px-8 lg:h-20 lg:px-10">
          <p className="text-xs text-[#83847d]">
            Pilotage opérationnel
            <span className="mx-2 text-[#c0bfb9]">/</span>
            <span className="text-[#3c3d38]">Commerce OS</span>
          </p>
          <Link
            href="/"
            className="text-xs font-medium text-[#676861] transition-colors hover:text-[#20211d]"
          >
            Voir le site
          </Link>
        </header>
        <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
