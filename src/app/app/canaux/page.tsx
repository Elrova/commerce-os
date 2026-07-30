import {
  AlertCircle,
  Check,
  CircleOff,
  Clock3,
  PlugZap,
  RefreshCw,
  ScrollText,
} from "lucide-react";
import {
  AppButton,
  EmptyState,
  PageHeader,
  StatusPill,
} from "@/components/app/page-shell";
import { demoChannelConnections, demoSyncJobs } from "@/lib/demo-data";
import type {
  ChannelConnectionStatus,
  SalesChannel,
} from "@/lib/channels/types";

const channelNames: Record<SalesChannel, string> = {
  shopify: "Shopify",
  amazon: "Amazon",
  ebay: "eBay",
  etsy: "Etsy",
  woocommerce: "WooCommerce",
};

const statusLabels: Record<
  ChannelConnectionStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "error" }
> = {
  not_connected: { label: "Non connecté", tone: "neutral" },
  connection_required: { label: "Connexion requise", tone: "warning" },
  connected: { label: "Connecté", tone: "success" },
  error: { label: "Erreur", tone: "error" },
};

const capabilityLabels = {
  importListings: "Import des annonces",
  publishListings: "Publication",
  orders: "Commandes",
  inventory: "Stock",
  pricing: "Prix",
} as const;

function ChannelMark({ channel }: { channel: SalesChannel }) {
  return (
    <span className="grid size-11 place-items-center rounded-xl bg-[#20211d] text-sm font-semibold uppercase text-white">
      {channel.slice(0, 2)}
    </span>
  );
}

export default function ChannelsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Intégrations"
        title="Canaux de vente"
        description="Connectez les plateformes officielles qui publieront vos produits et remonteront commandes, stocks et prix dans Commerce OS."
      />

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#dfe4da] bg-[#eef2eb] px-4 py-3 text-xs leading-5 text-[#5d6b57]">
        <PlugZap aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>
          Aperçu d’architecture : ces connexions sont des données locales de
          démonstration. Aucun compte, jeton ou flux OAuth réel n’est actif.
        </p>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium">Plateformes</h2>
            <p className="mt-1 text-xs text-[#81827b]">
              Capacités prévues par les API officielles.
            </p>
          </div>
          <span className="text-xs text-[#8c8d86]">
            {demoChannelConnections.length} disponibles
          </span>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {demoChannelConnections.map((connection) => {
            const status = statusLabels[connection.status];

            return (
              <article
                key={connection.id}
                className="rounded-2xl border border-[#e0ded6] bg-white p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <ChannelMark channel={connection.channel} />
                    <div>
                      <h3 className="font-medium">
                        {channelNames[connection.channel]}
                      </h3>
                      <div className="mt-1.5">
                        <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      </div>
                    </div>
                  </div>
                  <AppButton
                    variant={
                      connection.status === "connected"
                        ? "secondary"
                        : "primary"
                    }
                  >
                    {connection.status === "connected" ? "Gérer" : "Connecter"}
                  </AppButton>
                </div>

                <dl className="mt-6 grid gap-3 rounded-xl bg-[#f7f6f2] p-4 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-[#92938c]">Compte vendeur</dt>
                    <dd className="mt-1.5 font-medium text-[#41423d]">
                      {connection.sellerAccount ?? "Aucun compte associé"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#92938c]">
                      Dernière synchronisation
                    </dt>
                    <dd className="mt-1.5 flex items-center gap-1.5 font-medium text-[#41423d]">
                      <Clock3 aria-hidden="true" className="size-3.5" />
                      {connection.lastSyncedAt ? (
                        <time dateTime={connection.lastSyncedAt}>
                          {new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "Europe/Paris",
                          }).format(new Date(connection.lastSyncedAt))}
                        </time>
                      ) : (
                        "Jamais"
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#96978f]">
                    Capacités
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(connection.capabilities).map(
                      ([capability, enabled]) => (
                        <li
                          key={capability}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e7e5de] px-2.5 py-1.5 text-xs text-[#65665f]"
                        >
                          {enabled ? (
                            <Check
                              aria-hidden="true"
                              className="size-3.5 text-[#708069]"
                            />
                          ) : (
                            <CircleOff
                              aria-hidden="true"
                              className="size-3.5 text-[#a4a59e]"
                            />
                          )}
                          {
                            capabilityLabels[
                              capability as keyof typeof capabilityLabels
                            ]
                          }
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {connection.status === "error" && (
                  <div className="mt-5 flex items-center gap-2 border-t border-[#efede7] pt-4 text-xs text-[#8a554b]">
                    <AlertCircle aria-hidden="true" className="size-4" />
                    La dernière vérification a échoué. Reconnexion requise.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-medium">
              Journal des synchronisations
            </h2>
            <p className="mt-1 text-xs text-[#81827b]">
              Imports, publications et mises à jour récentes.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#747b70]"
          >
            <RefreshCw aria-hidden="true" className="size-3.5" />
            Actualiser
          </button>
        </div>
        <div className="mt-4">
          {demoSyncJobs.length === 0 ? (
            <EmptyState
              icon={<ScrollText aria-hidden="true" className="size-5" />}
              title="Aucune synchronisation enregistrée"
              description="Le journal commencera à se remplir après la connexion du premier canal officiel."
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
