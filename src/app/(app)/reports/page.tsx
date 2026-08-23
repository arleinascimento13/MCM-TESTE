import { getSessionUser } from "@/lib/auth";
import { ChartCard } from "@/components/chart-card";
import { PeriodFilter } from "@/components/period-filter";
import { BarChartComponent } from "@/components/bar-chart";
import { hoursByProject, hoursByEmployee, hoursByCostCenter, hoursByDiscipline, hoursByPeriod } from "@/services/reports";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ mes?: string; ano?: string }> }) {
  const user = await getSessionUser();
  if (!user) return null;
  const params = await searchParams;
  const query = {
    mes: params.mes ? Number(params.mes) : undefined,
    ano: params.ano ? Number(params.ano) : undefined,
  };

  const [porProjeto, porFuncionario, porCC, porDisciplina, porPeriodo] = await Promise.all([
    hoursByProject(user, query),
    hoursByEmployee(user, query),
    hoursByCostCenter(user, query),
    hoursByDiscipline(user, query),
    hoursByPeriod(user, query),
  ]);

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Horas por projeto, funcionário, centro de custo, disciplina e período"
        actions={<PeriodFilter />}
      />
      <main className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Horas por projeto">
            <BarChartComponent data={porProjeto.map((r) => ({ name: r.projectName, value: r.totalHoras }))} />
          </ChartCard>
          <ChartCard title="Horas por funcionário">
            <BarChartComponent data={porFuncionario.map((r) => ({ name: r.funcionarioNome, value: r.totalHoras }))} />
          </ChartCard>
          <ChartCard title="Horas por centro de custo">
            <BarChartComponent data={porCC.map((r) => ({ name: r.costCenterName, value: r.totalHoras }))} />
          </ChartCard>
          <ChartCard title="Horas por disciplina">
            <BarChartComponent data={porDisciplina.map((r) => ({ name: r.disciplineName, value: r.totalHoras }))} />
          </ChartCard>
          <ChartCard title="Horas por período">
            <BarChartComponent data={porPeriodo.map((r) => ({ name: `${String(r.mes).padStart(2, "0")}/${r.ano}`, value: r.totalHoras }))} />
          </ChartCard>
        </div>
      </main>
    </>
  );
}
