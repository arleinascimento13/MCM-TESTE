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