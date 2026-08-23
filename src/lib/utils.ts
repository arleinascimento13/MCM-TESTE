import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildQueryString(params: Record<string, string | number | null | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  ) as [string, string | number][];
  return new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export function formatAcao(acao: string): string {
  const mapa: Record<string, string> = {
    CRIAR: "Criação",
    EDITAR: "Edição",
    APROVAR: "Aprovação",
    REJEITAR: "Rejeição",
    REENVIAR: "Reenvio",
    REMOVER: "Remoção",
  };
  return mapa[acao] ?? acao;
}

export function formatDateTime(iso: Date | string): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
