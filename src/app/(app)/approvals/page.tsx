import { getSessionUser } from "@/lib/auth";
import { listTimeEntries } from "@/services/time-entries";
import { ApprovalsTable } from "@/components/approvals-table";
import { PageHeader } from "@/components/layout/page-header";

export default async function ApprovalsPage() {
  const user = await getSessionUser();
  if (!user || user.papel !== "JOB_LEADER") return null;
  const result = await listTimeEntries(user, { status: "PENDENTE" });

  const rows = result.items.map((r) => ({
    id: r.id,
    data: r.data.toISOString(),
    funcionarioNome: r.funcionario.nome,
    projectNome: r.project.nome,
    duracao: r.duracao.toString(),
    status: r.status,
  }));

  return (
    <>
      <PageHeader
        title="Aprovações da Equipe"
        subtitle="Revise e aprove os apontamentos de horas do seu time"
      />
      <main className="space-y-4 p-4 sm:p-6">
        <ApprovalsTable
          rows={rows}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
        />
      </main>
    </>
  );
}
