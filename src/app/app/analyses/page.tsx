import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/app/page-shell";

const bars = [38, 52, 45, 68, 63, 78, 92];

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Performance" title="Analyses" description="Mesurez la rentabilité réelle par produit et par canal pour décider où concentrer vos efforts." />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[["Ventes nettes", "1 842 €"], ["Marge nette", "527 €"], ["Retour sur stock", "13,3 %"]].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#e0ded6] bg-white p-5"><p className="text-xs text-[#7d7e77]">{label}</p><p className="mt-3 text-2xl font-medium tracking-tight">{value}</p></div>)}
      </div>
      <section className="mt-4 rounded-2xl border border-[#e0ded6] bg-white p-6">
        <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#edf0e9] text-[#708069]"><BarChart3 aria-hidden="true" className="size-4" /></span><div><h2 className="text-sm font-medium">Marge quotidienne</h2><p className="mt-0.5 text-xs text-[#85867f]">7 derniers jours</p></div></div>
        <div className="mt-8 flex h-52 items-end gap-3 border-b border-[#e9e7e0] px-2">
          {bars.map((height, index) => <div key={index} className="flex-1 rounded-t-lg bg-[#7d8b76]" style={{ height: `${height}%` }} />)}
        </div>
      </section>
    </div>
  );
}
