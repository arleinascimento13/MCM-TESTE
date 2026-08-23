import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/components/layout/page-header";
import { SidebarProvider } from "@/components/layout/sidebar-context";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("PageHeader", () => {
  it("renderiza título e subtítulo", () => {
    render(
      <SidebarProvider>
        <PageHeader title="Meus Apontamentos" subtitle="Acompanhe suas horas" />
      </SidebarProvider>
    );
    expect(screen.getByText("Meus Apontamentos")).toBeInTheDocument();
    expect(screen.getByText("Acompanhe suas horas")).toBeInTheDocument();
  });

  it("renderiza ações no slot direito", () => {
    render(
      <SidebarProvider>
        <PageHeader title="Título" actions={<span>Filtro de período</span>} />
      </SidebarProvider>
    );
    expect(screen.getByText("Filtro de período")).toBeInTheDocument();
  });

  it("não renderiza subtítulo quando ausente", () => {
    render(
      <SidebarProvider>
        <PageHeader title="Só título" />
      </SidebarProvider>
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Só título");
  });
});