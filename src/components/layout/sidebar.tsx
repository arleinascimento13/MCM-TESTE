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
