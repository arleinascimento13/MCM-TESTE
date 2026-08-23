import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "PENDENTE" | "APROVADA" | "REJEITADA";

const config: Record<Status, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-warning/15 text-warning border-warning/30" },
  APROVADA: { label: "Aprovada", className: "bg-success/15 text-success border-success/30" },
  REJEITADA: { label: "Rejeitada", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = config[status] ?? { label: status, className: "" };
  return <Badge variant="outline" className={cn("font-medium", cfg.className)}>{cfg.label}</Badge>;
}
