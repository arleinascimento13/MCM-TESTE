import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindUnique, mockBcrypt } = vi.hoisted(() => {
  return {
    mockFindUnique: vi.fn(),
    mockBcrypt: {
      compare: vi.fn((password: string) => Promise.resolve(password === "certa")),
      hash: vi.fn().mockResolvedValue("$2a$10$fakehash"),
    },
  };
});

vi.mock("bcryptjs", () => ({
  default: mockBcrypt,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
    },
  },
}));

vi.mock("@/lib/auth", () => ({ getSessionUser: vi.fn() }));

import { authorize } from "@/auth";

describe("authorize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBcrypt.compare.mockImplementation((password: string) => Promise.resolve(password === "certa"));
  });

  it("retorna null se usuário não existe", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await authorize({ email: "x@x.com", password: "123456" });
    expect(result).toBeNull();
  });

  it("retorna null se senha incorreta", async () => {
    mockFindUnique.mockResolvedValue({
      id: "u1", nome: "Ana", email: "ana@mcm.local", senhaHash: "hash", papel: "FUNCIONARIO", ativo: true,
    });
    const result = await authorize({ email: "ana@mcm.local", password: "errada" });
    expect(result).toBeNull();
  });

  it("retorna usuário se senha correta e ativo", async () => {
    mockFindUnique.mockResolvedValue({
      id: "u1", nome: "Ana", email: "ana@mcm.local", senhaHash: "hash", papel: "FUNCIONARIO", ativo: true,
    });
    const result = await authorize({ email: "ana@mcm.local", password: "certa" });
    expect(result).toEqual({ id: "u1", nome: "Ana", email: "ana@mcm.local", papel: "FUNCIONARIO" });
  });

  it("retorna null se usuário inativo", async () => {
    mockFindUnique.mockResolvedValue({
      id: "u1", nome: "Ana", email: "ana@mcm.local", senhaHash: "hash", papel: "FUNCIONARIO", ativo: false,
    });
    const result = await authorize({ email: "ana@mcm.local", password: "certa" });
    expect(result).toBeNull();
  });
});
