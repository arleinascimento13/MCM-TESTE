import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";

export async function createUser(data: { nome: string; email: string; senha: string; papel: "ADMIN" | "JOB_LEADER" | "FUNCIONARIO" }) {
  const existe = await prisma.user.findUnique({ where: { email: data.email } });
  if (existe) throw new ValidationError("E-mail já cadastrado");
  const senhaHash = await bcrypt.hash(data.senha, 10);
  return prisma.user.create({
    data: {
      nome: data.nome,
      email: data.email,
      senhaHash,
      papel: data.papel,
    },
    select: { id: true, nome: true, email: true, papel: true, ativo: true, criadoEm: true },
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, email: true, papel: true, ativo: true, criadoEm: true },
  });
}

export async function updateUser(id: string, data: { nome?: string; email?: string; papel?: "ADMIN" | "JOB_LEADER" | "FUNCIONARIO"; ativo?: boolean; senha?: string }) {
  const updateData: Record<string, unknown> = {};
  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.papel !== undefined) updateData.papel = data.papel;
  if (data.ativo !== undefined) updateData.ativo = data.ativo;
  if (data.senha) updateData.senhaHash = await bcrypt.hash(data.senha, 10);
  return prisma.user.update({ where: { id }, data: updateData });
}

export async function deactivateUser(id: string) {
  return prisma.user.update({ where: { id }, data: { ativo: false } });
}

export async function listAssignments() {
  return prisma.jobLeaderAssignment.findMany({
    where: { ativo: true },
    include: { funcionario: { select: { nome: true } }, jobLeader: { select: { nome: true } } },
    orderBy: { criadoEm: "desc" },
  });
}

export async function createAssignment(funcionarioId: string, jobLeaderId: string) {
  const atual = await prisma.jobLeaderAssignment.findFirst({ where: { funcionarioId, ativo: true } });
  if (atual) {
    await prisma.jobLeaderAssignment.update({ where: { id: atual.id }, data: { ativo: false } });
  }
  return prisma.jobLeaderAssignment.create({
    data: { funcionarioId, jobLeaderId, ativo: true },
  });
}

export async function deactivateAssignment(id: string) {
  return prisma.jobLeaderAssignment.update({ where: { id }, data: { ativo: false } });
}

export async function listAllowedOptions(userId?: string) {
  return prisma.userAllowedOption.findMany({
    where: userId ? { userId } : undefined,
    include: { user: { select: { nome: true } } },
    orderBy: { criadoEm: "desc" },
  });
}

export async function setAllowedOption(userId: string, tipo: "DISCIPLINA" | "CENTRO_CUSTO" | "LOCAL", valorId: string) {
  return prisma.userAllowedOption.create({ data: { userId, tipo, valorId } });
}

export async function removeAllowedOption(id: string) {
  return prisma.userAllowedOption.delete({ where: { id } });
}
