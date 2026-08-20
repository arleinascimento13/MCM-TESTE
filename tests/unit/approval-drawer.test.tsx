import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ApprovalDrawer } from "@/components/approval-drawer";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

global.fetch = vi.fn();
const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;

describe("ApprovalDrawer", () => {
  it("exige motivo para rejeitar", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });
    render(<ApprovalDrawer entryId="t1" />);
    fireEvent.click(screen.getByText("Rejeitar"));
    fireEvent.click(screen.getByText("Confirmar"));
    expect(await screen.findByText("Motivo da rejeição é obrigatório")).toBeInTheDocument();
  });
});
