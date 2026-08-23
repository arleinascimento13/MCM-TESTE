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
