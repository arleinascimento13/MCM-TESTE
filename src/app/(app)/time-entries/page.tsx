import { Suspense } from "react";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listTimeEntries } from "@/services/time-entries";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Row = Awaited<ReturnType<typeof listTimeEntries>>["items"][number];

const columns: Column<Row>[] = [
  { key: "data", header: "Data", render: (r) => r.data.toISOString().slice(0, 10) },
  { key: "project", header: "Projeto", render: (r) => r.project.nome },
  { key: "duracao", header: "Duração", className: "text-right font-mono tabular-nums", render: (r) => r.duracao.toString() },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  { key: "funcionario", header: "Funcionário", render: (r) => r.funcionario.nome },
];

export default async function TimeEntriesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await getSessionUser();
  if (!user) return null;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? 1);
  const result = await listTimeEntries(user, { page });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Apontamentos</h1>
        <Link href="/time-entries/new">
          <Button><Plus className="h-4 w-4" /> Novo apontamento</Button>
        </Link>
      </div>
      <Suspense fallback={<div>Carregando...</div>}>
        <DataTable columns={columns} rows={result.items} total={result.total} page={result.page} pageSize={result.pageSize} onPageChange={(p) => { window.location.href = `/time-entries?page=${p}`; }} />
      </Suspense>
    </div>
  );
}
