import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  jobLeaderAssignment: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { getTeamMemberIds, scopeFilter } from "@/services/scope";

const userAdmin = { id: "a", nome: "A", email: "a@mcm.local", papel: "ADMIN" as const };
const userJL = { id: "j", nome: "J", email: "j@mcm.local", papel: "JOB_LEADER" as const };
const userFunc = { id: "f", nome: "F", email: "f@mcm.local", papel: "FUNCIONARIO" as const };

describe("scope", () => {
  beforeEach(() => vi.clearAllMocks());

  it("admin não tem filtro", async () => {
    expect(await scopeFilter(userAdmin)).toEqual({});
  });

  it("funcionário filtra por si mesmo", async () => {
    expect(await scopeFilter(userFunc)).toEqual({ funcionarioId: "f" });
  });

  it("job leader filtra pelo time ativo", async () => {
    prismaMock.jobLeaderAssignment.findMany.mockResolvedValue([
      { funcionarioId: "f1" }, { funcionarioId: "f2" },
    ]);
    const filtro = await scopeFilter(userJL);
    expect(filtro).toEqual({ funcionarioId: { in: ["f1", "f2"] } });
  });

  it("getTeamMemberIds retorna ids", async () => {
    prismaMock.jobLeaderAssignment.findMany.mockResolvedValue([
      { funcionarioId: "f1" }, { funcionarioId: "f2" },
    ]);
    expect(await getTeamMemberIds("j")).toEqual(["f1", "f2"]);
  });
});
