import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable } from "@/components/data-table";

const columns = [
  { key: "data", header: "Data" },
  { key: "duracao", header: "Duração" },
];

const rows = [{ id: "1", data: "2026-08-10", duracao: "8.00" }];

describe("DataTable", () => {
  it("renderiza cabeçalhos e linhas", () => {
    render(<DataTable columns={columns} rows={rows} total={1} page={1} pageSize={25} onPageChange={vi.fn()} />);
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Duração")).toBeInTheDocument();
    expect(screen.getByText("2026-08-10")).toBeInTheDocument();
  });

  it("mostra empty state quando não há linhas", () => {
    render(<DataTable columns={columns} rows={[]} total={0} page={1} pageSize={25} onPageChange={vi.fn()} />);
    expect(screen.getByText("Nenhum registro encontrado")).toBeInTheDocument();
  });

  it("renderiza toolbar quando fornecida", () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        total={1}
        page={1}
        pageSize={25}
        onPageChange={vi.fn()}
        toolbar={<span>Barra de ferramentas</span>}
      />
    );
    expect(screen.getByText("Barra de ferramentas")).toBeInTheDocument();
  });

  it("paginação numerada marca a página atual", () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        total={120}
        page={2}
        pageSize={25}
        onPageChange={vi.fn()}
      />
    );
    const atual = screen.getByRole("button", { name: "2" });
    expect(atual).toHaveAttribute("aria-current", "page");
    for (const n of ["1", "3", "4", "5"]) {
      expect(screen.getByRole("button", { name: n })).not.toHaveAttribute("aria-current");
    }
    expect(screen.getByText(/Mostrando 26–50 de 120/)).toBeInTheDocument();
  });
});
