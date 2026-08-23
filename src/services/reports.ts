import { Prisma } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scopeFilter } from "./scope";

type ReportQuery = { mes?: number; ano?: number; projectId?: string };

async function baseWhere(user: SessionUser, query: ReportQuery) {
  const filtroEscopo = await scopeFilter(user);
  return {
    ...filtroEscopo,
    status: "APROVADA" as const,
    deletedAt: null,
    ...(query.mes ? { mes: query.mes } : {}),
    ...(query.ano ? { ano: query.ano } : {}),
    ...(query.projectId ? { projectId: query.projectId } : {}),
  };
}

export async function hoursByProject(user: SessionUser, query: ReportQuery) {
  const where = await baseWhere(user, query);
  const rows = await prisma.timeEntry.groupBy({
    by: ["projectId"],
    where,
    _sum: { duracao: true },
    orderBy: { _sum: { duracao: "desc" } },
  });
  const projetos = await prisma.project.findMany({
    where: { id: { in: rows.map((r) => r.projectId) } },
    select: { id: true, nome: true },
  });
  const nomes = new Map(projetos.map((p) => [p.id, p.nome]));
  return rows.map((r) => ({
    projectId: r.projectId,
    projectName: nomes.get(r.projectId) ?? "Desconhecido",
    totalHoras: r._sum.duracao?.toString() ?? "0",
  }));
}

export async function hoursByEmployee(user: SessionUser, query: ReportQuery) {
  const where = await baseWhere(user, query);
  const rows = await prisma.timeEntry.groupBy({
    by: ["funcionarioId"],
    where,
    _sum: { duracao: true },
    orderBy: { _sum: { duracao: "desc" } },
  });
  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.funcionarioId) } },
    select: { id: true, nome: true },
  });
  const nomes = new Map(users.map((u) => [u.id, u.nome]));
  return rows.map((r) => ({
    funcionarioId: r.funcionarioId,
    funcionarioNome: nomes.get(r.funcionarioId) ?? "Desconhecido",
    totalHoras: r._sum.duracao?.toString() ?? "0",
  }));
}

export async function hoursByCostCenter(user: SessionUser, query: ReportQuery) {
  const where = await baseWhere(user, query);
  const rows = await prisma.timeEntry.groupBy({
    by: ["costCenterId"],
    where,
    _sum: { duracao: true },
    orderBy: { _sum: { duracao: "desc" } },
  });
  const ccs = await prisma.costCenter.findMany({
    where: { id: { in: rows.map((r) => r.costCenterId) } },
    select: { id: true, nome: true },
  });
  const nomes = new Map(ccs.map((c) => [c.id, c.nome]));
  return rows.map((r) => ({
    costCenterId: r.costCenterId,
    costCenterName: nomes.get(r.costCenterId) ?? "Desconhecido",
    totalHoras: r._sum.duracao?.toString() ?? "0",
  }));
}

export async function hoursByDiscipline(user: SessionUser, query: ReportQuery) {
  const where = await baseWhere(user, query);
  const rows = await prisma.timeEntry.groupBy({
    by: ["disciplineId"],
    where,
    _sum: { duracao: true },
    orderBy: { _sum: { duracao: "desc" } },
  });
  const disciplinas = await prisma.discipline.findMany({
    where: { id: { in: rows.map((r) => r.disciplineId) } },
    select: { id: true, nome: true },
  });
  const nomes = new Map(disciplinas.map((d) => [d.id, d.nome]));
  return rows.map((r) => ({
    disciplineId: r.disciplineId,
    disciplineName: nomes.get(r.disciplineId) ?? "Desconhecido",
    totalHoras: r._sum.duracao?.toString() ?? "0",
  }));
}

export async function hoursByPeriod(user: SessionUser, query: ReportQuery) {
  const where = await baseWhere(user, query);
  const rows = await prisma.timeEntry.groupBy({
    by: ["mes", "ano"],
    where,
    _sum: { duracao: true },
    orderBy: [{ ano: "asc" }, { mes: "asc" }],
  });
  return rows.map((r) => ({
    mes: r.mes,
    ano: r.ano,
    totalHoras: r._sum.duracao?.toString() ?? "0",
  }));
}

export async function listAuditLog(user: SessionUser, query: { page?: number; pageSize?: number }) {
  const filtroEscopo = await scopeFilter(user);
  const where: Prisma.AuditLogWhereInput = {
    timeEntry: { ...filtroEscopo, deletedAt: null },
  };
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 50;
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        timeEntry: { select: { id: true, data: true, funcionarioId: true } },
        usuario: { select: { id: true, nome: true } },
      },
      orderBy: { quando: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total, page, pageSize };
}
