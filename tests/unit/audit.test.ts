import { describe, it, expect } from "vitest";
import { formatAcao } from "@/lib/utils";

describe("formatAcao", () => {
  it("traduz ações para português", () => {
    expect(formatAcao("CRIAR")).toBe("Criação");
    expect(formatAcao("EDITAR")).toBe("Edição");
    expect(formatAcao("APROVAR")).toBe("Aprovação");
    expect(formatAcao("REJEITAR")).toBe("Rejeição");
    expect(formatAcao("REENVIAR")).toBe("Reenvio");
    expect(formatAcao("REMOVER")).toBe("Remoção");
  });
});
