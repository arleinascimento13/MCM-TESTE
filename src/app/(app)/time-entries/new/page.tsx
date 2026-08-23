import { TimeEntryForm } from "@/components/time-entry-form";
import { PageHeader } from "@/components/layout/page-header";

export default function NewTimeEntryPage() {
  return (
    <>
      <PageHeader title="Novo Apontamento" subtitle="Registre as horas trabalhadas" />
      <main className="p-4 sm:p-6">
        <div className="mx-auto max-w-2xl">
          <TimeEntryForm />
        </div>
      </main>
    </>
  );
}
