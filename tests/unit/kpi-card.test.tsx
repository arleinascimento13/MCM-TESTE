import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Clock } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";

describe("KpiCard", () => {
  it("renderiza label, valor e sub", () => {
    render(<KpiCard label="Horas no mês" value="148h30" sub="Meta: 176h" />);
    expect(screen.getByText("Horas no mês")).toBeInTheDocument();
    expect(screen.getByText("148h30")).toBeInTheDocument();
    expect(screen.getByText("Meta: 176h")).toBeInTheDocument();
  });

  it("renderiza chip de ícone quando icon é passado", () => {
    const { container } = render(<KpiCard label="Pendentes" value="4" icon={Clock} tone="warning" />);
    // o chip é um container flex com o svg do lucide dentro
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("não renderiza chip sem icon", () => {
    const { container } = render(<KpiCard label="Projetos" value="12" />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});
