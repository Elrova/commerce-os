import {
  ArrowRight,
  Boxes,
  ChartNoAxesCombined,
  Sparkles,
  Workflow,
} from "lucide-react";

const metrics = [
  { label: "Chiffre d’affaires", value: "48 290 €" },
  { label: "Commandes", value: "1 284" },
  { label: "Produits actifs", value: "326" },
  { label: "Automatisations", value: "18" },
];

const features = [
  {
    icon: Boxes,
    title: "Tout piloter au même endroit",
    description:
      "Produits, commandes, stocks, fournisseurs et canaux de vente réunis dans une seule interface.",
  },
  {
    icon: Workflow,
    title: "Automatiser les opérations",
    description:
      "Réduisez les tâches répétitives grâce à des workflows pensés pour le commerce moderne.",
  },
  {
    icon: Sparkles,
    title: "Décider avec l’IA",
    description:
      "Analysez vos données, détectez les opportunités et obtenez des recommandations directement exploitables.",
  },
];

const chartBars = [32, 43, 38, 58, 50, 72, 64, 86, 76, 94, 84, 100];

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 sm:p-5">
      <p className="text-[11px] leading-none text-zinc-500 sm:text-xs">{label}</p>
      <p className="mt-3 text-lg font-medium tracking-tight text-zinc-50 sm:text-xl">
        {value}
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f4ee] text-[#181915]">
      <header className="relative z-20 border-b border-black/[0.06]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <a
            href="#"
            className="text-sm font-semibold tracking-[0.24em]"
            aria-label="ELROVA, accueil"
          >
            ELROVA
          </a>
          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-8 text-sm text-[#62635d] md:flex"
          >
            <a className="transition-colors hover:text-black" href="#produit">
              Produit
            </a>
            <a className="transition-colors hover:text-black" href="#vision">
              Vision
            </a>
            <a className="transition-colors hover:text-black" href="#contact">
              Contact
            </a>
          </nav>
          <a
            href="#contact"
            className="rounded-full bg-[#1c1d19] px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#33342f] sm:px-5 sm:text-sm"
          >
            Accès anticipé
          </a>
        </div>
      </header>

      <main>
        <section className="relative px-5 pb-24 pt-20 sm:px-8 sm:pb-32 sm:pt-28 lg:px-10 lg:pt-36">
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-[#dbe1d3]/45 blur-3xl sm:h-[34rem] sm:w-[34rem]"
          />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#cfd4c8] bg-white/55 px-3.5 py-2 text-xs font-medium text-[#535c4c] backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#73836a]" />
                Commerce OS entre en construction
              </div>
              <h1 className="mt-8 text-5xl font-medium leading-[0.96] tracking-[-0.06em] sm:text-7xl lg:text-[6.7rem]">
                Le commerce,
                <span className="mt-2 block font-normal text-[#74766f]">
                  réuni. simplifié.
                </span>
              </h1>
              <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-[#666760] sm:text-lg sm:leading-8">
                ELROVA Commerce OS centralise les opérations, automatise les
                tâches répétitives et aide les marques à prendre de meilleures
                décisions.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#produit"
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#1c1d19] px-6 py-3.5 text-sm font-medium text-white transition-all hover:bg-[#33342f] sm:w-auto"
                >
                  Découvrir le projet
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                  />
                </a>
                <a
                  href="#dashboard"
                  className="w-full rounded-full border border-black/10 bg-white/50 px-6 py-3.5 text-sm font-medium transition-colors hover:bg-white sm:w-auto"
                >
                  Explorer Commerce OS
                </a>
              </div>
            </div>

            <div
              id="dashboard"
              className="relative mx-auto mt-16 max-w-6xl scroll-mt-8 rounded-[2rem] border border-white/10 bg-[#141512] p-2 shadow-[0_40px_100px_-35px_rgba(24,25,21,0.45)] sm:mt-24 sm:p-3"
            >
              <div className="overflow-hidden rounded-[1.55rem] border border-white/[0.07] bg-[#191a17]">
                <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5 sm:px-8">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-7 place-items-center rounded-lg bg-[#d9e1d2] text-[#263023]">
                        <ChartNoAxesCombined
                          aria-hidden="true"
                          className="size-3.5"
                        />
                      </span>
                      <p className="text-sm font-medium text-white">Commerce OS</p>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">Vue d’ensemble</p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="h-2 w-2 rounded-full bg-[#829278]" />
                    <span className="text-xs text-zinc-500">Synchronisé</span>
                  </div>
                </div>

                <div className="p-4 sm:p-7 lg:p-9">
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {metrics.map((metric) => (
                      <Metric key={metric.label} {...metric} />
                    ))}
                  </div>

                  <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-sm font-medium text-zinc-100">
                          Activité commerciale
                        </h2>
                        <p className="mt-1.5 text-xs text-zinc-500">
                          Performance des 7 derniers jours
                        </p>
                      </div>
                      <span className="rounded-full bg-[#293226] px-3 py-1.5 text-xs font-medium text-[#aaba9f]">
                        +18,4 %
                      </span>
                    </div>
                    <div
                      aria-label="Graphique décoratif montrant une tendance à la hausse"
                      className="mt-8 flex h-36 items-end gap-2 border-b border-white/[0.07] sm:h-48 sm:gap-3"
                      role="img"
                    >
                      {chartBars.map((height, index) => (
                        <div
                          key={`${height}-${index}`}
                          className="flex-1 rounded-t-md bg-[#66735e] transition-colors hover:bg-[#87967e]"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="produit"
          className="scroll-mt-12 border-t border-black/[0.06] bg-[#fbfaf6] px-5 py-24 sm:px-8 sm:py-32 lg:px-10 lg:py-40"
        >
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d7b65]">
              Un système unique
            </p>
            <h2 className="mt-5 max-w-3xl text-4xl font-medium leading-tight tracking-[-0.045em] sm:text-6xl">
              Moins d’outils. Plus de maîtrise.
            </h2>
            <div className="mt-14 grid gap-4 md:grid-cols-3 sm:mt-20">
              {features.map(({ icon: Icon, title, description }, index) => (
                <article
                  key={title}
                  className="group flex min-h-80 flex-col rounded-[1.75rem] border border-black/[0.07] bg-[#f6f4ee] p-7 transition-all hover:-translate-y-1 hover:bg-white hover:shadow-[0_22px_55px_-38px_rgba(24,25,21,0.35)] sm:p-8"
                >
                  <div className="grid size-11 place-items-center rounded-2xl border border-black/[0.07] bg-white text-[#66735e]">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <div className="mt-auto pt-16">
                    <span className="text-xs text-[#999a93]">0{index + 1}</span>
                    <h3 className="mt-4 text-xl font-medium tracking-tight">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#6b6c65]">
                      {description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="vision"
          className="scroll-mt-8 bg-[#171814] px-5 py-24 text-white sm:px-8 sm:py-36 lg:px-10 lg:py-44"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
            <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-[#9faa98]">
              <span className="h-px w-8 bg-[#66735e]" />
              Notre vision
            </p>
            <p className="max-w-4xl text-3xl font-normal leading-[1.2] tracking-[-0.04em] text-[#f1f0e9] sm:text-5xl lg:text-6xl">
              Nous construisons une nouvelle base opérationnelle pour les
              marques qui veulent vendre, comprendre et évoluer{" "}
              <span className="text-[#8c8e86]">
                sans multiplier les outils.
              </span>
            </p>
          </div>
        </section>
      </main>

      <footer
        id="contact"
        className="scroll-mt-8 border-t border-white/[0.07] bg-[#171814] px-5 pb-10 text-white sm:px-8 lg:px-10"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-white/[0.07] pt-10 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold tracking-[0.24em]">ELROVA</p>
          <p className="text-[#8c8e86]">Commerce OS · En construction</p>
          <p className="text-[#8c8e86]">© 2026 ELROVA</p>
        </div>
      </footer>
    </div>
  );
}
