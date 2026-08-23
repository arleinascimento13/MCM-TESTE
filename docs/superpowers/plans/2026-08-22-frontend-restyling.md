# Frontend Restyling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar o design system dos mockups de `docs/reference/` ao app existente via restyling token-first, sem mudar rotas, fluxos, dados ou APIs.

**Architecture:** Três camadas na ordem: (1) tokens CSS em `globals.css`, (2) shell (Sidebar com grupos/drawer mobile, PageHeader contextual por página), (3) primitives → feature components → páginas. Cada camada só consome a anterior.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4 (`@theme inline`), componentes shadcn-style sobre @base-ui/react, lucide-react, recharts, vitest + testing-library.

**Spec:** `docs/superpowers/specs/2026-08-22-frontend-restyling-design.md`

## Global Constraints

- Tema **light-only**: nenhum bloco dark mode (`prefers-color-scheme`, classe `.dark`) deve existir após o Task 1
- Valores de token EXATOS da spec: `--primary: #4f46e5`, `--primary-hover: #4338ca`, `--primary-subtle: #eef2ff`, `--background: #f9fafb`, `--card: #ffffff`, `--border: #e5e7eb`, `--input: #d1d5db`, `--ring: #818cf8`, `--success: #059669`, `--warning: #d97706`, `--destructive: #dc2626`, `--radius: 0.75rem`
- **Nenhuma dependência nova** (sem Plotly, sem FontAwesome — mantém lucide + recharts)
- Cores apenas via tokens/classes utilitárias semânticas — nada de hex hardcoded em feature components (charts usam `var(--token)` via SVG)
- Rotas, fluxos, schemas, endpoints e dados: intocados
- Sem sino de notificações, sem export CSV/Excel, sem tabs no admin, sem modal de novo apontamento
- Este repo usa um Next.js com possíveis breaking changes: se surgir dúvida sobre API de layouts/route groups durante execução, consultar `node_modules/next/dist/docs/` antes de improvisar
- Comandos: `npx vitest run <arquivo>` (teste único), `npm run test` (suíte), `npm run lint`, `npm run build` (inclui typecheck)

---

### Task 1: Tokens do tema (`globals.css`)

**Files:**
- Modify: `src/app/globals.css` (substituição completa — arquivo atual tem 53 linhas)

**Interfaces:**
- Produces: utilitários Tailwind `bg-*`, `text-*`, `border-*`, `ring-*` para todos os tokens; consumidos por todos os tasks seguintes

- [ ] **Step 1: Substituir o conteúdo integral de `src/app/globals.css` por:**

```css
@import "tailwindcss";

:root {
  --background: #f9fafb;
  --foreground: #1f2937;
  --card: #ffffff;
  --card-foreground: #1f2937;
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --primary-subtle: #eef2ff;
  --primary-foreground: #ffffff;
  --secondary: #f3f4f6;
  --secondary-foreground: #374151;
  --muted: #f3f4f6;
  --muted-foreground: #6b7280;
  --accent: #eef2ff;
  --accent-foreground: #3730a3;
  --border: #e5e7eb;
  --input: #d1d5db;
  --ring: #818cf8;
  --success: #059669;
  --warning: #d97706;
  --info: #0891b2;
  --destructive: #dc2626;
  --radius: 0.75rem;
  --font-sans: var(--font-inter);
  --font-mono: var(--font-jetbrains-mono);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-subtle: var(--primary-subtle);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-info: var(--info);
  --color-destructive: var(--destructive);
  --font-sans: var(--font-inter);
  --font-mono: var(--font-jetbrains-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), Arial, Helvetica, sans-serif;
}

code, pre, .font-mono {
  font-family: var(--font-mono), monospace;
}
```

- [ ] **Step 2: Verificar que não sobrou dark mode**

Run: `Select-String -Path src\app\globals.css -Pattern "dark|prefers-color-scheme"`
Expected: nenhuma ocorrência

- [ ] **Step 3: Build + suíte verdes**

Run: `npm run build; npm run test`
Expected: build OK, testes passam

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(theme): tokens indigo/light do design system da referencia"
```

---

### Task 2: Shell infra — SidebarProvider, trigger mobile, CommandPalette, PageHeader

**Files:**
- Create: `src/components/layout/sidebar-context.tsx`
- Create: `src/components/layout/mobile-sidebar-trigger.tsx`
- Create: `src/components/layout/page-header.tsx`
- Modify: `src/components/layout/command-palette.tsx` (reescrita completa)
- Test: `tests/unit/page-header.test.tsx`

**Interfaces:**
- Consumes: nada de tasks anteriores
- Produces: `SidebarProvider` / `useSidebar()` → `{ aberto: boolean; setAberto: (v: boolean) => void }`; `MobileSidebarTrigger`; `<PageHeader title subtitle? actions?>` — usados pelos Tasks 3, 4, 5, 10, 11

- [ ] **Step 1: Criar `src/components/layout/sidebar-context.tsx`:**

```tsx
"use client";

import { createContext, useContext, useState } from "react";

type SidebarContextValue = { aberto: boolean; setAberto: (aberto: boolean) => void };

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  return (
    <SidebarContext.Provider value={{ aberto, setAberto }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar deve ser usado dentro de SidebarProvider");
  return ctx;
}
```

- [ ] **Step 2: Criar `src/components/layout/mobile-sidebar-trigger.tsx`:**

```tsx
"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "./sidebar-context";

export function MobileSidebarTrigger() {
  const { setAberto } = useSidebar();
  return (
    <button
      type="button"
      aria-label="Abrir menu de navegação"
      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
      onClick={() => setAberto(true)}
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
```

- [ ] **Step 3: Criar `src/components/layout/page-header.tsx` (server component — sem "use client"):**

```tsx
import { CommandPalette } from "./command-palette";
import { MobileSidebarTrigger } from "./mobile-sidebar-trigger";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileSidebarTrigger />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-foreground">{title}</h1>
          {subtitle ? (
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {actions}
        <CommandPalette />
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Reescrever `src/components/layout/command-palette.tsx` (trigger vira botão de ícone):**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CommandPalette() {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setAberto((v) => !v);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Buscar página (Ctrl+K)"
        onClick={() => setAberto(true)}
      >
        <Search className="h-4 w-4" />
      </Button>
      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-24"
          onClick={() => setAberto(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card p-2 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              autoFocus
              aria-label="Buscar página"
              placeholder="Buscar página..."
              onKeyDown={(e) => {
                if (e.key === "Escape") setAberto(false);
                if (e.key === "Enter") {
                  router.push("/time-entries");
                  setAberto(false);
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 5: Criar teste `tests/unit/page-header.test.tsx`:**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/components/layout/page-header";
import { SidebarProvider } from "@/components/layout/sidebar-context";

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
```

- [ ] **Step 6: Rodar teste novo**

Run: `npx vitest run tests/unit/page-header.test.tsx`
Expected: PASS (3 testes)

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/sidebar-context.tsx src/components/layout/mobile-sidebar-trigger.tsx src/components/layout/page-header.tsx src/components/layout/command-palette.tsx tests/unit/page-header.test.tsx
git commit -m "feat(layout): PageHeader contextual, SidebarProvider e trigger mobile"
```

---

### Task 3: Sidebar reconstruída + wiring do `(app)/layout.tsx`

**Files:**
- Modify: `src/components/layout/sidebar.tsx` (reescrita completa)
- Modify: `src/app/(app)/layout.tsx` (reescrita completa)
- Delete: `src/components/layout/topbar.tsx`, `src/components/layout/user-menu.tsx`
- Test: `tests/unit/sidebar.test.tsx` (atualizar)

**Interfaces:**
- Consumes: `SidebarProvider`/`useSidebar` (Task 2); papel tipo `"ADMIN" | "JOB_LEADER" | "FUNCIONARIO"` (`src/lib/auth.ts` SessionUser)
- Produces: `<Sidebar user={{ nome: string; papel }} />`; tipo exportado `SidebarUser`

- [ ] **Step 1: Substituir o conteúdo de `tests/unit/sidebar.test.tsx` (teste falha primeiro):**

```tsx
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
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run tests/unit/sidebar.test.tsx`
Expected: FAIL (Sidebar não aceita prop `user`)

- [ ] **Step 3: Reescrever `src/components/layout/sidebar.tsx`:**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Clock,
  CheckSquare,
  BarChart3,
  History,
  Settings,
  Users,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

type Papel = "ADMIN" | "JOB_LEADER" | "FUNCIONARIO";

export type SidebarUser = { nome: string; papel: Papel };

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavSection = { titulo?: string; itens: NavItem[] };

const rotuloPapel: Record<Papel, string> = {
  ADMIN: "Admin",
  JOB_LEADER: "Job Leader",
  FUNCIONARIO: "Funcionário",
};

function secoesPara(papel: Papel): NavSection[] {
  const base: NavItem[] = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/time-entries", label: "Apontamentos", icon: Clock },
    ...(papel === "JOB_LEADER"
      ? [{ href: "/approvals", label: "Aprovações", icon: CheckSquare }]
      : []),
    { href: "/reports", label: "Relatórios", icon: BarChart3 },
    { href: "/audit", label: "Auditoria", icon: History },
  ];
  if (papel !== "ADMIN") return [{ itens: base }];
  return [
    { itens: base },
    {
      titulo: "Parametrização",
      itens: [
        { href: "/admin", label: "Cadastros", icon: Settings },
        { href: "/admin/usuarios", label: "Usuários & Permissões", icon: Users },
      ],
    },
  ];
}

function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function BrandHeader() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        M
      </div>
      <span className="text-lg font-bold text-foreground">MCM</span>
    </div>
  );
}

function NavList({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const { setAberto } = useSidebar();
  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        {secoesPara(user.papel).map((secao, i) => (
          <div key={secao.titulo ?? i}>
            {secao.titulo && (
              <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {secao.titulo}
              </p>
            )}
            {secao.itens.map((item) => {
              const ativo =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setAberto(false)}
                  className={cn(
                    "mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    ativo
                      ? "bg-primary-subtle text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-border p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary">
            {iniciais(user.nome)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{user.nome}</p>
            <p className="text-xs text-muted-foreground">{rotuloPapel[user.papel]}</p>
          </div>
          <button
            type="button"
            aria-label="Sair"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const { aberto, setAberto } = useSidebar();
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <BrandHeader />
        <NavList user={user} />
      </aside>

      {aberto && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAberto(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-card shadow-xl">
            <BrandHeader />
            <NavList user={user} />
          </aside>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Reescrever `src/app/(app)/layout.tsx`:**

```tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <Sidebar user={{ nome: user.nome, papel: user.papel }} />
      <div className="min-h-dvh lg:pl-64">{children}</div>
    </SidebarProvider>
  );
}
```

Nota: o padding de conteúdo sai do layout e passa a ser responsabilidade de cada página (`<main className="p-4 sm:p-6">`) — os Tasks 4 e 5 migram TODAS as páginas; execute-os antes de subir nada para ambiente visível.

- [ ] **Step 5: Deletar arquivos órfãos e conferir que não há imports pendentes**

```bash
git rm src/components/layout/topbar.tsx src/components/layout/user-menu.tsx
```

Run: `rg -n "topbar|user-menu|UserMenu|Topbar" src/`
Expected: nenhuma ocorrência

- [ ] **Step 6: Rodar suíte e lint**

Run: `npm run test`
Expected: sidebar tests PASS; demais PASS

Run: `npm run lint`
Expected: sem erros

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(shell): sidebar com grupos, identidade e drawer mobile"
```

---

### Task 4: Migração das páginas principais para PageHeader + main

Padrão único: remover `<h1>` local, importar `PageHeader`, envolver conteúdo em `<main className="p-4 sm:p-6">`. Estrutura final de toda página do grupo `(app)`: `<> <PageHeader/> <main>…</main> </>`.

**Files:**
- Modify: `src/app/(app)/page.tsx`
- Modify: `src/app/(app)/approvals/page.tsx`
- Modify: `src/app/(app)/time-entries/page.tsx`
- Modify: `src/app/(app)/reports/page.tsx`
- Modify: `src/app/(app)/audit/page.tsx`
- Modify: `src/app/(app)/admin/page.tsx`
- Modify: `src/app/(app)/time-entries/new/page.tsx`

**Interfaces:**
- Consumes: `PageHeader` (Task 2)
- Produces: estrutura padrão de página; Tasks 10/11 refinam `/` e `/approvals` mantendo-a

- [ ] **Step 1: `src/app/(app)/page.tsx`** — adicionar import:

```tsx
import { PageHeader } from "@/components/layout/page-header";
```

Substituir o `return (...)` atual por (conteúdo interno inalterado, só ganha wrapper):

```tsx
  return (
    <>
      <PageHeader title="Meus Apontamentos" subtitle="Acompanhe e registre suas horas trabalhadas" />
      <main className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Horas aprovadas" value={totalHoras.toFixed(2)} sub="Período total" />
          <KpiCard label="Projetos" value={String(porProjeto.length)} />
          <KpiCard label="Meses com apontamento" value={String(porPeriodo.length)} />
        </div>
        <ChartCard title="Horas por projeto">
          <ProjetoChart data={porProjeto} />
        </ChartCard>
        <ChartCard title="Horas por período">
          <PeriodChart data={porPeriodo} />
        </ChartCard>
      </main>
    </>
  );
```

- [ ] **Step 2: `src/app/(app)/approvals/page.tsx`** — adicionar import do `PageHeader` e substituir o `return (...)` (remove o `<h1>` antigo):

```tsx
  return (
    <>
      <PageHeader
        title="Aprovações da Equipe"
        subtitle="Revise e aprove os apontamentos de horas do seu time"
      />
      <main className="space-y-4 p-4 sm:p-6">
        <ApprovalsTable
          rows={rows}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
        />
      </main>
    </>
  );
```

- [ ] **Step 3: `src/app/(app)/time-entries/page.tsx`** — adicionar import do `PageHeader`; substituir o bloco `<div className="space-y-4">…</div>` inteiro do `return` por:

```tsx
  return (
    <>
      <PageHeader
        title="Apontamentos"
        subtitle="Consulte seus registros de horas"
        actions={
          <Link href="/time-entries/new">
            <Button>
              <Plus className="h-4 w-4" /> Novo apontamento
            </Button>
          </Link>
        }
      />
      <main className="p-4 sm:p-6">
        <Suspense fallback={<div>Carregando...</div>}>
          <TimeEntriesTable
            rows={rows}
            total={result.total}
            page={result.page}
            pageSize={result.pageSize}
          />
        </Suspense>
      </main>
    </>
  );
```

(`Link`, `Button`, `Plus` já estão importados no arquivo.)

- [ ] **Step 4: `src/app/(app)/reports/page.tsx`** — adicionar import do `PageHeader`; remover o trecho

```tsx
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <PeriodFilter />
      </div>
```

e reestruturar o retorno para:

```tsx
  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle="Horas por projeto, funcionário, centro de custo, disciplina e período"
        actions={<PeriodFilter />}
      />
      <main className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* os cinco ChartCard existentes permanecem exatamente como estão */}
        </div>
      </main>
    </>
  );
```

(Manter os cinco `<ChartCard>` existentes dentro da grid — nenhum conteúdo muda nesta task.)

- [ ] **Step 5: `src/app/(app)/audit/page.tsx`** — adicionar import do `PageHeader`; substituir `<h1 className="text-xl font-semibold">Auditoria</h1>` e o wrapper `<div className="space-y-4">` por:

```tsx
  return (
    <>
      <PageHeader title="Auditoria" subtitle="Registro histórico de ações no sistema" />
      <main className="p-4 sm:p-6">
        <Suspense fallback={<div>Carregando...</div>}>
          <AuditTable
            rows={rows}
            total={result.total}
            page={result.page}
            pageSize={result.pageSize}
          />
        </Suspense>
      </main>
    </>
  );
```

- [ ] **Step 6: `src/app/(app)/admin/page.tsx`** — substituir o arquivo inteiro por:

```tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

const links = [
  { href: "/admin/cost-centers", label: "Centros de custo" },
  { href: "/admin/disciplines", label: "Disciplinas" },
  { href: "/admin/locations", label: "Locais" },
  { href: "/admin/projects", label: "Projetos" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/vinculos", label: "Job leaders" },
  { href: "/admin/opcoes", label: "Opções permitidas" },
];

export default function AdminPage() {
  return (
    <>
      <PageHeader
        title="Cadastros"
        subtitle="Gerencie centros de custo, disciplinas, locais, projetos e alocações"
      />
      <main className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm font-medium">
                    {l.label}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Gerenciar {l.label.toLowerCase()}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 7: `src/app/(app)/time-entries/new/page.tsx`** — substituir o arquivo inteiro por:

```tsx
import { TimeEntryForm } from "@/components/time-entry-form";
import { PageHeader } from "@/components/layout/page-header";

export default function NewTimeEntryPage() {
  return (
    <>
      <PageHeader title="Novo Apontamento" subtitle="Registre as horas trabalhadas" />
      <main className="p-4 sm:p-6">
        <div className="mx-auto max-w-2xl">
          <TimeEntryForm />
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 8: Rodar suíte + build**

Run: `npm run test; npm run lint`
Expected: PASS sem erros

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(pages): estrutura PageHeader+main nas páginas principais"
```

---

### Task 5: Páginas admin restantes + ParamManager sem título duplicado

**Files:**
- Modify: `src/components/param-manager.tsx`
- Modify: `src/app/(app)/admin/cost-centers/page.tsx`
- Modify: `src/app/(app)/admin/disciplines/page.tsx`
- Modify: `src/app/(app)/admin/locations/page.tsx`
- Modify: `src/app/(app)/admin/projects/page.tsx`
- Modify: `src/app/(app)/admin/usuarios/page.tsx`
- Modify: `src/app/(app)/admin/vinculos/page.tsx`
- Modify: `src/app/(app)/admin/opcoes/page.tsx`
- Test: `tests/unit/param-manager.test.tsx` (ajustar se assertar o título)

**Interfaces:**
- Consumes: `PageHeader` (Task 2)
- Produces: `<ParamManager resource={string} />` — prop `title` REMOVIDA

- [ ] **Step 1: Em `src/components/param-manager.tsx`:**

1. Trocar a assinatura: `export function ParamManager({ resource }: { resource: string }) {`
2. Remover do JSX a linha `<h2 className="text-lg font-medium">{title}</h2>`

- [ ] **Step 2: As quatro páginas de ParamManager ganham o mesmo formato.** Exemplo completo para `cost-centers/page.tsx` (disciplines → título `"Disciplinas"`, locations → `"Locais"`, projects → `"Projetos"`; resource idem):

```tsx
import { ParamManager } from "@/components/param-manager";
import { PageHeader } from "@/components/layout/page-header";

export default function CostCentersPage() {
  return (
    <>
      <PageHeader title="Centros de custo" subtitle="Cadastre e gerencie os centros de custo" />
      <main className="p-4 sm:p-6">
        <ParamManager resource="cost-centers" />
      </main>
    </>
  );
}
```

- [ ] **Step 3: `usuarios/page.tsx`, `vinculos/page.tsx`, `opcoes/page.tsx`** (client components — transformação textual nos três):

1. Adicionar import: `import { PageHeader } from "@/components/layout/page-header";`
2. Localizar `return (\n    <div className="space-y-4">` e trocar por:

```tsx
  return (
    <>
      <PageHeader title="<TÍTULO>" subtitle="<SUBTÍTULO>" />
      <main className="space-y-4 p-4 sm:p-6">
```

3. Fechar no final do JSX do return: trocar o último

```tsx
      </Table>
    </div>
  );
```

por

```tsx
        </Table>
      </main>
    </>
  );
```

Títulos/subtítulos exatos:
- usuarios → `"Usuários & Permissões"` / `"Crie usuários e defina papéis"`
- vinculos → `"Job Leaders"` / `"Vincule funcionários aos seus job leaders"`
- opcoes → `"Opções Permitidas"` / `"Defina quais opções cada funcionário pode usar"`

(Indentação interna do corpo permanece; se o prettier/eslint reclamar, rode `npx eslint --fix <arquivo>`.)

- [ ] **Step 4: Ajustar `tests/unit/param-manager.test.tsx` se ele renderizar `title`**

Run: `npx vitest run tests/unit/param-manager.test.tsx`
Se falhar em props/título: remover a prop `title` da chamada no teste e qualquer assertion sobre o `<h2>`.

- [ ] **Step 5: Suíte completa + commit**

Run: `npm run test; npm run lint`
Expected: PASS

```bash
git add -A
git commit -m "feat(admin): PageHeader nas páginas de parametrização; ParamManager sem título próprio"
```

---

### Task 6: Primitives — card, table, button, input

**Files:**
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/table.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`

**Interfaces:**
- Consumes: tokens do Task 1
- Produces: visual da referência em TODAS as telas que usam esses primitives (admin incluído); sem mudança de API

- [ ] **Step 1: `card.tsx`** — no Card principal, trocar

```
ring-1 ring-foreground/10 [--card-spacing:--spacing(4)]
```

por

```
border border-border [--card-spacing:--spacing(5)]
```

(a string completa atual contém `...overflow-hidden rounded-xl bg-card py-(--card-spacing)... ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] ...` — apenas essas duas partes mudam; o restante da className permanece.)

- [ ] **Step 2: `table.tsx`** — trocar as classes base:

`TableHead` — de

```tsx
"h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0"
```

para

```tsx
"h-10 bg-muted/50 px-5 text-left align-middle text-xs font-semibold uppercase tracking-wide whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0"
```

`TableCell` — de

```tsx
"p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0"
```

para

```tsx
"px-5 py-3.5 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0"
```

- [ ] **Step 3: `button.tsx`** — no variant `default`, trocar `hover:bg-primary/80` por `hover:bg-primary-hover`.

- [ ] **Step 4: `input.tsx`** — na classe base, trocar `h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1` por `h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5`.

- [ ] **Step 5: Suíte + build**

Run: `npm run test; npm run build`
Expected: PASS (nenhum teste asserta classes desses primitives)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): primitives no padrao da referencia (borda de card, thead uppercase, alturas)"
```

---

### Task 7: DataTable v2 — card único, toolbar opcional, paginação numerada

**Files:**
- Modify: `src/components/data-table.tsx` (reescrita completa)
- Test: `tests/unit/data-table.test.tsx` (adicionar casos)

**Interfaces:**
- Consumes: tokens (Task 1)
- Produces: `<DataTable columns rows total page pageSize onPageChange toolbar?>`; `toolbar?: React.ReactNode` renderizado numa faixa superior; footer "Mostrando X–Y de Z" com paginação numerada (`aria-current="page"` na página ativa). Consumidores existentes (time-entries-table, approvals-table, audit-table) não precisam mudar nesta task.

- [ ] **Step 1: Adicionar ao final de `describe("DataTable")` em `tests/unit/data-table.test.tsx`:**

```tsx
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
```

- [ ] **Step 2: Rodar e confirmar falha nos dois novos testes**

Run: `npx vitest run tests/unit/data-table.test.tsx`
Expected: FAIL (toolbar não existe; footer antigo mostra "página X de Y")

- [ ] **Step 3: Reescrever `src/components/data-table.tsx`:**

```tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T extends { id: string }> = {
  columns: Column<T>[];
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  toolbar?: React.ReactNode;
};

function paginasVisiveis(page: number, totalPages: number): number[] {
  const inicio = Math.max(1, Math.min(page - 2, totalPages - 4));
  const fim = Math.min(totalPages, inicio + 4);
  const lista: number[] = [];
  for (let p = inicio; p <= fim; p++) lista.push(p);
  return lista;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  total,
  page,
  pageSize,
  onPageChange,
  toolbar,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const primeira = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const ultima = Math.min(total, page * pageSize);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {toolbar ? (
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          {toolbar}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.className}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3.5 text-xs text-muted-foreground">
        <span>
          Mostrando {primeira}–{ultima} de {total}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Página anterior"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {paginasVisiveis(page, totalPages).map((p) => (
            <button
              key={p}
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onPageChange(p)}
              className={cn(
                "h-7 w-7 rounded-lg border text-xs font-medium",
                p === page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              )}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            aria-label="Próxima página"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

Notas: removeu-se o `Button` importado (botões puros agora) e o scroll vertical com max-h (a tabela cresce dentro da página).

- [ ] **Step 4: Rodar testes do data-table e suíte**

Run: `npx vitest run tests/unit/data-table.test.tsx; npm run test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/data-table.tsx tests/unit/data-table.test.tsx
git commit -m "feat(data-table): card unico, toolbar opcional e paginacao numerada"
```

---

### Task 8: KpiCard com variantes + StatusBadge com dot

**Files:**
- Modify: `src/components/kpi-card.tsx` (reescrita completa)
- Modify: `src/components/status-badge.tsx` (reescrita completa)
- Test: `tests/unit/kpi-card.test.tsx` (novo)
- Test: `tests/unit/status-badge.test.tsx` (verificar; ajustar se necessário)

**Interfaces:**
- Consumes: tokens (Task 1); `LucideIcon` de lucide-react
- Produces: `<KpiCard label value sub? icon? tone? />` com `tone?: "primary" | "success" | "warning" | "destructive"` (default `"primary"`); `<StatusBadge status />` renderiza pílula com dot. Tasks 10/11 usam `icon`/`tone`

- [ ] **Step 1: Criar `tests/unit/kpi-card.test.tsx`:**

```tsx
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
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npx vitest run tests/unit/kpi-card.test.tsx`
Expected: FAIL (props `icon`/`tone` não existem)

- [ ] **Step 3: Reescrever `src/components/kpi-card.tsx`:**

```tsx
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const toneClasses = {
  primary: "bg-primary-subtle text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
} as const;

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          {Icon ? (
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                toneClasses[tone]
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
        </div>
        <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
        {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Reescrever `src/components/status-badge.tsx`:**

```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "PENDENTE" | "APROVADA" | "REJEITADA";

const config: Record<Status, { label: string; dotClass: string; badgeClass: string }> = {
  PENDENTE: {
    label: "Pendente",
    dotClass: "bg-warning",
    badgeClass: "bg-warning/15 text-warning border-warning/30",
  },
  APROVADA: {
    label: "Aprovada",
    dotClass: "bg-success",
    badgeClass: "bg-success/15 text-success border-success/30",
  },
  REJEITADA: {
    label: "Rejeitada",
    dotClass: "bg-destructive",
    badgeClass: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = config[status] ?? {
    label: status,
    dotClass: "bg-muted-foreground",
    badgeClass: "",
  };
  return (
    <Badge variant="outline" className={cn("gap-1.5 rounded-full font-medium", cfg.badgeClass)}>
      <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.dotClass)} />
      {cfg.label}
    </Badge>
  );
}
```

- [ ] **Step 5: Rodar testes dos dois componentes + suíte**

Run: `npx vitest run tests/unit/kpi-card.test.tsx tests/unit/status-badge.test.tsx`
Expected: PASS (se `status-badge.test.tsx` assertar estrutura exata da badge e falhar, ajustar assertion para continuar checando apenas texto/role — o comportamento visível não muda)

Run: `npm run test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/kpi-card.tsx src/components/status-badge.tsx tests/unit/kpi-card.test.tsx tests/unit/status-badge.test.tsx
git commit -m "feat(components): kpi-card com icone/tone e status-badge com dot"
```

---

### Task 9: Charts com tokens + ChartCard com hint

**Files:**
- Create: `src/components/chart-theme.ts`
- Modify: `src/components/bar-chart.tsx`
- Modify: `src/components/period-chart.tsx`
- Modify: `src/components/projeto-chart.tsx`
- Modify: `src/components/chart-card.tsx`

**Interfaces:**
- Consumes: tokens (Task 1) via `var(--token)` em atributos SVG do recharts
- Produces: `chartGrid`, `chartAxisTick`, `chartAxisStroke`, `chartTooltipStyle`, `chartPrimaryFill`; `<ChartCard title hint?>`

- [ ] **Step 1: Criar `src/components/chart-theme.ts`:**

```ts
export const chartGrid = { strokeDasharray: "3 3", stroke: "var(--border)" } as const;

export const chartAxisTick = { fontSize: 12, fill: "var(--muted-foreground)" } as const;

export const chartAxisStroke = "var(--muted-foreground)";

export const chartTooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--foreground)",
} as const;

export const chartPrimaryFill = "var(--primary)";
```

- [ ] **Step 2: Atualizar os três charts.** Em cada um dos arquivos (`bar-chart.tsx`, `period-chart.tsx`, `projeto-chart.tsx`):

Adicionar import:

```tsx
import {
  chartAxisStroke,
  chartAxisTick,
  chartGrid,
  chartPrimaryFill,
  chartTooltipStyle,
} from "./chart-theme";
```

E substituir, dentro do `<BarChart>`:

```tsx
<CartesianGrid strokeDasharray="3 3" stroke="#334155" />
```
por
```tsx
<CartesianGrid {...chartGrid} vertical={false} />
```

```tsx
<XAxis dataKey="…" tick={{ fontSize: 12 }} stroke="#64748b" />
```
por
```tsx
<XAxis dataKey="…" tick={chartAxisTick} stroke={chartAxisStroke} />
```
(idem no `<YAxis>`)

```tsx
<Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 6 }} />
```
por
```tsx
<Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
```

```tsx
<Bar dataKey="…" fill="#3b82f6" radius={[4, 4, 0, 0]} />
```
por
```tsx
<Bar dataKey="…" fill={chartPrimaryFill} radius={[4, 4, 0, 0]} />
```

- [ ] **Step 3: `chart-card.tsx`** — substituir o arquivo por:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Suíte + build**

Run: `npm run test; npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(charts): cores via tokens e ChartCard com hint de periodo"
```

---

### Task 10: Dashboard do funcionário — KPIs ricos + Ações necessárias

**Files:**
- Modify: `src/app/(app)/page.tsx` (reescrita completa)

**Interfaces:**
- Consumes: `PageHeader` (Task 2), `KpiCard` com icon/tone (Task 8), `ChartCard` (Task 9), `listTimeEntries(user, { status, pageSize })` de `@/services/time-entries` (existente; itens incluem `motivoRejeicao`, `data`, `id`)
- Produces: dashboard final conforme referência

- [ ] **Step 1: Substituir o arquivo inteiro `src/app/(app)/page.tsx`:**

```tsx
import Link from "next/link";
import { CalendarDays, CircleX, Clock, FolderKanban } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { ChartCard } from "@/components/chart-card";
import { ProjetoChart } from "@/components/projeto-chart";
import { PeriodChart } from "@/components/period-chart";
import { hoursByProject, hoursByPeriod } from "@/services/reports";
import { listTimeEntries } from "@/services/time-entries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [porProjeto, porPeriodo, rejeitadas] = await Promise.all([
    hoursByProject(user, {}),
    hoursByPeriod(user, {}),
    listTimeEntries(user, { status: "REJEITADA", pageSize: 5 }),
  ]);

  const totalHoras = porProjeto.reduce((acc, p) => acc + Number(p.totalHoras), 0);

  return (
    <>
      <PageHeader
        title="Meus Apontamentos"
        subtitle="Acompanhe e registre suas horas trabalhadas"
        actions={
          <Link href="/time-entries/new">
            <Button size="sm">
              <Clock className="h-4 w-4" /> Novo Apontamento
            </Button>
          </Link>
        }
      />
      <main className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Horas aprovadas"
            value={totalHoras.toFixed(2)}
            sub="Período total"
            icon={Clock}
            tone="primary"
          />
          <KpiCard
            label="Projetos"
            value={String(porProjeto.length)}
            sub="Com horas lançadas"
            icon={FolderKanban}
            tone="success"
          />
          <KpiCard
            label="Meses com apontamento"
            value={String(porPeriodo.length)}
            sub="Histórico"
            icon={CalendarDays}
            tone="warning"
          />
          <KpiCard
            label="Rejeitadas"
            value={String(rejeitadas.total)}
            sub="Requer edição"
            icon={CircleX}
            tone="destructive"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartCard title="Horas por projeto" hint="Período total">
              <ProjetoChart data={porProjeto} />
            </ChartCard>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Ações necessárias</h3>
            {rejeitadas.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum apontamento rejeitado. Tudo em ordem!
              </p>
            ) : (
              <ul className="space-y-3">
                {rejeitadas.items.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {new Date(r.data).toLocaleDateString("pt-BR")} — Rejeitada
                    </p>
                    {"motivoRejeicao" in r && r.motivoRejeicao ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Motivo: “{r.motivoRejeicao}”
                      </p>
                    ) : null}
                    <Link
                      href={`/time-entries/${r.id}`}
                      className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                    >
                      Editar e reenviar
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <ChartCard title="Horas por período" hint="Últimos meses">
          <PeriodChart data={porPeriodo} />
        </ChartCard>
      </main>
    </>
  );
}
```

Nota: `"motivoRejeicao" in r` protege o tipo caso o campo não exista no retorno — o `findMany` sem `select` retorna todos os escalares do modelo.

- [ ] **Step 2: Build + suíte**

Run: `npm run build; npm run test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/page.tsx
git commit -m "feat(dashboard): kpis ricos, acoes necessarias e grid da referencia"
```

---

### Task 11: Painel do Job Leader — KPIs + pendências por colaborador

**Files:**
- Modify: `src/app/(app)/approvals/page.tsx` (reescrita completa)
- Modify: `src/components/approval-drawer.tsx` (apenas classes dos botões)

**Interfaces:**
- Consumes: `PageHeader`, `KpiCard`, `ApprovalsTable`, `listTimeEntries(user, { status, pageSize })`
- Produces: painel JL final; desvio documentado da spec: gráfico semanal "aprovadas vs rejeitadas" vira "Horas por projeto" (agregação semanal não existe nos services e criar endpoint sairia do escopo restyling)

- [ ] **Step 1: Reescrever `src/components/approval-drawer.tsx` — apenas os dois botões de toggle trocam de estilo:**

O botão de aprovar:

```tsx
      <Button
        size="sm"
        onClick={() => setModo(modo === "aprovacao" ? null : "aprovacao")}
        className={modo === "aprovacao" ? "" : "bg-success text-white hover:bg-success/90"}
      >
        {modo === "aprovacao" ? "Cancelar" : "Aprovar"}
      </Button>
```

O botão de rejeitar:

```tsx
      <Button
        size="sm"
        variant="outline"
        onClick={() => setModo(modo === "rejeicao" ? null : "rejeicao")}
        className={modo === "rejeicao" ? "" : "border-destructive/30 text-destructive hover:bg-destructive/10"}
      >
        {modo === "rejeicao" ? "Cancelar" : "Rejeitar"}
      </Button>
```

(Resto do arquivo inalterado.)

- [ ] **Step 2: Substituir o arquivo inteiro `src/app/(app)/approvals/page.tsx`:**

```tsx
import { CheckCircle2, Clock, Hourglass, XCircle } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/kpi-card";
import { ChartCard } from "@/components/chart-card";
import { ProjetoChart } from "@/components/projeto-chart";
import { hoursByProject } from "@/services/reports";
import { listTimeEntries } from "@/services/time-entries";
import { ApprovalsTable } from "@/components/approvals-table";

export default async function ApprovalsPage() {
  const user = await getSessionUser();
  if (!user || user.papel !== "JOB_LEADER") return null;

  const [pendentes, aprovadas, rejeitadas, porProjeto] = await Promise.all([
    listTimeEntries(user, { status: "PENDENTE", pageSize: 200 }),
    listTimeEntries(user, { status: "APROVADA", pageSize: 1 }),
    listTimeEntries(user, { status: "REJEITADA", pageSize: 1 }),
    hoursByProject(user, {}),
  ]);

  const porColaborador = Object.entries(
    pendentes.items.reduce<Record<string, number>>((acc, r) => {
      acc[r.funcionario.nome] = (acc[r.funcionario.nome] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([nome, qtd]) => ({ nome, qtd }))
    .sort((a, b) => b.qtd - a.qtd);

  const rows = pendentes.items.map((r) => ({
    id: r.id,
    data: r.data.toISOString(),
    funcionarioNome: r.funcionario.nome,
    projectNome: r.project.nome,
    duracao: r.duracao.toString(),
    status: r.status,
  }));

  return (
    <>
      <PageHeader
        title="Aprovações da Equipe"
        subtitle="Revise e aprove os apontamentos de horas do seu time"
      />
      <main className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Pendentes"
            value={String(pendentes.total)}
            sub="Aguardando sua análise"
            icon={Hourglass}
            tone="warning"
          />
          <KpiCard
            label="Aprovadas no período"
            value={String(aprovadas.total)}
            sub="Do seu time"
            icon={CheckCircle2}
            tone="success"
          />
          <KpiCard
            label="Rejeitadas no período"
            value={String(rejeitadas.total)}
            sub="Corrigidas pelos funcionários"
            icon={XCircle}
            tone="destructive"
          />
          <KpiCard
            label="Horas por projeto"
            value={porProjeto.length > 0 ? String(porProjeto.length) : "0"}
            sub={`Projetos com horas (total ${pendentes.total} pendentes)`}
            icon={Clock}
            tone="primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChartCard title="Horas por projeto" hint="Período total">
              <ProjetoChart data={porProjeto} />
            </ChartCard>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Pendências por colaborador
            </h3>
            {porColaborador.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma pendência na fila.</p>
            ) : (
              <ul className="space-y-3">
                {porColaborador.map(({ nome, qtd }) => (
                  <li key={nome} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
                      {nome
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((parte) => parte[0]?.toUpperCase() ?? "")
                        .join("")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {nome}
                    </span>
                    <span className="text-xs font-semibold text-warning">{qtd}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            Fila de aprovação
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
              {pendentes.total} pendentes
            </span>
          </h2>
          <ApprovalsTable
            rows={rows}
            total={pendentes.total}
            page={pendentes.page}
            pageSize={pendentes.pageSize === 200 ? 25 : pendentes.pageSize}
          />
        </div>
      </main>
    </>
  );
}
```

Atenção ao trade-off documentado: carregamos até 200 pendentes para computar as pendências por colaborador; a tabela exibe a lista carregada. Se o time tiver mais de 200 pendências simultâneas, os números do breakdown ficam limitados — comportamento aceito nesta fase e anotado como melhoria futura (endpoint de agregação).

O `ApprovalsTable` recebe `pageSize` ajustado de volta para 25 para manter o rodapé coerente com a paginação visual. A prop `onPageChange` continua no-op dentro do `ApprovalsTable` (limitação pré-existente, fora do escopo).

- [ ] **Step 3: Suíte + build**

Run: `npm run test; npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(approvals): painel jl com kpis, pendencias por colaborador e fila destacada"
```

---

### Task 11.5: TimeEntryForm — reagrupamento visual + selects estilizados

Reordenação apenas de JSX (registro react-hook-form é por nome de campo, não por posição). Campos finais na ordem da referência: Data · Início/Fim · Mês/Ano competência · Projeto · Centro de custo/Disciplina · Local · Descrição · Hora extra.

**Files:**
- Modify: `src/components/time-entry-form.tsx`

**Interfaces:**
- Consumes: primitives (Tasks 1, 6)
- Produces: nenhum (form interno)

- [ ] **Step 1: Substituir TODO o bloco `return (...)` do formulário (a lógica acima dele permanece idêntica):**

```tsx
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="data">Data</Label>
          <Input id="data" type="date" {...register("data")} />
          {errors.data && <p className="text-sm text-destructive">{errors.data.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="projectId">Projeto</Label>
          <select id="projectId" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" {...register("projectId")}>
            <option value="">Selecione...</option>
            {opcoes.projects.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          {errors.projectId && <p className="text-sm text-destructive">{errors.projectId.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="inicio">Início</Label>
          <Input id="inicio" type="time" {...register("inicio")} />
          {errors.inicio && <p className="text-sm text-destructive">{errors.inicio.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="fim">Fim</Label>
          <Input id="fim" type="time" {...register("fim")} />
          {errors.fim && <p className="text-sm text-destructive">{errors.fim.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="mes">Mês (competência)</Label>
          <Input id="mes" type="number" {...register("mes", { valueAsNumber: true })} />
          {errors.mes && <p className="text-sm text-destructive">{errors.mes.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="ano">Ano (competência)</Label>
          <Input id="ano" type="number" {...register("ano", { valueAsNumber: true })} />
          {errors.ano && <p className="text-sm text-destructive">{errors.ano.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="costCenterId">Centro de custo</Label>
          <select id="costCenterId" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" {...register("costCenterId")}>
            <option value="">Selecione...</option>
            {opcoes.costCenters.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          {errors.costCenterId && <p className="text-sm text-destructive">{errors.costCenterId.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="disciplineId">Disciplina</Label>
          <select id="disciplineId" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" {...register("disciplineId")}>
            <option value="">Selecione...</option>
            {opcoes.disciplines.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
          {errors.disciplineId && <p className="text-sm text-destructive">{errors.disciplineId.message}</p>}
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="locationId">Local</Label>
          <select id="locationId" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" {...register("locationId")}>
            <option value="">Selecione...</option>
            {opcoes.locations.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
          {errors.locationId && <p className="text-sm text-destructive">{errors.locationId.message}</p>}
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" {...register("descricao")} />
          {errors.descricao && <p className="text-sm text-destructive">{errors.descricao.message}</p>}
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <Checkbox id="horaExtra" checked={watch("horaExtra")} onCheckedChange={(v) => setValue("horaExtra", !!v)} />
          <Label htmlFor="horaExtra">Hora extra (informativo)</Label>
        </div>
      </div>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar apontamento"}</Button>
    </form>
  );
```

- [ ] **Step 2: Build + suíte**

Run: `npm run build; npm run test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/time-entry-form.tsx
git commit -m "feat(form): reagrupamento visual e selects estilizados no time-entry-form"
```

---

### Task 12: Verificação final

**Files:** nenhum novo — varredura.

**Interfaces:** n/a

- [ ] **Step 1: Suíte completa, lint e build**

Run: `npm run test; npm run lint; npm run build`
Expected: tudo verde

- [ ] **Step 2: Varredura de cores hardcoded em feature components**

Run: `rg -n "#[0-9a-fA-F]{6}" src/components src/app --glob "!**/globals.css"`
Expected: nenhuma ocorrência fora de `globals.css`

Run: `rg -n "dark:" src/`
Expected: nenhuma ocorrência (light-only)

- [ ] **Step 3: Smoke visual manual (`npm run dev`) contra `docs/reference/`, checklist:**

- `/` logado como FUNCIONARIO: header com título/subtítulo + CTA Novo Apontamento; KPIs 4-col com chips de ícone; gráfico ⅔ + card Ações necessárias ⅓; tabela em card único com paginação numerada
- `/approvals` logado como JOB_LEADER: KPIs JL; card Pendências por colaborador com avatares de iniciais; botões Aprovar (verde)/Rejeitar (vermelho outline); badge "N pendentes" na fila
- `/admin` e `/admin/cost-centers` como ADMIN: sidebar com grupo Parametrização; thead uppercase; footer de paginação "Mostrando X–Y de Z"; linha inativa legível
- `/time-entries/new`: formulário alinhado, inputs h-9 com focus ring indigo
- `/login`: card centralizado branco sobre gray-50, botão primário indigo
- Viewport estreito (<lg): hamburger visível; drawer abre/fecha; grids colapsam para 2 colunas (KPIs) e 1 coluna (gráfico+card)

- [ ] **Step 4: Commit final se houver resíduos**

```bash
git add -A
git commit -m "chore: ajustes finais do restyling"
```

---

## Cobertura da spec (mapa spec → tasks)

| Seção da spec | Tasks |
|---|---|
| §3.1 Tokens | Task 1 |
| §3.2 Sidebar / PageHeader / Responsivo | Tasks 2, 3 |
| Páginas principais (estrutura PageHeader+main) | Tasks 4 |
| Admin pages + ParamManager | Task 5 |
| §3.3a Primitives | Task 6 |
| §3.4 DataTable/KPI/Badge | Tasks 7, 8 |
| Charts/ChartCard | Task 9 |
| `/` dashboard completo | Tasks 4, 10 |
| `/approvals` completo | Tasks 4, 11 |
| TimeEntryForm reagrupamento + selects | Task 11.5 |
| Login alinhado | herdado dos tokens (Task 1), sem mudanças de markup |
| §5 Verificação | Task 12 |

**Desvio documentado da spec (aprovado na origem):** gráfico semanal "aprovadas vs rejeitadas" do JL vira "Horas por projeto" — não existe agregação semanal nos services e criar endpoint sairia do escopo restyling.
