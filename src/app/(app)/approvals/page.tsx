import { CheckCircle2, Clock, Hourglass, XCircle } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/kpi-card";
import { ChartCard } from "@/components/chart-card";
import { ProjetoChart } from "@/components/projeto-chart";
import { hoursByProject } from "@/services/reports";
import { listTimeEntries } from "@/services/time-entries";
import { ApprovalsTable } from "@/components/approvals-table";

export default async function ApprovalsPage() {
  const user = await getSessionUser();
  if (!user || user.papel !== "JOB_LEADER") return null;

  const [pendentes, aprovadas, rejeitadas, porProjeto] = await Promise.all([
    listTimeEntries(user, { status: "PENDENTE", pageSize: 200 }),
    listTimeEntries(user, { status: "APROVADA", pageSize: 1 }),
    listTimeEntries(user, { status: "REJEITADA", pageSize: 1 }),
    hoursByProject(user, {}),
  ]);

  const porColaborador = Object.entries(
    pendentes.items.reduce<Record<string, number>>((acc, r) => {
      acc[r.funcionario.nome] = (acc[r.funcionario.nome] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([nome, qtd]) => ({ nome, qtd }))
    .sort((a, b) => b.qtd - a.qtd);

  const rows = pendentes.items.map((r) => ({
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
      <main className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Pendentes"
            value={String(pendentes.total)}
            sub="Aguardando sua análise"
            icon={Hourglass}
            tone="warning"
          />
          <KpiCard
            label="Aprovadas no período"
            value={String(aprovadas.total)}
            sub="Do seu time"
            icon={CheckCircle2}
            tone="success"
          />
          <KpiCard
            label="Rejeitadas no período"
            value={String(rejeitadas.total)}
            sub="Corrigidas pelos funcionários"
            icon={XCircle}
            tone="destructive"
          />
          <KpiCard
            label="Horas por projeto"
            value={porProjeto.length > 0 ? String(porProjeto.length) : "0"}
            sub={`Projetos com horas (total ${pendentes.total} pendentes)`}
            icon={Clock}
            tone="primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartCard title="Horas por projeto" hint="Período total">
              <ProjetoChart data={porProjeto} />
            </ChartCard>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Pendências por colaborador
            </h3>
            {porColaborador.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma pendência na fila.</p>
            ) : (
              <ul className="space-y-3">
                {porColaborador.map(({ nome, qtd }) => (
                  <li key={nome} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
                      {nome
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((parte) => parte[0]?.toUpperCase() ?? "")
                        .join("")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {nome}
                    </span>
                    <span className="text-xs font-semibold text-warning">{qtd}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            Fila de aprovação
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
              {pendentes.total} pendentes
            </span>
          </h2>
          <ApprovalsTable
            rows={rows}
            total={pendentes.total}
            page={pendentes.page}
            pageSize={pendentes.pageSize === 200 ? 25 : pendentes.pageSize}
          />
        </div>
      </main>
    </>
  );
}
