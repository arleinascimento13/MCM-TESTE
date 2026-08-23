import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { Mock } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
  getSessionUser: vi.fn(),
}));
vi.mock("@/services/scope", () => ({
  getTeamMemberIds: vi.fn().mockResolvedValue(["f1"]),
  scopeFilter: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/services/permissions", () => ({ checkPermission: vi.fn() }));
vi.mock("@/services/audit", () => ({ logAudit: vi.fn() }));

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    jobLeaderAssignment: { findFirst: vi.fn(), findMany: vi.fn() },
    allocation: { findFirst: vi.fn() },
    userAllowedOption: { findFirst: vi.fn() },
    costCenter: { findFirst: vi.fn() },
    discipline: { findFirst: vi.fn() },
    location: { findFirst: vi.fn() },
    project: { findFirst: vi.fn() },
    timeEntry: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn((fn) => fn(prismaMock)),
  };
  return { prismaMock };
});
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { requireUser } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";
import { POST, GET } from "@/app/api/time-entries/route";

// Cast to Mock so TypeScript recognizes mock methods
const requireUserMock = requireUser as Mock<() => Promise<unknown>>;

const userAdmin = { id: "a", nome: "A", email: "a@mcm.local", papel: "ADMIN" as const };

describe("POST /api/time-entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue(userAdmin);
    prismaMock.jobLeaderAssignment.findFirst.mockResolvedValue({ id: "v1", jobLeaderId: "j" });
    prismaMock.allocation.findFirst.mockResolvedValue({ id: "al1" });
    prismaMock.userAllowedOption.findFirst.mockResolvedValue({ id: "o1" });
    prismaMock.costCenter.findFirst.mockResolvedValue({ id: "c1", ativo: true });
    prismaMock.discipline.findFirst.mockResolvedValue({ id: "d1", ativo: true });
    prismaMock.location.findFirst.mockResolvedValue({ id: "l1", ativo: true });
    prismaMock.project.findFirst.mockResolvedValue({ id: "p1", ativo: true });
  });

  it("retorna 201 ao criar", async () => {
    prismaMock.timeEntry.create.mockResolvedValue({ id: "t1" });
    const req = new NextRequest("http://localhost/api/time-entries", {
      method: "POST",
      body: JSON.stringify({
        projectId: "00000000-0000-4000-8000-000000000001",
        data: "2026-08-10", mes: 8, ano: 2026,
        inicio: "09:00", fim: "17:00",
        costCenterId: "00000000-0000-4000-8000-000000000002",
        disciplineId: "00000000-0000-4000-8000-000000000003",
        locationId: "00000000-0000-4000-8000-000000000004",
        horaExtra: false,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toEqual({ id: "t1" });
  });

  it("retorna 401 sem usuário", async () => {
    requireUserMock.mockRejectedValue(new UnauthorizedError());
    const req = new NextRequest("http://localhost/api/time-entries", { method: "POST", body: "{}" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 com corpo inválido", async () => {
    const req = new NextRequest("http://localhost/api/time-entries", { method: "POST", body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/time-entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue(userAdmin);
    prismaMock.timeEntry.findMany.mockResolvedValue([]);
    prismaMock.timeEntry.count.mockResolvedValue(0);
  });

  it("retorna lista paginada", async () => {
    const req = new NextRequest("http://localhost/api/time-entries?page=1&pageSize=25");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual({ items: [], total: 0, page: 1, pageSize: 25 });
  });
});
