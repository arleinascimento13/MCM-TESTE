# Task 9 Report

## Status: DONE

## What was done

**Step 1 — Test file created** (`tests/unit/reports.test.ts`):
- Fixed plan typos: `ests/unit` → `tests/unit`, `	ypescript` → `typescript`, `pm test` → `npm test`
- Used `vi.hoisted()` pattern for prisma mock (required because `vi.mock` is hoisted)

**Step 2 — Tests failed as expected**:
- `npm test -- tests/unit/reports.test.ts` → FAIL: "Failed to resolve import `@/services/reports`"

**Step 3 — Created `src/services/reports.ts`**:
- `baseWhere(user, query)`: composes scope filter + `status: "APROVADA"` + `deletedAt: null` + optional mes/ano/projectId
- `hoursByProject`, `hoursByEmployee`, `hoursByCostCenter`, `hoursByDiscipline`, `hoursByPeriod`: groupBy aggregations using `baseWhere`
- `listAuditLog`: paginated audit log with scope filter via `timeEntry` relation

**Step 4 — Created 6 route files**:
- `src/app/api/reports/hours-by-project/route.ts`
- `src/app/api/reports/hours-by-employee/route.ts`
- `src/app/api/reports/hours-by-cost-center/route.ts`
- `src/app/api/reports/hours-by-discipline/route.ts`
- `src/app/api/reports/hours-by-period/route.ts`
- `src/app/api/audit-log/route.ts`

**Step 5 — Tests passed**: 2 passed (hoursByProject + listAuditLog)

**Step 6 — Build passed**: TypeScript + static pages clean, all 6 routes registered

**Step 7 — Committed**: `3ecc952`

## Commands & Evidence

| Step | Command | Result |
|------|---------|--------|
| Test (fail) | `npm test -- tests/unit/reports.test.ts` | FAIL — module not found |
| Test (pass) | `npm test -- tests/unit/reports.test.ts` | 2 passed |
| Build | `npm run build` | ✓ Compiled, TypeScript clean |

## Test Summary
- `hoursByProject`: verifies groupBy is called with `status: "APROVADA"` and `deletedAt: null`
- `listAuditLog`: verifies scope filter applied via `timeEntry` relation + pagination defaults (page 1, pageSize 50)

## Build Summary
All 6 routes registered under `ƒ` (dynamic): `/api/audit-log`, `/api/reports/hours-by-{project,employee,cost-center,discipline,period}`.

## Deviations from Plan
- Test file uses `vi.hoisted()` for prisma mock (plan had top-level `prismaMock` variable which fails because `vi.mock` is hoisted to top of file — corrected to match existing test patterns in codebase)

## Commit
`3ecc9521847d16fe4787680a30aea89d6a3a072b` — "feat: add reports and audit log API"

---

## Fix Round 1/5 — Non-admin scope enforcement tests

**Finding:** Tests only exercised ADMIN path; no assertions for non-admin scope filtering.

**New test cases added to `tests/unit/reports.test.ts`:**

1. `hoursByProject — job leader obtém filtro de escopo`: asserts `timeEntry.groupBy` is called with `where.funcionarioId: { in: ["f1", "f2"] }` (from existing scope mock for non-admin)

2. `listAuditLog — funcionário obtém filtro por próprio id`: uses `vi.mocked(scopeFilter).mockResolvedValueOnce({ funcionarioId: "f" })` and asserts `auditLog.findMany` is called with `where.timeEntry.funcionarioId: "f"` via `expect.objectContaining`

**Test run output:**
```
Test Files  1 passed (1)
     Tests  4 passed (4)
```

**Commit:** `284b6ad798ea60c2792ae55ab903e3325b886f3e` — "test: add non-admin scope assertions for reports and audit"
