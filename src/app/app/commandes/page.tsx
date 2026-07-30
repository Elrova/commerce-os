import { PageHeader, StatusPill } from "@/components/app/page-shell";
import { demoOrders } from "@/lib/demo-data";

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Exécution" title="Commandes" description="Rassemblez les commandes des canaux connectés et gardez les opérations à traiter visibles." />
      <div className="mt-8 overflow-hidden rounded-2xl border border-[#e0ded6] bg-white">
        {demoOrders.map((order) => (
          <div key={order.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-[#efede7] px-5 py-5 last:border-0 sm:grid-cols-[100px_1fr_140px_140px]">
            <span className="text-sm font-medium">{order.id}</span><span className="text-sm text-[#64655f]">{order.customer}</span><span className="hidden text-sm font-medium sm:block">{order.total}</span><StatusPill tone={order.status === "À traiter" ? "warning" : "success"}>{order.status}</StatusPill>
          </div>
        ))}
      </div>
    </div>
  );
}
