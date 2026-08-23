import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SENHA_DEFAULT = "Senha123!";
const SENHA_ADMIN = "Admin123!";

async function hash(senha: string) {
  return bcrypt.hash(senha, 10);
}

// Helper: findFirst-then-create — returns existing record or creates new one
async function findOrCreate<T>(
  findFn: () => Promise<T | null>,
  createFn: () => Promise<T>,
): Promise<T> {
  const existing = await findFn();
  if (existing) return existing;
  return createFn();
}

export async function seed() {
  const senhaHashAdmin = await hash(SENHA_ADMIN);
  const senhaHashDefault = await hash(SENHA_DEFAULT);

  // ── Admin ──────────────────────────────────────────────────────────────────
  const admin = await findOrCreate(
    () => prisma.user.findFirst({ where: { papel: "ADMIN" } }),
    () =>
      prisma.user.create({
        data: {
          nome: "Administrador",
          email: "admin@mcm.local",
          senhaHash: senhaHashAdmin,
          papel: "ADMIN",
        },
      }),
  );

  // ── Job Leader ─────────────────────────────────────────────────────────────
  const lider = await findOrCreate(
    () => prisma.user.findFirst({ where: { email: "lider@mcm.local" } }),
    () =>
      prisma.user.create({
        data: {
          nome: "Líder de Projeto",
          email: "lider@mcm.local",
          senhaHash: senhaHashDefault,
          papel: "JOB_LEADER",
        },
      }),
  );

  // ── Funcionários ────────────────────────────────────────────────────────────
  const func1 = await findOrCreate(
    () => prisma.user.findFirst({ where: { email: "func1@mcm.local" } }),
    () =>
      prisma.user.create({
        data: {
          nome: "Funcionário Um",
          email: "func1@mcm.local",
          senhaHash: senhaHashDefault,
          papel: "FUNCIONARIO",
        },
      }),
  );

  const func2 = await findOrCreate(
    () => prisma.user.findFirst({ where: { email: "func2@mcm.local" } }),
    () =>
      prisma.user.create({
        data: {
          nome: "Funcionário Dois",
          email: "func2@mcm.local",
          senhaHash: senhaHashDefault,
          papel: "FUNCIONARIO",
        },
      }),
  );

  // ── Projects ─────────────────────────────────────────────────────────────────
  const projeto1 = await findOrCreate(
    () => prisma.project.findFirst({ where: { nome: "Projeto Alpha" } }),
    () => prisma.project.create({ data: { nome: "Projeto Alpha" } }),
  );

  const projeto2 = await findOrCreate(
    () => prisma.project.findFirst({ where: { nome: "Projeto Beta" } }),
    () => prisma.project.create({ data: { nome: "Projeto Beta" } }),
  );

  // ── Cost Centers ────────────────────────────────────────────────────────────
  const cc1 = await findOrCreate(
    () => prisma.costCenter.findFirst({ where: { nome: "CC Administrativo" } }),
    () => prisma.costCenter.create({ data: { nome: "CC Administrativo" } }),
  );

  const cc2 = await findOrCreate(
    () => prisma.costCenter.findFirst({ where: { nome: "CC Desenvolvimento" } }),
    () => prisma.costCenter.create({ data: { nome: "CC Desenvolvimento" } }),
  );

  const cc3 = await findOrCreate(
    () => prisma.costCenter.findFirst({ where: { nome: "CC Infraestrutura" } }),
    () => prisma.costCenter.create({ data: { nome: "CC Infraestrutura" } }),
  );

  // ── Disciplines ─────────────────────────────────────────────────────────────
  const disp1 = await findOrCreate(
    () => prisma.discipline.findFirst({ where: { nome: "Análise" } }),
    () => prisma.discipline.create({ data: { nome: "Análise" } }),
  );

  const disp2 = await findOrCreate(
    () => prisma.discipline.findFirst({ where: { nome: "Desenvolvimento" } }),
    () => prisma.discipline.create({ data: { nome: "Desenvolvimento" } }),
  );

  const disp3 = await findOrCreate(
    () => prisma.discipline.findFirst({ where: { nome: "Revisão" } }),
    () => prisma.discipline.create({ data: { nome: "Revisão" } }),
  );

  // ── Locations ────────────────────────────────────────────────────────────────
  const local1 = await findOrCreate(
    () => prisma.location.findFirst({ where: { nome: "Escritório Central" } }),
    () => prisma.location.create({ data: { nome: "Escritório Central" } }),
  );

  const local2 = await findOrCreate(
    () => prisma.location.findFirst({ where: { nome: "Home Office" } }),
    () => prisma.location.create({ data: { nome: "Home Office" } }),
  );

  // ── Allocations ─────────────────────────────────────────────────────────────
  await findOrCreate(
    () =>
      prisma.allocation.findFirst({
        where: { funcionarioId: func1.id, projectId: projeto1.id },
      }),
    () =>
      prisma.allocation.create({
        data: { funcionarioId: func1.id, projectId: projeto1.id },
      }),
  );

  await findOrCreate(
    () =>
      prisma.allocation.findFirst({
        where: { funcionarioId: func1.id, projectId: projeto2.id },
      }),
    () =>
      prisma.allocation.create({
        data: { funcionarioId: func1.id, projectId: projeto2.id },
      }),
  );

  await findOrCreate(
    () =>
      prisma.allocation.findFirst({
        where: { funcionarioId: func2.id, projectId: projeto1.id },
      }),
    () =>
      prisma.allocation.create({
        data: { funcionarioId: func2.id, projectId: projeto1.id },
      }),
  );

  // ── Job Leader Assignments (active) ─────────────────────────────────────────
  await findOrCreate(
    () =>
      prisma.jobLeaderAssignment.findFirst({
        where: { funcionarioId: func1.id, jobLeaderId: lider.id, ativo: true },
      }),
    () =>
      prisma.jobLeaderAssignment.create({
        data: { funcionarioId: func1.id, jobLeaderId: lider.id, ativo: true },
      }),
  );

  await findOrCreate(
    () =>
      prisma.jobLeaderAssignment.findFirst({
        where: { funcionarioId: func2.id, jobLeaderId: lider.id, ativo: true },
      }),
    () =>
      prisma.jobLeaderAssignment.create({
        data: { funcionarioId: func2.id, jobLeaderId: lider.id, ativo: true },
      }),
  );

  // ── Allowed Options for funcionários ────────────────────────────────────────
  // func1: can work on all disciplines and cost centers
  await findOrCreate(
    () =>
      prisma.userAllowedOption.findFirst({
        where: { userId: func1.id, tipo: "DISCIPLINA", valorId: disp1.id },
      }),
    () =>
      prisma.userAllowedOption.create({
        data: { userId: func1.id, tipo: "DISCIPLINA", valorId: disp1.id },
      }),
  );

  await findOrCreate(
    () =>
      prisma.userAllowedOption.findFirst({
        where: { userId: func1.id, tipo: "DISCIPLINA", valorId: disp2.id },
      }),
    () =>
      prisma.userAllowedOption.create({
        data: { userId: func1.id, tipo: "DISCIPLINA", valorId: disp2.id },
      }),
  );

  await findOrCreate(
    () =>
      prisma.userAllowedOption.findFirst({
        where: { userId: func1.id, tipo: "CENTRO_CUSTO", valorId: cc1.id },
      }),
    () =>
      prisma.userAllowedOption.create({
        data: { userId: func1.id, tipo: "CENTRO_CUSTO", valorId: cc1.id },
      }),
  );

  await findOrCreate(
    () =>
      prisma.userAllowedOption.findFirst({
        where: { userId: func1.id, tipo: "CENTRO_CUSTO", valorId: cc2.id },
      }),
    () =>
      prisma.userAllowedOption.create({
        data: { userId: func1.id, tipo: "CENTRO_CUSTO", valorId: cc2.id },
      }),
  );

  await findOrCreate(
    () =>
      prisma.userAllowedOption.findFirst({
        where: { userId: func1.id, tipo: "LOCAL", valorId: local1.id },
      }),
    () =>
      prisma.userAllowedOption.create({
        data: { userId: func1.id, tipo: "LOCAL", valorId: local1.id },
      }),
  );

  await findOrCreate(
    () =>
      prisma.userAllowedOption.findFirst({
        where: { userId: func1.id, tipo: "LOCAL", valorId: local2.id },
      }),
    () =>
      prisma.userAllowedOption.create({
        data: { userId: func1.id, tipo: "LOCAL", valorId: local2.id },
      }),
  );

  // func2: can work on a subset
  await findOrCreate(
    () =>
      prisma.userAllowedOption.findFirst({
        where: { userId: func2.id, tipo: "DISCIPLINA", valorId: disp2.id },
      }),
    () =>
      prisma.userAllowedOption.create({
        data: { userId: func2.id, tipo: "DISCIPLINA", valorId: disp2.id },
      }),
  );

  await findOrCreate(
    () =>
      prisma.userAllowedOption.findFirst({
        where: { userId: func2.id, tipo: "DISCIPLINA", valorId: disp3.id },
      }),
    () =>
      prisma.userAllowedOption.create({
        data: { userId: func2.id, tipo: "DISCIPLINA", valorId: disp3.id },
      }),
  );

  await findOrCreate(
    () =>
      prisma.userAllowedOption.findFirst({
        where: { userId: func2.id, tipo: "CENTRO_CUSTO", valorId: cc2.id },
      }),
    () =>
      prisma.userAllowedOption.create({
        data: { userId: func2.id, tipo: "CENTRO_CUSTO", valorId: cc2.id },
      }),
  );

  await findOrCreate(
    () =>
      prisma.userAllowedOption.findFirst({
        where: { userId: func2.id, tipo: "CENTRO_CUSTO", valorId: cc3.id },
      }),
    () =>
      prisma.userAllowedOption.create({
        data: { userId: func2.id, tipo: "CENTRO_CUSTO", valorId: cc3.id },
      }),
  );

  await findOrCreate(
    () =>
      prisma.userAllowedOption.findFirst({
        where: { userId: func2.id, tipo: "LOCAL", valorId: local1.id },
      }),
    () =>
      prisma.userAllowedOption.create({
        data: { userId: func2.id, tipo: "LOCAL", valorId: local1.id },
      }),
  );

  // ── Time Entries ────────────────────────────────────────────────────────────
  // PENDENTE entry by func1
  const entryPendente = await findOrCreate(
    () =>
      prisma.timeEntry.findFirst({
        where: {
          funcionarioId: func1.id,
          mes: new Date().getMonth() + 1,
          ano: new Date().getFullYear(),
          inicio: "09:00",
        },
      }),
    () =>
      prisma.timeEntry.create({
        data: {
          funcionarioId: func1.id,
          jobLeaderId: lider.id,
          projectId: projeto1.id,
          mes: new Date().getMonth() + 1,
          ano: new Date().getFullYear(),
          data: new Date(),
          inicio: "09:00",
          fim: "12:00",
          duracao: 3,
          descricao: "Desenvolvimento de feature X",
          costCenterId: cc1.id,
          disciplineId: disp2.id,
          locationId: local1.id,
          status: "PENDENTE",
        },
      }),
  );

  // APROVADA entry by func1
  const entryAprovada = await findOrCreate(
    () =>
      prisma.timeEntry.findFirst({
        where: {
          funcionarioId: func1.id,
          mes: new Date().getMonth() + 1,
          ano: new Date().getFullYear(),
          inicio: "14:00",
        },
      }),
    () =>
      prisma.timeEntry.create({
        data: {
          funcionarioId: func1.id,
          jobLeaderId: lider.id,
          projectId: projeto2.id,
          mes: new Date().getMonth() + 1,
          ano: new Date().getFullYear(),
          data: new Date(),
          inicio: "14:00",
          fim: "18:00",
          duracao: 4,
          descricao: "Revisão de código",
          costCenterId: cc2.id,
          disciplineId: disp3.id,
          locationId: local2.id,
          status: "APROVADA",
        },
      }),
  );

  // REJEITADA entry by func2
  const entryRejeitada = await findOrCreate(
    () =>
      prisma.timeEntry.findFirst({
        where: {
          funcionarioId: func2.id,
          mes: new Date().getMonth() + 1,
          ano: new Date().getFullYear(),
          inicio: "08:00",
        },
      }),
    () =>
      prisma.timeEntry.create({
        data: {
          funcionarioId: func2.id,
          jobLeaderId: lider.id,
          projectId: projeto1.id,
          mes: new Date().getMonth() + 1,
          ano: new Date().getFullYear(),
          data: new Date(),
          inicio: "08:00",
          fim: "12:00",
          duracao: 4,
          descricao: "Tarefa rejeitada por falta de descrição",
          costCenterId: cc3.id,
          disciplineId: disp2.id,
          locationId: local1.id,
          status: "REJEITADA",
          motivoRejeicao: "Descrição insuficiente para validar a entrada",
        },
      }),
  );

  // ── Audit Logs ──────────────────────────────────────────────────────────────
  // APROVADA entry audit
  await findOrCreate(
    () =>
      prisma.auditLog.findFirst({
        where: {
          timeEntryId: entryAprovada.id,
          acao: "APROVAR",
          usuarioId: lider.id,
        },
      }),
    () =>
      prisma.auditLog.create({
        data: {
          timeEntryId: entryAprovada.id,
          acao: "APROVAR",
          usuarioId: lider.id,
        },
      }),
  );

  // REJEITADA entry audit
  await findOrCreate(
    () =>
      prisma.auditLog.findFirst({
        where: {
          timeEntryId: entryRejeitada.id,
          acao: "REJEITAR",
          usuarioId: lider.id,
        },
      }),
    () =>
      prisma.auditLog.create({
        data: {
          timeEntryId: entryRejeitada.id,
          acao: "REJEITAR",
          usuarioId: lider.id,
          motivo: "Descrição insuficiente para validar a entrada",
        },
      }),
  );

  // PENDENTE entry audit (created)
  await findOrCreate(
    () =>
      prisma.auditLog.findFirst({
        where: {
          timeEntryId: entryPendente.id,
          acao: "CRIAR",
          usuarioId: func1.id,
        },
      }),
    () =>
      prisma.auditLog.create({
        data: {
          timeEntryId: entryPendente.id,
          acao: "CRIAR",
          usuarioId: func1.id,
        },
      }),
  );

  console.log("Seed concluído:");
  console.log("  admin@mcm.local / Admin123!");
  console.log("  lider@mcm.local / Senha123!");
  console.log("  func1@mcm.local / Senha123!");
  console.log("  func2@mcm.local / Senha123!");
}

if (require.main === module) {
  seed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
