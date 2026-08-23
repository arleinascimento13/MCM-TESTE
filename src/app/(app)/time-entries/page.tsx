import { Suspense } from "react";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listTimeEntries } from "@/services/time-entries";
import { TimeEntriesTable } from "@/components/time-entries-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function TimeEntriesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await getSessionUser();
  if (!user) return null;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? 1);
  const result = await listTimeEntries(user, { page });

  const rows = result.items.map((r) => ({
    id: r.id,
    data: r.data.toISOString(),
    projectNome: r.project.nome,
    duracao: r.duracao.toString(),
    status: r.status,
    funcionarioNome: r.funcionario.nome,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Apontamentos</h1>
        <Link href="/time-entries/new">
          <Button><Plus className="h-4 w-4" /> Novo apontamento</Button>
        </Link>
      </div>
      <Suspense fallback={<div>Carregando...</div>}>
        <TimeEntriesTable
          rows={rows}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
        />
      </Suspense>
    </div>
  );
}
