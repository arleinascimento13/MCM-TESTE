# Task 6 Report

## What I did

Implemented Task 6: Service layer — TimeEntry (CRUD + fluxo + auditoria).

### Files created

1. **tests/unit/time-entries.test.ts** — 16 tests covering:
   - `calcularDuracao` (2 tests)
   - `createTimeEntry` (5 tests: cria com duração, rejeita sem job leader, rejeita sem alocação, rejeita opção não permitida, grava auditoria CRIAR)
   - `approveTimeEntry` (4 tests: aprova pendente, bloqueia fora do time, bloqueia já aprovada, não encontra)
   - `rejectTimeEntry` (2 tests: exige motivo, rejeita com motivo e grava auditoria)
   - `resubmitTimeEntry` (2 tests: reenvia própria rejeitada, bloqueia de outro)
   - `softDeleteTimeEntry` (1 test: somente admin remove)

2. **src/services/audit.ts** — `logAudit(tx, params)` + `AuditTx` type

3. **src/services/time-entries.ts** — Full implementation:
   - `calcularDuracao`, `validarOpcoesPermitidas`, `validarMesAno`
   - `createTimeEntry`, `listTimeEntries`, `getTimeEntry`, `updateTimeEntry`
   - `approveTimeEntry`, `rejectTimeEntry`, `resubmitTimeEntry`, `softDeleteTimeEntry`
   - All with state machine enforcement, scope checks, and audit logging in transactions

### Test result
```
npm test -- tests/unit/time-entries.test.ts
Test Files  1 passed (1)
     Tests  16 passed (16)
```

### Prisma 7 adaptations
- `Prisma.TransactionClient` — available at `Prisma.TransactionClient` in Prisma 7 (line 1760 of generated types)
- `Prisma.InputJsonValue` — available at `Prisma.InputJsonValue` in Prisma 7 (line 418 via runtime re-export)
- `Prisma.TimeEntryWhereInput` — available at `Prisma.TimeEntryWhereInput` in Prisma 7 (line 14105)
- `Prisma.EnumSTATUSFilter` — available at `Prisma.EnumSTATUSFilter` in Prisma 7 (line 15482)
- Used `vi.hoisted()` pattern (established in seed.test.ts/scope.test.ts) for the prisma mock to ensure proper hoisting in vitest

### Commit
```
9d36e786f0ed2e963829b6c6030da1c8aceff54b
feat: add time entry service with state machine and audit
```

## Status: DONE

---

## Fix Round 1/5

### Controller Ruling (binding)
**HIGH "duration not recalculated when times change" — REJECTED.** Spec section 8, rule 7 (line 319): "Duração — calculada automaticamente na criação ((fim - inicio) em horas decimais); após isso editável e a service layer não recalcula — o valor informado prevalece." The plan's `updateTimeEntry` calling `calcularDuracao(inicio, fim)` without using the result (validation-only) is verbatim from the plan and spec-compliant. Do NOT change.

### MEDIUM Fix: updateTimeEntry test coverage added
Added 6 tests to `tests/unit/time-entries.test.ts`:

1. `rejeita FUNCIONARIO editando linha APROVADA` — ValidationError (code APPROVED_ENTRY_EDIT)
2. `rejeita FUNCIONARIO editando linha de outro usuário` — ForbiddenError
3. `rejeita JOB_LEADER editando linha fora do team` — ForbiddenError
4. `quando inicio/fim mudam sem duracao, update NÃO inclui duracao` — spec rule 7 compliance (service does not recalculate)
5. `quando costCenterId muda, revalida opções e inclui novo costCenterId no update` — validarOpcoesPermitidas called and update includes new costCenterId
6. `grava auditoria EDITAR com antes e depois na transação` — auditLog.create called with acao EDITAR

### Test result
```
npm test -- tests/unit/time-entries.test.ts
Test Files  1 passed (1)
     Tests  22 passed (22)
```

### Commit
```
ec7d30f820cde5cda4b10560f2fb8a4e082e212e
test: add updateTimeEntry coverage
```
