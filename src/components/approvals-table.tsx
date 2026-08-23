"use client";

import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { ApprovalDrawer } from "@/components/approval-drawer";

type Row = {
  id: string;
  data: string;
  funcionarioNome: string;
  projectNome: string;
  duracao: string;
  status: string;
};

const columns: Column<Row>[] = [
  { key: "data", header: "Data", render: (r) => r.data.slice(0, 10) },
  { key: "funcionarioNome", header: "Funcionário" },
  { key: "projectNome", header: "Projeto" },
  { key: "duracao", header: "Duração", className: "text-right font-mono tabular-nums" },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status as "PENDENTE" | "APROVADA" | "REJEITADA"} /> },
  {
    key: "acoes",
    header: "Ações",
    render: (r) => (r.status === "PENDENTE" ? <ApprovalDrawer entryId={r.id} /> : null),
  },
];

export function ApprovalsTable({
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
      onPageChange={() => {}}
    />
  );
}
