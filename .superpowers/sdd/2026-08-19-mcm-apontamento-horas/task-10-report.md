# Task 10 Report

## Status: DONE

## What was done

**Step 1 — Test file created** (`tests/unit/sidebar.test.tsx`):
- Verbatim from plan (3 cases: FUNCIONARIO sees Dashboard/Apontamentos but not Aprovações/Administração; ADMIN sees Administração; JOB_LEADER sees Aprovações)
- Added `vi.mock("next-auth/react", () => ({ signOut: vi.fn() }))` per Controller Ruling #6 (UserMenu imports signOut)

**Step 2 — Test failed as expected**:
- `npm test -- tests/unit/sidebar.test.tsx` → FAIL: "Failed to resolve import `@/components/layout/sidebar`"

**Step 3 — Ran shadcn add**:
- `npx shadcn@latest add select textarea badge table dropdown-menu dialog drawer checkbox skeleton avatar tooltip command --yes`
- Added 13 new UI components in `src/components/ui/`: select, textarea, badge, table, dropdown-menu, dialog, drawer, checkbox, skeleton, avatar, tooltip, command, input-group

**Step 4 — Added semantic colors to `src/app/globals.css`**:
- Added `--success: #22c55e;`, `--warning: #f59e0b;`, `--info: #06b6d4;`, `--destructive: #ef4444;` to `:root` block
- Registered in `@theme inline` as `--color-success: var(--success);`, `--color-warning: var(--warning);`, `--color-info: var(--info);`, `--color-destructive: var(--destructive);`
- Also added to `.dark` block (via media query) — note: since this is dark-first per DESIGN.md, the dark values are same as light

**Step 5 — Created layout components** (verbatim from plan):
- `src/components/layout/sidebar.tsx`: Fixed w-60 sidebar with role-based nav (pt-BR labels, Lucide icons, py-2 text-sm rows)
- `src/components/layout/user-menu.tsx`: SignOut button using next-auth/react
- `src/components/layout/topbar.tsx`: Fixed header with pl-60 offset
- `src/components/layout/command-palette.tsx`: Cmd+K triggered search overlay
- `src/app/(app)/layout.tsx`: Server component with getSessionUser + redirect("/login"), wraps Sidebar + Topbar + main content

**Step 6 — Tests passed**: 3 passed (FUNCIONARIO, ADMIN, JOB_LEADER navigation)

**Step 7 — Build passed**: TypeScript clean, static pages generated

**Step 8 — Commit**: `git commit -m "feat: add app shell and login"`

## Commands

| Command | Result |
|---------|--------|
| `npm test -- tests/unit/sidebar.test.tsx` (first) | FAIL — module not found ✓ |
| `npx shadcn@latest add select textarea badge table...` | 13 components added ✓ |
| `npm test -- tests/unit/sidebar.test.tsx` (second) | PASS — 3/3 tests ✓ |
| `npm run build` | PASS — TypeScript + static pages clean ✓ |

## Evidence

- Test fail: `Error: Failed to resolve import "@/components/layout/sidebar"` (module not found)
- Test pass: `Test Files 1 passed (1) | Tests 3 passed (3)`
- Build: `✓ Compiled successfully in 4.1s | Finished TypeScript in 9.2s`

## Shadcn components present

button, card, input, label, select, textarea, badge, table, dropdown-menu, dialog, drawer, checkbox, skeleton, avatar, tooltip, command (15 total — button/card/input/label from Task 4, plus 11 new)

## How semantic colors were registered for Tailwind v4

In `src/app/globals.css`:
```
:root {
  --success: #22c55e;
  --warning: #f59e0b;
  --info: #06b6d4;
  --destructive: #ef4444;
}
@theme inline {
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-info: var(--info);
  --color-destructive: var(--destructive);
}
```
This enables `bg-success/15`, `text-warning`, `border-warning/30` classes to compile.

## Deviations

None — all components created verbatim from plan, shadcn CLI handled dependencies, Controller Rulings followed exactly.

## Commit

- **Hash**: `ea7844d687898974cb7ffdfbbf16a6562dd146c0`
- **Message**: `feat: add app shell and login`
