import { Suspense } from "react";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listTimeEntries } from "@/services/time-entries";
import { TimeEntriesTable } from "@/components/time-entries-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

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
    <>
      <PageHeader
        title="Apontamentos"
        subtitle="Consulte seus registros de horas"
        actions={
          <Link href="/time-entries/new">
            <Button>
              <Plus className="h-4 w-4" /> Novo apontamento
            </Button>
          </Link>
        }
      />
      <main className="p-4 sm:p-6">
        <Suspense fallback={<div>Carregando...</div>}>
          <TimeEntriesTable
            rows={rows}
            total={result.total}
            page={result.page}
            pageSize={result.pageSize}
          />
        </Suspense>
      </main>
    </>
  );
}
