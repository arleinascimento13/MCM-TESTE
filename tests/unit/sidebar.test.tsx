import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/time-entries",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));

describe("Sidebar", () => {
  it("exibe navegação para funcionário", () => {
    render(<Sidebar papel="FUNCIONARIO" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Apontamentos")).toBeInTheDocument();
    expect(screen.queryByText("Aprovações")).not.toBeInTheDocument();
    expect(screen.queryByText("Administração")).not.toBeInTheDocument();
  });

  it("exibe navegação de admin", () => {
    render(<Sidebar papel="ADMIN" />);
    expect(screen.getByText("Administração")).toBeInTheDocument();
  });

  it("exibe navegação de job leader", () => {
    render(<Sidebar papel="JOB_LEADER" />);
    expect(screen.getByText("Aprovações")).toBeInTheDocument();
  });
});
