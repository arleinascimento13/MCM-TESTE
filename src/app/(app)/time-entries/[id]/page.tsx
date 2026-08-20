import { getSessionUser } from "@/lib/auth";
import { getTimeEntry } from "@/services/time-entries";
import { StatusBadge } from "@/components/status-badge";
import { TimeEntryForm } from "@/components/time-entry-form";
import { ResubmitButton } from "./resubmit-button";

export default async function TimeEntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return null;
  const { id } = await params;
  const entry = await getTimeEntry(user, id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Apontamento</h1>
        <StatusBadge status={entry.status} />
      </div>
      <dl className="grid grid-cols-2 gap-4 rounded-md border border-border p-4 text-sm">
        <div><dt className="text-muted-foreground">Projeto</dt><dd>{entry.project.nome}</dd></div>
        <div><dt className="text-muted-foreground">Data</dt><dd>{entry.data.toISOString().slice(0, 10)}</dd></div>
        <div><dt className="text-muted-foreground">Horário</dt><dd>{entry.inicio} — {entry.fim}</dd></div>
        <div><dt className="text-muted-foreground">Duração</dt><dd className="font-mono tabular-nums">{entry.duracao.toString()} h</dd></div>
        <div><dt className="text-muted-foreground">Centro de custo</dt><dd>{entry.costCenter.nome}</dd></div>
        <div><dt className="text-muted-foreground">Disciplina</dt><dd>{entry.discipline.nome}</dd></div>
        <div><dt className="text-muted-foreground">Local</dt><dd>{entry.location.nome}</dd></div>
        <div><dt className="text-muted-foreground">Descrição</dt><dd>{entry.descricao ?? "—"}</dd></div>
      </dl>
      {entry.status !== "APROVADA" && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Editar</h2>
          <TimeEntryForm
            initial={{
              projectId: entry.projectId,
              data: entry.data.toISOString().slice(0, 10),
              mes: entry.mes,
              ano: entry.ano,
              inicio: entry.inicio,
              fim: entry.fim,
              duracao: entry.duracao.toString(),
              descricao: entry.descricao ?? undefined,
              costCenterId: entry.costCenterId,
              disciplineId: entry.disciplineId,
              locationId: entry.locationId,
              horaExtra: entry.horaExtra,
            }}
            entryId={entry.id}
          />
          {entry.status === "REJEITADA" && <ResubmitButton entryId={entry.id} />}
        </div>
      )}
    </div>
  );
}
