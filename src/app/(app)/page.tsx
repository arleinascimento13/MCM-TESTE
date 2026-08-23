import { getSessionUser } from "@/lib/auth";
import { KpiCard } from "@/components/kpi-card";
import { ChartCard } from "@/components/chart-card";
import { ProjetoChart } from "@/components/projeto-chart";
import { PeriodChart } from "@/components/period-chart";
import { hoursByProject, hoursByPeriod } from "@/services/reports";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [porProjeto, porPeriodo] = await Promise.all([
    hoursByProject(user, {}),
    hoursByPeriod(user, {}),
  ]);

  const totalHoras = porProjeto.reduce((acc, p) => acc + Number(p.totalHoras), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Horas aprovadas" value={totalHoras.toFixed(2)} sub="Período total" />
        <KpiCard label="Projetos" value={String(porProjeto.length)} />
        <KpiCard label="Meses com apontamento" value={String(porPeriodo.length)} />
      </div>
      <ChartCard title="Horas por projeto">
        <ProjetoChart data={porProjeto} />
      </ChartCard>
      <ChartCard title="Horas por período">
        <PeriodChart data={porPeriodo} />
      </ChartCard>
    </div>
  );
}
