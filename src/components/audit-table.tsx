"use client";

import { DataTable, type Column } from "@/components/data-table";
import { formatAcao, formatDateTime } from "@/lib/utils";

type Row = {
  id: string;
  quando: string;
  usuarioNome: string;
  acao: string;
  motivo: string | null;
};

const columns: Column<Row>[] = [
  { key: "quando", header: "Quando", render: (r) => formatDateTime(r.quando) },
  { key: "usuarioNome", header: "Usuário" },
  { key: "acao", header: "Ação", render: (r) => formatAcao(r.acao) },
  { key: "motivo", header: "Motivo", render: (r) => r.motivo ?? "—" },
];

export function AuditTable({
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
        window.location.href = `/audit?page=${p}`;
      }}
    />
  );
}
