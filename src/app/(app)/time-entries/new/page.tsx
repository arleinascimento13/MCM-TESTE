import { TimeEntryForm } from "@/components/time-entry-form";

export default function NewTimeEntryPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Novo apontamento</h1>
      <TimeEntryForm />
    </div>
  );
}
