import { Prisma } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from "@/lib/errors";
import { ERROR_CODES } from "@/lib/error-codes";
import { scopeFilter, getTeamMemberIds } from "./scope";
import { checkPermission } from "./permissions";
import { logAudit } from "./audit";

export type TimeEntryInput = {
  projectId: string;
  data: string;
  mes: number;
  ano: number;
  inicio: string;
  fim: string;
  duracao?: string;
  descricao?: string;
  costCenterId: string;
  disciplineId: string;
  locationId: string;
  horaExtra: boolean;
};

export type TimeEntryQuery = {
  page?: number;
  pageSize?: number;
  mes?: number;
  ano?: number;
  projectId?: string;
  status?: string;
  costCenterId?: string;
  disciplineId?: string;
};

export function calcularDuracao(inicio: string, fim: string): string {
  const [hi, mi] = inicio.split(":").map(Number);
  const [hf, mf] = fim.split(":").map(Number);
  const minutos = hf * 60 + mf - (hi * 60 + mi);
  if (minutos <= 0) throw new ValidationError("O campo início deve ser anterior ao campo fim");
  return (minutos / 60).toFixed(2);
}

async function validarOpcoesPermitidas(userId: string, input: TimeEntryInput) {
  const [cc, disc, loc] = await Promise.all([
    prisma.costCenter.findFirst({ where: { id: input.costCenterId, ativo: true } }),
    prisma.discipline.findFirst({ where: { id: input.disciplineId, ativo: true } }),
    prisma.location.findFirst({ where: { id: input.locationId, ativo: true } }),
  ]);
  if (!cc) throw new ValidationError("Centro de custo não encontrado ou inativo");
  if (!disc) throw new ValidationError("Disciplina não encontrada ou inativa");
  if (!loc) throw new ValidationError("Local não encontrado ou inativo");

  const [optCC, optDisc, optLoc] = await Promise.all([
    prisma.userAllowedOption.findFirst({ where: { userId, tipo: "CENTRO_CUSTO", valorId: input.costCenterId } }),
    prisma.userAllowedOption.findFirst({ where: { userId, tipo: "DISCIPLINA", valorId: input.disciplineId } }),
    prisma.userAllowedOption.findFirst({ where: { userId, tipo: "LOCAL", valorId: input.locationId } }),
  ]);
  if (!optCC || !optDisc || !optLoc) throw new ValidationError("Opção não permitida para este usuário", ERROR_CODES.OPTION_NOT_ALLOWED);
}

async function validarMesAno(input: TimeEntryInput) {
  if (input.mes < 1 || input.mes > 12) throw new ValidationError("Mês inválido");
  if (input.ano < 2000 || input.ano > 2100) throw new ValidationError("Ano inválido");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.data)) throw new ValidationError("Data inválida");
  if (!/^\d{2}:\d{2}$/.test(input.inicio) || !/^\d{2}:\d{2}$/.test(input.fim)) {
    throw new ValidationError("Hora inválida");
  }
}

export async function createTimeEntry(user: SessionUser, input: TimeEntryInput) {
  checkPermission(user, "create", "time-entry");
  await validarMesAno(input);
  const duracao = input.duracao ?? calcularDuracao(input.inicio, input.fim);

  const vinculo = await prisma.jobLeaderAssignment.findFirst({
    where: { funcionarioId: user.id, ativo: true },
  });
  if (!vinculo) throw new ValidationError("Funcionário sem job leader ativo");

  const alocacao = await prisma.allocation.findFirst({
    where: { funcionarioId: user.id, projectId: input.projectId },
  });
  if (!alocacao) throw new ValidationError("Funcionário não alocado neste projeto", ERROR_CODES.EMPLOYEE_NOT_ALLOCATED);

  await validarOpcoesPermitidas(user.id, input);

  const projeto = await prisma.project.findFirst({ where: { id: input.projectId, ativo: true } });
  if (!projeto) throw new ValidationError("Projeto não encontrado ou inativo");

  return prisma.$transaction(async (tx) => {
    const entrada = await tx.timeEntry.create({
      data: {
        funcionarioId: user.id,
        jobLeaderId: vinculo.jobLeaderId,
        projectId: input.projectId,
        mes: input.mes,
        ano: input.ano,
        data: new Date(input.data),
        inicio: input.inicio,
        fim: input.fim,
        duracao: duracao,
        descricao: input.descricao,
        costCenterId: input.costCenterId,
        disciplineId: input.disciplineId,
        locationId: input.locationId,
        horaExtra: input.horaExtra,
        status: "PENDENTE",
      },
    });
    await logAudit(tx, {
      timeEntryId: entrada.id,
      acao: "CRIAR",
      usuarioId: user.id,
      dadosAlterados: input,
    });
    return entrada;
  });
}

export async function listTimeEntries(user: SessionUser, query: TimeEntryQuery) {
  const filtroEscopo = await scopeFilter(user);
  const where: Prisma.TimeEntryWhereInput = {
    ...filtroEscopo,
    deletedAt: null,
    ...(query.mes ? { mes: query.mes } : {}),
    ...(query.ano ? { ano: query.ano } : {}),
    ...(query.projectId ? { projectId: query.projectId } : {}),
    ...(query.status ? { status: query.status as Prisma.EnumSTATUSFilter["equals"] } : {}),
    ...(query.costCenterId ? { costCenterId: query.costCenterId } : {}),
    ...(query.disciplineId ? { disciplineId: query.disciplineId } : {}),
  };
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 25;
  const [items, total] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      include: {
        project: { select: { nome: true } },
        costCenter: { select: { nome: true } },
        discipline: { select: { nome: true } },
        location: { select: { nome: true } },
        funcionario: { select: { id: true, nome: true } },
      },
      orderBy: { criadoEm: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.timeEntry.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getTimeEntry(user: SessionUser, id: string) {
  const filtroEscopo = await scopeFilter(user);
  const entrada = await prisma.timeEntry.findFirst({
    where: { id, ...filtroEscopo, deletedAt: null },
    include: {
      project: true,
      costCenter: true,
      discipline: true,
      location: true,
      funcionario: { select: { id: true, nome: true } },
    },
  });
  if (!entrada) throw new NotFoundError(ERROR_CODES.NOT_FOUND, "Apontamento não encontrado");
  return entrada;
}

export async function updateTimeEntry(user: SessionUser, id: string, input: Partial<TimeEntryInput>) {
  checkPermission(user, "edit", "time-entry");
  const entrada = await getTimeEntry(user, id);
  if (entrada.status === "APROVADA") {
    throw new ValidationError("Linha aprovada não pode ser editada", ERROR_CODES.APPROVED_ENTRY_EDIT);
  }
  if (user.papel === "FUNCIONARIO" && entrada.funcionarioId !== user.id) throw new ForbiddenError();
  if (user.papel === "JOB_LEADER") {
    const teamIds = await getTeamMemberIds(user.id);
    if (!teamIds.includes(entrada.funcionarioId)) throw new ForbiddenError();
  }
  if (input.inicio || input.fim) {
    const inicio = input.inicio ?? entrada.inicio;
    const fim = input.fim ?? entrada.fim;
    if (input.duracao === undefined) calcularDuracao(inicio, fim);
  }
  if (input.costCenterId || input.disciplineId || input.locationId || input.projectId) {
    await validarOpcoesPermitidas(entrada.funcionarioId, {
      ...entrada,
      ...input,
      data: input.data ?? entrada.data.toISOString().slice(0, 10),
      inicio: input.inicio ?? entrada.inicio,
      fim: input.fim ?? entrada.fim,
      horaExtra: input.horaExtra ?? entrada.horaExtra,
      duracao: input.duracao ?? entrada.duracao.toString(),
    } as TimeEntryInput);
  }

  return prisma.$transaction(async (tx) => {
    const atualizada = await tx.timeEntry.update({
      where: { id },
      data: {
        ...(input.projectId ? { projectId: input.projectId } : {}),
        ...(input.data ? { data: new Date(input.data) } : {}),
        ...(input.mes ? { mes: input.mes } : {}),
        ...(input.ano ? { ano: input.ano } : {}),
        ...(input.inicio ? { inicio: input.inicio } : {}),
        ...(input.fim ? { fim: input.fim } : {}),
        ...(input.duracao ? { duracao: input.duracao } : {}),
        ...(input.descricao !== undefined ? { descricao: input.descricao } : {}),
        ...(input.costCenterId ? { costCenterId: input.costCenterId } : {}),
        ...(input.disciplineId ? { disciplineId: input.disciplineId } : {}),
        ...(input.locationId ? { locationId: input.locationId } : {}),
        ...(input.horaExtra !== undefined ? { horaExtra: input.horaExtra } : {}),
      },
    });
    await logAudit(tx, {
      timeEntryId: id,
      acao: "EDITAR",
      usuarioId: user.id,
      dadosAlterados: { antes: { ...entrada, duracao: entrada.duracao?.toString() }, depois: { ...atualizada, duracao: atualizada.duracao?.toString() } },
    });
    return atualizada;
  });
}

export async function approveTimeEntry(user: SessionUser, id: string) {
  checkPermission(user, "approve", "time-entry");
  const teamIds = await getTeamMemberIds(user.id);
  return prisma.$transaction(async (tx) => {
    const entrada = await tx.timeEntry.findUnique({ where: { id } });
    if (!entrada || entrada.deletedAt) throw new NotFoundError(ERROR_CODES.NOT_FOUND, "Apontamento não encontrado");
    if (!teamIds.includes(entrada.funcionarioId)) throw new ForbiddenError();
    if (entrada.status === "APROVADA") {
      throw new ConflictError(ERROR_CODES.LINE_ALREADY_APPROVED, "Esta linha já foi aprovada");
    }
    if (entrada.status !== "PENDENTE") throw new ConflictError(ERROR_CODES.CONFLICT, "Apenas linhas pendentes podem ser aprovadas");
    const atualizada = await tx.timeEntry.update({
      where: { id },
      data: { status: "APROVADA" },
    });
    await logAudit(tx, { timeEntryId: id, acao: "APROVAR", usuarioId: user.id });
    return atualizada;
  });
}

export async function rejectTimeEntry(user: SessionUser, id: string, motivo: string) {
  checkPermission(user, "reject", "time-entry");
  if (!motivo || motivo.trim().length < 3) {
    throw new ValidationError("Motivo da rejeição é obrigatório", ERROR_CODES.REJECTION_WITHOUT_REASON);
  }
  const teamIds = await getTeamMemberIds(user.id);
  return prisma.$transaction(async (tx) => {
    const entrada = await tx.timeEntry.findUnique({ where: { id } });
    if (!entrada || entrada.deletedAt) throw new NotFoundError(ERROR_CODES.NOT_FOUND, "Apontamento não encontrado");
    if (!teamIds.includes(entrada.funcionarioId)) throw new ForbiddenError();
    if (entrada.status !== "PENDENTE") throw new ConflictError(ERROR_CODES.CONFLICT, "Apenas linhas pendentes podem ser rejeitadas");
    const atualizada = await tx.timeEntry.update({
      where: { id },
      data: { status: "REJEITADA", motivoRejeicao: motivo.trim() },
    });
    await logAudit(tx, { timeEntryId: id, acao: "REJEITAR", usuarioId: user.id, motivo: motivo.trim() });
    return atualizada;
  });
}

export async function resubmitTimeEntry(user: SessionUser, id: string) {
  checkPermission(user, "resubmit", "time-entry");
  return prisma.$transaction(async (tx) => {
    const entrada = await tx.timeEntry.findUnique({ where: { id } });
    if (!entrada || entrada.deletedAt) throw new NotFoundError(ERROR_CODES.NOT_FOUND, "Apontamento não encontrado");
    if (entrada.funcionarioId !== user.id) throw new ForbiddenError();
    if (entrada.status !== "REJEITADA") throw new ConflictError(ERROR_CODES.CONFLICT, "Apenas linhas rejeitadas podem ser reenviadas");
    const atualizada = await tx.timeEntry.update({
      where: { id },
      data: { status: "PENDENTE", motivoRejeicao: null },
    });
    await logAudit(tx, { timeEntryId: id, acao: "REENVIAR", usuarioId: user.id });
    return atualizada;
  });
}

export async function softDeleteTimeEntry(user: SessionUser, id: string) {
  checkPermission(user, "delete", "time-entry");
  if (user.papel !== "ADMIN") throw new ForbiddenError();
  return prisma.$transaction(async (tx) => {
    const entrada = await tx.timeEntry.findUnique({ where: { id } });
    if (!entrada || entrada.deletedAt) throw new NotFoundError(ERROR_CODES.NOT_FOUND, "Apontamento não encontrado");
    const removida = await tx.timeEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await logAudit(tx, { timeEntryId: id, acao: "REMOVER", usuarioId: user.id });
    return removida;
  });
}
