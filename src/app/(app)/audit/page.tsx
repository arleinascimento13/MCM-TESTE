import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth";
import { listAuditLog } from "@/services/reports";
import { DataTable, type Column } from "@/components/data-table";
import { formatAcao, formatDateTime } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listAuditLog>>["items"][number];

const columns: Column<Row>[] = [
  { key: "quando", header: "Quando", render: (r) => formatDateTime(r.quando) },
  { key: "usuario", header: "Usuário", render: (r) => r.usuario.nome },
  { key: "acao", header: "Ação", render: (r) => formatAcao(r.acao) },
  { key: "motivo", header: "Motivo", render: (r) => r.motivo ?? "—" },
];

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await getSessionUser();
  if (!user) return null;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? 1);
  const result = await listAuditLog(user, { page });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Auditoria</h1>
      <Suspense fallback={<div>Carregando...</div>}>
        <DataTable
          columns={columns}
          rows={result.items}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          onPageChange={(p) => { window.location.href = `/audit?page=${p}`; }}
        />
      </Suspense>
    </div>
  );
}
