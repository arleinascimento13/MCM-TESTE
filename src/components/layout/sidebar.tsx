"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, CheckSquare, BarChart3, ScrollText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

type Papel = "ADMIN" | "JOB_LEADER" | "FUNCIONARIO";

const itensBase = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/time-entries", label: "Apontamentos", icon: Clock },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/audit", label: "Auditoria", icon: ScrollText },
];

export function Sidebar({ papel }: { papel: Papel }) {
  const pathname = usePathname();
  const itens = [
    ...itensBase,
    ...(papel === "JOB_LEADER" ? [{ href: "/approvals", label: "Aprovações", icon: CheckSquare }] : []),
    ...(papel === "ADMIN" ? [{ href: "/admin", label: "Administração", icon: Settings }] : []),
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-background">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-sm font-semibold">MCM — Horas</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {itens.map((item) => {
          const ativo = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors",
                ativo ? "border-l-[3px] border-primary bg-muted text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <UserMenu />
      </div>
    </aside>
  );
}
