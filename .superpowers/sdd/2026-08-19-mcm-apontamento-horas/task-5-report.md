# Task 5 Report — Service layer: scope and permissions

## What I did

1. Created `tests/unit/scope.test.ts` and `tests/unit/permissions.test.ts` with 10 tests total (4 scope + 6 permissions)
2. Ran tests — confirmed FAIL (module not found: `@/services/scope`, `@/services/permissions`)
3. Created `src/services/scope.ts` (getTeamMemberIds, scopeFilter) and `src/services/permissions.ts` (checkPermission with Action/Resource types)
4. Ran tests again — all 10 PASS

**Note:** The plan's test code used `vi.mock` with a top-level variable reference which causes a vitest hoisting issue. Fixed to use `vi.hoisted()` pattern consistent with the project's existing tests (e.g., auth.test.ts).

## Commands

```bash
# Fail step (confirmed module not found)
npm test -- tests/unit/scope.test.ts tests/unit/permissions.test.ts
# Result: FAIL — Failed to resolve import "@/services/scope"

# Pass step
npm test -- tests/unit/scope.test.ts tests/unit/permissions.test.ts
# Result: PASS — 10 tests passed (2 test files)

# Commit
git add src/services/scope.ts src/services/permissions.ts tests/unit/scope.test.ts tests/unit/permissions.test.ts
git commit -m "feat: add scope and permissions service layer"
```

## Validation evidence

- **Before:** FAIL — `Failed to resolve import "@/services/permissions" from "tests/unit/permissions.test.ts"`
- **After:** PASS — `Test Files 2 passed (2) | Tests 10 passed (10)`

## Commit

- **Hash:** `6cc5e4d2f9283aab8a401809753f8a49a38f9678`
- **Files:** `src/services/scope.ts`, `src/services/permissions.ts`, `tests/unit/scope.test.ts`, `tests/unit/permissions.test.ts`

## Status

**DONE** — scope and permissions service layer implemented and committed.

## Concerns

None.
