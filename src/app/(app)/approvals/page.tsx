import { getSessionUser } from "@/lib/auth";
import { listTimeEntries } from "@/services/time-entries";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, type Column } from "@/components/data-table";
import { ApprovalDrawer } from "@/components/approval-drawer";

type Row = Awaited<ReturnType<typeof listTimeEntries>>["items"][number];

const columns: Column<Row>[] = [
  { key: "data", header: "Data", render: (r) => r.data.toISOString().slice(0, 10) },
  { key: "funcionario", header: "Funcionário", render: (r) => r.funcionario.nome },
  { key: "project", header: "Projeto", render: (r) => r.project.nome },
  { key: "duracao", header: "Duração", className: "text-right font-mono tabular-nums", render: (r) => r.duracao.toString() },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  {
    key: "acoes", header: "Ações",
    render: (r) => r.status === "PENDENTE" ? <ApprovalDrawer entryId={r.id} /> : null,
  },
];

export default async function ApprovalsPage() {
  const user = await getSessionUser();
  if (!user || user.papel !== "JOB_LEADER") return null;
  const result = await listTimeEntries(user, { status: "PENDENTE" });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Aprovações pendentes</h1>
      <DataTable columns={columns} rows={result.items} total={result.total} page={result.page} pageSize={result.pageSize} onPageChange={() => {}} />
    </div>
  );
}
