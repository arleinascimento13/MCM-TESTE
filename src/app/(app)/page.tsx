import Link from "next/link";
import { CalendarDays, CircleX, Clock, FolderKanban } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { ChartCard } from "@/components/chart-card";
import { ProjetoChart } from "@/components/projeto-chart";
import { PeriodChart } from "@/components/period-chart";
import { hoursByProject, hoursByPeriod } from "@/services/reports";
import { listTimeEntries } from "@/services/time-entries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [porProjeto, porPeriodo, rejeitadas] = await Promise.all([
    hoursByProject(user, {}),
    hoursByPeriod(user, {}),
    listTimeEntries(user, { status: "REJEITADA", pageSize: 5 }),
  ]);

  const totalHoras = porProjeto.reduce((acc, p) => acc + Number(p.totalHoras), 0);

  return (
    <>
      <PageHeader
        title="Meus Apontamentos"
        subtitle="Acompanhe e registre suas horas trabalhadas"
        actions={
          <Link href="/time-entries/new">
            <Button size="sm">
              <Clock className="h-4 w-4" /> Novo Apontamento
            </Button>
          </Link>
        }
      />
      <main className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Horas aprovadas"
            value={totalHoras.toFixed(2)}
            sub="Período total"
            icon={Clock}
            tone="primary"
          />
          <KpiCard
            label="Projetos"
            value={String(porProjeto.length)}
            sub="Com horas lançadas"
            icon={FolderKanban}
            tone="success"
          />
          <KpiCard
            label="Meses com apontamento"
            value={String(porPeriodo.length)}
            sub="Histórico"
            icon={CalendarDays}
            tone="warning"
          />
          <KpiCard
            label="Rejeitadas"
            value={String(rejeitadas.total)}
            sub="Requer edição"
            icon={CircleX}
            tone="destructive"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartCard title="Horas por projeto" hint="Período total">
              <ProjetoChart data={porProjeto} />
            </ChartCard>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Ações necessárias</h3>
            {rejeitadas.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum apontamento rejeitado. Tudo em ordem!
              </p>
            ) : (
              <ul className="space-y-3">
                {rejeitadas.items.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {new Date(r.data).toLocaleDateString("pt-BR")} — Rejeitada
                    </p>
                    {"motivoRejeicao" in r && r.motivoRejeicao ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Motivo: &ldquo;{r.motivoRejeicao}&rdquo;
                      </p>
                    ) : null}
                    <Link
                      href={`/time-entries/${r.id}`}
                      className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                    >
                      Editar e reenviar
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <ChartCard title="Horas por período" hint="Últimos meses">
          <PeriodChart data={porPeriodo} />
        </ChartCard>
      </main>
    </>
  );
}
