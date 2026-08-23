import { ParamManager } from "@/components/param-manager";
import { PageHeader } from "@/components/layout/page-header";

export default function CostCentersPage() {
  return (
    <>
      <PageHeader title="Centros de custo" subtitle="Cadastre e gerencie os centros de custo" />
      <main className="p-4 sm:p-6">
        <ParamManager resource="cost-centers" />
      </main>
    </>
  );
}
