import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/time-entries",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));

function renderSidebar(papel: "ADMIN" | "JOB_LEADER" | "FUNCIONARIO", nome = "Rafael Souza") {
  return render(
    <SidebarProvider>
      <Sidebar user={{ nome, papel }} />
    </SidebarProvider>
  );
}

describe("Sidebar", () => {
  it("exibe navegação base para funcionário, sem itens restritos", () => {
    renderSidebar("FUNCIONARIO");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Apontamentos")).toBeInTheDocument();
    expect(screen.queryByText("Aprovações")).not.toBeInTheDocument();
    expect(screen.queryByText("Cadastros")).not.toBeInTheDocument();
  });

  it("exibe grupo Parametrização para admin", () => {
    renderSidebar("ADMIN");
    expect(screen.getByText("Parametrização")).toBeInTheDocument();
    expect(screen.getByText("Cadastros")).toBeInTheDocument();
    expect(screen.getByText("Usuários & Permissões")).toBeInTheDocument();
  });

  it("exibe Aprovações para job leader", () => {
    renderSidebar("JOB_LEADER");
    expect(screen.getByText("Aprovações")).toBeInTheDocument();
  });

  it("exibe identidade do usuário no rodapé", () => {
    renderSidebar("FUNCIONARIO", "Rafael Souza");
    expect(screen.getByText("Rafael Souza")).toBeInTheDocument();
    expect(screen.getByText("Funcionário")).toBeInTheDocument();
    expect(screen.getByLabelText("Sair")).toBeInTheDocument();
  });
});
