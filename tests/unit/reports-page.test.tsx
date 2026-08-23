import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PeriodFilter } from "@/components/period-filter";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("PeriodFilter", () => {
  it("renderiza selects de mês e ano", () => {
    render(<PeriodFilter />);
    expect(screen.getByLabelText("Mês")).toBeInTheDocument();
    expect(screen.getByLabelText("Ano")).toBeInTheDocument();
  });
});
