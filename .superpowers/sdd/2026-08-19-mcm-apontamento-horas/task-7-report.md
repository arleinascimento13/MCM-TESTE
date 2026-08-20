# Task 7 Report — API Time Entry Routes

## Status: DONE

## What was done

Created the full TimeEntry API layer:

**Helpers (`src/lib/api.ts`):**
- `ok(data, status)` — wraps success with `{ data }` envelope
- `fail(error)` — maps ZodError→400 VALIDATION_ERROR, AppError→its statusCode, unknown→500
- `parseBody(request, schema)` — parses JSON and validates with Zod schema

**Schemas (`src/schemas/time-entry.ts`):**
- `CreateTimeEntrySchema`, `UpdateTimeEntrySchema` (partial of create), `RejectTimeEntrySchema`, `ListTimeEntriesQuerySchema`

**Route files (5 files):**
- `src/app/api/time-entries/route.ts` — GET list + POST create
- `src/app/api/time-entries/[id]/route.ts` — GET detail + PUT update + DELETE soft
- `src/app/api/time-entries/[id]/approve/route.ts` — POST approve
- `src/app/api/time-entries/[id]/reject/route.ts` — POST reject
- `src/app/api/time-entries/[id]/resubmit/route.ts` — POST resubmit

**Integration tests (`tests/api/time-entries.test.ts`):**
- 4 tests: 201 create, 401 unauth, 400 invalid body, 200 list paginated

## Commands

```
npm test -- tests/api/time-entries.test.ts   # 4/4 PASS
npm run build                                 # PASS
git commit -m "feat: add time entry API routes"  # 7587c53
```

## Test Evidence

```
Test Files  1 passed (1)
     Tests  4 passed (4)
```

## Build Result

```
✓ Compiled successfully in 23.0s
✓ Generating static pages (6/6)
Route (app)
├ ƒ /api/time-entries
├ ƒ /api/time-entries/[id]
├ ƒ /api/time-entries/[id]/approve
├ ƒ /api/time-entries/[id]/reject
└ ƒ /api/time-entries/[id]/resubmit
```

## Next 16 Params Adaptation Detail

Per Next.js 16 docs (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`), route handler `context.params` is now a `Promise`. The plan used synchronous `{ params: { id: string } }` — adapted to:

```typescript
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}
```

This was applied to all 4 route files with dynamic `[id]` params.

## Fixes Applied (not in plan verbatim)

1. **NextRequest instead of web Request**: Test used `new Request()` which lacks `nextUrl.searchParams`. Changed to `new NextRequest()` for both GET and POST test requests.

2. **Valid RFC 4122 UUIDs**: Plan's test UUIDs `00000000-0000-0000-0000-000000000001` fail Zod's `uuid()` validation — version digit must be 1-8 and variant digit must be 8/9/a/b. Changed last segment to `4000-8000-000000000001` etc. (version=4, variant=8).

3. **UnauthorizedError for 401 test**: Per Ruling 2, changed `requireUser.mockRejectedValue(Object.assign(new Error(...), { statusCode: 401 }))` to `requireUser.mockRejectedValue(new UnauthorizedError())`.

4. **vi.hoisted() for prismaMock**: Per Ruling 3, moved prismaMock to `vi.hoisted()` so it's available at module scope for the `$transaction: vi.fn((fn) => fn(prismaMock))` mock.

5. **TypeScript Mock cast**: Added `const requireUserMock = requireUser as Mock<() => Promise<unknown>>` to fix TS2339 errors on `mockResolvedValue`/`mockRejectedValue`.

## Commit Hash

`7587c532b705a9bd3558fd3379eb33232046e879`

## Concerns

- Test UUIDs diverged from plan verbatim due to RFC 4122 validation (Zod `uuid()` is strict). The semantics are preserved (4 distinct UUID-shaped identifiers).
- TypeScript mock cast (`requireUser as Mock<...>`) is a workaround — works but not elegant. The pattern is consistent with other vitest TypeScript patterns.
- No concerns beyond the above; all 4 tests pass and build is clean.
