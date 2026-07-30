import type {
  ChannelConnection,
  SyncJob,
} from "@/lib/channels/types";

export const demoChannelConnections: ChannelConnection[] = [
  {
    id: "channel-shopify-demo",
    channel: "shopify",
    status: "connection_required",
    capabilities: {
      importListings: true,
      publishListings: true,
      orders: true,
      inventory: true,
      pricing: true,
    },
  },
  {
    id: "channel-amazon-demo",
    channel: "amazon",
    status: "not_connected",
    capabilities: {
      importListings: true,
      publishListings: true,
      orders: true,
      inventory: true,
      pricing: true,
    },
  },
  {
    id: "channel-ebay-demo",
    channel: "ebay",
    status: "not_connected",
    capabilities: {
      importListings: true,
      publishListings: true,
      orders: true,
      inventory: true,
      pricing: true,
    },
  },
  {
    id: "channel-etsy-demo",
    channel: "etsy",
    status: "connected",
    sellerAccount: "ELROVA Studio (démo)",
    lastSyncedAt: "2026-07-30T08:42:00.000Z",
    capabilities: {
      importListings: true,
      publishListings: true,
      orders: true,
      inventory: true,
      pricing: true,
    },
  },
  {
    id: "channel-woocommerce-demo",
    channel: "woocommerce",
    status: "error",
    sellerAccount: "boutique.elrova.test",
    lastSyncedAt: "2026-07-29T16:15:00.000Z",
    capabilities: {
      importListings: true,
      publishListings: true,
      orders: true,
      inventory: true,
      pricing: true,
    },
  },
];

export const demoSyncJobs: SyncJob[] = [];

export const demoOpportunities = [
  {
    name: "Lampe nomade en aluminium",
    signal: "Demande en hausse",
    margin: "42 %",
    stage: "À qualifier",
  },
  {
    name: "Organisateur de bureau modulaire",
    signal: "Faible concurrence",
    margin: "36 %",
    stage: "Fournisseur trouvé",
  },
  {
    name: "Gourde isotherme 750 ml",
    signal: "Volume stable",
    margin: "31 %",
    stage: "Calcul terminé",
  },
];

export const demoProducts = [
  { sku: "ELR-LMP-001", name: "Lampe nomade Alba", stock: 48, status: "Brouillon" },
  { sku: "ELR-ORG-002", name: "Organisateur Sora", stock: 120, status: "Prêt" },
  { sku: "ELR-GRD-003", name: "Gourde Noma", stock: 76, status: "Publié" },
];

export const demoSuppliers = [
  { name: "Nordwerk Supply", country: "Allemagne", leadTime: "8 jours", products: 3 },
  { name: "Atelier Faro", country: "Portugal", leadTime: "12 jours", products: 2 },
];

export const demoOrders = [
  { id: "#1048", customer: "Camille Martin", total: "89,00 €", status: "À traiter" },
  { id: "#1047", customer: "Louis Bernard", total: "64,00 €", status: "Expédiée" },
  { id: "#1046", customer: "Sarah Petit", total: "118,00 €", status: "Expédiée" },
];
