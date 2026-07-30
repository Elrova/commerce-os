import { PageHeader } from "@/components/app/page-shell";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Configuration" title="Paramètres" description="Configurez les informations de l’entreprise et les préférences opérationnelles de Commerce OS." />
      <section className="mt-8 max-w-2xl rounded-2xl border border-[#e0ded6] bg-white p-6">
        <h2 className="text-sm font-medium">Espace de travail</h2>
        <dl className="mt-6 divide-y divide-[#efede7]">
          <div className="flex justify-between py-4 text-sm"><dt className="text-[#777871]">Nom</dt><dd className="font-medium">ELROVA</dd></div>
          <div className="flex justify-between py-4 text-sm"><dt className="text-[#777871]">Devise</dt><dd className="font-medium">EUR (€)</dd></div>
          <div className="flex justify-between py-4 text-sm"><dt className="text-[#777871]">Marché principal</dt><dd className="font-medium">France</dd></div>
        </dl>
      </section>
    </div>
  );
}
