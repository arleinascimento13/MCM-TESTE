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