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