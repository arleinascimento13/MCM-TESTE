import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => {
  const model = {
    findMany: vi.fn(), create: vi.fn(), update: vi.fn(),
  };
  const prismaMock = {
    costCenter: model, discipline: model, location: model, project: model,
    allocation: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    userAllowedOption: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    jobLeaderAssignment: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
  };
  return { prismaMock };
});
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { deactivateParam, createParam } from "@/services/params";
import { createAssignment } from "@/services/users";

describe("params", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cria parâmetro", async () => {
    prismaMock.costCenter.create.mockResolvedValue({ id: "x", nome: "Engenharia", ativo: true });
    const r = await createParam("costCenter", { nome: "Engenharia" });
    expect(prismaMock.costCenter.create).toHaveBeenCalledWith({ data: { nome: "Engenharia" } });
    expect(r.nome).toBe("Engenharia");
  });

  it("desativa em vez de deletar", async () => {
    prismaMock.costCenter.update.mockResolvedValue({ id: "x", ativo: false });
    await deactivateParam("costCenter", "x");
    expect(prismaMock.costCenter.update).toHaveBeenCalledWith({
      where: { id: "x" },
      data: { ativo: false },
    });
  });

  it("cria vínculo desativando o anterior", async () => {
    prismaMock.jobLeaderAssignment.findFirst.mockResolvedValue({ id: "v1", ativo: true });
    prismaMock.jobLeaderAssignment.create.mockResolvedValue({ id: "v2" });
    await createAssignment("f1", "j1");
    expect(prismaMock.jobLeaderAssignment.update).toHaveBeenCalledWith({
      where: { id: "v1" }, data: { ativo: false },
    });
    expect(prismaMock.jobLeaderAssignment.create).toHaveBeenCalledWith({
      data: { funcionarioId: "f1", jobLeaderId: "j1", ativo: true },
    });
  });
});
