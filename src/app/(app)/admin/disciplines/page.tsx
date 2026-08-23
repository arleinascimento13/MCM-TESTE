import { ParamManager } from "@/components/param-manager";
import { PageHeader } from "@/components/layout/page-header";

export default function DisciplinesPage() {
  return (
    <>
      <PageHeader title="Disciplinas" subtitle="Cadastre e gerencie as disciplinas" />
      <main className="p-4 sm:p-6">
        <ParamManager resource="disciplines" />
      </main>
    </>
  );
}
