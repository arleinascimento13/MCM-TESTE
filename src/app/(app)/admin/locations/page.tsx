import { ParamManager } from "@/components/param-manager";
import { PageHeader } from "@/components/layout/page-header";

export default function LocationsPage() {
  return (
    <>
      <PageHeader title="Locais" subtitle="Cadastre e gerencie os locais" />
      <main className="p-4 sm:p-6">
        <ParamManager resource="locations" />
      </main>
    </>
  );
}
