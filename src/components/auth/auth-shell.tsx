import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-[#f6f4ee] lg:grid-cols-[1fr_1.05fr]">
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14 lg:py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.22em] text-[#20211d]"
          >
            ELROVA
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-[#74756e] transition-colors hover:text-[#20211d]"
          >
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            Retour au site
          </Link>
        </div>
        <div className="my-auto w-full max-w-md self-center py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#788570]">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-medium tracking-[-0.045em] text-[#20211d]">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6d6e67]">{description}</p>
          {children}
        </div>
        <p className="text-xs text-[#96978f]">© 2026 ELROVA</p>
      </section>

      <aside className="relative hidden overflow-hidden bg-[#1b1c18] p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute -right-32 -top-24 size-[30rem] rounded-full bg-[#6d7b65]/20 blur-3xl"
        />
        <p className="relative text-xs font-medium uppercase tracking-[0.2em] text-white/45">
          Commerce OS
        </p>
        <div className="relative max-w-xl">
          <p className="text-4xl font-normal leading-tight tracking-[-0.04em] text-[#f0efe8]">
            De l’opportunité produit à l’analyse de la marge, dans un seul
            espace opérationnel.
          </p>
          <ul className="mt-10 space-y-4">
            {[
              "Centraliser les produits et fournisseurs",
              "Publier sur les canaux connectés",
              "Piloter commandes, stocks et rentabilité",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-sm text-white/60"
              >
                <span className="grid size-6 place-items-center rounded-full bg-[#718069]/20 text-[#aebba8]">
                  <Check aria-hidden="true" className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/35">
          Une base conçue pour opérer, pas seulement observer.
        </p>
      </aside>
    </main>
  );
}
