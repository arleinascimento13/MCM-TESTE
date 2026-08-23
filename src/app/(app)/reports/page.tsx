import { getSessionUser } from "@/lib/auth";
import { ChartCard } from "@/components/chart-card";
import { PeriodFilter } from "@/components/period-filter";
import { BarChartComponent } from "@/components/bar-chart";
import { hoursByProject, hoursByEmployee, hoursByCostCenter, hoursByDiscipline, hoursByPeriod } from "@/services/reports";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <PeriodFilter />
      </div>
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
    </div>
  );
}
