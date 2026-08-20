import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  timeEntry: { groupBy: vi.fn() },
  project: { findMany: vi.fn() },
  user: { findMany: vi.fn() },
  costCenter: { findMany: vi.fn() },
  discipline: { findMany: vi.fn() },
  auditLog: { findMany: vi.fn(), count: vi.fn() },
  jobLeaderAssignment: { findMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/services/scope", () => ({
  getTeamMemberIds: vi.fn().mockResolvedValue(["f1", "f2"]),
  scopeFilter: vi.fn().mockImplementation((user: { papel: string }) =>
    user.papel === "ADMIN" ? Promise.resolve({}) : Promise.resolve({ funcionarioId: { in: ["f1", "f2"] } })
  ),
}));

import { hoursByProject, listAuditLog } from "@/services/reports";
import { scopeFilter } from "@/services/scope";

const userAdmin = { id: "a", nome: "A", email: "a@mcm.local", papel: "ADMIN" as const };
const userJL = { id: "j", nome: "J", email: "j@mcm.local", papel: "JOB_LEADER" as const };
const userFunc = { id: "f", nome: "F", email: "f@mcm.local", papel: "FUNCIONARIO" as const };

describe("hoursByProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("agrega por projeto apenas aprovadas", async () => {
    prismaMock.timeEntry.groupBy.mockResolvedValue([
      { projectId: "p1", _sum: { duracao: 10.5 } },
      { projectId: "p2", _sum: { duracao: 4.25 } },
    ]);
    prismaMock.project.findMany.mockResolvedValue([
      { id: "p1", nome: "Projeto A" }, { id: "p2", nome: "Projeto B" },
    ]);
    const result = await hoursByProject(userAdmin, {});
    expect(prismaMock.timeEntry.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["projectId"],
        where: expect.objectContaining({ status: "APROVADA", deletedAt: null }),
        _sum: { duracao: true },
      })
    );
    expect(result).toHaveLength(2);
  });

  it("job leader obtém filtro de escopo", async () => {
    prismaMock.timeEntry.groupBy.mockResolvedValue([]);
    prismaMock.project.findMany.mockResolvedValue([]);
    await hoursByProject(userJL, {});
    expect(prismaMock.timeEntry.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ funcionarioId: { in: ["f1", "f2"] } }),
      })
    );
  });
});

describe("listAuditLog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filtra pelo escopo via relação timeEntry", async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([]);
    prismaMock.auditLog.count.mockResolvedValue(0);
    const result = await listAuditLog(userAdmin, {});
    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 50 });
  });

  it("funcionário obtém filtro por próprio id", async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([]);
    prismaMock.auditLog.count.mockResolvedValue(0);
    vi.mocked(scopeFilter).mockResolvedValueOnce({ funcionarioId: "f" });
    const result = await listAuditLog(userFunc, { page: 1, pageSize: 50 });
    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          timeEntry: expect.objectContaining({ funcionarioId: "f" }),
        }),
      })
    );
  });
});
