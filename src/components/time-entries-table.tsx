"use client";

import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";

type Row = {
  id: string;
  data: string;
  projectNome: string;
  duracao: string;
  status: string;
  funcionarioNome: string;
};

const columns: Column<Row>[] = [
  { key: "data", header: "Data", render: (r) => r.data.slice(0, 10) },
  { key: "projectNome", header: "Projeto" },
  { key: "duracao", header: "Duração", className: "text-right font-mono tabular-nums" },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as "PENDENTE" | "APROVADA" | "REJEITADA"} /> },
  { key: "funcionarioNome", header: "Funcionário" },
];

export function TimeEntriesTable({
  rows,
  total,
  page,
  pageSize,
}: {
  rows: Row[];
  total: number;
  page: number;
  pageSize: number;
}) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={(p) => {
        window.location.href = `/time-entries?page=${p}`;
      }}
    />
  );
}
