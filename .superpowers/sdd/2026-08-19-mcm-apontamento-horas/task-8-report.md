# Task 8 Report — API e serviços de parâmetros e admin

## Status: DONE

## What was done

### Files Created

**Services:**
- `src/services/params.ts` — listParams/createParam/updateParam/deactivateParam (soft-delete)
- `src/services/users.ts` — createUser/listUsers/updateUser/deactivateUser + listAssignments/createAssignment/deactivateAssignment + listAllowedOptions/setAllowedOption/removeAllowedOption

**Schemas:**
- `src/schemas/params.ts` — CreateParamSchema/UpdateParamSchema
- `src/schemas/users.ts` — CreateUserSchema/UpdateUserSchema
- `src/schemas/assignments.ts` — CreateAssignmentSchema
- `src/schemas/allowed-options.ts` — CreateAllowedOptionSchema
- `src/schemas/allocations.ts` — CreateAllocationSchema

**Routes (16 new route files):**
- `src/app/api/cost-centers/route.ts` + `[id]/route.ts`
- `src/app/api/disciplines/route.ts` + `[id]/route.ts`
- `src/app/api/locations/route.ts` + `[id]/route.ts`
- `src/app/api/projects/route.ts` + `[id]/route.ts`
- `src/app/api/allocations/route.ts` + `[id]/route.ts`
- `src/app/api/users/route.ts` + `[id]/route.ts`
- `src/app/api/job-leader-assignments/route.ts` + `[id]/route.ts`
- `src/app/api/user-allowed-options/route.ts` + `[id]/route.ts`

**Tests:**
- `tests/unit/params.test.ts` — 3 tests (cria parâmetro, desativa em vez de deletar, cria vínculo desativando anterior)

### Commands

```bash
npm test -- tests/unit/params.test.ts  # FAIL (module not found) → PASS (3 tests)
npm run build  # PASS
git commit -m "feat: add params and admin services and routes"
```

### Evidence

- **Test FAIL→PASS**: `Error: Failed to resolve import "@/services/params"` → `Test Files  1 passed (1) | Tests  3 passed (3)`
- **Build**: `✓ Finished TypeScript in 3.1s` — all 24 API routes compiled

### Commit Hash
`31f17d74135631e2c72a0f485483920936634ff8`

### Deviations from Plan (typo fixes per Ruling 1)
- `ests/unit/params.test.ts` → `tests/unit/params.test.ts`
- `pm test` → `npm test`
- `pm run build` → `npm run build`
- `emoveAllowedOption` → `removeAllowedOption`
- `	ypescript` fences → proper ```typescript fences (in code itself)

### Deviations from Plan (Prisma 7 type adjustment)
- `src/services/params.ts` line 7: `Record<ParamModel, typeof prisma.costCenter>` changed to `Record<ParamModel, any>` due to Prisma 7 delegate type incompatibility across models. Logic identical.

### Controller Rulings Applied
- Ruling 2 (GET routes readable by all authenticated): cost-centers/disciplines/locations/projects GET routes use `requireUser()` (any authenticated) + `?ativos=true` support via `ativosOnly=true` to listParams. POST/PUT/DELETE stay ADMIN-only.
- Ruling 3 (Next 16 Promise params): all [id] routes use `{ params: Promise<{ id: string }> }` + `await params`.
- Ruling 4 (allocations): GET/POST/DELETE all ADMIN-only; DELETE is hard delete via `prisma.allocation.delete`.
- Ruling 5 (users): all routes ADMIN-only.
- Ruling 6 (job-leader-assignments): all routes ADMIN-only.
- Ruling 7 (user-allowed-options): all routes ADMIN-only.
- Ruling 8 (tests): vi.hoisted() pattern used.

### Additional File (not in plan but required by rulings)
- `src/schemas/allocations.ts` — CreateAllocationSchema required by allocations route per plan step 5.

## One-Line Summary
3 tests pass (fail→pass), build clean, 24 routes compiled, commit 31f17d7.

## Concerns
None — implementation matches plan + rulings, tests pass, build passes.

---

## Fix Round 1/5

**Issue (MEDIUM):** GET /api/cost-centers, /api/disciplines, /api/locations, /api/projects returned ALL params (including `ativo=false`) to any authenticated user when `ativos` param was absent. Non-admin users must never see inactive params (server-side scope enforcement per spec).

**Fix applied to all 4 GET routes** — changed:
```typescript
// Before (all users got all params unless ?ativos=true):
const ativosOnly = request.nextUrl.searchParams.get("ativos") === "true";

// After (non-admin always gets active-only; admin controls via ?ativos=true):
const user = await requireUser();
const ativosOnly = user.papel === "ADMIN" ? request.nextUrl.searchParams.get("ativos") === "true" : true;
```

**Also fixed (LOW):** removed unused `import { ERROR_CODES } from "@/lib/error-codes"` from `src/services/users.ts`.

### Verification
```
npm run build  # PASS — ✓ Finished TypeScript in 4.1s, all 24 routes compiled
```

### Fix Commit
`ffb63f949830e3a2c1bff8099dec35f828a57c44`

## Concerns
None.
