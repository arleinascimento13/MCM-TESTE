"use client";

import { CommandPalette } from "./command-palette";

export function Topbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background pl-60 pr-4">
      <CommandPalette />
    </header>
  );
}
