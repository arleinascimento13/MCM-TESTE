import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/status-badge";

describe("StatusBadge", () => {
  it("mostra Pendente", () => {
    render(<StatusBadge status="PENDENTE" />);
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });

  it("mostra Aprovada", () => {
    render(<StatusBadge status="APROVADA" />);
    expect(screen.getByText("Aprovada")).toBeInTheDocument();
  });

  it("mostra Rejeitada", () => {
    render(<StatusBadge status="REJEITADA" />);
    expect(screen.getByText("Rejeitada")).toBeInTheDocument();
  });
});
