"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

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

  if (!aberto) return <Search className="h-4 w-4 text-muted-foreground" />;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24" onClick={() => setAberto(false)}>
      <div className="w-full max-w-md rounded-md border border-border bg-background p-2" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="w-full rounded-sm border border-border bg-muted px-3 py-2 text-sm outline-none"
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
  );
}
