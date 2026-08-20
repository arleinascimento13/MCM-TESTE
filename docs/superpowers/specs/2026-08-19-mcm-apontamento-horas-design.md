# MCM — Sistema de Apontamento de Horas — Design Spec

- **Data:** 2026-08-19
- **Status:** Aprovado para planejamento
- **Escopo da sessão:** Finalizar especificação com base nos documentos existentes (BUSINESS, TECHNICAL, DESIGN, REFERENCES) e resolver as pendências técnicas.

## 1. Visão Geral

O MCM é uma aplicação web full-stack interna para digitalizar o processo de apontamento de horas, substituindo planilhas manuais. Colaboradores registram horas trabalhadas por projeto; job leaders aprovam ou rejeitam cada linha; o admin parametriza a aplicação. O sistema oferece auditoria completa, controle operacional em tempo real e dashboards com agregações por projeto, funcionário, centro de custo, disciplina e período.

Acesso restrito a colaboradores da MCM, com três papéis: admin, job leader e funcionário.

## 2. Objetivos e Critérios de Sucesso

- Migrar o apontamento de planilhas para um sistema dedicado com rastreabilidade total.
- Log de auditoria completo de todas as ações (criar, editar, aprovar, rejeitar, reenviar, remover) com timestamp e responsável.
- Controle operacional em tempo real do estado de cada apontamento.
- Processamento automatizado de informações e redução do trabalho manual repetitivo.

## 3. Escopo

### No escopo desta fase

- Autenticação com usuário e senha (Credentials provider).
- CRUD de apontamentos de hora (TimeEntry) com ciclo de vida pendente → aprovada/rejeitada → (rejeitada) → pendente.
- Aprovação e rejeição por linha individual, com motivo obrigatório na rejeição.
- Escopo de dados por papel (admin vê tudo, job leader vê seu time, funcionário vê a si mesmo), enforce em código na service layer.
- Cadastro de parâmetros pelo admin: centros de custo, disciplinas, locais, projetos, alocações, usuários, vínculos job leader/funcionário, opções permitidas por funcionário.
- Dashboard e relatórios agregados (horas por projeto, funcionário, centro de custo, disciplina, período) respeitando o escopo do papel.
- Log de auditoria consultável por escopo.
- Soft delete de apontamentos pelo admin (preserva auditoria).

### Fora de escopo desta fase (escopo futuro)

- Exportação de dados (CSV/.xlsx). Quando entrar em escopo, a biblioteca de exportação e uma skill específica de Excel serão incorporadas ao planejamento.
- Integrações externas (folha de pagamento, ERP).
- Notificações push ou e-mail.
- RLS (Row-Level Security) no banco — autorização é em código.
- Aprovação em lote — sempre por linha individual.
- Validação de conflitos de horário entre apontamentos.
- Suporte a turnos noturnos que cruzam a meia-noite (inicio/fim no mesmo dia, inicio < fim).
- Hard delete de registros — toda remoção é soft.
- Aplicativo mobile.

## 4. Decisões da Sessão de Brainstorming

| # | Decisão | Escolha | Observação |
|---|---------|---------|------------|
| 1 | Objetivo | Finalizar spec única e implementável | Baseada nos docs existentes |
| 2 | Infra | PostgreSQL local no desenvolvimento; deploy decidido quando o serviço estiver 100% | Ambiente parametrizável via env vars |
| 3 | Autenticação | Credentials (usuário + senha) | Admin cria contas iniciais |
| 4 | Escala | Pequena (~50 usuários, milhares de linhas/mês) | Uma instância Next.js + Postgres local |
| 5 | ORM | Prisma | DX madura, migrations robustas, tipos gerados |
| 6 | Migrations | Prisma Migrate | Segue da escolha do Prisma |
| 7 | Sessão | Auth.js com cookie-only JWT (stateless) | Suficiente para a escala |
| 8 | Gráficos | Recharts | Ecossistema React + shadcn/ui |
| 9 | Exportação | Fora de escopo nesta fase | Retomada em escopo posterior com skill de Excel |
| 10 | Job leader | Um vínculo ativo por funcionário; N:N vira histórico | TimeEntry herda o job leader ativo na criação |
| 11 | Mês/Ano | Escolha manual do funcionário | Competência pode diferir da data do trabalho |
| 12 | Remoção | Soft delete (deleted_at) | Preserva auditoria e integridade das FKs |
| 13 | Infra dev | Postgres instalado localmente, sem Docker | Documentação de setup no README |

## 5. Arquitetura

### Stack

- Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui (Radix), Lucide icons.
- Zod para validação compartilhada client/server.
- Auth.js (NextAuth) com Credentials provider e sessão JWT em cookie HTTP-only.
- Prisma ORM + PostgreSQL.
- Recharts para gráficos do dashboard.
- React Hook Form para formulários.

### Camadas

```
Pages / Components (React + shadcn/ui, design system do DESIGN.md)
        │
        ▼
Route Handlers (app/api/**)  →  valida Zod + sessão (Auth.js)
        │
        ▼
Service Layer (src/services/**)  →  scopeFilter por papel + regras de negócio + AuditLog
        │
        ▼
Prisma Client (queries tipadas)  →  PostgreSQL (local no dev)
```

### Princípios

1. Escopo por papel enforced na service layer — toda query recebe o usuário autenticado e aplica scopeFilter (admin = tudo, job leader = time, funcionário = próprio). Sem RLS no banco.
2. Auditoria total — toda mutação grava AuditLog pela service layer, na mesma transação.
3. Validação rigorosa — schemas Zod em toda entrada; erros específicos com código próprio.
4. Sessão stateless — cookie HTTP-only JWT; sem tabela de sessão no banco.
5. Configuração por env vars — trocar de ambiente local para qualquer deploy futuro é mudança de configuração, não de código.

### Estrutura de pastas

```
src/
  app/            → páginas e route handlers (app router)
    (auth)/       → login
    (app)/        → dashboard, apontamentos, relatórios, admin
    api/          → route handlers REST
  components/     → componentes UI (shadcn/ui + específicos)
  lib/            → prisma client, auth config, utils
  services/       → service layer (escopo, regras, auditoria)
  schemas/        → schemas Zod por domínio
prisma/
  schema.prisma   → modelo de dados
  migrations/     → versionamento via Prisma Migrate
.env              → variáveis de ambiente (DATABASE_URL, AUTH_SECRET)
```

## 6. Modelo de Dados

Notação: UUID como chaves, TIMESTAMPTZ para timestamps, enums PostgreSQL.

### User

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| nome | VARCHAR(255) | Sim | Nome completo |
| email | VARCHAR(255) | Sim | E-mail único de login |
| senha_hash | VARCHAR(255) | Sim | Hash bcrypt da senha |
| papel | ENUM | Sim | admin, job_leader, funcionario |
| ativo | BOOLEAN | Sim | Funcionário inativo não cria apontamentos, permanece para histórico |
| criado_em | TIMESTAMPTZ | Sim | Data de criação |
| atualizado_em | TIMESTAMPTZ | Sim | Data da última alteração |

### JobLeaderAssignment

Relacionamento N:N com flag ativa. No máximo um vínculo ativo por funcionário; trocar responsabilidade = desativar o atual + criar novo (histórico preservado). O TimeEntry herda o job leader ativo no momento da criação.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| funcionario_id | UUID | Sim | FK para User |
| job_leader_id | UUID | Sim | FK para User |
| ativo | BOOLEAN | Sim | Indica vínculo vigente |
| criado_em | TIMESTAMPTZ | Sim | Data de criação do vínculo |

### Project / CostCenter / Discipline / Location

Parâmetros gerenciados pelo admin. "Deletar" um parâmetro = ativo = false (soft deactivation), nunca hard delete — preserva referências de apontamentos antigos.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| nome | VARCHAR(255) | Sim | Nome |
| ativo | BOOLEAN | Sim | Indica disponibilidade para uso |
| criado_em | TIMESTAMPTZ | Sim | Data de criação |
| atualizado_em | TIMESTAMPTZ | Sim | Data da última alteração |

### Allocation

Mapeamento funcionário × projeto. Valida que o funcionário só aponta em projetos alocados.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| funcionario_id | UUID | Sim | FK para User |
| project_id | UUID | Sim | FK para Project |
| criado_em | TIMESTAMPTZ | Sim | Data de criação |

### UserAllowedOptions

Limita quais disciplinas, centros de custo e locais cada funcionário pode usar nos apontamentos.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| user_id | UUID | Sim | FK para User |
| tipo | ENUM | Sim | disciplina, centro_custo, local |
| valor_id | UUID | Sim | ID do registro permitido conforme o tipo |
| criado_em | TIMESTAMPTZ | Sim | Data de criação |

### TimeEntry

Entidade central. Mês/Ano são escolhidos manualmente (competência pode diferir da data do trabalho). Duração calculada na criação e editável depois. Remoção é soft delete.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| funcionario_id | UUID | Sim | FK para User — quem apontou |
| job_leader_id | UUID | Sim | FK para User — responsável pela aprovação (herdado na criação) |
| project_id | UUID | Sim | FK para Project |
| mes | INTEGER | Sim | Mês da competência (1-12), manual |
| ano | INTEGER | Sim | Ano da competência (YYYY), manual |
| data | DATE | Sim | Data do trabalho realizado |
| inicio | TIME | Sim | Hora de início |
| fim | TIME | Sim | Hora de término |
| duracao | NUMERIC(5,2) | Sim | Duração em horas decimais (calculada e editável) |
| descricao | TEXT | Não | Detalhamento do trabalho |
| cost_center_id | UUID | Sim | FK para CostCenter |
| discipline_id | UUID | Sim | FK para Discipline |
| location_id | UUID | Sim | FK para Location |
| hora_extra | BOOLEAN | Sim | Campo informativo |
| status | ENUM | Sim | pendente, aprovada, rejeitada |
| motivo_rejeicao | TEXT | Não | Motivo da rejeição (obrigatório ao rejeitar) |
| deleted_at | TIMESTAMPTZ | Não | Soft delete — preenchido quando o admin remove |
| criado_em | TIMESTAMPTZ | Sim | Data de criação |
| atualizado_em | TIMESTAMPTZ | Sim | Data da última alteração |

### AuditLog

Gravado pela service layer a cada mutação, na mesma transação. O FK para TimeEntry permanece válido graças ao soft delete.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| time_entry_id | UUID | Sim | FK para TimeEntry |
| acao | ENUM | Sim | criar, editar, aprovar, rejeitar, reenviar, remover |
| usuario_id | UUID | Sim | FK para User — quem realizou a ação |
| motivo | TEXT | Não | Motivo informado (para rejeição) |
| dados_alterados | JSONB | Não | Snapshot antes/depois (para edição) ou dados completos (para criação/remoção) |
| quando | TIMESTAMPTZ | Sim | Timestamp da ação |

### Índices

- TimeEntry.funcionario_id
- TimeEntry.status
- TimeEntry composto (funcionario_id, mes, ano)
- TimeEntry.project_id
- AuditLog.time_entry_id
- AuditLog.quando

### Integridade

FKs com ON DELETE RESTRICT — como toda remoção é soft (delete/deactivation), nenhum registro é fisicamente removido.

### Ciclo de Vida do Status

```
PENDENTE (criação ou reenvio)
   │
   ├── aprovada → APROVADA (terminal; somente admin pode remover via soft delete)
   │
   └── rejeitada (com motivo) → REJEITADA
                                    │
                                    └── funcionário edita e reenvia → PENDENTE
```

## 7. API e Service Layer

### Convenções

- Todas as rotas exigem sessão válida, exceto login.
- Sucesso: objeto com propriedade data (objeto ou array).
- Erro: objeto com propriedade error contendo code e message.
- Validação Zod em todo POST/PUT.
- Códigos de erro: VALIDATION_ERROR (400), OPTION_NOT_ALLOWED (400), EMPLOYEE_NOT_ALLOCATED (400), APPROVED_ENTRY_EDIT (400), REJECTION_WITHOUT_REASON (400), UNAUTHORIZED (401), FORBIDDEN (403), NOT_FOUND (404), LINE_ALREADY_APPROVED (409), CONFLICT (409), INTERNAL_ERROR (500).
- Mensagens de erro específicas e descritivas em português.

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/login | Login com credenciais |
| POST | /api/auth/logout | Logout e invalidação de sessão |
| GET | /api/auth/session | Retorna sessão atual |

### Apontamentos (escopo aplicado sempre)

| Método | Rota | Papel | Regras-chave |
|--------|------|-------|--------------|
| GET | /api/time-entries | todos | lista paginada com filtros (período, projeto, status, centro, disciplina) + escopo |
| POST | /api/time-entries | funcionário, job leader | valida alocação, opções permitidas, deriva job_leader ativo; status = pendente; grava AuditLog |
| GET | /api/time-entries/:id | todos | detalhe + escopo |
| PUT | /api/time-entries/:id | funcionário (próprias), job leader (time) | só status pendente/rejeitada; bloqueia aprovada; grava AuditLog com antes/depois |
| DELETE | /api/time-entries/:id | admin | soft delete (deleted_at); grava AuditLog |
| POST | /api/time-entries/:id/approve | job leader | só do time + status pendente; 409 se já aprovada; grava AuditLog |
| POST | /api/time-entries/:id/reject | job leader | motivo obrigatório (mín. 3 caracteres); só do time + pendente; grava AuditLog |
| POST | /api/time-entries/:id/resubmit | funcionário | só própria + rejeitada → pendente; grava AuditLog |

### Parâmetros e Admin (todas admin only)

CRUD de /api/cost-centers, /api/disciplines, /api/locations, /api/projects, /api/allocations, /api/users, /api/job-leader-assignments, /api/user-allowed-options. DELETE em parâmetros = desativação (ativo = false); DELETE em assignment = desativa o vínculo atual.

### Relatórios e Auditoria (escopo por papel)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/reports/hours-by-project | agregação de horas por projeto |
| GET | /api/reports/hours-by-employee | agregação de horas por funcionário |
| GET | /api/reports/hours-by-cost-center | agregação de horas por centro de custo |
| GET | /api/reports/hours-by-discipline | agregação de horas por disciplina |
| GET | /api/reports/hours-by-period | agregação de horas por período |
| GET | /api/audit-log | log de auditoria filtrado por escopo |

Agregações somam apenas linhas aprovadas e não deletadas. Os gráficos exibem totais agregados com granularidade parametrizada na requisição.

### Service Layer (src/services/)

- scopeFilter(user): admin → {}; job leader → { funcionarioId: { in: teamIds } }; funcionário → { funcionarioId: user.id }. Concatenado a toda consulta.
- checkPermission(user, action, resource): valida papel + propriedade antes de cada ação.
- Máquina de estados: pendente → aprovada (terminal), pendente → rejeitada, rejeitada → pendente (resubmit); edição só em pendente/rejeitada; remoção (admin) via soft delete a qualquer momento.
- Auditoria: toda mutação chama logAudit na mesma transação (prisma.$transaction) — nunca há mutação sem log.
- Aprovar, rejeitar e resubmit rodam em transação atômica (verifica status + atualiza + grava log), evitando corridas.

## 8. Regras de Negócio e Validação

### Schemas Zod (src/schemas/, compartilhados client/server)

- CreateTimeEntry: projectId, data (YYYY-MM-DD), mes (1-12), ano (4 dígitos), inicio/fim (HH:mm), costCenterId, disciplineId, locationId, horaExtra (default false), descricao (máx 1000, opcional).
- UpdateTimeEntry: mesmos campos, todos opcionais.
- RejectTimeEntry: motivo (string, min 3, obrigatório).
- CreateUser/UpdateUser, CreateAssignment, CreateAllowedOption e schemas de parâmetros por domínio.

### Regras validadas pela service layer (nesta ordem)

1. Autenticação e permissão — sessão válida + checkPermission → 401/403.
2. Estado do registro — editável só se pendente/rejeitada; aprovar/rejeitar só se pendente; resubmit só se rejeitada e própria → 409/400/403.
3. Escopo de dados — consultas e mutações respeitam scopeFilter → 403 se fora do escopo.
4. Alocação — ao criar, deve existir Allocation(funcionario, project) → EMPLOYEE_NOT_ALLOCATED.
5. Opções permitidas — ao criar/editar, cost_center_id, discipline_id e location_id devem constar em UserAllowedOptions do funcionário → OPTION_NOT_ALLOWED.
6. Consistência de horário — inicio < fim → "O campo início deve ser anterior ao campo fim" (sem suporte a turno noturno).
7. Duração — calculada automaticamente na criação ((fim - inicio) em horas decimais); após isso editável e a service layer não recalcula — o valor informado prevalece.
8. Mês/Ano — valores válidos (1-12, ano 4 dígitos); sem obrigação de igualdade com a data (competência manual).
9. Hora extra — booleano puramente informativo; sem validação de limite, sem fluxo próprio.
10. Parâmetros inativos — não podem ser usados em novos apontamentos.

### Tratamento de erros

Mensagens específicas em português ("Centro de custo não encontrado ou inativo", "Esta linha já foi aprovada"); código de erro sempre presente; nunca mensagens genéricas.

## 9. Frontend

### Sistema visual

Design system do DESIGN.md adotado integralmente: dark-first, data-dense (7/10), Inter + JetBrains Mono com tabular-nums para números, sidebar fixa 240–280px, topbar com busca (cmd+k), cores semânticas apenas para estado, skeleton loading, empty states com CTA, ícones Lucide (sem emojis), interface em português (pt-BR).

### Páginas por papel (navegação condicionada ao papel)

| Página | Funcionário | Job Leader | Admin |
|--------|-------------|------------|-------|
| /login | ✓ | ✓ | ✓ |
| / Dashboard (KPIs + gráficos) | escopo próprio | escopo do time | escopo global |
| /time-entries (tabela + filtros) | próprios | do time | todos |
| /time-entries/new (formulário) | ✓ | ✓ | — |
| /time-entries/:id (detalhe/edição em drawer) | própria | do time | qualquer |
| /approvals (fila de pendentes p/ aprovar/rejeitar) | — | ✓ | — |
| /reports (gráficos por projeto/funcionário/CC/disciplina/período) | escopo próprio | escopo do time | global |
| /audit (log de auditoria) | próprios | do time | completo |
| /admin/* (parâmetros, usuários, alocações, opções) | — | — | ✓ |

### Componentes-chave

- DataTable (wrapper sobre shadcn table): sticky header, sort multi-coluna, filtros inline, paginação (25/50/100), seleção com bulk bar, linhas de 36px (dense).
- StatusBadge: pendente (warning), aprovada (success), rejeitada (danger); centrado, cor semântica apenas aqui.
- TimeEntryForm: labels acima dos campos, validação on blur, asterisco para obrigatórios, opções restritas às UserAllowedOptions do funcionário.
- ApprovalDrawer: drawer lateral para aprovar/rejeitar com motivo obrigatório (textarea + validação).
- KpiCard: valor em mono + label + tendência contextual.
- ChartCard: Recharts (bar/pie/line) com skeleton e empty state.
- CommandPalette: cmd+k para navegação e busca.
- FilterBar: período, projeto, status, centro de custo, disciplina (respeitando escopo).

## 10. Segurança

- Senhas com bcrypt.
- Cookies HTTP-only com SameSite; proteção CSRF em mutações.
- Validação Zod em toda entrada de API.
- Rate limiting básico na rota de login.
- Sem secrets no código; tudo via env vars.
- Escopo de dados enforced em código na service layer — nunca confiando em filtros do frontend.
- AuditLog registra quem, o quê e quando em cada mutação.

## 11. Ambiente de Desenvolvimento e Dependências

### Ambiente local

- Node.js 20+ e PostgreSQL instalados diretamente na máquina (sem Docker).
- .env com DATABASE_URL, AUTH_SECRET e demais variáveis.
- Prisma Migrate para versionamento do schema; prisma db seed cria o usuário admin inicial e parâmetros básicos.
- O mesmo código roda em produção com mudança de env vars; a decisão de deploy fica para quando o serviço estiver 100%.

### Dependências resolvidas

| Pendência | Decisão | Justificativa |
|-----------|---------|---------------|
| ORM | Prisma | DX madura, migrations robustas, tipos gerados |
| Migrations | Prisma Migrate | segue do Prisma |
| Sessão | Auth.js + cookie-only JWT | stateless, suficiente para escala pequena |
| Credenciais | Credentials (usuário + senha) | decidido na sessão |
| Gráficos | Recharts | ecossistema React + shadcn |
| Exportação | Fora de escopo nesta fase | retomada em escopo posterior |
| Banco dev | Postgres local | decidido na sessão |

## 12. Testes

- Service layer (Vitest): máquina de estados, scopeFilter por papel, validação de opções/alocação, auditoria em transação (mock do Prisma).
- API (integração): fluxos felizes e de erro por rota (401/403/404/409/400).
- Componentes (Testing Library): formulário de apontamento, StatusBadge, DataTable (paginação/seleção).
- E2E (Playwright, opcional): 2–3 caminhos felizes (login → criar → aprovar; rejeitar → editar → resubmit) — apenas se fizer sentido no plano.

## 13. Escopo Futuro (não implementar nesta fase)

- Exportação de dados (CSV/.xlsx) — biblioteca de exportação e skill de Excel a incorporar no planejamento quando este escopo for aberto.
- Integrações externas (folha de pagamento, ERP).
- Notificações push ou e-mail.
- RLS no banco.
- Aprovação em lote.
- Validação de conflitos de horário.
- Turnos noturnos cruzando meia-noite.
- Aplicativo mobile.