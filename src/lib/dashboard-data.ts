import { createClient } from "@/lib/supabase/server";

export type DashboardMetric = {
  label: string;
  value: string;
  note: string;
};

const demoMetrics: DashboardMetric[] = [
  { label: "Chiffre d’affaires", value: "1 842 €", note: "+18,4 %" },
  { label: "Marge nette", value: "527 €", note: "28,6 %" },
  { label: "Commandes", value: "24", note: "1 à traiter" },
  { label: "Stock valorisé", value: "3 960 €", note: "244 unités" },
];

export async function getDashboardMetrics(workspaceId: string): Promise<{
  metrics: DashboardMetric[];
  isDemoFallback: boolean;
}> {
  const supabase = await createClient();
  const [
    { data: orders, error: ordersError },
    { data: products, error: productsError },
    { count: opportunitiesCount, error: opportunitiesError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total, platform_fees, shipping_cost, status")
      .eq("workspace_id", workspaceId),
    supabase
      .from("products")
      .select("purchase_price, stock_quantity")
      .eq("workspace_id", workspaceId),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
  ]);

  const queryError = ordersError ?? productsError ?? opportunitiesError;

  if (queryError) {
    throw new Error(
      `Impossible de charger les indicateurs du workspace : ${queryError.message}`,
    );
  }

  if (
    (orders?.length ?? 0) === 0 &&
    (products?.length ?? 0) === 0 &&
    (opportunitiesCount ?? 0) === 0
  ) {
    return { metrics: demoMetrics, isDemoFallback: true };
  }

  const revenue = (orders ?? []).reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );
  const feesAndShipping = (orders ?? []).reduce(
    (sum, order) =>
      sum + Number(order.platform_fees) + Number(order.shipping_cost),
    0,
  );
  const stockUnits = (products ?? []).reduce(
    (sum, product) => sum + product.stock_quantity,
    0,
  );
  const stockValue = (products ?? []).reduce(
    (sum, product) =>
      sum + Number(product.purchase_price) * product.stock_quantity,
    0,
  );
  const pendingOrders = (orders ?? []).filter((order) =>
    ["pending", "paid", "processing"].includes(order.status),
  ).length;
  const netMargin = revenue - feesAndShipping;
  const formatCurrency = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  return {
    isDemoFallback: false,
    metrics: [
      {
        label: "Chiffre d’affaires",
        value: formatCurrency.format(revenue),
        note: `${orders?.length ?? 0} commandes`,
      },
      {
        label: "Marge après frais",
        value: formatCurrency.format(netMargin),
        note:
          revenue > 0 ? `${((netMargin / revenue) * 100).toFixed(1)} %` : "—",
      },
      {
        label: "Commandes",
        value: String(orders?.length ?? 0),
        note: `${pendingOrders} à traiter`,
      },
      {
        label: "Stock valorisé",
        value: formatCurrency.format(stockValue),
        note: `${stockUnits} unités`,
      },
    ],
  };
}
