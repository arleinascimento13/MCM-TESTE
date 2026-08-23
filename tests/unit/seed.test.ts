import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => {
  const mock = {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    costCenter: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    discipline: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    location: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    allocation: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    jobLeaderAssignment: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    userAllowedOption: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    timeEntry: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $disconnect: vi.fn(),
  };
  return { prismaMock: mock };
});

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { seed } from "../../prisma/seed";

describe("seed", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cria admin se não existir", async () => {
    // All findFirst calls return null → all creates run
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "admin-id" });
    prismaMock.project.findFirst.mockResolvedValue(null);
    prismaMock.project.create.mockResolvedValue({ id: "p1" });
    prismaMock.costCenter.findFirst.mockResolvedValue(null);
    prismaMock.costCenter.create.mockResolvedValue({ id: "cc1" });
    prismaMock.discipline.findFirst.mockResolvedValue(null);
    prismaMock.discipline.create.mockResolvedValue({ id: "d1" });
    prismaMock.location.findFirst.mockResolvedValue(null);
    prismaMock.location.create.mockResolvedValue({ id: "l1" });
    prismaMock.allocation.findFirst.mockResolvedValue(null);
    prismaMock.allocation.create.mockResolvedValue({ id: "alloc1" });
    prismaMock.jobLeaderAssignment.findFirst.mockResolvedValue(null);
    prismaMock.jobLeaderAssignment.create.mockResolvedValue({ id: "jla1" });
    prismaMock.userAllowedOption.findFirst.mockResolvedValue(null);
    prismaMock.userAllowedOption.create.mockResolvedValue({ id: "uao1" });
    prismaMock.timeEntry.findFirst.mockResolvedValue(null);
    prismaMock.timeEntry.create.mockResolvedValue({ id: "te1" });
    prismaMock.auditLog.findFirst.mockResolvedValue(null);
    prismaMock.auditLog.create.mockResolvedValue({ id: "al1" });

    await seed();

    // Core assertion: admin user.create was called with papel ADMIN
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ papel: "ADMIN" }),
      }),
    );
  });
});
