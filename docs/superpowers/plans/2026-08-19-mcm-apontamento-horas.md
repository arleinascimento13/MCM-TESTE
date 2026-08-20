# MCM — Sistema de Apontamento de Horas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o sistema interno de apontamento de horas da MCM conforme o design spec aprovado.

**Architecture:** Monolito full-stack Next.js App Router: Route Handlers (REST) → Service Layer com escopo de dados por papel e auditoria → Prisma → PostgreSQL local. Frontend data-dense com shadcn/ui, Recharts e design system do DESIGN.md.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zod, Auth.js v5 (next-auth@beta, Credentials + JWT cookie), Prisma + PostgreSQL, bcryptjs, Recharts, React Hook Form, Lucide, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-19-mcm-apontamento-horas-design.md` — o plano argumenta a partir do spec; o executor deve ler o spec e este plano juntos.

## Global Constraints

- Scaffold do Next.js na raiz do repo (substituir o package.json atual).
- Node.js 20+, PostgreSQL instalado localmente (sem Docker).
- .env na raiz com DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL (http://localhost:3000).
- Nomes de campos de API em camelCase (projectId, costCenterId, disciplineId, locationId, horaExtra, motivoRejeicao); colunas no banco em snake_case via @map.
- Enums Prisma: PAPEL = ADMIN | JOB_LEADER | FUNCIONARIO; STATUS = PENDENTE | APROVADA | REJEITADA; TIPO_OPCAO = DISCIPLINA | CENTRO_CUSTO | LOCAL; ACAO_AUDITORIA = CRIAR | EDITAR | APROVAR | REJEITAR | REENVIAR | REMOVER.
- Idioma da UI: português (pt-BR). Sem emojis na UI (ícones Lucide). Design system do DESIGN.md (dark-first, data-dense, Inter + JetBrains Mono, tabular-nums).
- Escopo de dados sempre enforce em código na service layer; nunca confiar em filtros do frontend.
- Auditoria: toda mutação grava AuditLog na mesma transação (prisma.$transaction) — nunca mutação sem log.
- Remoções são soft: TimeEntry.deletedAt, parâmetros ativo=false. Allocation e UserAllowedOption podem ser removidas fisicamente (não têm soft flag e não são referenciadas por FK obrigatória de TimeEntry).
- TDD: cada task começa com teste que falha, depois implementação mínima, depois commit.
- Exportação de dados FORA de escopo nesta fase.
- FKs com ON DELETE RESTRICT; índices conforme spec seção 6.

---

## Estrutura de Arquivos (mapa geral)

```
src/
  app/
    layout.tsx                    → raiz (fonts, lang pt-BR)
    globals.css                   → tokens Tailwind
    (auth)/layout.tsx             → layout centrado p/ login
    (auth)/login/page.tsx         → página de login
    (app)/layout.tsx              → shell com sidebar + topbar (protegido)
    (app)/page.tsx                → dashboard (KPIs + gráficos)
    (app)/time-entries/page.tsx   → tabela de apontamentos + filtros
    (app)/time-entries/new/page.tsx
    (app)/time-entries/[id]/page.tsx
    (app)/approvals/page.tsx      → fila de aprovação do job leader
    (app)/reports/page.tsx        → relatórios agregados
    (app)/audit/page.tsx          → log de auditoria
    (app)/admin/...               → páginas de parâmetros
    api/auth/[...nextauth]/route.ts
    api/time-entries/route.ts
    api/time-entries/[id]/route.ts
    api/time-entries/[id]/approve/route.ts
    api/time-entries/[id]/reject/route.ts
    api/time-entries/[id]/resubmit/route.ts
    api/cost-centers/route.ts + [id]/route.ts
    api/disciplines/route.ts + [id]/route.ts
    api/locations/route.ts + [id]/route.ts
    api/projects/route.ts + [id]/route.ts
    api/allocations/route.ts + [id]/route.ts
    api/users/route.ts + [id]/route.ts
    api/job-leader-assignments/route.ts + [id]/route.ts
    api/user-allowed-options/route.ts + [id]/route.ts
    api/reports/hours-by-project/route.ts
    api/reports/hours-by-employee/route.ts
    api/reports/hours-by-cost-center/route.ts
    api/reports/hours-by-discipline/route.ts
    api/reports/hours-by-period/route.ts
    api/audit-log/route.ts
  components/
    layout/ (Sidebar, Topbar, CommandPalette, UserMenu)
    ui/ (componentes shadcn gerados)
    data-table.tsx
    filter-bar.tsx
    status-badge.tsx
    kpi-card.tsx
    chart-card.tsx
    time-entry-form.tsx
    approval-drawer.tsx
  lib/
    prisma.ts, auth.ts, api.ts, errors.ts, error-codes.ts, utils.ts
  schemas/
    time-entry.ts, params.ts, users.ts, assignments.ts, allowed-options.ts
  services/
    scope.ts, permissions.ts, audit.ts, time-entries.ts, params.ts, users.ts, reports.ts
  middleware.ts
prisma/
  schema.prisma
  migrations/
  seed.ts
tests/
  unit/  (services, schemas, componentes)
  api/   (route handlers)
.env
```

---

## Task 1: Scaffold do projeto

**Files:**
- Create: todo o scaffold via `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm` (usar --yes para aceitar defaults; confirmar substituição do package.json)
- Modify: package.json (scripts de teste), vitest.config.ts, vitest.setup.ts

**Interfaces:**
- Produces: projeto Next.js compilável na raiz, com scripts dev/build/start.

- [ ] **Step 1: Instalar dependências base**

```bash
npm install prisma @prisma/client zod next-auth@beta bcryptjs recharts react-hook-form @hookform/resolvers lucide-react clsx tailwind-merge
npm install -D @types/bcryptjs vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Configurar Vitest**

Criar `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

Criar `vitest.setup.ts`:

```typescript
import "@testing-library/jest-dom";
```

Adicionar ao package.json: `"test": "vitest run"` e `"test:watch": "vitest"`.

- [ ] **Step 3: Escrever teste de fumaça (falha)**

Criar `tests/unit/smoke.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildQueryString } from "@/lib/utils";

describe("buildQueryString", () => {
  it("ignora valores nulos e indefinidos", () => {
    expect(buildQueryString({ page: 1, status: null, termo: undefined })).toBe("page=1");
  });
});
```

- [ ] **Step 4: Rodar teste para ver falhar**

Run: `npm test -- tests/unit/smoke.test.ts`
Expected: FAIL — module not found `@/lib/utils`.

- [ ] **Step 5: Implementar util**

Criar `src/lib/utils.ts`:

```typescript
export function buildQueryString(params: Record<string, string | number | null | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  ) as [string, string | number][];
  return new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}
```

- [ ] **Step 6: Rodar teste para passar**

Run: `npm test -- tests/unit/smoke.test.ts`
Expected: PASS.

- [ ] **Step 7: Rodar build**

Run: `npm run build`
Expected: build completo sem erros.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with testing setup"
```

---

## Task 2: Prisma schema, migração e seed

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`
- Modify: `src/lib/prisma.ts` (novo), `.env` (novo), `package.json` (seed config)

**Interfaces:**
- Produces: modelo de dados completo (ver spec seção 6), client Prisma singleton, seed que cria admin inicial.
- Consumes: Task 1.

- [ ] **Step 1: Criar schema**

Criar `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum PAPEL {
  ADMIN
  JOB_LEADER
  FUNCIONARIO
}

enum STATUS {
  PENDENTE
  APROVADA
  REJEITADA
}

enum TIPO_OPCAO {
  DISCIPLINA
  CENTRO_CUSTO
  LOCAL
}

enum ACAO_AUDITORIA {
  CRIAR
  EDITAR
  APROVAR
  REJEITAR
  REENVIAR
  REMOVER
}

model User {
  id              String   @id @default(uuid()) @db.Uuid
  nome            String   @db.VarChar(255)
  email           String   @unique @db.VarChar(255)
  senhaHash       String   @map("senha_hash") @db.VarChar(255)
  papel           PAPEL
  ativo           Boolean  @default(true)
  criadoEm        DateTime @default(now()) @map("criado_em") @db.Timestamptz(6)
  atualizadoEm    DateTime @updatedAt @map("atualizado_em") @db.Timestamptz(6)

  jobLeaderAssignments   JobLeaderAssignment[] @relation("FuncionarioAssignments")
  funcionarioAssignments JobLeaderAssignment[] @relation("JobLeaderAssignments")
  alocacoes              Allocation[]
  opcoesPermitidas       UserAllowedOption[]
  timeEntries            TimeEntry[] @relation("FuncionarioEntries")
  entradasLideradas      TimeEntry[] @relation("JobLeaderEntries")
  logsAuditoria          AuditLog[]

  @@map("users")
}

model JobLeaderAssignment {
  id            String   @id @default(uuid()) @db.Uuid
  funcionarioId String   @map("funcionario_id") @db.Uuid
  jobLeaderId   String   @map("job_leader_id") @db.Uuid
  ativo         Boolean  @default(true)
  criadoEm      DateTime @default(now()) @map("criado_em") @db.Timestamptz(6)

  funcionario User @relation("FuncionarioAssignments", fields: [funcionarioId], references: [id], onDelete: Restrict)
  jobLeader   User @relation("JobLeaderAssignments", fields: [jobLeaderId], references: [id], onDelete: Restrict)

  @@index([funcionarioId])
  @@index([jobLeaderId])
  @@map("job_leader_assignments")
}

model Project {
  id           String   @id @default(uuid()) @db.Uuid
  nome         String   @db.VarChar(255)
  ativo        Boolean  @default(true)
  criadoEm     DateTime @default(now()) @map("criado_em") @db.Timestamptz(6)
  atualizadoEm DateTime @updatedAt @map("atualizado_em") @db.Timestamptz(6)

  alocacoes   Allocation[]
  timeEntries TimeEntry[]

  @@map("projects")
}

model CostCenter {
  id           String   @id @default(uuid()) @db.Uuid
  nome         String   @db.VarChar(255)
  ativo        Boolean  @default(true)
  criadoEm     DateTime @default(now()) @map("criado_em") @db.Timestamptz(6)
  atualizadoEm DateTime @updatedAt @map("atualizado_em") @db.Timestamptz(6)

  timeEntries TimeEntry[]

  @@map("cost_centers")
}

model Discipline {
  id           String   @id @default(uuid()) @db.Uuid
  nome         String   @db.VarChar(255)
  ativo        Boolean  @default(true)
  criadoEm     DateTime @default(now()) @map("criado_em") @db.Timestamptz(6)
  atualizadoEm DateTime @updatedAt @map("atualizado_em") @db.Timestamptz(6)

  timeEntries TimeEntry[]

  @@map("disciplines")
}

model Location {
  id           String   @id @default(uuid()) @db.Uuid
  nome         String   @db.VarChar(255)
  ativo        Boolean  @default(true)
  criadoEm     DateTime @default(now()) @map("criado_em") @db.Timestamptz(6)
  atualizadoEm DateTime @updatedAt @map("atualizado_em") @db.Timestamptz(6)

  timeEntries TimeEntry[]

  @@map("locations")
}

model Allocation {
  id            String   @id @default(uuid()) @db.Uuid
  funcionarioId String   @map("funcionario_id") @db.Uuid
  projectId     String   @map("project_id") @db.Uuid
  criadoEm      DateTime @default(now()) @map("criado_em") @db.Timestamptz(6)

  funcionario User    @relation(fields: [funcionarioId], references: [id], onDelete: Restrict)
  project     Project @relation(fields: [projectId], references: [id], onDelete: Restrict)

  @@index([funcionarioId])
  @@index([projectId])
  @@map("allocations")
}

model UserAllowedOption {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  tipo      TIPO_OPCAO
  valorId   String    @map("valor_id") @db.Uuid
  criadoEm  DateTime  @default(now()) @map("criado_em") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([userId])
  @@map("user_allowed_options")
}

model TimeEntry {
  id              String    @id @default(uuid()) @db.Uuid
  funcionarioId   String    @map("funcionario_id") @db.Uuid
  jobLeaderId     String    @map("job_leader_id") @db.Uuid
  projectId       String    @map("project_id") @db.Uuid
  mes             Int
  ano             Int
  data            DateTime  @db.Date
  inicio          String    @db.VarChar(5)
  fim             String    @db.VarChar(5)
  duracao         Decimal   @db.Decimal(5, 2)
  descricao       String?   @db.Text
  costCenterId    String    @map("cost_center_id") @db.Uuid
  disciplineId    String    @map("discipline_id") @db.Uuid
  locationId      String    @map("location_id") @db.Uuid
  horaExtra       Boolean   @default(false) @map("hora_extra")
  status          STATUS    @default(PENDENTE)
  motivoRejeicao  String?   @map("motivo_rejeicao") @db.Text
  deletedAt       DateTime? @map("deleted_at") @db.Timestamptz(6)
  criadoEm        DateTime  @default(now()) @map("criado_em") @db.Timestamptz(6)
  atualizadoEm    DateTime  @updatedAt @map("atualizado_em") @db.Timestamptz(6)

  funcionario  User        @relation("FuncionarioEntries", fields: [funcionarioId], references: [id], onDelete: Restrict)
  jobLeader    User        @relation("JobLeaderEntries", fields: [jobLeaderId], references: [id], onDelete: Restrict)
  project      Project     @relation(fields: [projectId], references: [id], onDelete: Restrict)
  costCenter   CostCenter  @relation(fields: [costCenterId], references: [id], onDelete: Restrict)
  discipline   Discipline  @relation(fields: [disciplineId], references: [id], onDelete: Restrict)
  location     Location    @relation(fields: [locationId], references: [id], onDelete: Restrict)
  logs         AuditLog[]

  @@index([funcionarioId])
  @@index([status])
  @@index([funcionarioId, mes, ano])
  @@index([projectId])
  @@map("time_entries")
}

model AuditLog {
  id            String       @id @default(uuid()) @db.Uuid
  timeEntryId   String       @map("time_entry_id") @db.Uuid
  acao          ACAO_AUDITORIA
  usuarioId     String       @map("usuario_id") @db.Uuid
  motivo        String?      @db.Text
  dadosAlterados JsonValue?  @map("dados_alterados") @db.JsonB
  quando        DateTime     @default(now()) @map("quando") @db.Timestamptz(6)

  timeEntry TimeEntry @relation(fields: [timeEntryId], references: [id], onDelete: Restrict)
  usuario   User      @relation(fields: [usuarioId], references: [id], onDelete: Restrict)

  @@index([timeEntryId])
  @@index([quando])
  @@map("audit_logs")
}
```

- [ ] **Step 2: Configurar .env e Prisma Client**

Criar `.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mcm?schema=public"
AUTH_SECRET="dev-secret-change-me"
NEXTAUTH_URL="http://localhost:3000"
```

Criar `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Rodar migração**

Run: `npx prisma migrate dev --name init`
Expected: migration criada e aplicada ao Postgres local; client gerado.

- [ ] **Step 4: Escrever teste do seed (falha)**

Criar `tests/unit/seed.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = {
  user: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { seed } from "../../prisma/seed";

describe("seed", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cria admin se não existir", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: "u1" });
    await seed();
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ papel: "ADMIN" }) })
    );
  });
});
```

- [ ] **Step 5: Implementar seed**

Criar `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seed() {
  const senhaHash = await bcrypt.hash("Admin123!", 10);

  const adminExistente = await prisma.user.findFirst({ where: { papel: "ADMIN" } });
  if (!adminExistente) {
    await prisma.user.create({
      data: {
        nome: "Administrador",
        email: "admin@mcm.local",
        senhaHash,
        papel: "ADMIN",
      },
    });
  }
  console.log("Seed concluído: admin@mcm.local / Admin123!");
}

if (require.main === module) {
  seed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
```

Adicionar ao package.json: `"prisma": { "seed": "tsx prisma/seed.ts" }` e instalar tsx (`npm install -D tsx`).

- [ ] **Step 6: Rodar teste para passar**

Run: `npm test -- tests/unit/seed.test.ts`
Expected: PASS.

- [ ] **Step 7: Rodar seed**

Run: `npx prisma db seed`
Expected: admin criado no banco local.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add prisma schema, migration and seed"
```

---

## Task 3: Camada de erros e constantes

**Files:**
- Create: `src/lib/errors.ts`, `src/lib/error-codes.ts`

**Interfaces:**
- Produces: `AppError` (com statusCode e code), subclasses `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409), `ValidationError` (400), e constantes de código de erro.
- Consumes: Task 1.

- [ ] **Step 1: Escrever testes (falham)**

Criar `tests/unit/errors.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { AppError, NotFoundError, ConflictError, ValidationError, ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { ERROR_CODES } from "@/lib/error-codes";

describe("errors", () => {
  it("AppError expõe code e statusCode", () => {
    const e = new AppError("MEU_CODIGO", "mensagem", 400);
    expect(e.code).toBe("MEU_CODIGO");
    expect(e.message).toBe("mensagem");
    expect(e.statusCode).toBe(400);
  });

  it("NotFoundError usa 404", () => {
    expect(new NotFoundError(ERROR_CODES.NOT_FOUND, "não existe").statusCode).toBe(404);
  });

  it("erros comuns herdam de AppError", () => {
    for (const E of [UnauthorizedError, ForbiddenError, ConflictError, ValidationError]) {
      expect(new E("X", "y") instanceof AppError).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Rodar testes para falhar**

Run: `npm test -- tests/unit/errors.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar**

Criar `src/lib/error-codes.ts`:

```typescript
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  OPTION_NOT_ALLOWED: "OPTION_NOT_ALLOWED",
  EMPLOYEE_NOT_ALLOCATED: "EMPLOYEE_NOT_ALLOCATED",
  APPROVED_ENTRY_EDIT: "APPROVED_ENTRY_EDIT",
  REJECTION_WITHOUT_REASON: "REJECTION_WITHOUT_REASON",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  LINE_ALREADY_APPROVED: "LINE_ALREADY_APPROVED",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
```

Criar `src/lib/errors.ts`:

```typescript
import { ERROR_CODES, ErrorCode } from "./error-codes";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado") {
    super(ERROR_CODES.UNAUTHORIZED, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Sem permissão para esta ação") {
    super(ERROR_CODES.FORBIDDEN, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(code: ErrorCode = ERROR_CODES.NOT_FOUND, message = "Recurso não encontrado") {
    super(code, message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(code: ErrorCode = ERROR_CODES.CONFLICT, message = "Estado conflitante") {
    super(code, message, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dados inválidos", code: ErrorCode = ERROR_CODES.VALIDATION_ERROR) {
    super(code, message, 400);
  }
}
```

- [ ] **Step 4: Rodar testes para passar**

Run: `npm test -- tests/unit/errors.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/errors.ts src/lib/error-codes.ts tests/unit/errors.test.ts
git commit -m "feat: add error layer and error codes"
```

---

## Task 4: Autenticação (Auth.js v5 + Credentials + bcrypt)

**Files:**
- Create: `src/auth.ts`, `src/lib/auth.ts`, `src/middleware.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/layout.tsx`
- Modify: `src/app/layout.tsx` (raiz), `src/app/globals.css` (fontes Inter + JetBrains Mono)

**Interfaces:**
- Produces: `auth` (config Auth.js), `handlers`, `getSessionUser()`, `requireUser()`, `requireRole(papel)`, middleware de proteção de rotas.
- Consumes: Task 2 (prisma), Task 3 (errors).

- [ ] **Step 1: Escrever teste do authorize (falha)**

Criar `tests/unit/auth.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

const prismaMock = {
  user: { findUnique: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ getSessionUser: vi.fn() }));

import { authorize } from "@/auth";

describe("authorize", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retorna null se usuário não existe", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const result = await authorize({ email: "x@x.com", password: "123456" });
    expect(result).toBeNull();
  });

  it("retorna null se senha incorreta", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1", nome: "Ana", email: "ana@mcm.local", senhaHash: await bcrypt.hash("certa", 10), papel: "FUNCIONARIO", ativo: true,
    });
    const result = await authorize({ email: "ana@mcm.local", password: "errada" });
    expect(result).toBeNull();
  });

  it("retorna usuário se senha correta e ativo", async () => {
    const hash = await bcrypt.hash("certa", 10);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1", nome: "Ana", email: "ana@mcm.local", senhaHash: hash, papel: "FUNCIONARIO", ativo: true,
    });
    const result = await authorize({ email: "ana@mcm.local", password: "certa" });
    expect(result).toEqual({ id: "u1", nome: "Ana", email: "ana@mcm.local", papel: "FUNCIONARIO" });
  });

  it("retorna null se usuário inativo", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1", nome: "Ana", email: "ana@mcm.local", senhaHash: await bcrypt.hash("certa", 10), papel: "FUNCIONARIO", ativo: false,
    });
    const result = await authorize({ email: "ana@mcm.local", password: "certa" });
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar teste para falhar**

Run: `npm test -- tests/unit/auth.test.ts`
Expected: FAIL — module not found `@/auth`.

- [ ] **Step 3: Implementar auth**

Criar `src/auth.ts`:

```typescript
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function authorize(credentials: Partial<Record<"email" | "password", unknown>>) {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.ativo) return null;

  const senhaValida = await bcrypt.compare(password, user.senhaHash);
  if (!senhaValida) return null;

  return { id: user.id, nome: user.nome, email: user.email, papel: user.papel };
}

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.papel = (user as { papel: string }).papel;
        token.nome = (user as { nome: string }).nome;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.papel = token.papel as string;
        session.user.nome = token.nome as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

Criar `src/lib/auth.ts`:

```typescript
import { auth } from "@/auth";
import { UnauthorizedError, ForbiddenError } from "./errors";

export type SessionUser = {
  id: string;
  nome: string;
  email: string;
  papel: "ADMIN" | "JOB_LEADER" | "FUNCIONARIO";
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id as string,
    nome: session.user.nome as string,
    email: session.user.email as string,
    papel: session.user.papel as SessionUser["papel"],
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireRole(...papeis: SessionUser["papel"][]): Promise<SessionUser> {
  const user = await requireUser();
  if (!papeis.includes(user.papel)) throw new ForbiddenError();
  return user;
}
```

Criar `src/middleware.ts`:

```typescript
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAutenticado = !!req.auth?.user;
  const isRotaPublica = pathname === "/login" || pathname.startsWith("/api/auth");

  if (!isAutenticado && !isRotaPublica) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  if (isAutenticado && pathname === "/login") {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

Criar `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 4: Rodar teste para passar**

Run: `npm test -- tests/unit/auth.test.ts`
Expected: PASS.

- [ ] **Step 5: Criar layout raiz e página de login**

Modificar `src/app/layout.tsx` para incluir fontes Inter e JetBrains Mono (via next/font/google) e html lang="pt-BR". Criar `src/app/(auth)/layout.tsx` com container centralizado e `src/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setErro("Credenciais inválidas");
      setCarregando(false);
      return;
    }
    router.push(params.get("callbackUrl") ?? "/");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>MCM — Apontamento de Horas</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button type="submit" disabled={carregando} className="w-full">
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 6: Adicionar rate limiting básico no login**

Criar `src/lib/rate-limit.ts`:

```typescript
type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();
const MAX = 10; // tentativas por janela
const WINDOW_MS = 60_000;

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= MAX;
}
```

Em `src/middleware.ts`, importar `checkRateLimit` e aplicar antes de chamar o auth na rota de login (pathname inclui `/api/auth/callback/credentials`):

```typescript
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (pathname.startsWith("/api/auth/callback/credentials") && !checkRateLimit(`login:${ip}`)) {
    return Response.json(
      { error: { code: "TOO_MANY_ATTEMPTS", message: "Muitas tentativas de login. Tente novamente em 1 minuto." } },
      { status: 429 }
    );
  }

  const isAutenticado = !!req.auth?.user;
  const isRotaPublica = pathname === "/login" || pathname.startsWith("/api/auth");

  if (!isAutenticado && !isRotaPublica) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  if (isAutenticado && pathname === "/login") {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

Nota: com cookies SameSite=lax configurados pelo Auth.js e validação de origem via SameSite, a proteção CSRF das demais mutações é coberta; o middleware acima adiciona a camada de rate limiting no login.

- [ ] **Step 7: Rodar build**

Run: `npm run build`
Expected: build passa (login acessível, rotas protegidas pelo middleware).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add authentication with Auth.js credentials provider"
```

---

## Instruções finais

- Crie apenas esse arquivo com a Parte 1 acima. NÃO faça commit (as próximas partes farão append antes do commit final).
- Retorne: o caminho absoluto do arquivo criado e a quantidade de linhas escritas.





## Task 5: Service layer — escopo de dados e permissões

**Files:**
- Create: `src/services/scope.ts`, `src/services/permissions.ts`

**Interfaces:**
- Produces: `getTeamMemberIds(jobLeaderId)`, `scopeFilter(user)`, `checkPermission(user, action, resource)`.
- Consumes: Task 2 (prisma), Task 3 (errors), Task 4 (SessionUser).

- [ ] **Step 1: Escrever testes (falham)**

Criar `tests/unit/scope.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = {
  jobLeaderAssignment: { findMany: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { getTeamMemberIds, scopeFilter } from "@/services/scope";

const userAdmin = { id: "a", nome: "A", email: "a@mcm.local", papel: "ADMIN" as const };
const userJL = { id: "j", nome: "J", email: "j@mcm.local", papel: "JOB_LEADER" as const };
const userFunc = { id: "f", nome: "F", email: "f@mcm.local", papel: "FUNCIONARIO" as const };

describe("scope", () => {
  beforeEach(() => vi.clearAllMocks());

  it("admin não tem filtro", async () => {
    expect(await scopeFilter(userAdmin)).toEqual({});
  });

  it("funcionário filtra por si mesmo", async () => {
    expect(await scopeFilter(userFunc)).toEqual({ funcionarioId: "f" });
  });

  it("job leader filtra pelo time ativo", async () => {
    prismaMock.jobLeaderAssignment.findMany.mockResolvedValue([
      { funcionarioId: "f1" }, { funcionarioId: "f2" },
    ]);
    const filtro = await scopeFilter(userJL);
    expect(filtro).toEqual({ funcionarioId: { in: ["f1", "f2"] } });
  });

  it("getTeamMemberIds retorna ids", async () => {
    prismaMock.jobLeaderAssignment.findMany.mockResolvedValue([
      { funcionarioId: "f1" }, { funcionarioId: "f2" },
    ]);
    expect(await getTeamMemberIds("j")).toEqual(["f1", "f2"]);
  });
});
```

Criar `tests/unit/permissions.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { checkPermission } from "@/services/permissions";
import { ForbiddenError } from "@/lib/errors";

const userAdmin = { id: "a", nome: "A", email: "a@mcm.local", papel: "ADMIN" as const };
const userJL = { id: "j", nome: "J", email: "j@mcm.local", papel: "JOB_LEADER" as const };
const userFunc = { id: "f", nome: "F", email: "f@mcm.local", papel: "FUNCIONARIO" as const };

describe("checkPermission", () => {
  it("admin pode aprovar? não", () => {
    expect(() => checkPermission(userAdmin, "approve", "time-entry")).toThrow(ForbiddenError);
  });
  it("job leader pode aprovar? sim", () => {
    expect(() => checkPermission(userJL, "approve", "time-entry")).not.toThrow();
  });
  it("funcionário pode aprovar? não", () => {
    expect(() => checkPermission(userFunc, "approve", "time-entry")).toThrow(ForbiddenError);
  });
  it("funcionário pode criar? sim", () => {
    expect(() => checkPermission(userFunc, "create", "time-entry")).not.toThrow();
  });
  it("job leader não gerencia parâmetros", () => {
    expect(() => checkPermission(userJL, "manage", "params")).toThrow(ForbiddenError);
  });
  it("admin gerencia parâmetros", () => {
    expect(() => checkPermission(userAdmin, "manage", "params")).not.toThrow();
  });
});
```

- [ ] **Step 2: Rodar testes para falhar**

Run: `npm test -- tests/unit/scope.test.ts tests/unit/permissions.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implementar**

Criar `src/services/scope.ts`:

```typescript
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/lib/errors";

export async function getTeamMemberIds(jobLeaderId: string): Promise<string[]> {
  const vinculos = await prisma.jobLeaderAssignment.findMany({
    where: { jobLeaderId, ativo: true },
    select: { funcionarioId: true },
  });
  return vinculos.map((v) => v.funcionarioId);
}

export async function scopeFilter(user: SessionUser): Promise<{ funcionarioId?: string | { in: string[] } }> {
  switch (user.papel) {
    case "ADMIN":
      return {};
    case "JOB_LEADER": {
      const teamIds = await getTeamMemberIds(user.id);
      return { funcionarioId: { in: teamIds } };
    }
    case "FUNCIONARIO":
      return { funcionarioId: user.id };
    default:
      throw new ForbiddenError("Papel desconhecido");
  }
}
```

Criar `src/services/permissions.ts`:

```typescript
import type { SessionUser } from "@/lib/auth";
import { ForbiddenError } from "@/lib/errors";

export type Action = "create" | "edit" | "delete" | "approve" | "reject" | "resubmit" | "view" | "manage" | "export";
export type Resource = "time-entry" | "params" | "users" | "audit" | "reports";

export function checkPermission(user: SessionUser, action: Action, resource: Resource): void {
  const adminAllowed: Action[] = ["create", "edit", "delete", "view", "manage", "export"];
  const jlAllowed: Action[] = ["create", "edit", "approve", "reject", "view", "export"];
  const funcAllowed: Action[] = ["create", "edit", "resubmit", "view", "export"];

  const allowed = user.papel === "ADMIN" ? adminAllowed : user.papel === "JOB_LEADER" ? jlAllowed : funcAllowed;

  if (!allowed.includes(action)) throw new ForbiddenError();
  if (resource === "params" || resource === "users") {
    if (user.papel !== "ADMIN") throw new ForbiddenError();
  }
}
```

- [ ] **Step 4: Rodar testes para passar**

Run: `npm test -- tests/unit/scope.test.ts tests/unit/permissions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/scope.ts src/services/permissions.ts tests/unit/scope.test.ts tests/unit/permissions.test.ts
git commit -m "feat: add scope and permissions service layer"
```

---

## Task 6: Service layer — TimeEntry (CRUD + fluxo + auditoria)

**Files:**
- Create: `src/services/audit.ts`, `src/services/time-entries.ts`

**Interfaces:**
- Consumes: Task 2 (prisma), Task 3 (errors), Task 4 (SessionUser), Task 5 (scopeFilter, checkPermission).
- Produces:
  - `createTimeEntry(user, data)` → cria com validações, status PENDENTE, auditoria CRIAR
  - `listTimeEntries(user, query)` → paginado, escopo, filtros
  - `getTimeEntry(user, id)` → escopo
  - `updateTimeEntry(user, id, data)` → edição só pendente/rejeitada, auditoria EDITAR
  - `softDeleteTimeEntry(user, id)` → admin, auditoria REMOVER
  - `approveTimeEntry(user, id)` / `rejectTimeEntry(user, id, motivo)` / `resubmitTimeEntry(user, id)` — transação atômica + auditoria
  - `logAudit(tx, params)` — cria AuditLog dentro de transação
  - `calcularDuracao(inicio, fim)` — horas decimais
  - Tipos: `TimeEntryInput`, `TimeEntryQuery`

- [ ] **Step 1: Escrever testes (falham)**

Criar `tests/unit/time-entries.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { calcularDuracao, createTimeEntry, approveTimeEntry, rejectTimeEntry, resubmitTimeEntry, softDeleteTimeEntry } from "@/services/time-entries";
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from "@/lib/errors";

const prismaMock = {
  $transaction: vi.fn((fn) => fn(prismaTxMock)),
  jobLeaderAssignment: { findFirst: vi.fn() },
  allocation: { findFirst: vi.fn() },
  userAllowedOption: { findFirst: vi.fn() },
  costCenter: { findFirst: vi.fn() },
  discipline: { findFirst: vi.fn() },
  location: { findFirst: vi.fn() },
  project: { findFirst: vi.fn() },
  timeEntry: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
  auditLog: { create: vi.fn() },
};

const prismaTxMock = {
  timeEntry: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  auditLog: { create: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/services/scope", () => ({
  getTeamMemberIds: vi.fn().mockResolvedValue(["f1", "f2"]),
  scopeFilter: vi.fn().mockImplementation((user: { papel: string; id: string }) =>
    user.papel === "ADMIN" ? Promise.resolve({}) : user.papel === "FUNCIONARIO" ? Promise.resolve({ funcionarioId: user.id }) : Promise.resolve({ funcionarioId: { in: ["f1", "f2"] } })
  ),
}));
vi.mock("@/services/permissions", () => ({
  checkPermission: vi.fn(),
}));

const userFunc = { id: "f1", nome: "F", email: "f@mcm.local", papel: "FUNCIONARIO" as const };
const userAdmin = { id: "a", nome: "A", email: "a@mcm.local", papel: "ADMIN" as const };
const userJL = { id: "j", nome: "J", email: "j@mcm.local", papel: "JOB_LEADER" as const };

const inputValido = {
  projectId: "p1", data: "2026-08-10", mes: 8, ano: 2026,
  inicio: "09:00", fim: "17:00", costCenterId: "c1", disciplineId: "d1", locationId: "l1",
  horaExtra: false, descricao: "Trabalho de teste",
};

describe("calcularDuracao", () => {
  it("calcula 8 horas", () => {
    expect(calcularDuracao("09:00", "17:00")).toBe("8.00");
  });
  it("calcula meia hora", () => {
    expect(calcularDuracao("08:30", "09:00")).toBe("0.50");
  });
});

describe("createTimeEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.jobLeaderAssignment.findFirst.mockResolvedValue({ id: "v1", jobLeaderId: "j" });
    prismaMock.allocation.findFirst.mockResolvedValue({ id: "al1" });
    prismaMock.userAllowedOption.findFirst.mockResolvedValue({ id: "o1" });
    prismaMock.costCenter.findFirst.mockResolvedValue({ id: "c1", ativo: true });
    prismaMock.discipline.findFirst.mockResolvedValue({ id: "d1", ativo: true });
    prismaMock.location.findFirst.mockResolvedValue({ id: "l1", ativo: true });
    prismaMock.project.findFirst.mockResolvedValue({ id: "p1", ativo: true });
    prismaTxMock.timeEntry.create.mockResolvedValue({ id: "t1" });
  });

  it("cria com duração calculada e job leader ativo", async () => {
    await createTimeEntry(userFunc, inputValido);
    expect(prismaTxMock.timeEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          funcionarioId: "f1", jobLeaderId: "j", duracao: "8.00", status: "PENDENTE", mes: 8, ano: 2026,
        }),
      })
    );
  });

  it("rejeita funcionário sem job leader ativo", async () => {
    prismaMock.jobLeaderAssignment.findFirst.mockResolvedValue(null);
    await expect(createTimeEntry(userFunc, inputValido)).rejects.toThrow(ValidationError);
  });

  it("rejeita funcionário não alocado", async () => {
    prismaMock.allocation.findFirst.mockResolvedValue(null);
    await expect(createTimeEntry(userFunc, inputValido)).rejects.toThrow(ValidationError);
  });

  it("rejeita opção não permitida", async () => {
    prismaMock.userAllowedOption.findFirst.mockResolvedValue(null);
    await expect(createTimeEntry(userFunc, inputValido)).rejects.toThrow(ValidationError);
  });

  it("grava auditoria CRIAR na mesma transação", async () => {
    await createTimeEntry(userFunc, inputValido);
    expect(prismaTxMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ acao: "CRIAR", usuarioId: "f1" }) })
    );
  });
});

describe("approveTimeEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaTxMock.timeEntry.findUnique.mockResolvedValue({
      id: "t1", funcionarioId: "f1", status: "PENDENTE", deletedAt: null,
    });
    prismaTxMock.timeEntry.update.mockResolvedValue({ id: "t1", status: "APROVADA" });
  });

  it("aprova linha pendente do time", async () => {
    await approveTimeEntry(userJL, "t1");
    expect(prismaTxMock.timeEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "APROVADA" }) })
    );
  });

  it("bloqueia aprovar fora do time", async () => {
    prismaTxMock.timeEntry.findUnique.mockResolvedValue({
      id: "t1", funcionarioId: "f9", status: "PENDENTE", deletedAt: null,
    });
    await expect(approveTimeEntry(userJL, "t1")).rejects.toThrow(ForbiddenError);
  });

  it("bloqueia linha já aprovada (409)", async () => {
    prismaTxMock.timeEntry.findUnique.mockResolvedValue({
      id: "t1", funcionarioId: "f1", status: "APROVADA", deletedAt: null,
    });
    await expect(approveTimeEntry(userJL, "t1")).rejects.toThrow(ConflictError);
  });

  it("não encontra linha", async () => {
    prismaTxMock.timeEntry.findUnique.mockResolvedValue(null);
    await expect(approveTimeEntry(userJL, "t1")).rejects.toThrow(NotFoundError);
  });
});

describe("rejectTimeEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaTxMock.timeEntry.findUnique.mockResolvedValue({
      id: "t1", funcionarioId: "f1", status: "PENDENTE", deletedAt: null,
    });
    prismaTxMock.timeEntry.update.mockResolvedValue({ id: "t1", status: "REJEITADA" });
  });

  it("exige motivo", async () => {
    await expect(rejectTimeEntry(userJL, "t1", "  ")).rejects.toThrow(ValidationError);
  });

  it("rejeita com motivo e grava auditoria", async () => {
    await rejectTimeEntry(userJL, "t1", "Descrição incompleta");
    expect(prismaTxMock.timeEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "REJEITADA", motivoRejeicao: "Descrição incompleta" }) })
    );
    expect(prismaTxMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ acao: "REJEITAR", motivo: "Descrição incompleta" }) })
    );
  });
});

describe("resubmitTimeEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaTxMock.timeEntry.findUnique.mockResolvedValue({
      id: "t1", funcionarioId: "f1", status: "REJEITADA", deletedAt: null,
    });
    prismaTxMock.timeEntry.update.mockResolvedValue({ id: "t1", status: "PENDENTE" });
  });

  it("reenvia apenas linha rejeitada própria", async () => {
    await resubmitTimeEntry(userFunc, "t1");
    expect(prismaTxMock.timeEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PENDENTE" }) })
    );
  });

  it("bloqueia reenviar linha de outro usuário", async () => {
    prismaTxMock.timeEntry.findUnique.mockResolvedValue({
      id: "t1", funcionarioId: "f9", status: "REJEITADA", deletedAt: null,
    });
    await expect(resubmitTimeEntry(userFunc, "t1")).rejects.toThrow(ForbiddenError);
  });
});

describe("softDeleteTimeEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaTxMock.timeEntry.findUnique.mockResolvedValue({
      id: "t1", funcionarioId: "f1", status: "APROVADA", deletedAt: null,
    });
    prismaTxMock.timeEntry.update.mockResolvedValue({ id: "t1", deletedAt: new Date() });
  });

  it("somente admin remove", async () => {
    await expect(softDeleteTimeEntry(userFunc, "t1")).rejects.toThrow(ForbiddenError);
    await softDeleteTimeEntry(userAdmin, "t1");
    expect(prismaTxMock.timeEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) })
    );
  });
});
```

- [ ] **Step 2: Rodar testes para falhar**

Run: `npm test -- tests/unit/time-entries.test.ts`
Expected: FAIL — module not found `@/services/time-entries`.

- [ ] **Step 3: Implementar audit.ts**

Criar `src/services/audit.ts`:

```typescript
import { Prisma } from "@prisma/client";

export type AuditTx = Prisma.TransactionClient;

export async function logAudit(
  tx: AuditTx,
  params: {
    timeEntryId: string;
    acao: "CRIAR" | "EDITAR" | "APROVAR" | "REJEITAR" | "REENVIAR" | "REMOVER";
    usuarioId: string;
    motivo?: string;
    dadosAlterados?: unknown;
  }
) {
  await tx.auditLog.create({
    data: {
      timeEntryId: params.timeEntryId,
      acao: params.acao,
      usuarioId: params.usuarioId,
      motivo: params.motivo,
      dadosAlterados: params.dadosAlterados as Prisma.InputJsonValue | undefined,
    },
  });
}
```

- [ ] **Step 4: Implementar time-entries.ts**

Criar `src/services/time-entries.ts`:

```typescript
import { Prisma } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from "@/lib/errors";
import { ERROR_CODES } from "@/lib/error-codes";
import { scopeFilter, getTeamMemberIds } from "./scope";
import { checkPermission } from "./permissions";
import { logAudit } from "./audit";

export type TimeEntryInput = {
  projectId: string;
  data: string;
  mes: number;
  ano: number;
  inicio: string;
  fim: string;
  duracao?: string;
  descricao?: string;
  costCenterId: string;
  disciplineId: string;
  locationId: string;
  horaExtra: boolean;
};

export type TimeEntryQuery = {
  page?: number;
  pageSize?: number;
  mes?: number;
  ano?: number;
  projectId?: string;
  status?: string;
  costCenterId?: string;
  disciplineId?: string;
};

export function calcularDuracao(inicio: string, fim: string): string {
  const [hi, mi] = inicio.split(":").map(Number);
  const [hf, mf] = fim.split(":").map(Number);
  const minutos = hf * 60 + mf - (hi * 60 + mi);
  if (minutos <= 0) throw new ValidationError("O campo início deve ser anterior ao campo fim");
  return (minutos / 60).toFixed(2);
}

async function validarOpcoesPermitidas(userId: string, input: TimeEntryInput) {
  const [cc, disc, loc] = await Promise.all([
    prisma.costCenter.findFirst({ where: { id: input.costCenterId, ativo: true } }),
    prisma.discipline.findFirst({ where: { id: input.disciplineId, ativo: true } }),
    prisma.location.findFirst({ where: { id: input.locationId, ativo: true } }),
  ]);
  if (!cc) throw new ValidationError("Centro de custo não encontrado ou inativo");
  if (!disc) throw new ValidationError("Disciplina não encontrada ou inativa");
  if (!loc) throw new ValidationError("Local não encontrado ou inativo");

  const [optCC, optDisc, optLoc] = await Promise.all([
    prisma.userAllowedOption.findFirst({ where: { userId, tipo: "CENTRO_CUSTO", valorId: input.costCenterId } }),
    prisma.userAllowedOption.findFirst({ where: { userId, tipo: "DISCIPLINA", valorId: input.disciplineId } }),
    prisma.userAllowedOption.findFirst({ where: { userId, tipo: "LOCAL", valorId: input.locationId } }),
  ]);
  if (!optCC || !optDisc || !optLoc) throw new ValidationError("Opção não permitida para este usuário", ERROR_CODES.OPTION_NOT_ALLOWED);
}

async function validarMesAno(input: TimeEntryInput) {
  if (input.mes < 1 || input.mes > 12) throw new ValidationError("Mês inválido");
  if (input.ano < 2000 || input.ano > 2100) throw new ValidationError("Ano inválido");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.data)) throw new ValidationError("Data inválida");
  if (!/^\d{2}:\d{2}$/.test(input.inicio) || !/^\d{2}:\d{2}$/.test(input.fim)) {
    throw new ValidationError("Hora inválida");
  }
}

export async function createTimeEntry(user: SessionUser, input: TimeEntryInput) {
  checkPermission(user, "create", "time-entry");
  await validarMesAno(input);
  const duracao = input.duracao ?? calcularDuracao(input.inicio, input.fim);

  const vinculo = await prisma.jobLeaderAssignment.findFirst({
    where: { funcionarioId: user.id, ativo: true },
  });
  if (!vinculo) throw new ValidationError("Funcionário sem job leader ativo");

  const alocacao = await prisma.allocation.findFirst({
    where: { funcionarioId: user.id, projectId: input.projectId },
  });
  if (!alocacao) throw new ValidationError("Funcionário não alocado neste projeto", ERROR_CODES.EMPLOYEE_NOT_ALLOCATED);

  await validarOpcoesPermitidas(user.id, input);

  const projeto = await prisma.project.findFirst({ where: { id: input.projectId, ativo: true } });
  if (!projeto) throw new ValidationError("Projeto não encontrado ou inativo");

  return prisma.$transaction(async (tx) => {
    const entrada = await tx.timeEntry.create({
      data: {
        funcionarioId: user.id,
        jobLeaderId: vinculo.jobLeaderId,
        projectId: input.projectId,
        mes: input.mes,
        ano: input.ano,
        data: new Date(input.data),
        inicio: input.inicio,
        fim: input.fim,
        duracao: duracao,
        descricao: input.descricao,
        costCenterId: input.costCenterId,
        disciplineId: input.disciplineId,
        locationId: input.locationId,
        horaExtra: input.horaExtra,
        status: "PENDENTE",
      },
    });
    await logAudit(tx, {
      timeEntryId: entrada.id,
      acao: "CRIAR",
      usuarioId: user.id,
      dadosAlterados: input,
    });
    return entrada;
  });
}

export async function listTimeEntries(user: SessionUser, query: TimeEntryQuery) {
  const filtroEscopo = await scopeFilter(user);
  const where: Prisma.TimeEntryWhereInput = {
    ...filtroEscopo,
    deletedAt: null,
    ...(query.mes ? { mes: query.mes } : {}),
    ...(query.ano ? { ano: query.ano } : {}),
    ...(query.projectId ? { projectId: query.projectId } : {}),
    ...(query.status ? { status: query.status as Prisma.EnumSTATUSFilter["equals"] } : {}),
    ...(query.costCenterId ? { costCenterId: query.costCenterId } : {}),
    ...(query.disciplineId ? { disciplineId: query.disciplineId } : {}),
  };
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 25;
  const [items, total] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      include: {
        project: { select: { nome: true } },
        costCenter: { select: { nome: true } },
        discipline: { select: { nome: true } },
        location: { select: { nome: true } },
        funcionario: { select: { id: true, nome: true } },
      },
      orderBy: { criadoEm: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.timeEntry.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getTimeEntry(user: SessionUser, id: string) {
  const filtroEscopo = await scopeFilter(user);
  const entrada = await prisma.timeEntry.findFirst({
    where: { id, ...filtroEscopo, deletedAt: null },
    include: {
      project: true,
      costCenter: true,
      discipline: true,
      location: true,
      funcionario: { select: { id: true, nome: true } },
    },
  });
  if (!entrada) throw new NotFoundError(ERROR_CODES.NOT_FOUND, "Apontamento não encontrado");
  return entrada;
}

export async function updateTimeEntry(user: SessionUser, id: string, input: Partial<TimeEntryInput>) {
  checkPermission(user, "edit", "time-entry");
  const entrada = await getTimeEntry(user, id);
  if (entrada.status === "APROVADA") {
    throw new ValidationError("Linha aprovada não pode ser editada", ERROR_CODES.APPROVED_ENTRY_EDIT);
  }
  if (user.papel === "FUNCIONARIO" && entrada.funcionarioId !== user.id) throw new ForbiddenError();
  if (user.papel === "JOB_LEADER") {
    const teamIds = await getTeamMemberIds(user.id);
    if (!teamIds.includes(entrada.funcionarioId)) throw new ForbiddenError();
  }
  if (input.inicio || input.fim) {
    const inicio = input.inicio ?? entrada.inicio;
    const fim = input.fim ?? entrada.fim;
    if (input.duracao === undefined) calcularDuracao(inicio, fim);
  }
  if (input.costCenterId || input.disciplineId || input.locationId || input.projectId) {
    await validarOpcoesPermitidas(entrada.funcionarioId, {
      ...entrada,
      ...input,
      data: input.data ?? entrada.data.toISOString().slice(0, 10),
      inicio: input.inicio ?? entrada.inicio,
      fim: input.fim ?? entrada.fim,
      horaExtra: input.horaExtra ?? entrada.horaExtra,
      duracao: input.duracao ?? entrada.duracao.toString(),
    } as TimeEntryInput);
  }

  return prisma.$transaction(async (tx) => {
    const atualizada = await tx.timeEntry.update({
      where: { id },
      data: {
        ...(input.projectId ? { projectId: input.projectId } : {}),
        ...(input.data ? { data: new Date(input.data) } : {}),
        ...(input.mes ? { mes: input.mes } : {}),
        ...(input.ano ? { ano: input.ano } : {}),
        ...(input.inicio ? { inicio: input.inicio } : {}),
        ...(input.fim ? { fim: input.fim } : {}),
        ...(input.duracao ? { duracao: input.duracao } : {}),
        ...(input.descricao !== undefined ? { descricao: input.descricao } : {}),
        ...(input.costCenterId ? { costCenterId: input.costCenterId } : {}),
        ...(input.disciplineId ? { disciplineId: input.disciplineId } : {}),
        ...(input.locationId ? { locationId: input.locationId } : {}),
        ...(input.horaExtra !== undefined ? { horaExtra: input.horaExtra } : {}),
      },
    });
    await logAudit(tx, {
      timeEntryId: id,
      acao: "EDITAR",
      usuarioId: user.id,
      dadosAlterados: { antes: entrada, depois: atualizada },
    });
    return atualizada;
  });
}

export async function approveTimeEntry(user: SessionUser, id: string) {
  checkPermission(user, "approve", "time-entry");
  const teamIds = await getTeamMemberIds(user.id);
  return prisma.$transaction(async (tx) => {
    const entrada = await tx.timeEntry.findUnique({ where: { id } });
    if (!entrada || entrada.deletedAt) throw new NotFoundError(ERROR_CODES.NOT_FOUND, "Apontamento não encontrado");
    if (!teamIds.includes(entrada.funcionarioId)) throw new ForbiddenError();
    if (entrada.status === "APROVADA") {
      throw new ConflictError(ERROR_CODES.LINE_ALREADY_APPROVED, "Esta linha já foi aprovada");
    }
    if (entrada.status !== "PENDENTE") throw new ConflictError(ERROR_CODES.CONFLICT, "Apenas linhas pendentes podem ser aprovadas");
    const atualizada = await tx.timeEntry.update({
      where: { id },
      data: { status: "APROVADA" },
    });
    await logAudit(tx, { timeEntryId: id, acao: "APROVAR", usuarioId: user.id });
    return atualizada;
  });
}

export async function rejectTimeEntry(user: SessionUser, id: string, motivo: string) {
  checkPermission(user, "reject", "time-entry");
  if (!motivo || motivo.trim().length < 3) {
    throw new ValidationError("Motivo da rejeição é obrigatório", ERROR_CODES.REJECTION_WITHOUT_REASON);
  }
  const teamIds = await getTeamMemberIds(user.id);
  return prisma.$transaction(async (tx) => {
    const entrada = await tx.timeEntry.findUnique({ where: { id } });
    if (!entrada || entrada.deletedAt) throw new NotFoundError(ERROR_CODES.NOT_FOUND, "Apontamento não encontrado");
    if (!teamIds.includes(entrada.funcionarioId)) throw new ForbiddenError();
    if (entrada.status !== "PENDENTE") throw new ConflictError(ERROR_CODES.CONFLICT, "Apenas linhas pendentes podem ser rejeitadas");
    const atualizada = await tx.timeEntry.update({
      where: { id },
      data: { status: "REJEITADA", motivoRejeicao: motivo.trim() },
    });
    await logAudit(tx, { timeEntryId: id, acao: "REJEITAR", usuarioId: user.id, motivo: motivo.trim() });
    return atualizada;
  });
}

export async function resubmitTimeEntry(user: SessionUser, id: string) {
  checkPermission(user, "resubmit", "time-entry");
  return prisma.$transaction(async (tx) => {
    const entrada = await tx.timeEntry.findUnique({ where: { id } });
    if (!entrada || entrada.deletedAt) throw new NotFoundError(ERROR_CODES.NOT_FOUND, "Apontamento não encontrado");
    if (entrada.funcionarioId !== user.id) throw new ForbiddenError();
    if (entrada.status !== "REJEITADA") throw new ConflictError(ERROR_CODES.CONFLICT, "Apenas linhas rejeitadas podem ser reenviadas");
    const atualizada = await tx.timeEntry.update({
      where: { id },
      data: { status: "PENDENTE", motivoRejeicao: null },
    });
    await logAudit(tx, { timeEntryId: id, acao: "REENVIAR", usuarioId: user.id });
    return atualizada;
  });
}

export async function softDeleteTimeEntry(user: SessionUser, id: string) {
  checkPermission(user, "delete", "time-entry");
  if (user.papel !== "ADMIN") throw new ForbiddenError();
  return prisma.$transaction(async (tx) => {
    const entrada = await tx.timeEntry.findUnique({ where: { id } });
    if (!entrada || entrada.deletedAt) throw new NotFoundError(ERROR_CODES.NOT_FOUND, "Apontamento não encontrado");
    const removida = await tx.timeEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await logAudit(tx, { timeEntryId: id, acao: "REMOVER", usuarioId: user.id });
    return removida;
  });
}
```

- [ ] **Step 5: Rodar testes para passar**

Run: `npm test -- tests/unit/time-entries.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/audit.ts src/services/time-entries.ts tests/unit/time-entries.test.ts
git commit -m "feat: add time entry service with state machine and audit"
```

---

## Task 7: API — rotas de TimeEntry

**Files:**
- Create: `src/lib/api.ts`, `src/schemas/time-entry.ts`, `src/app/api/time-entries/route.ts`, `src/app/api/time-entries/[id]/route.ts`, `src/app/api/time-entries/[id]/approve/route.ts`, `src/app/api/time-entries/[id]/reject/route.ts`, `src/app/api/time-entries/[id]/resubmit/route.ts`

**Interfaces:**
- Consumes: Task 4 (requireUser), Task 6 (services), Task 3 (errors).
- Produces: REST endpoints conforme spec seção 7, helpers `ok(data)`, `fail(error)`.

- [ ] **Step 1: Implementar helpers de API**

Criar `src/lib/api.ts`:

```typescript
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";
import { ERROR_CODES } from "./error-codes";

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: ERROR_CODES.VALIDATION_ERROR, message: error.issues.map((i) => i.message).join("; ") } },
      { status: 400 }
    );
  }
  if (error instanceof AppError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
  }
  console.error(error);
  return NextResponse.json(
    { error: { code: ERROR_CODES.INTERNAL_ERROR, message: "Erro interno" } },
    { status: 500 }
  );
}

export async function parseBody<T>(request: Request, schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: ZodError } }): Promise<T> {
  const body = await request.json().catch(() => null);
  const result = schema.safeParse(body);
  if (!result.success) throw result.error;
  return result.data as T;
}
```

Criar `src/schemas/time-entry.ts`:

```typescript
import { z } from "zod";

export const CreateTimeEntrySchema = z.object({
  projectId: z.string().uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(2000).max(2100),
  inicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora de início inválida"),
  fim: z.string().regex(/^\d{2}:\d{2}$/, "Hora de fim inválida"),
  duracao: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  descricao: z.string().max(1000).optional(),
  costCenterId: z.string().uuid(),
  disciplineId: z.string().uuid(),
  locationId: z.string().uuid(),
  horaExtra: z.boolean().default(false),
});

export const UpdateTimeEntrySchema = CreateTimeEntrySchema.partial();

export const RejectTimeEntrySchema = z.object({
  motivo: z.string().min(3, "Motivo da rejeição é obrigatório"),
});

export const ListTimeEntriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
  projectId: z.string().uuid().optional(),
  status: z.enum(["PENDENTE", "APROVADA", "REJEITADA"]).optional(),
  costCenterId: z.string().uuid().optional(),
  disciplineId: z.string().uuid().optional(),
});
```

- [ ] **Step 2: Criar rotas**

Criar `src/app/api/time-entries/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { createTimeEntry, listTimeEntries } from "@/services/time-entries";
import { CreateTimeEntrySchema, ListTimeEntriesQuerySchema } from "@/schemas/time-entry";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const query = ListTimeEntriesQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const result = await listTimeEntries(user, query);
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await parseBody(request, CreateTimeEntrySchema);
    const entrada = await createTimeEntry(user, body);
    return ok(entrada, 201);
  } catch (error) {
    return fail(error);
  }
}
```

Criar `src/app/api/time-entries/[id]/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { getTimeEntry, updateTimeEntry, softDeleteTimeEntry } from "@/services/time-entries";
import { UpdateTimeEntrySchema } from "@/schemas/time-entry";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    return ok(await getTimeEntry(user, params.id));
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await parseBody(request, UpdateTimeEntrySchema);
    return ok(await updateTimeEntry(user, params.id, body));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    return ok(await softDeleteTimeEntry(user, params.id));
  } catch (error) {
    return fail(error);
  }
}
```

Criar `src/app/api/time-entries/[id]/approve/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { approveTimeEntry } from "@/services/time-entries";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    return ok(await approveTimeEntry(user, params.id));
  } catch (error) {
    return fail(error);
  }
}
```

Criar `src/app/api/time-entries/[id]/reject/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { rejectTimeEntry } from "@/services/time-entries";
import { RejectTimeEntrySchema } from "@/schemas/time-entry";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await parseBody(request, RejectTimeEntrySchema);
    return ok(await rejectTimeEntry(user, params.id, body.motivo));
  } catch (error) {
    return fail(error);
  }
}
```

Criar `src/app/api/time-entries/[id]/resubmit/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { resubmitTimeEntry } from "@/services/time-entries";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    return ok(await resubmitTimeEntry(user, params.id));
  } catch (error) {
    return fail(error);
  }
}
```

- [ ] **Step 3: Escrever teste de integração (falha)**

Criar `tests/api/time-entries.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
  getSessionUser: vi.fn(),
}));
vi.mock("@/services/scope", () => ({
  getTeamMemberIds: vi.fn().mockResolvedValue(["f1"]),
  scopeFilter: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/services/permissions", () => ({ checkPermission: vi.fn() }));
vi.mock("@/services/audit", () => ({ logAudit: vi.fn() }));

const prismaMock = {
  jobLeaderAssignment: { findFirst: vi.fn(), findMany: vi.fn() },
  allocation: { findFirst: vi.fn() },
  userAllowedOption: { findFirst: vi.fn() },
  costCenter: { findFirst: vi.fn() },
  discipline: { findFirst: vi.fn() },
  location: { findFirst: vi.fn() },
  project: { findFirst: vi.fn() },
  timeEntry: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  auditLog: { create: vi.fn() },
  $transaction: vi.fn((fn) => fn(prismaMock)),
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { requireUser } from "@/lib/auth";
import { POST, GET } from "@/app/api/time-entries/route";

const userAdmin = { id: "a", nome: "A", email: "a@mcm.local", papel: "ADMIN" };

describe("POST /api/time-entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue(userAdmin);
    prismaMock.jobLeaderAssignment.findFirst.mockResolvedValue({ id: "v1", jobLeaderId: "j" });
    prismaMock.allocation.findFirst.mockResolvedValue({ id: "al1" });
    prismaMock.userAllowedOption.findFirst.mockResolvedValue({ id: "o1" });
    prismaMock.costCenter.findFirst.mockResolvedValue({ id: "c1", ativo: true });
    prismaMock.discipline.findFirst.mockResolvedValue({ id: "d1", ativo: true });
    prismaMock.location.findFirst.mockResolvedValue({ id: "l1", ativo: true });
    prismaMock.project.findFirst.mockResolvedValue({ id: "p1", ativo: true });
  });

  it("retorna 201 ao criar", async () => {
    prismaMock.timeEntry.create.mockResolvedValue({ id: "t1" });
    const req = new Request("http://localhost/api/time-entries", {
      method: "POST",
      body: JSON.stringify({
        projectId: "00000000-0000-0000-0000-000000000001",
        data: "2026-08-10", mes: 8, ano: 2026,
        inicio: "09:00", fim: "17:00",
        costCenterId: "00000000-0000-0000-0000-000000000002",
        disciplineId: "00000000-0000-0000-0000-000000000003",
        locationId: "00000000-0000-0000-0000-000000000004",
        horaExtra: false,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toEqual({ id: "t1" });
  });

  it("retorna 401 sem usuário", async () => {
    requireUser.mockRejectedValue(Object.assign(new Error("Não autenticado"), { statusCode: 401, code: "UNAUTHORIZED" }));
    const req = new Request("http://localhost/api/time-entries", { method: "POST", body: "{}" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 com corpo inválido", async () => {
    const req = new Request("http://localhost/api/time-entries", { method: "POST", body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/time-entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue(userAdmin);
    prismaMock.timeEntry.findMany.mockResolvedValue([]);
    prismaMock.timeEntry.count.mockResolvedValue(0);
  });

  it("retorna lista paginada", async () => {
    const req = new Request("http://localhost/api/time-entries?page=1&pageSize=25");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual({ items: [], total: 0, page: 1, pageSize: 25 });
  });
});
```

- [ ] **Step 4: Rodar testes para passar**

Run: `npm test -- tests/api/time-entries.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.ts src/schemas/time-entry.ts src/app/api/time-entries tests/api/time-entries.test.ts
git commit -m "feat: add time entry API routes"
```

---

## Instruções finais

- Abra o arquivo em modo append e adicione o conteúdo da Parte 2 exatamente como acima. NÃO faça commit.
- Retorne: caminho do arquivo e número de linhas do arquivo após o append.

## Task 8: API e serviços de parâmetros e admin

**Files:**
- Create: src/services/params.ts, src/services/users.ts, src/schemas/params.ts, src/schemas/users.ts, src/schemas/assignments.ts, src/schemas/allowed-options.ts
- Create rotas: src/app/api/cost-centers/route.ts, src/app/api/cost-centers/[id]/route.ts, e o MESMO padrão para disciplines, locations, projects, allocations, users, job-leader-assignments, user-allowed-options.

**Interfaces:**
- Consumes: Task 4 (requireUser/requireRole), Task 3 (errors).
- Produces: serviços genéricos listParams, createParam, updateParam, deactivateParam (soft), serviços de users/assignments/options; rotas REST admin-only.

- [ ] **Step 1: Escrever testes do serviço de parâmetros (falham)**

Criar 	ests/unit/params.test.ts:

`	ypescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const model = {
  findMany: vi.fn(), create: vi.fn(), update: vi.fn(),
};
const prismaMock = {
  costCenter: model, discipline: model, location: model, project: model,
  allocation: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
  userAllowedOption: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
  jobLeaderAssignment: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { deactivateParam, createParam } from "@/services/params";
import { createAssignment } from "@/services/users";

describe("params", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cria parâmetro", async () => {
    model.create.mockResolvedValue({ id: "x", nome: "Engenharia", ativo: true });
    const r = await createParam("costCenter", { nome: "Engenharia" });
    expect(model.create).toHaveBeenCalledWith({ data: { nome: "Engenharia" } });
    expect(r.nome).toBe("Engenharia");
  });

  it("desativa em vez de deletar", async () => {
    model.update.mockResolvedValue({ id: "x", ativo: false });
    await deactivateParam("costCenter", "x");
    expect(model.update).toHaveBeenCalledWith({
      where: { id: "x" },
      data: { ativo: false },
    });
  });

  it("cria vínculo desativando o anterior", async () => {
    prismaMock.jobLeaderAssignment.findFirst.mockResolvedValue({ id: "v1", ativo: true });
    prismaMock.jobLeaderAssignment.create.mockResolvedValue({ id: "v2" });
    await createAssignment("f1", "j1");
    expect(prismaMock.jobLeaderAssignment.update).toHaveBeenCalledWith({
      where: { id: "v1" }, data: { ativo: false },
    });
    expect(prismaMock.jobLeaderAssignment.create).toHaveBeenCalledWith({
      data: { funcionarioId: "f1", jobLeaderId: "j1", ativo: true },
    });
  });
});
`

- [ ] **Step 2: Rodar testes para falhar**

Run: 
pm test -- tests/unit/params.test.ts
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar serviços**

Criar src/services/params.ts:

`	ypescript
import { prisma } from "@/lib/prisma";

type ParamModel = "costCenter" | "discipline" | "location" | "project";

const models: Record<ParamModel, typeof prisma.costCenter> = {
  costCenter: prisma.costCenter,
  discipline: prisma.discipline,
  location: prisma.location,
  project: prisma.project,
};

export async function listParams(model: ParamModel, ativosOnly = false) {
  return models[model].findMany({
    where: ativosOnly ? { ativo: true } : undefined,
    orderBy: { nome: "asc" },
  });
}

export async function createParam(model: ParamModel, data: { nome: string }) {
  return models[model].create({ data });
}

export async function updateParam(model: ParamModel, id: string, data: { nome?: string; ativo?: boolean }) {
  return models[model].update({ where: { id }, data });
}

export async function deactivateParam(model: ParamModel, id: string) {
  return models[model].update({ where: { id }, data: { ativo: false } });
}
`

Criar src/services/users.ts:

`	ypescript
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { ERROR_CODES } from "@/lib/error-codes";

export async function createUser(data: { nome: string; email: string; senha: string; papel: "ADMIN" | "JOB_LEADER" | "FUNCIONARIO" }) {
  const existe = await prisma.user.findUnique({ where: { email: data.email } });
  if (existe) throw new ValidationError("E-mail já cadastrado");
  const senhaHash = await bcrypt.hash(data.senha, 10);
  return prisma.user.create({
    data: {
      nome: data.nome,
      email: data.email,
      senhaHash,
      papel: data.papel,
    },
    select: { id: true, nome: true, email: true, papel: true, ativo: true, criadoEm: true },
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, email: true, papel: true, ativo: true, criadoEm: true },
  });
}

export async function updateUser(id: string, data: { nome?: string; email?: string; papel?: "ADMIN" | "JOB_LEADER" | "FUNCIONARIO"; ativo?: boolean; senha?: string }) {
  const updateData: Record<string, unknown> = {};
  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.papel !== undefined) updateData.papel = data.papel;
  if (data.ativo !== undefined) updateData.ativo = data.ativo;
  if (data.senha) updateData.senhaHash = await bcrypt.hash(data.senha, 10);
  return prisma.user.update({ where: { id }, data: updateData });
}

export async function deactivateUser(id: string) {
  return prisma.user.update({ where: { id }, data: { ativo: false } });
}

export async function listAssignments() {
  return prisma.jobLeaderAssignment.findMany({
    where: { ativo: true },
    include: { funcionario: { select: { nome: true } }, jobLeader: { select: { nome: true } } },
    orderBy: { criadoEm: "desc" },
  });
}

export async function createAssignment(funcionarioId: string, jobLeaderId: string) {
  const atual = await prisma.jobLeaderAssignment.findFirst({ where: { funcionarioId, ativo: true } });
  if (atual) {
    await prisma.jobLeaderAssignment.update({ where: { id: atual.id }, data: { ativo: false } });
  }
  return prisma.jobLeaderAssignment.create({
    data: { funcionarioId, jobLeaderId, ativo: true },
  });
}

export async function deactivateAssignment(id: string) {
  return prisma.jobLeaderAssignment.update({ where: { id }, data: { ativo: false } });
}

export async function listAllowedOptions(userId?: string) {
  return prisma.userAllowedOption.findMany({
    where: userId ? { userId } : undefined,
    include: { user: { select: { nome: true } } },
    orderBy: { criadoEm: "desc" },
  });
}

export async function setAllowedOption(userId: string, tipo: "DISCIPLINA" | "CENTRO_CUSTO" | "LOCAL", valorId: string) {
  return prisma.userAllowedOption.create({ data: { userId, tipo, valorId } });
}

export async function removeAllowedOption(id: string) {
  return prisma.userAllowedOption.delete({ where: { id } });
}
`

- [ ] **Step 4: Criar schemas**

Criar src/schemas/params.ts:

`	ypescript
import { z } from "zod";

export const CreateParamSchema = z.object({ nome: z.string().min(1).max(255) });
export const UpdateParamSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  ativo: z.boolean().optional(),
});
`

Criar src/schemas/users.ts:

`	ypescript
import { z } from "zod";

export const CreateUserSchema = z.object({
  nome: z.string().min(1).max(255),
  email: z.string().email(),
  senha: z.string().min(6),
  papel: z.enum(["ADMIN", "JOB_LEADER", "FUNCIONARIO"]),
});

export const UpdateUserSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  senha: z.string().min(6).optional(),
  papel: z.enum(["ADMIN", "JOB_LEADER", "FUNCIONARIO"]).optional(),
  ativo: z.boolean().optional(),
});
`

Criar src/schemas/assignments.ts:

`	ypescript
import { z } from "zod";

export const CreateAssignmentSchema = z.object({
  funcionarioId: z.string().uuid(),
  jobLeaderId: z.string().uuid(),
});
`

Criar src/schemas/allowed-options.ts:

`	ypescript
import { z } from "zod";

export const CreateAllowedOptionSchema = z.object({
  userId: z.string().uuid(),
  tipo: z.enum(["DISCIPLINA", "CENTRO_CUSTO", "LOCAL"]),
  valorId: z.string().uuid(),
});
`

- [ ] **Step 5: Criar rotas (padrão repetido por recurso)**

Criar src/app/api/cost-centers/route.ts:

`	ypescript
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { listParams, createParam } from "@/services/params";
import { CreateParamSchema } from "@/schemas/params";

export async function GET() {
  try {
    const user = await requireRole("ADMIN");
    return ok(await listParams("costCenter"));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("ADMIN");
    const body = await parseBody(request, CreateParamSchema);
    return ok(await createParam("costCenter", body), 201);
  } catch (error) {
    return fail(error);
  }
}
`

Criar src/app/api/cost-centers/[id]/route.ts:

`	ypescript
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { ok, fail, parseBody } from "@/lib/api";
import { updateParam, deactivateParam } from "@/services/params";
import { UpdateParamSchema } from "@/schemas/params";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("ADMIN");
    const body = await parseBody(request, UpdateParamSchema);
    return ok(await updateParam("costCenter", params.id, body));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("ADMIN");
    return ok(await deactivateParam("costCenter", params.id));
  } catch (error) {
    return fail(error);
  }
}
`

Repetir o padrão exato para: disciplines, locations, projects (trocando o nome do modelo na chamada: "discipline", "location", "project"). Para allocations, users, job-leader-assignments e user-allowed-options, criar rotas análogas usando os serviços de users.ts e schemas correspondentes:

- src/app/api/allocations/route.ts: GET usa prisma.allocation.findMany com include do funcionário e projeto; POST usa CreateAllocationSchema (funcionarioId + projectId, uuid) e prisma.allocation.create; src/app/api/allocations/[id]/route.ts: DELETE usa prisma.allocation.delete.
- src/app/api/users/route.ts: GET usa listUsers; POST usa CreateUserSchema e createUser. src/app/api/users/[id]/route.ts: PUT usa UpdateUserSchema e updateUser; DELETE usa deactivateUser.
- src/app/api/job-leader-assignments/route.ts: GET usa listAssignments; POST usa CreateAssignmentSchema e createAssignment. src/app/api/job-leader-assignments/[id]/route.ts: DELETE usa deactivateAssignment.
- src/app/api/user-allowed-options/route.ts: GET usa listAllowedOptions; POST usa CreateAllowedOptionSchema e setAllowedOption. src/app/api/user-allowed-options/[id]/route.ts: DELETE usa emoveAllowedOption.

- [ ] **Step 6: Rodar testes para passar**

Run: 
pm test -- tests/unit/params.test.ts
Expected: PASS.

- [ ] **Step 7: Rodar build**

Run: 
pm run build
Expected: build passa (todas as rotas admin compilam).

- [ ] **Step 8: Commit**

`ash
git add src/services/params.ts src/services/users.ts src/schemas/params.ts src/schemas/users.ts src/schemas/assignments.ts src/schemas/allowed-options.ts src/app/api/cost-centers src/app/api/disciplines src/app/api/locations src/app/api/projects src/app/api/allocations src/app/api/users src/app/api/job-leader-assignments src/app/api/user-allowed-options tests/unit/params.test.ts
git commit -m "feat: add params and admin services and routes"
`

---

## Task 9: API — relatórios e auditoria

**Files:**
- Create: src/services/reports.ts, src/app/api/reports/hours-by-project/route.ts, src/app/api/reports/hours-by-employee/route.ts, src/app/api/reports/hours-by-cost-center/route.ts, src/app/api/reports/hours-by-discipline/route.ts, src/app/api/reports/hours-by-period/route.ts, src/app/api/audit-log/route.ts

**Interfaces:**
- Consumes: Task 4 (requireUser), Task 5 (scopeFilter), Task 2 (prisma).
- Produces: agregações por dimensão (spec seção 7), lista de audit log com escopo.

- [ ] **Step 1: Escrever testes (falham)**

Criar 	ests/unit/reports.test.ts:

`	ypescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = {
  timeEntry: { groupBy: vi.fn() },
  project: { findMany: vi.fn() },
  user: { findMany: vi.fn() },
  costCenter: { findMany: vi.fn() },
  discipline: { findMany: vi.fn() },
  auditLog: { findMany: vi.fn(), count: vi.fn() },
  jobLeaderAssignment: { findMany: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/services/scope", () => ({
  getTeamMemberIds: vi.fn().mockResolvedValue(["f1", "f2"]),
  scopeFilter: vi.fn().mockImplementation((user) =>
    user.papel === "ADMIN" ? Promise.resolve({}) : Promise.resolve({ funcionarioId: { in: ["f1", "f2"] } })
  ),
}));

import { hoursByProject, listAuditLog } from "@/services/reports";

const userAdmin = { id: "a", nome: "A", email: "a@mcm.local", papel: "ADMIN" };

describe("hoursByProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("agrega por projeto apenas aprovadas", async () => {
    prismaMock.timeEntry.groupBy.mockResolvedValue([
      { projectId: "p1", _sum: { duracao: 10.5 } },
      { projectId: "p2", _sum: { duracao: 4.25 } },
    ]);
    prismaMock.project.findMany.mockResolvedValue([
      { id: "p1", nome: "Projeto A" }, { id: "p2", nome: "Projeto B" },
    ]);
    const result = await hoursByProject(userAdmin, {});
    expect(prismaMock.timeEntry.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["projectId"],
        where: expect.objectContaining({ status: "APROVADA", deletedAt: null }),
        _sum: { duracao: true },
      })
    );
    expect(result).toHaveLength(2);
  });
});

describe("listAuditLog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filtra pelo escopo via relação timeEntry", async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([]);
    prismaMock.auditLog.count.mockResolvedValue(0);
    const result = await listAuditLog(userAdmin, {});
    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 50 });
  });
});
`

- [ ] **Step 2: Rodar testes para falhar**

Run: 
pm test -- tests/unit/reports.test.ts
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar reports**

Criar src/services/reports.ts:

`	ypescript
import { Prisma } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scopeFilter } from "./scope";

type ReportQuery = { mes?: number; ano?: number; projectId?: string };

async function baseWhere(user: SessionUser, query: ReportQuery) {
  const filtroEscopo = await scopeFilter(user);
  return {
    ...filtroEscopo,
    status: "APROVADA" as const,
    deletedAt: null,
    ...(query.mes ? { mes: query.mes } : {}),
    ...(query.ano ? { ano: query.ano } : {}),
    ...(query.projectId ? { projectId: query.projectId } : {}),
  };
}

export async function hoursByProject(user: SessionUser, query: ReportQuery) {
  const where = await baseWhere(user, query);
  const rows = await prisma.timeEntry.groupBy({
    by: ["projectId"],
    where,
    _sum: { duracao: true },
    orderBy: { _sum: { duracao: "desc" } },
  });
  const projetos = await prisma.project.findMany({
    where: { id: { in: rows.map((r) => r.projectId) } },
    select: { id: true, nome: true },
  });
  const nomes = new Map(projetos.map((p) => [p.id, p.nome]));
  return rows.map((r) => ({
    projectId: r.projectId,
    projectName: nomes.get(r.projectId) ?? "Desconhecido",
    totalHoras: r._sum.duracao?.toString() ?? "0",
  }));
}

export async function hoursByEmployee(user: SessionUser, query: ReportQuery) {
  const where = await baseWhere(user, query);
  const rows = await prisma.timeEntry.groupBy({
    by: ["funcionarioId"],
    where,
    _sum: { duracao: true },
    orderBy: { _sum: { duracao: "desc" } },
  });
  const users = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.funcionarioId) } },
    select: { id: true, nome: true },
  });
  const nomes = new Map(users.map((u) => [u.id, u.nome]));
  return rows.map((r) => ({
    funcionarioId: r.funcionarioId,
    funcionarioNome: nomes.get(r.funcionarioId) ?? "Desconhecido",
    totalHoras: r._sum.duracao?.toString() ?? "0",
  }));
}

export async function hoursByCostCenter(user: SessionUser, query: ReportQuery) {
  const where = await baseWhere(user, query);
  const rows = await prisma.timeEntry.groupBy({
    by: ["costCenterId"],
    where,
    _sum: { duracao: true },
    orderBy: { _sum: { duracao: "desc" } },
  });
  const ccs = await prisma.costCenter.findMany({
    where: { id: { in: rows.map((r) => r.costCenterId) } },
    select: { id: true, nome: true },
  });
  const nomes = new Map(ccs.map((c) => [c.id, c.nome]));
  return rows.map((r) => ({
    costCenterId: r.costCenterId,
    costCenterName: nomes.get(r.costCenterId) ?? "Desconhecido",
    totalHoras: r._sum.duracao?.toString() ?? "0",
  }));
}

export async function hoursByDiscipline(user: SessionUser, query: ReportQuery) {
  const where = await baseWhere(user, query);
  const rows = await prisma.timeEntry.groupBy({
    by: ["disciplineId"],
    where,
    _sum: { duracao: true },
    orderBy: { _sum: { duracao: "desc" } },
  });
  const disciplinas = await prisma.discipline.findMany({
    where: { id: { in: rows.map((r) => r.disciplineId) } },
    select: { id: true, nome: true },
  });
  const nomes = new Map(disciplinas.map((d) => [d.id, d.nome]));
  return rows.map((r) => ({
    disciplineId: r.disciplineId,
    disciplineName: nomes.get(r.disciplineId) ?? "Desconhecido",
    totalHoras: r._sum.duracao?.toString() ?? "0",
  }));
}

export async function hoursByPeriod(user: SessionUser, query: ReportQuery) {
  const where = await baseWhere(user, query);
  const rows = await prisma.timeEntry.groupBy({
    by: ["mes", "ano"],
    where,
    _sum: { duracao: true },
    orderBy: [{ ano: "asc" }, { mes: "asc" }],
  });
  return rows.map((r) => ({
    mes: r.mes,
    ano: r.ano,
    totalHoras: r._sum.duracao?.toString() ?? "0",
  }));
}

export async function listAuditLog(user: SessionUser, query: { page?: number; pageSize?: number }) {
  const filtroEscopo = await scopeFilter(user);
  const where: Prisma.AuditLogWhereInput = {
    timeEntry: { ...filtroEscopo, deletedAt: null },
  };
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 50;
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        timeEntry: { select: { id: true, data: true, funcionarioId: true } },
        usuario: { select: { id: true, nome: true } },
      },
      orderBy: { quando: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total, page, pageSize };
}
`

- [ ] **Step 4: Criar rotas de relatório**

Criar src/app/api/reports/hours-by-project/route.ts:

`	ypescript
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { hoursByProject } from "@/services/reports";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const query = {
      mes: params.mes ? Number(params.mes) : undefined,
      ano: params.ano ? Number(params.ano) : undefined,
      projectId: params.projectId,
    };
    return ok(await hoursByProject(user, query));
  } catch (error) {
    return fail(error);
  }
}
`

Repetir o padrão para hours-by-employee, hours-by-cost-center, hours-by-discipline, hours-by-period trocando a função importada.

Criar src/app/api/audit-log/route.ts:

`	ypescript
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { listAuditLog } from "@/services/reports";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const page = Number(request.nextUrl.searchParams.get("page") ?? 1);
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? 50);
    return ok(await listAuditLog(user, { page, pageSize }));
  } catch (error) {
    return fail(error);
  }
}
`

- [ ] **Step 5: Rodar testes para passar**

Run: 
pm test -- tests/unit/reports.test.ts
Expected: PASS.

- [ ] **Step 6: Rodar build**

Run: 
pm run build
Expected: build passa.

- [ ] **Step 7: Commit**

`ash
git add src/services/reports.ts src/app/api/reports src/app/api/audit-log tests/unit/reports.test.ts
git commit -m "feat: add reports and audit log API"
`

---

## Instruções finais

- Abra o arquivo em modo append e adicione o conteúdo da Parte 3 exatamente como acima. NÃO faça commit.
- Retorne: caminho do arquivo e número de linhas do arquivo após o append.

## Task 10: Frontend — shell e login

**Files:**
- Create: `src/components/layout/sidebar.tsx`, `src/components/layout/topbar.tsx`, `src/components/layout/user-menu.tsx`, `src/components/layout/command-palette.tsx`, `src/app/(app)/layout.tsx`
- Modify: `src/app/layout.tsx`, `src/app/globals.css`
- Rodar: `npx shadcn@latest init` e `npx shadcn@latest add button card input label select textarea badge table dropdown-menu dialog drawer checkbox skeleton avatar tooltip command`

**Interfaces:**
- Consumes: Task 4 (auth), Task 1 (shadcn).
- Produces: shell autenticado com navegação por papel, login funcional.

- [ ] **Step 1: Configurar shadcn**

Run: `npx shadcn@latest init` (responder defaults; selecionar base color slate, css variables yes) e `npx shadcn@latest add button card input label select textarea badge table dropdown-menu dialog drawer checkbox skeleton avatar tooltip command`
Expected: componentes criados em `src/components/ui/`.

Nota: adicionar ao `src/app/globals.css` as variáveis de cor semântica do DESIGN.md nos blocos `:root` e `.dark`: `--success: #22c55e;`, `--warning: #f59e0b;`, `--info: #06b6d4;` (e registrá-las no tema do Tailwind, ex.: `success`, `warning`, `info` em `tailwind.config.ts` ou `@theme` inline, conforme a versão do shadcn) para que classes como `bg-success/15 text-warning` funcionem.

- [ ] **Step 2: Escrever teste do Sidebar (falha)**

Criar `tests/unit/sidebar.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/time-entries",
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Sidebar", () => {
  it("exibe navegação para funcionário", () => {
    render(<Sidebar papel="FUNCIONARIO" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Apontamentos")).toBeInTheDocument();
    expect(screen.queryByText("Aprovações")).not.toBeInTheDocument();
    expect(screen.queryByText("Administração")).not.toBeInTheDocument();
  });

  it("exibe navegação de admin", () => {
    render(<Sidebar papel="ADMIN" />);
    expect(screen.getByText("Administração")).toBeInTheDocument();
  });

  it("exibe navegação de job leader", () => {
    render(<Sidebar papel="JOB_LEADER" />);
    expect(screen.getByText("Aprovações")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Rodar teste para falhar**

Run: `npm test -- tests/unit/sidebar.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implementar componentes de layout**

Criar `src/components/layout/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, CheckSquare, BarChart3, ScrollText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

type Papel = "ADMIN" | "JOB_LEADER" | "FUNCIONARIO";

const itensBase = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/time-entries", label: "Apontamentos", icon: Clock },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/audit", label: "Auditoria", icon: ScrollText },
];

export function Sidebar({ papel }: { papel: Papel }) {
  const pathname = usePathname();
  const itens = [
    ...itensBase,
    ...(papel === "JOB_LEADER" ? [{ href: "/approvals", label: "Aprovações", icon: CheckSquare }] : []),
    ...(papel === "ADMIN" ? [{ href: "/admin", label: "Administração", icon: Settings }] : []),
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-background">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-sm font-semibold">MCM — Horas</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {itens.map((item) => {
          const ativo = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors",
                ativo ? "border-l-[3px] border-primary bg-muted text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <UserMenu />
      </div>
    </aside>
  );
}
```

Criar `src/components/layout/user-menu.tsx`:

```tsx
"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut className="h-4 w-4" />
      Sair
    </Button>
  );
}
```

Criar `src/components/layout/topbar.tsx`:

```tsx
"use client";

import { CommandPalette } from "./command-palette";

export function Topbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background pl-60 pr-4">
      <CommandPalette />
    </header>
  );
}
```

Criar `src/components/layout/command-palette.tsx` (versão mínima com atalho cmd+k que navega para busca):

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function CommandPalette() {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setAberto((v) => !v);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!aberto) return <Search className="h-4 w-4 text-muted-foreground" />;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24" onClick={() => setAberto(false)}>
      <div className="w-full max-w-md rounded-md border border-border bg-background p-2" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="w-full rounded-sm border border-border bg-muted px-3 py-2 text-sm outline-none"
          placeholder="Buscar página..."
          onKeyDown={(e) => {
            if (e.key === "Escape") setAberto(false);
            if (e.key === "Enter") {
              router.push("/time-entries");
              setAberto(false);
            }
          }}
        />
      </div>
    </div>
  );
}
```

Criar `src/app/(app)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <Sidebar papel={user.papel} />
      <Topbar />
      <main className="pl-60 pt-14">
        <div className="mx-auto max-w-[1600px] p-6">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Rodar teste para passar**

Run: `npm test -- tests/unit/sidebar.test.tsx`
Expected: PASS.

- [ ] **Step 6: Rodar build**

Run: `npm run build`
Expected: build passa.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add app shell and login"
```

---

## Task 11: Frontend — dashboard

**Files:**
- Create: `src/components/kpi-card.tsx`, `src/components/status-badge.tsx`, `src/components/chart-card.tsx`, `src/components/projeto-chart.tsx`, `src/app/(app)/page.tsx`

**Interfaces:**
- Consumes: Task 9 (reports API), Task 10 (shell).
- Produces: dashboard com KPIs e gráficos (horas por projeto e por período) respeitando o escopo do usuário.

- [ ] **Step 1: Escrever testes dos componentes (falham)**

Criar `tests/unit/status-badge.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/status-badge";

describe("StatusBadge", () => {
  it("mostra Pendente", () => {
    render(<StatusBadge status="PENDENTE" />);
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });

  it("mostra Aprovada", () => {
    render(<StatusBadge status="APROVADA" />);
    expect(screen.getByText("Aprovada")).toBeInTheDocument();
  });

  it("mostra Rejeitada", () => {
    render(<StatusBadge status="REJEITADA" />);
    expect(screen.getByText("Rejeitada")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar testes para falhar**

Run: `npm test -- tests/unit/status-badge.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar componentes**

Criar `src/components/status-badge.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "PENDENTE" | "APROVADA" | "REJEITADA";

const config: Record<Status, { label: string; className: string }> = {
  PENDENTE: { label: "Pendente", className: "bg-warning/15 text-warning border-warning/30" },
  APROVADA: { label: "Aprovada", className: "bg-success/15 text-success border-success/30" },
  REJEITADA: { label: "Rejeitada", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = config[status];
  return <Badge variant="outline" className={cn("font-medium", cfg.className)}>{cfg.label}</Badge>;
}
```

Criar `src/components/kpi-card.tsx`:

```tsx
import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
```

Criar `src/components/chart-card.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
```

Criar `src/components/projeto-chart.tsx`:

```tsx
"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ProjetoChart({ data }: { data: { projectName: string; totalHoras: string }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="projectName" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 6 }} />
          <Bar dataKey="totalHoras" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

Criar `src/app/(app)/page.tsx` (server component que busca dados via serviços e renderiza KPIs + gráficos):

```tsx
import { getSessionUser } from "@/lib/auth";
import { KpiCard } from "@/components/kpi-card";
import { ChartCard } from "@/components/chart-card";
import { ProjetoChart } from "@/components/projeto-chart";
import { hoursByProject, hoursByPeriod } from "@/services/reports";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [porProjeto, porPeriodo] = await Promise.all([
    hoursByProject(user, {}),
    hoursByPeriod(user, {}),
  ]);

  const totalHoras = porProjeto.reduce((acc, p) => acc + Number(p.totalHoras), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Horas aprovadas" value={totalHoras.toFixed(2)} sub="Período total" />
        <KpiCard label="Projetos" value={String(porProjeto.length)} />
        <KpiCard label="Meses com apontamento" value={String(porPeriodo.length)} />
      </div>
      <ChartCard title="Horas por projeto">
        <ProjetoChart data={porProjeto} />
      </ChartCard>
    </div>
  );
}
```

- [ ] **Step 4: Rodar testes para passar**

Run: `npm test -- tests/unit/status-badge.test.tsx`
Expected: PASS.

- [ ] **Step 5: Rodar build**

Run: `npm run build`
Expected: build passa.

- [ ] **Step 6: Commit**

```bash
git add src/components/kpi-card.tsx src/components/status-badge.tsx src/components/chart-card.tsx src/components/projeto-chart.tsx src/app/(app)/page.tsx tests/unit/status-badge.test.tsx
git commit -m "feat: add dashboard with KPIs and charts"
```

---

## Task 12: Frontend — apontamentos (tabela, filtros, formulário, drawer)

**Files:**
- Create: `src/components/data-table.tsx`, `src/components/time-entry-form.tsx`, `src/app/(app)/time-entries/page.tsx`, `src/app/(app)/time-entries/new/page.tsx`, `src/app/(app)/time-entries/[id]/page.tsx`

**Interfaces:**
- Consumes: Task 7 (API), Task 9 (API), Task 10 (shell), Task 11 (StatusBadge).
- Produces: página de lista com DataTable (sort, filtros, paginação), formulário de criação/edição com validação, detalhe/edição em drawer.

- [ ] **Step 1: Escrever testes do DataTable (falham)**

Criar `tests/unit/data-table.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable } from "@/components/data-table";

const columns = [
  { key: "data", header: "Data" },
  { key: "duracao", header: "Duração" },
];

const rows = [{ id: "1", data: "2026-08-10", duracao: "8.00" }];

describe("DataTable", () => {
  it("renderiza cabeçalhos e linhas", () => {
    render(<DataTable columns={columns} rows={rows} total={1} page={1} pageSize={25} onPageChange={vi.fn()} />);
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Duração")).toBeInTheDocument();
    expect(screen.getByText("2026-08-10")).toBeInTheDocument();
  });

  it("mostra empty state quando não há linhas", () => {
    render(<DataTable columns={columns} rows={[]} total={0} page={1} pageSize={25} onPageChange={vi.fn()} />);
    expect(screen.getByText("Nenhum registro encontrado")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar testes para falhar**

Run: `npm test -- tests/unit/data-table.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar DataTable**

Criar `src/components/data-table.tsx`:

```tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  total,
  page,
  pageSize,
  onPageChange,
}: {
  columns: Column<T>[];
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.className}>{c.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} registro(s) — página {page} de {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implementar formulário e páginas**

Criar `src/components/time-entry-form.tsx` (client component com React Hook Form + Zod; carrega opções permitidas do funcionário; envia para /api/time-entries):

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  projectId: z.string().min(1, "Selecione o projeto"),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  mes: z.coerce.number().int().min(1).max(12),
  ano: z.coerce.number().int().min(2000).max(2100),
  inicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  fim: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  duracao: z.string().optional(),
  descricao: z.string().max(1000).optional(),
  costCenterId: z.string().min(1, "Selecione o centro de custo"),
  disciplineId: z.string().min(1, "Selecione a disciplina"),
  locationId: z.string().min(1, "Selecione o local"),
  horaExtra: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export function TimeEntryForm({ initial }: { initial?: Partial<FormData> }) {
  const router = useRouter();
  const [opcoes, setOpcoes] = useState<{
    projects: { id: string; nome: string }[];
    costCenters: { id: string; nome: string }[];
    disciplines: { id: string; nome: string }[];
    locations: { id: string; nome: string }[];
  }>({ projects: [], costCenters: [], disciplines: [], locations: [] });
  const [erro, setErro] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { horaExtra: false, ...initial },
  });

  useEffect(() => {
    async function load() {
      const [projects, costCenters, disciplines, locations] = await Promise.all([
        fetch("/api/projects?ativos=true").then((r) => r.json()).then((r) => r.data),
        fetch("/api/cost-centers?ativos=true").then((r) => r.json()).then((r) => r.data),
        fetch("/api/disciplines?ativos=true").then((r) => r.json()).then((r) => r.data),
        fetch("/api/locations?ativos=true").then((r) => r.json()).then((r) => r.data),
      ]);
      setOpcoes({ projects, costCenters, disciplines, locations });
    }
    load();
  }, []);

  async function onSubmit(data: FormData) {
    setErro(null);
    const res = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) {
      setErro(body.error?.message ?? "Erro ao salvar");
      return;
    }
    router.push("/time-entries");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="data">Data</Label>
          <Input id="data" type="date" {...register("data")} />
          {errors.data && <p className="text-sm text-destructive">{errors.data.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="projectId">Projeto</Label>
          <select id="projectId" className="w-full rounded-sm border border-border bg-muted px-3 py-2 text-sm" {...register("projectId")}>
            <option value="">Selecione...</option>
            {opcoes.projects.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          {errors.projectId && <p className="text-sm text-destructive">{errors.projectId.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="mes">Mês (competência)</Label>
          <Input id="mes" type="number" {...register("mes")} />
          {errors.mes && <p className="text-sm text-destructive">{errors.mes.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="ano">Ano (competência)</Label>
          <Input id="ano" type="number" {...register("ano")} />
          {errors.ano && <p className="text-sm text-destructive">{errors.ano.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="inicio">Início</Label>
          <Input id="inicio" type="time" {...register("inicio")} />
          {errors.inicio && <p className="text-sm text-destructive">{errors.inicio.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="fim">Fim</Label>
          <Input id="fim" type="time" {...register("fim")} />
          {errors.fim && <p className="text-sm text-destructive">{errors.fim.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="costCenterId">Centro de custo</Label>
          <select id="costCenterId" className="w-full rounded-sm border border-border bg-muted px-3 py-2 text-sm" {...register("costCenterId")}>
            <option value="">Selecione...</option>
            {opcoes.costCenters.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          {errors.costCenterId && <p className="text-sm text-destructive">{errors.costCenterId.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="disciplineId">Disciplina</Label>
          <select id="disciplineId" className="w-full rounded-sm border border-border bg-muted px-3 py-2 text-sm" {...register("disciplineId")}>
            <option value="">Selecione...</option>
            {opcoes.disciplines.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
          {errors.disciplineId && <p className="text-sm text-destructive">{errors.disciplineId.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="locationId">Local</Label>
          <select id="locationId" className="w-full rounded-sm border border-border bg-muted px-3 py-2 text-sm" {...register("locationId")}>
            <option value="">Selecione...</option>
            {opcoes.locations.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
          {errors.locationId && <p className="text-sm text-destructive">{errors.locationId.message}</p>}
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" {...register("descricao")} />
          {errors.descricao && <p className="text-sm text-destructive">{errors.descricao.message}</p>}
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <Checkbox id="horaExtra" checked={watch("horaExtra")} onCheckedChange={(v) => setValue("horaExtra", !!v)} />
          <Label htmlFor="horaExtra">Hora extra (informativo)</Label>
        </div>
      </div>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar apontamento"}</Button>
    </form>
  );
}
```

Nota: para carregar apenas os parâmetros ativos nas rotas admin, as rotas GET de /api/projects, /api/cost-centers, /api/disciplines e /api/locations devem aceitar o query param `ativos=true` e repassar a `listParams(model, true)`. Ajuste as rotas da Task 8 para ler `request.nextUrl.searchParams.get("ativos") === "true"`.

Criar `src/app/(app)/time-entries/page.tsx` (server component com client wrapper para filtros e paginação):

```tsx
import { Suspense } from "react";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listTimeEntries } from "@/services/time-entries";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Row = Awaited<ReturnType<typeof listTimeEntries>>["items"][number];

const columns: Column<Row>[] = [
  { key: "data", header: "Data", render: (r) => r.data.toISOString().slice(0, 10) },
  { key: "project", header: "Projeto", render: (r) => r.project.nome },
  { key: "duracao", header: "Duração", className: "text-right font-mono tabular-nums", render: (r) => r.duracao.toString() },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  { key: "funcionario", header: "Funcionário", render: (r) => r.funcionario.nome },
];

export default async function TimeEntriesPage({ searchParams }: { searchParams: { page?: string } }) {
  const user = await getSessionUser();
  if (!user) return null;
  const page = Number(searchParams.page ?? 1);
  const result = await listTimeEntries(user, { page });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Apontamentos</h1>
        <Link href="/time-entries/new">
          <Button><Plus className="h-4 w-4" /> Novo apontamento</Button>
        </Link>
      </div>
      <Suspense fallback={<div>Carregando...</div>}>
        <DataTable columns={columns} rows={result.items} total={result.total} page={result.page} pageSize={result.pageSize} onPageChange={(p) => { window.location.href = `/time-entries?page=${p}`; }} />
      </Suspense>
    </div>
  );
}
```

Criar `src/app/(app)/time-entries/new/page.tsx`:

```tsx
import { TimeEntryForm } from "@/components/time-entry-form";

export default function NewTimeEntryPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Novo apontamento</h1>
      <TimeEntryForm />
    </div>
  );
}
```

Criar `src/app/(app)/time-entries/[id]/page.tsx` (detalhe + edição; reusa TimeEntryForm com initial; bloco de reenvio quando rejeitada):

```tsx
import { getSessionUser } from "@/lib/auth";
import { getTimeEntry } from "@/services/time-entries";
import { StatusBadge } from "@/components/status-badge";
import { TimeEntryForm } from "@/components/time-entry-form";
import { ResubmitButton } from "./resubmit-button";

export default async function TimeEntryDetailPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return null;
  const entry = await getTimeEntry(user, params.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Apontamento</h1>
        <StatusBadge status={entry.status} />
      </div>
      <dl className="grid grid-cols-2 gap-4 rounded-md border border-border p-4 text-sm">
        <div><dt className="text-muted-foreground">Projeto</dt><dd>{entry.project.nome}</dd></div>
        <div><dt className="text-muted-foreground">Data</dt><dd>{entry.data.toISOString().slice(0, 10)}</dd></div>
        <div><dt className="text-muted-foreground">Horário</dt><dd>{entry.inicio} — {entry.fim}</dd></div>
        <div><dt className="text-muted-foreground">Duração</dt><dd className="font-mono tabular-nums">{entry.duracao.toString()} h</dd></div>
        <div><dt className="text-muted-foreground">Centro de custo</dt><dd>{entry.costCenter.nome}</dd></div>
        <div><dt className="text-muted-foreground">Disciplina</dt><dd>{entry.discipline.nome}</dd></div>
        <div><dt className="text-muted-foreground">Local</dt><dd>{entry.location.nome}</dd></div>
        <div><dt className="text-muted-foreground">Descrição</dt><dd>{entry.descricao ?? "—"}</dd></div>
      </dl>
      {entry.status !== "APROVADA" && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Editar</h2>
          <TimeEntryForm
            initial={{
              projectId: entry.projectId,
              data: entry.data.toISOString().slice(0, 10),
              mes: entry.mes,
              ano: entry.ano,
              inicio: entry.inicio,
              fim: entry.fim,
              duracao: entry.duracao.toString(),
              descricao: entry.descricao ?? undefined,
              costCenterId: entry.costCenterId,
              disciplineId: entry.disciplineId,
              locationId: entry.locationId,
              horaExtra: entry.horaExtra,
            }}
            entryId={entry.id}
          />
          {entry.status === "REJEITADA" && <ResubmitButton entryId={entry.id} />}
        </div>
      )}
    </div>
  );
}
```

Nota: o TimeEntryForm precisa aceitar prop opcional `entryId`; quando presente, usa PUT /api/time-entries/:id em vez de POST. Ajustar o componente do form: adicionar `entryId?: string` à assinatura e no onSubmit usar método PUT para a rota /api/time-entries/{entryId}. Criar `src/app/(app)/time-entries/[id]/resubmit-button.tsx` (client component) que chama POST /api/time-entries/:id/resubmit e recarrega a página.

- [ ] **Step 5: Rodar testes para passar**

Run: `npm test -- tests/unit/data-table.test.tsx`
Expected: PASS.

- [ ] **Step 6: Rodar build**

Run: `npm run build`
Expected: build passa.

- [ ] **Step 7: Commit**

```bash
git add src/components/data-table.tsx src/components/time-entry-form.tsx src/app/(app)/time-entries tests/unit/data-table.test.tsx
git commit -m "feat: add time entries list, form and detail pages"
```

---

## Task 13: Frontend — aprovações (job leader)

**Files:**
- Create: `src/components/approval-drawer.tsx`, `src/app/(app)/approvals/page.tsx`

**Interfaces:**
- Consumes: Task 7 (API), Task 10 (shell), Task 11 (StatusBadge).
- Produces: fila de apontamentos pendentes do time com ações de aprovar/rejeitar (motivo obrigatório).

- [ ] **Step 1: Escrever testes do ApprovalDrawer (falham)**

Criar `tests/unit/approval-drawer.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ApprovalDrawer } from "@/components/approval-drawer";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

global.fetch = vi.fn();

describe("ApprovalDrawer", () => {
  it("exige motivo para rejeitar", async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });
    render(<ApprovalDrawer entryId="t1" />);
    fireEvent.click(screen.getByText("Rejeitar"));
    expect(await screen.findByText("Motivo da rejeição é obrigatório")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar testes para falhar**

Run: `npm test -- tests/unit/approval-drawer.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar ApprovalDrawer**

Criar `src/components/approval-drawer.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ApprovalDrawer({ entryId, onDone }: { entryId: string; onDone?: () => void }) {
  const router = useRouter();
  const [modo, setModo] = useState<"aprovacao" | "rejeicao" | null>(null);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function executar() {
    setErro(null);
    if (modo === "rejeicao" && motivo.trim().length < 3) {
      setErro("Motivo da rejeição é obrigatório");
      return;
    }
    setCarregando(true);
    const url = `/api/time-entries/${entryId}/${modo}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    const body = await res.json();
    if (!res.ok) {
      setErro(body.error?.message ?? "Erro ao processar");
      setCarregando(false);
      return;
    }
    router.refresh();
    onDone?.();
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => setModo(modo === "aprovacao" ? null : "aprovacao")}>
        {modo === "aprovacao" ? "Cancelar" : "Aprovar"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setModo(modo === "rejeicao" ? null : "rejeicao")}>
        {modo === "rejeicao" ? "Cancelar" : "Rejeitar"}
      </Button>
      {modo === "rejeicao" && (
        <div className="flex items-center gap-2">
          <Label htmlFor="motivo">Motivo</Label>
          <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-64" />
        </div>
      )}
      {modo && (
        <Button size="sm" disabled={carregando} onClick={executar}>
          {carregando ? "Processando..." : "Confirmar"}
        </Button>
      )}
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}
```

Criar `src/app/(app)/approvals/page.tsx` (server component; lista pendentes do time do job leader):

```tsx
import { getSessionUser } from "@/lib/auth";
import { listTimeEntries } from "@/services/time-entries";
import { StatusBadge } from "@/components/status-badge";
import { DataTable, type Column } from "@/components/data-table";
import { ApprovalDrawer } from "@/components/approval-drawer";

type Row = Awaited<ReturnType<typeof listTimeEntries>>["items"][number];

const columns: Column<Row>[] = [
  { key: "data", header: "Data", render: (r) => r.data.toISOString().slice(0, 10) },
  { key: "funcionario", header: "Funcionário", render: (r) => r.funcionario.nome },
  { key: "project", header: "Projeto", render: (r) => r.project.nome },
  { key: "duracao", header: "Duração", className: "text-right font-mono tabular-nums", render: (r) => r.duracao.toString() },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  {
    key: "acoes", header: "Ações",
    render: (r) => r.status === "PENDENTE" ? <ApprovalDrawer entryId={r.id} /> : null,
  },
];

export default async function ApprovalsPage() {
  const user = await getSessionUser();
  if (!user || user.papel !== "JOB_LEADER") return null;
  const result = await listTimeEntries(user, { status: "PENDENTE" });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Aprovações pendentes</h1>
      <DataTable columns={columns} rows={result.items} total={result.total} page={result.page} pageSize={result.pageSize} onPageChange={() => {}} />
    </div>
  );
}
```

- [ ] **Step 4: Rodar testes para passar**

Run: `npm test -- tests/unit/approval-drawer.test.tsx`
Expected: PASS.

- [ ] **Step 5: Rodar build**

Run: `npm run build`
Expected: build passa.

- [ ] **Step 6: Commit**

```bash
git add src/components/approval-drawer.tsx src/app/(app)/approvals tests/unit/approval-drawer.test.tsx
git commit -m "feat: add approvals page for job leader"
```

## Task 14: Frontend — relatórios

**Files:**
- Create: `src/app/(app)/reports/page.tsx`

**Interfaces:**
- Consumes: Task 9 (reports API), Task 10 (shell), Task 11 (ChartCard).
- Produces: página de relatórios com gráficos por projeto, funcionário, centro de custo, disciplina e período, com filtro de período.

- [ ] **Step 1: Escrever teste do componente de filtro (falha)**

Criar `tests/unit/reports-page.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PeriodFilter } from "@/components/period-filter";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("PeriodFilter", () => {
  it("renderiza selects de mês e ano", () => {
    render(<PeriodFilter />);
    expect(screen.getByLabelText("Mês")).toBeInTheDocument();
    expect(screen.getByLabelText("Ano")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar teste para falhar**

Run: `npm test -- tests/unit/reports-page.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar filtro de período**

Criar `src/components/period-filter.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function PeriodFilter() {
  const router = useRouter();
  const params = useSearchParams();

  function apply() {
    const mes = (document.getElementById("mes") as HTMLInputElement)?.value;
    const ano = (document.getElementById("ano") as HTMLInputElement)?.value;
    const sp = new URLSearchParams();
    if (mes) sp.set("mes", mes);
    if (ano) sp.set("ano", ano);
    router.push(`/reports?${sp.toString()}`);
  }

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="mes">Mês</Label>
        <Input id="mes" type="number" min={1} max={12} defaultValue={params.get("mes") ?? ""} placeholder="Mês" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ano">Ano</Label>
        <Input id="ano" type="number" min={2000} max={2100} defaultValue={params.get("ano") ?? ""} placeholder="Ano" />
      </div>
      <button type="button" className="rounded-sm bg-primary px-4 py-2 text-sm text-white" onClick={apply}>
        Filtrar
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Implementar página de relatórios**

Criar `src/app/(app)/reports/page.tsx`:

```tsx
import { getSessionUser } from "@/lib/auth";
import { ChartCard } from "@/components/chart-card";
import { PeriodFilter } from "@/components/period-filter";
import { hoursByProject, hoursByEmployee, hoursByCostCenter, hoursByDiscipline, hoursByPeriod } from "@/services/reports";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: { mes?: string; ano?: string } }) {
  const user = await getSessionUser();
  if (!user) return null;
  const query = {
    mes: searchParams.mes ? Number(searchParams.mes) : undefined,
    ano: searchParams.ano ? Number(searchParams.ano) : undefined,
  };

  const [porProjeto, porFuncionario, porCC, porDisciplina, porPeriodo] = await Promise.all([
    hoursByProject(user, query),
    hoursByEmployee(user, query),
    hoursByCostCenter(user, query),
    hoursByDiscipline(user, query),
    hoursByPeriod(user, query),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <PeriodFilter />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Horas por projeto">
          <Chart data={porProjeto.map((r) => ({ name: r.projectName, value: r.totalHoras }))} />
        </ChartCard>
        <ChartCard title="Horas por funcionário">
          <Chart data={porFuncionario.map((r) => ({ name: r.funcionarioNome, value: r.totalHoras }))} />
        </ChartCard>
        <ChartCard title="Horas por centro de custo">
          <Chart data={porCC.map((r) => ({ name: r.costCenterName, value: r.totalHoras }))} />
        </ChartCard>
        <ChartCard title="Horas por disciplina">
          <Chart data={porDisciplina.map((r) => ({ name: r.disciplineName, value: r.totalHoras }))} />
        </ChartCard>
        <ChartCard title="Horas por período">
          <Chart data={porPeriodo.map((r) => ({ name: `${String(r.mes).padStart(2, "0")}/${r.ano}`, value: r.totalHoras }))} />
        </ChartCard>
      </div>
    </div>
  );
}

function Chart({ data }: { data: { name: string; value: string }[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
          <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 6 }} />
          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 5: Rodar testes para passar**

Run: `npm test -- tests/unit/reports-page.test.tsx`
Expected: PASS.

- [ ] **Step 6: Rodar build**

Run: `npm run build`
Expected: build passa.

- [ ] **Step 7: Commit**

```bash
git add src/components/period-filter.tsx src/app/(app)/reports tests/unit/reports-page.test.tsx
git commit -m "feat: add reports page with charts"
```

---

## Task 15: Frontend — auditoria

**Files:**
- Create: `src/app/(app)/audit/page.tsx`

**Interfaces:**
- Consumes: Task 9 (audit API/service), Task 10 (shell).
- Produces: tabela do log de auditoria filtrada por escopo com paginação.

- [ ] **Step 1: Escrever teste do helper de formatação (falha)**

Criar `tests/unit/audit.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatAcao } from "@/lib/utils";

describe("formatAcao", () => {
  it("traduz ações para português", () => {
    expect(formatAcao("CRIAR")).toBe("Criação");
    expect(formatAcao("EDITAR")).toBe("Edição");
    expect(formatAcao("APROVAR")).toBe("Aprovação");
    expect(formatAcao("REJEITAR")).toBe("Rejeição");
    expect(formatAcao("REENVIAR")).toBe("Reenvio");
    expect(formatAcao("REMOVER")).toBe("Remoção");
  });
});
```

- [ ] **Step 2: Rodar teste para falhar**

Run: `npm test -- tests/unit/audit.test.ts`
Expected: FAIL — formatAcao not exported.

- [ ] **Step 3: Implementar helper**

Adicionar a `src/lib/utils.ts`:

```typescript
export function formatAcao(acao: string): string {
  const mapa: Record<string, string> = {
    CRIAR: "Criação",
    EDITAR: "Edição",
    APROVAR: "Aprovação",
    REJEITAR: "Rejeição",
    REENVIAR: "Reenvio",
    REMOVER: "Remoção",
  };
  return mapa[acao] ?? acao;
}

export function formatDateTime(iso: Date | string): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
```

- [ ] **Step 4: Implementar página de auditoria**

Criar `src/app/(app)/audit/page.tsx`:

```tsx
import { getSessionUser } from "@/lib/auth";
import { listAuditLog } from "@/services/reports";
import { DataTable, type Column } from "@/components/data-table";
import { formatAcao, formatDateTime } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof listAuditLog>>["items"][number];

const columns: Column<Row>[] = [
  { key: "quando", header: "Quando", render: (r) => formatDateTime(r.quando) },
  { key: "usuario", header: "Usuário", render: (r) => r.usuario.nome },
  { key: "acao", header: "Ação", render: (r) => formatAcao(r.acao) },
  { key: "motivo", header: "Motivo", render: (r) => r.motivo ?? "—" },
];

export default async function AuditPage({ searchParams }: { searchParams: { page?: string } }) {
  const user = await getSessionUser();
  if (!user) return null;
  const page = Number(searchParams.page ?? 1);
  const result = await listAuditLog(user, { page });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Auditoria</h1>
      <DataTable columns={columns} rows={result.items} total={result.total} page={result.page} pageSize={result.pageSize} onPageChange={(p) => { window.location.href = `/audit?page=${p}`; }} />
    </div>
  );
}
```

- [ ] **Step 5: Rodar testes para passar**

Run: `npm test -- tests/unit/audit.test.ts`
Expected: PASS.

- [ ] **Step 6: Rodar build**

Run: `npm run build`
Expected: build passa.

- [ ] **Step 7: Commit**

```bash
git add src/lib/utils.ts src/app/(app)/audit tests/unit/audit.test.ts
git commit -m "feat: add audit log page"
```

---

## Task 16: Frontend — administração (parâmetros)

**Files:**
- Create: `src/components/param-manager.tsx`, `src/app/(app)/admin/layout.tsx`, `src/app/(app)/admin/page.tsx`, `src/app/(app)/admin/usuarios/page.tsx`, `src/app/(app)/admin/vinculos/page.tsx`, `src/app/(app)/admin/opcoes/page.tsx`

**Interfaces:**
- Consumes: Task 8 (API admin), Task 10 (shell), Task 11 (DataTable).
- Produces: páginas de gestão de parâmetros, usuários, vínculos e opções permitidas (admin only).

- [ ] **Step 1: Escrever teste do ParamManager (falham)**

Criar `tests/unit/param-manager.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ParamManager } from "@/components/param-manager";

global.fetch = vi.fn();

describe("ParamManager", () => {
  it("lista itens e permite criar", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: "1", nome: "Engenharia", ativo: true }] }) });
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: { id: "2", nome: "Financeiro", ativo: true } }) });

    render(<ParamManager resource="cost-centers" title="Centros de custo" />);
    expect(await screen.findByText("Engenharia")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Novo nome"), { target: { value: "Financeiro" } });
    fireEvent.click(screen.getByText("Adicionar"));
    expect(await screen.findByText("Financeiro")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar testes para falhar**

Run: `npm test -- tests/unit/param-manager.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar ParamManager**

Criar `src/components/param-manager.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

type Item = { id: string; nome: string; ativo: boolean };

export function ParamManager({ resource, title }: { resource: string; title: string }) {
  const [itens, setItens] = useState<Item[]>([]);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/${resource}`);
    const body = await res.json();
    setItens(body.data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    setErro(null);
    const res = await fetch(`/api/${resource}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });
    const body = await res.json();
    if (!res.ok) {
      setErro(body.error?.message ?? "Erro ao criar");
      return;
    }
    setNome("");
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/${resource}/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="novo-nome">Novo nome</Label>
          <Input id="novo-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <Button onClick={create}>Adicionar</Button>
      </div>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.nome}</TableCell>
              <TableCell>{item.ativo ? "Sim" : "Não"}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => remove(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 4: Implementar páginas de admin**

Criar `src/app/(app)/admin/layout.tsx` (protege rota admin):

```tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.papel !== "ADMIN") redirect("/");
  return <div className="space-y-6">{children}</div>;
}
```

Criar `src/app/(app)/admin/page.tsx`:

```tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const links = [
  { href: "/admin/cost-centers", label: "Centros de custo" },
  { href: "/admin/disciplines", label: "Disciplinas" },
  { href: "/admin/locations", label: "Locais" },
  { href: "/admin/projects", label: "Projetos" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/vinculos", label: "Job leaders" },
  { href: "/admin/opcoes", label: "Opções permitidas" },
];

export default function AdminPage() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((l) => (
        <Link key={l.href} href={l.href}>
          <Card className="transition-colors hover:bg-muted">
            <CardHeader><CardTitle className="text-sm font-medium">{l.label}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">Gerenciar {l.label.toLowerCase()}</CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
```

Criar páginas específicas reutilizando ParamManager e padrões equivalentes para usuários, vínculos e opções:

- `src/app/(app)/admin/cost-centers/page.tsx`: `<ParamManager resource="cost-centers" title="Centros de custo" />`
- `src/app/(app)/admin/disciplines/page.tsx`: `<ParamManager resource="disciplines" title="Disciplinas" />`
- `src/app/(app)/admin/locations/page.tsx`: `<ParamManager resource="locations" title="Locais" />`
- `src/app/(app)/admin/projects/page.tsx`: `<ParamManager resource="projects" title="Projetos" />`
- `src/app/(app)/admin/usuarios/page.tsx`: tabela de usuários com botão criar (POST /api/users com nome, email, senha, papel) e desativar (DELETE /api/users/:id); formulário simples com Inputs e Select de papel.
- `src/app/(app)/admin/vinculos/page.tsx`: tabela de vínculos ativos (GET /api/job-leader-assignments), select de funcionário e job leader + botão criar (POST), botão remover (DELETE /api/job-leader-assignments/:id).
- `src/app/(app)/admin/opcoes/page.tsx`: tabela de opções permitidas (GET /api/user-allowed-options), select de usuário, tipo e valor + botão criar (POST), botão remover (DELETE /api/user-allowed-options/:id).

- [ ] **Step 5: Rodar testes para passar**

Run: `npm test -- tests/unit/param-manager.test.tsx`
Expected: PASS.

- [ ] **Step 6: Rodar build**

Run: `npm run build`
Expected: build passa.

- [ ] **Step 7: Commit**

```bash
git add src/components/param-manager.tsx src/app/(app)/admin tests/unit/param-manager.test.tsx
git commit -m "feat: add admin parameter management pages"
```

---

## Task 17: Seed completo, README e verificação final

**Files:**
- Modify: `prisma/seed.ts` (dados de demonstração), `README.md` (novo, setup local), `package.json` (scripts de verificação)

**Interfaces:**
- Consumes: Tasks 1-16.
- Produces: ambiente local documentado e verificável de ponta a ponta.

- [ ] **Step 1: Expandir o seed com dados de demonstração**

Modificar `prisma/seed.ts` para também criar (idempotente): 1 job leader (`lider@mcm.local`), 2 funcionários (`func1@mcm.local`, `func2@mcm.local`), 2 projetos, 3 centros de custo, 3 disciplinas, 2 locais, alocações, vínculos ativos, opções permitidas e alguns apontamentos (um aprovado, um pendente, um rejeitado). Senha padrão para todos: `Senha123!`. Usar funções auxiliares que verificam existência antes de criar (findFirst + create) e agrupam criações em `prisma.$transaction` onde aplicável.

- [ ] **Step 2: Criar README.md**

Criar `README.md` com: visão geral, requisitos (Node 20+, PostgreSQL local), setup passo a passo (criar banco `mcm`, copiar .env.example para .env, npm install, npx prisma migrate dev, npx prisma db seed, npm run dev), credenciais padrão do seed, scripts de teste (npm test) e build (npm run build). Criar também `.env.example` com as mesmas chaves do .env.

- [ ] **Step 3: Rodar verificação completa**

Run: `npm run build` e depois `npm test`
Expected: build sem erros e todos os testes passando.

- [ ] **Step 4: Rodar migração e seed limpos (opcional, se Postgres local disponível)**

Run: `npx prisma migrate reset --force` e `npx prisma db seed`
Expected: banco recriado e populado com dados de demonstração.

- [ ] **Step 5: Commit**

```bash
git add README.md .env.example prisma/seed.ts package.json
git commit -m "chore: expand seed data and add setup docs"
```

---

## Fim do plano

Tasks 1-17 entregam o sistema completo conforme o spec aprovado em `docs/superpowers/specs/2026-08-19-mcm-apontamento-horas-design.md`. Após a Task 17, o projeto está pronto para uso local e para a decisão futura de deploy (mudança de env vars apenas).
