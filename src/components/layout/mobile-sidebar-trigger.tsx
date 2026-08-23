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