import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ParamManager } from "@/components/param-manager";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

global.fetch = vi.fn();
const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;

describe("ParamManager", () => {
  beforeEach(() => { mockFetch.mockReset(); });
  it("lista itens e permite criar", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: "1", nome: "Engenharia", ativo: true }] }) });
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: "2", nome: "Financeiro", ativo: true } }) });
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: "1", nome: "Engenharia", ativo: true }, { id: "2", nome: "Financeiro", ativo: true }] }) });

    render(<ParamManager resource="cost-centers" title="Centros de custo" />);
    expect(await screen.findByText("Engenharia")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Novo nome"), { target: { value: "Financeiro" } });
    fireEvent.click(screen.getByText("Adicionar"));
    expect(await screen.findByText("Financeiro")).toBeInTheDocument();
  });
});
