import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { calcularDuracao, createTimeEntry, updateTimeEntry, approveTimeEntry, rejectTimeEntry, resubmitTimeEntry, softDeleteTimeEntry } from "@/services/time-entries";
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from "@/lib/errors";

const { prismaMock, prismaTxMock } = vi.hoisted(() => {
  const prismaTxMock = {
    timeEntry: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  const prismaMock = {
    $transaction: vi.fn((fn) => fn(prismaTxMock)),
    jobLeaderAssignment: { findFirst: vi.fn() },
    allocation: { findFirst: vi.fn() },
    userAllowedOption: { findFirst: vi.fn() },
    costCenter: { findFirst: vi.fn() },
    discipline: { findFirst: vi.fn() },
    location: { findFirst: vi.fn() },
    project: { findFirst: vi.fn() },
    timeEntry: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  return { prismaMock, prismaTxMock };
});

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/services/scope", () => ({
  getTeamMemberIds: vi.fn().mockResolvedValue(["f1", "f2"]),
  scopeFilter: vi.fn().mockImplementation((user: { papel: string; id: string }) =>
    user.papel === "ADMIN" ? Promise.resolve({}) : user.papel === "FUNCIONARIO" ? Promise.resolve({ funcionarioId: user.id }) : Promise.resolve({ funcionarioId: { in: ["f1", "f2"] } })
  ),
}));
vi.mock("@/services/permissions", () => ({
  checkPermission: vi.fn(),
}));

const userFunc = { id: "f1", nome: "F", email: "f@mcm.local", papel: "FUNCIONARIO" as const };
const userAdmin = { id: "a", nome: "A", email: "a@mcm.local", papel: "ADMIN" as const };
const userJL = { id: "j", nome: "J", email: "j@mcm.local", papel: "JOB_LEADER" as const };

const inputValido = {
  projectId: "p1", data: "2026-08-10", mes: 8, ano: 2026,
  inicio: "09:00", fim: "17:00", costCenterId: "c1", disciplineId: "d1", locationId: "l1",
  horaExtra: false, descricao: "Trabalho de teste",
};

describe("calcularDuracao", () => {
  it("calcula 8 horas", () => {
    expect(calcularDuracao("09:00", "17:00")).toBe("8.00");
  });
  it("calcula meia hora", () => {
    expect(calcularDuracao("08:30", "09:00")).toBe("0.50");
  });
});

describe("createTimeEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.jobLeaderAssignment.findFirst.mockResolvedValue({ id: "v1", jobLeaderId: "j" });
    prismaMock.allocation.findFirst.mockResolvedValue({ id: "al1" });
    prismaMock.userAllowedOption.findFirst.mockResolvedValue({ id: "o1" });
    prismaMock.costCenter.findFirst.mockResolvedValue({ id: "c1", ativo: true });
    prismaMock.discipline.findFirst.mockResolvedValue({ id: "d1", ativo: true });
    prismaMock.location.findFirst.mockResolvedValue({ id: "l1", ativo: true });
    prismaMock.project.findFirst.mockResolvedValue({ id: "p1", ativo: true });
    prismaTxMock.timeEntry.create.mockResolvedValue({ id: "t1" });
  });

  it("cria com duração calculada e job leader ativo", async () => {
    await createTimeEntry(userFunc, inputValido);
    expect(prismaTxMock.timeEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          funcionarioId: "f1", jobLeaderId: "j", duracao: "8.00", status: "PENDENTE", mes: 8, ano: 2026,
        }),
      })
    );
  });

  it("rejeita funcionário sem job leader ativo", async () => {
    prismaMock.jobLeaderAssignment.findFirst.mockResolvedValue(null);
    await expect(createTimeEntry(userFunc, inputValido)).rejects.toThrow(ValidationError);
  });

  it("rejeita funcionário não alocado", async () => {
    prismaMock.allocation.findFirst.mockResolvedValue(null);
    await expect(createTimeEntry(userFunc, inputValido)).rejects.toThrow(ValidationError);
  });

  it("rejeita opção não permitida", async () => {
    prismaMock.userAllowedOption.findFirst.mockResolvedValue(null);
    await expect(createTimeEntry(userFunc, inputValido)).rejects.toThrow(ValidationError);
  });

  it("grava auditoria CRIAR na mesma transação", async () => {
    await createTimeEntry(userFunc, inputValido);
    expect(prismaTxMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ acao: "CRIAR", usuarioId: "f1" }) })
    );
  });
});

describe("updateTimeEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita FUNCIONARIO editando linha APROVADA", async () => {
    prismaMock.timeEntry.findFirst.mockResolvedValue({
      id: "t1", funcionarioId: "f1", status: "APROVADA", deletedAt: null,
      inicio: "09:00", fim: "17:00", duracao: "8.00" as unknown as Prisma.Decimal,
      costCenterId: "c1", disciplineId: "d1", locationId: "l1", projectId: "p1",
      data: new Date("2026-08-10"), horaExtra: false, descricao: null,
    });
    await expect(updateTimeEntry(userFunc, "t1", { descricao: "nova" })).rejects.toThrow(ValidationError);
  });

  it("rejeita FUNCIONARIO editando linha de outro usuário", async () => {
    prismaMock.timeEntry.findFirst.mockResolvedValue({
      id: "t1", funcionarioId: "f9", status: "PENDENTE", deletedAt: null,
      inicio: "09:00", fim: "17:00", duracao: "8.00" as unknown as Prisma.Decimal,
      costCenterId: "c1", disciplineId: "d1", locationId: "l1", projectId: "p1",
      data: new Date("2026-08-10"), horaExtra: false, descricao: null,
    });
    await expect(updateTimeEntry(userFunc, "t1", { descricao: "nova" })).rejects.toThrow(ForbiddenError);
  });

  it("rejeita JOB_LEADER editando linha fora do team", async () => {
    prismaMock.timeEntry.findFirst.mockResolvedValue({
      id: "t1", funcionarioId: "f9", status: "PENDENTE", deletedAt: null,
      inicio: "09:00", fim: "17:00", duracao: "8.00" as unknown as Prisma.Decimal,
      costCenterId: "c1", disciplineId: "d1", locationId: "l1", projectId: "p1",
      data: new Date("2026-08-10"), horaExtra: false, descricao: null,
    });
    await expect(updateTimeEntry(userJL, "t1", { descricao: "nova" })).rejects.toThrow(ForbiddenError);
  });

  it("quando inicio/fim mudam sem duracao, update NÃO inclui duracao", async () => {
    prismaMock.timeEntry.findFirst.mockResolvedValue({
      id: "t1", funcionarioId: "f1", status: "PENDENTE", deletedAt: null,
      inicio: "09:00", fim: "17:00", duracao: "8.00" as unknown as Prisma.Decimal,
      costCenterId: "c1", disciplineId: "d1", locationId: "l1", projectId: "p1",
      data: new Date("2026-08-10"), horaExtra: false, descricao: null,
    });
    prismaTxMock.timeEntry.update.mockResolvedValue({ id: "t1" });
    await updateTimeEntry(userFunc, "t1", { inicio: "08:00", fim: "16:00" });
    expect(prismaTxMock.timeEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ duracao: expect.anything() }),
      })
    );
  });

  it("quando costCenterId muda, revalida opções e inclui novo costCenterId no update", async () => {
    prismaMock.timeEntry.findFirst.mockResolvedValue({
      id: "t1", funcionarioId: "f1", status: "PENDENTE", deletedAt: null,
      inicio: "09:00", fim: "17:00", duracao: "8.00" as unknown as Prisma.Decimal,
      costCenterId: "c1", disciplineId: "d1", locationId: "l1", projectId: "p1",
      data: new Date("2026-08-10"), horaExtra: false, descricao: null,
    });
    prismaMock.costCenter.findFirst.mockResolvedValue({ id: "c2", ativo: true });
    prismaMock.userAllowedOption.findFirst.mockResolvedValue({ id: "o1" });
    prismaTxMock.timeEntry.update.mockResolvedValue({ id: "t1" });
    await updateTimeEntry(userFunc, "t1", { costCenterId: "c2" });
    expect(prismaMock.userAllowedOption.findFirst).toHaveBeenCalled();
    expect(prismaTxMock.timeEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ costCenterId: "c2" }) })
    );
  });

  it("grava auditoria EDITAR com antes e depois na transação", async () => {
    prismaMock.timeEntry.findFirst.mockResolvedValue({
      id: "t1", funcionarioId: "f1", status: "PENDENTE", deletedAt: null,
      inicio: "09:00", fim: "17:00", duracao: "8.00" as unknown as Prisma.Decimal,
      costCenterId: "c1", disciplineId: "d1", locationId: "l1", projectId: "p1",
      data: new Date("2026-08-10"), horaExtra: false, descricao: null,
    });
    prismaTxMock.timeEntry.update.mockResolvedValue({ id: "t1", descricao: "nova desc" });
    await updateTimeEntry(userFunc, "t1", { descricao: "nova desc" });
    expect(prismaTxMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ acao: "EDITAR", usuarioId: "f1" }),
      })
    );
  });
});

describe("approveTimeEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaTxMock.timeEntry.findUnique.mockResolvedValue({
      id: "t1", funcionarioId: "f1", status: "PENDENTE", deletedAt: null,
    });
    prismaTxMock.timeEntry.update.mockResolvedValue({ id: "t1", status: "APROVADA" });
  });

  it("aprova linha pendente do time", async () => {
    await approveTimeEntry(userJL, "t1");
    expect(prismaTxMock.timeEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "APROVADA" }) })
    );
  });

  it("bloqueia aprovar fora do time", async () => {
    prismaTxMock.timeEntry.findUnique.mockResolvedValue({
      id: "t1", funcionarioId: "f9", status: "PENDENTE", deletedAt: null,
    });
    await expect(approveTimeEntry(userJL, "t1")).rejects.toThrow(ForbiddenError);
  });

  it("bloqueia linha já aprovada (409)", async () => {
    prismaTxMock.timeEntry.findUnique.mockResolvedValue({
      id: "t1", funcionarioId: "f1", status: "APROVADA", deletedAt: null,
    });
    await expect(approveTimeEntry(userJL, "t1")).rejects.toThrow(ConflictError);
  });

  it("não encontra linha", async () => {
    prismaTxMock.timeEntry.findUnique.mockResolvedValue(null);
    await expect(approveTimeEntry(userJL, "t1")).rejects.toThrow(NotFoundError);
  });
});

describe("rejectTimeEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaTxMock.timeEntry.findUnique.mockResolvedValue({
      id: "t1", funcionarioId: "f1", status: "PENDENTE", deletedAt: null,
    });
    prismaTxMock.timeEntry.update.mockResolvedValue({ id: "t1", status: "REJEITADA" });
  });

  it("exige motivo", async () => {
    await expect(rejectTimeEntry(userJL, "t1", "  ")).rejects.toThrow(ValidationError);
  });

  it("rejeita com motivo e grava auditoria", async () => {
    await rejectTimeEntry(userJL, "t1", "Descrição incompleta");
    expect(prismaTxMock.timeEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "REJEITADA", motivoRejeicao: "Descrição incompleta" }) })
    );
    expect(prismaTxMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ acao: "REJEITAR", motivo: "Descrição incompleta" }) })
    );
  });
});

describe("resubmitTimeEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaTxMock.timeEntry.findUnique.mockResolvedValue({
      id: "t1", funcionarioId: "f1", status: "REJEITADA", deletedAt: null,
    });
    prismaTxMock.timeEntry.update.mockResolvedValue({ id: "t1", status: "PENDENTE" });
  });

  it("reenvia apenas linha rejeitada própria", async () => {
    await resubmitTimeEntry(userFunc, "t1");
    expect(prismaTxMock.timeEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PENDENTE" }) })
    );
  });

  it("bloqueia reenviar linha de outro usuário", async () => {
    prismaTxMock.timeEntry.findUnique.mockResolvedValue({
      id: "t1", funcionarioId: "f9", status: "REJEITADA", deletedAt: null,
    });
    await expect(resubmitTimeEntry(userFunc, "t1")).rejects.toThrow(ForbiddenError);
  });
});

describe("softDeleteTimeEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaTxMock.timeEntry.findUnique.mockResolvedValue({
      id: "t1", funcionarioId: "f1", status: "APROVADA", deletedAt: null,
    });
    prismaTxMock.timeEntry.update.mockResolvedValue({ id: "t1", deletedAt: new Date() });
  });

  it("somente admin remove", async () => {
    await expect(softDeleteTimeEntry(userFunc, "t1")).rejects.toThrow(ForbiddenError);
    await softDeleteTimeEntry(userAdmin, "t1");
    expect(prismaTxMock.timeEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) })
    );
  });
});
