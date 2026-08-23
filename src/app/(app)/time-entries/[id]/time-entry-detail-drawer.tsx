"use client";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { StatusBadge } from "@/components/status-badge";
import { TimeEntryForm } from "@/components/time-entry-form";
import { ResubmitButton } from "./resubmit-button";

type EntryDetail = {
  id: string;
  data: Date;
  inicio: string;
  fim: string;
  duracao: unknown;
  descricao: string | null;
  horaExtra: boolean;
  status: "PENDENTE" | "APROVADA" | "REJEITADA";
  projectId: string;
  mes: number;
  ano: number;
  costCenterId: string;
  disciplineId: string;
  locationId: string;
  project: { nome: string };
  costCenter: { nome: string };
  discipline: { nome: string };
  location: { nome: string };
};

export function TimeEntryDetailDrawer({
  entry,
  open = true,
}: {
  entry: EntryDetail;
  open?: boolean;
}) {
  return (
    <Drawer swipeDirection="left" open={open}>
      <DrawerContent className="max-w-xl">
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <DrawerTitle>Apontamento</DrawerTitle>
            <StatusBadge status={entry.status} />
          </div>
          <DrawerDescription>
            Detalhes do apontamento
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-6 overflow-y-auto p-4">
          <dl className="grid grid-cols-2 gap-4 rounded-md border border-border p-4 text-sm">
            <div><dt className="text-muted-foreground">Projeto</dt><dd>{entry.project.nome}</dd></div>
            <div><dt className="text-muted-foreground">Data</dt><dd>{entry.data.toISOString().slice(0, 10)}</dd></div>
            <div><dt className="text-muted-foreground">Horário</dt><dd>{entry.inicio} — {entry.fim}</dd></div>
            <div><dt className="text-muted-foreground">Duração</dt><dd className="font-mono tabular-nums">{entry.duracao?.toString()} h</dd></div>
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
                  duracao: entry.duracao?.toString(),
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
      </DrawerContent>
    </Drawer>
  );
}
