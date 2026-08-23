import { Prisma } from "@prisma/client";

export type AuditTx = Prisma.TransactionClient;

export async function logAudit(
  tx: AuditTx,
  params: {
    timeEntryId: string;
    acao: "CRIAR" | "EDITAR" | "APROVAR" | "REJEITAR" | "REENVIAR" | "REMOVER";
    usuarioId: string;
    motivo?: string;
    dadosAlterados?: unknown;
  }
) {
  await tx.auditLog.create({
    data: {
      timeEntryId: params.timeEntryId,
      acao: params.acao,
      usuarioId: params.usuarioId,
      motivo: params.motivo,
      dadosAlterados: params.dadosAlterados as Prisma.InputJsonValue | undefined,
    },
  });
}
