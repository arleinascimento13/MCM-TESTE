import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth";
import { listAuditLog } from "@/services/reports";
import { AuditTable } from "@/components/audit-table";

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await getSessionUser();
  if (!user) return null;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam ?? 1);
  const result = await listAuditLog(user, { page });

  const rows = result.items.map((r) => ({
    id: r.id,
    quando: r.quando instanceof Date ? r.quando.toISOString() : r.quando,
    usuarioNome: r.usuario.nome,
    acao: r.acao,
    motivo: r.motivo ?? null,
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Auditoria</h1>
      <Suspense fallback={<div>Carregando...</div>}>
        <AuditTable
          rows={rows}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
        />
      </Suspense>
    </div>
  );
}
