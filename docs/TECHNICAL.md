# MCM — Arquitetura e Decisões Técnicas

## 1. Visão Técnica

O sistema MCM é uma aplicação web full-stack construída sobre o Next.js com App Router, projetada para operar como ferramenta interna de apontamento de horas. A arquitetura adota o padrão de backend integrado ao frontend, onde as Route Handlers do Next.js expõem APIs REST que são consumidas por componentes React no frontend.

A segurança é o princípio orientador da arquitetura. Toda operação de leitura e escrita passa por uma camada de serviço (service layer) que aplica o escopo de dados baseado no papel do usuário autenticado. Não há reliance em RLS (Row-Level Security) no banco de dados; a filtragem é implementada inteiramente em código, o que proporciona maior flexibilidade e visibilidade das regras de autorização.

O modelo de dados relacional em PostgreSQL armazena todos os registros com suporte a transações ACID, garantindo consistência nas operações de aprovação e rejeição. O log de auditoria é gravado pela camada de serviço a cada mutação, criando rastreabilidade completa de todas as ações.

### Princípios Arquiteturais

- **Segurança primeiro:** toda requisição autenticada passa pela service layer com escopo enforced
- **Escopo por papel enforced em código:** admin vê tudo, job leader vê seu time, funcionário vê a si mesmo
- **Auditoria total:** cada criar, editar, aprovar, rejeitar gera entrada no AuditLog
- **Validação rigorosa:** schemas Zod em todas as entradas de API; erros específicos, nunca genéricos

---

## 2. Stack e Dependências

### Frontend

| Camada | Tecnologia | Observação |
|--------|------------|------------|
| Framework | Next.js App Router | SSR e client components |
| UI Library | React 18+ | Componentes funcionais e hooks |
| Linguagem | TypeScript | Tipagem estática em todo o código |
| Estilização | Tailwind CSS | Utility-first, integrado ao shadcn/ui |
| Componentes | shadcn/ui | Base de componentes acessíveis |
| Validação | Zod | Schemas de validação compartilhados client/server |

### Backend

| Camada | Tecnologia | Observação |
|--------|------------|------------|
| API | Next.js Route Handlers | Endpoints REST em `app/api/` |
| Lógica de negócio | Service Layer | Funções em `services/` com escopo de dados |
| ORM | **Pendente — Prisma ou Drizzle** | Decisão fica para a especificação detalhada |
| Validação de entrada | Zod | Schemas por domínio, usados na API e service layer |
| Banco de dados | PostgreSQL | Instância própria, acessível pela aplicação |

### Autenticação e Autorização

| Componente | Tecnologia | Observação |
|------------|------------|------------|
| Auth | Auth.js (NextAuth) | Provedor de sessão |
| Credenciais | Credentials ou E-mail | Decisão fica para a especificação detalhada |
| Sessão | Cookie HTTP-only | Armazenada no cliente; pendente se em cookie-only ou banco |

### Dependências a Definir na Especificação

- ORM definitivo (Prisma vs Drizzle)
- Biblioteca de exportação CSV/Excel
- Biblioteca de gráficos para dashboard

---

## 3. Arquitetura

### Visão Geral

A aplicação segue o padrão full-stack do Next.js com separação clara em camadas:

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │   Pages     │  │ Components │  │   Hooks     │               │
│  │ (Next.js)   │  │ (shadcn/ui)│  │  (React)    │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
│         │                                    │                    │
│         └────────────── Fetch API ───────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ROUTE HANDLERS (API)                        │
│  GET/POST/PUT/PATCH /api/time-entries                           │
│  GET/POST/PUT    /api/time-entries/:id                          │
│  POST            /api/time-entries/:id/approve                  │
│  POST            /api/time-entries/:id/reject                    │
│  ...                                                          │
│  + Middleware de sessão (Auth.js) + Validação Zod               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                               │
│  - scopeFilter(user): aplica filtro de escopo por papel          │
│  - checkPermission(user, action, resource): valida ação         │
│  - Lógica de negócio: criação, edição, aprovação, rejeição      │
│  - Cálculo de durações, validações de domínio                   │
│  - Escrita em AuditLog a cada mutação                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ORM                                      │
│  Prisma ou Drizzle (a definir)                                   │
│  - Query builder com tipos gerados                               │
│  - Filtros de escopo aplicados em cada consulta                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL                                  │
│  - Tabelas normalizadas (User, TimeEntry, Project, etc.)        │
│  - Índices em foreign keys e campos de filtro                   │
│  - Sem RLS — filtragem feita em código                          │
└─────────────────────────────────────────────────────────────────┘
```

### Service Layer e Escopo de Dados

A service layer é o ponto central de aplicação das regras de escopo. Toda função de consulta (`findMany`, `findUnique`) recebe o usuário autenticado e aplica o filtro adequado:

```typescript
// Exemplo conceitual de scopeFilter
function scopeFilter(user: User) {
  switch (user.role) {
    case 'admin':
      return {}; // sem filtro — vê tudo
    case 'job_leader':
      return {
        // filtra pelos funcionários sob responsabilidade deste job leader
        funcionarioId: { in: getTeamMemberIds(user.id) }
      };
    case 'funcionario':
      return { funcionarioId: user.id }; // apenas a si mesmo
  }
}
```

Esse filtro é concatenado com quaisquer condições adicionais da consulta antes de executar a query no ORM.

### Proteção de Rotas

O middleware do Next.js ou dos Route Handlers verifica a sessão antes de qualquer processamento. Requisições sem sessão válida retornam 401 Unauthorized. Após a autenticação, a service layer aplica o escopo de dados.

---

## 4. Modelo de Dados

### Entidade: User

Cadastro de usuários do sistema com papel hierárquico.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| nome | VARCHAR(255) | Sim | Nome completo |
| email | VARCHAR(255) | Sim | E-mail único de login |
| senha_hash | VARCHAR(255) | Sim | Hash bcrypt da senha |
| papel | ENUM | Sim | admin, job_leader, funcionario |
| ativo | BOOLEAN | Sim | Indica se o usuário pode usar o sistema |
| criado_em | TIMESTAMPTZ | Sim | Data de criação do registro |
| atualizado_em | TIMESTAMPTZ | Sim | Data da última alteração |

### Entidade: JobLeaderAssignment

Relacionamento N:N entre job leaders e funcionários. Define quais funcionários cada job leader é responsável por aprovar.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| funcionario_id | UUID | Sim | FK para User |
| job_leader_id | UUID | Sim | FK para User |
| criado_em | TIMESTAMPTZ | Sim | Data de criação do vínculo |

### Entidade: Project

Projetos ativos na organização nos quais funcionários podem ser alocados.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| nome | VARCHAR(255) | Sim | Nome do projeto |
| ativo | BOOLEAN | Sim | Indica se o projeto aceita apontamentos |
| criado_em | TIMESTAMPTZ | Sim | Data de criação |
| atualizado_em | TIMESTAMPTZ | Sim | Data da última alteração |

### Entidade: Allocation

Mapeamento de qual funcionário trabalha em qual projeto. Usado para validar que o funcionário só aponta horas em projetos nos quais está alocado.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| funcionario_id | UUID | Sim | FK para User |
| project_id | UUID | Sim | FK para Project |
| criado_em | TIMESTAMPTZ | Sim | Data de criação |

### Entidade: CostCenter

Centros de custo disponíveis para classificação de apontamentos. Parâmetro gerenciado pelo admin.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| nome | VARCHAR(255) | Sim | Nome do centro de custo |
| ativo | BOOLEAN | Sim | Indica se está disponível para uso |
| criado_em | TIMESTAMPTZ | Sim | Data de criação |
| atualizado_em | TIMESTAMPTZ | Sim | Data da última alteração |

### Entidade: Discipline

Áreas de competência ou especialização para classificação de apontamentos. Parâmetro gerenciado pelo admin.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| nome | VARCHAR(255) | Sim | Nome da disciplina |
| ativo | BOOLEAN | Sim | Indica se está disponível para uso |
| criado_em | TIMESTAMPTZ | Sim | Data de criação |
| atualizado_em | TIMESTAMPTZ | Sim | Data da última alteração |

### Entidade: Location

Locais ou modos de trabalho para classificação de apontamentos. Parâmetro gerenciado pelo admin.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| nome | VARCHAR(255) | Sim | Nome do local |
| ativo | BOOLEAN | Sim | Indica se está disponível para uso |
| criado_em | TIMESTAMPTZ | Sim | Data de criação |
| atualizado_em | TIMESTAMPTZ | Sim | Data da última alteração |

### Entidade: UserAllowedOptions

Define quais opções de disciplina, centro de custo e local cada funcionário tem permissão de utilizar. Parâmetro configurado pelo admin.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| user_id | UUID | Sim | FK para User |
| tipo | ENUM | Sim | disciplina, centro_custo, local |
| valor_id | UUID | Sim | ID do registro permitido conforme o tipo |
| criado_em | TIMESTAMPTZ | Sim | Data de criação |

### Entidade: TimeEntry

Registro de apontamento de hora. Entidade central do sistema.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| funcionario_id | UUID | Sim | FK para User — quem apontou |
| job_leader_id | UUID | Sim | FK para User — responsável pela aprovação |
| project_id | UUID | Sim | FK para Project — projeto ao qual o apontamento pertence |
| mes | INTEGER | Sim | Mês do apontamento (1-12) |
| ano | INTEGER | Sim | Ano do apontamento (YYYY) |
| data | DATE | Sim | Data do trabalho realizado |
| inicio | TIME | Sim | Hora de início |
| fim | TIME | Sim | Hora de término |
| duracao | NUMERIC(5,2) | Sim | Duração em horas (pode ser editada) |
| descricao | TEXT | Não | Detalhamento do trabalho |
| cost_center_id | UUID | Sim | FK para CostCenter |
| discipline_id | UUID | Sim | FK para Discipline |
| location_id | UUID | Sim | FK para Location |
| hora_extra | BOOLEAN | Sim | Indica se são horas extras (campo informativo) |
| status | ENUM | Sim | pendente, aprovada, rejeitada |
| motivo_rejeicao | TEXT | Não | Motivo da rejeição (obrigatório ao rejeitar) |
| criado_em | TIMESTAMPTZ | Sim | Data de criação |
| atualizado_em | TIMESTAMPTZ | Sim | Data da última alteração |

### Entidade: AuditLog

Log de auditoria de todas as ações de mutação em TimeEntry.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | UUID | Sim | Identificador único |
| time_entry_id | UUID | Sim | FK para TimeEntry |
| acao | ENUM | Sim | criar, editar, aprovar, rejeitar |
| usuario_id | UUID | Sim | FK para User — quem realizou a ação |
| motivo | TEXT | Não | Motivo informado (para rejeição) |
| dados_alterados | JSONB | Não | Snapshot dos dados alterados (para edição) |
| quando | TIMESTAMPTZ | Sim | Timestamp da ação |

### Ciclo de Vida do Status

```
                    ┌──────────────────┐
                    │     PENDENTE     │
                    │  (criação ou     │
                    │   reenvio)       │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              │                                 │
              ▼                                 ▼
     ┌─────────────────┐             ┌─────────────────┐
     │    APROVADA     │             │   REJEITADA     │
     │  (job leader    │             │  (job leader    │
     │   aprova)       │             │   rejeita com   │
     │                 │             │   motivo)       │
     └─────────────────┘             └────────┬────────┘
                                             │
                                             ▼
                                   ┌─────────────────────┐
                                   │   Volta para        │
                                   │   edição pelo       │
                                   │   funcionário       │
                                   └──────────┬──────────┘
                                              │
                                              │ (reenvio após correção)
                                              ▼
                                   ┌─────────────────────┐
                                   │      PENDENTE      │
                                   │   (reenviado)      │
                                   └─────────────────────┘
```

---

## 5. Autorização e Escopo de Dados (Regrão)

### Implementação do Escopo em Código

A filtragem de escopo é implementada por meio de uma função `scopeFilter` que retorna um objeto de filtro conforme o papel do usuário. Esse filtro é aplicado a todas as consultas da service layer.

```typescript
// Pseudocódigo da lógica de scopeFilter
function scopeFilter(user: SessionUser): FilterObject {
  switch (user.papel) {
    case 'admin':
      return {}; // sem filtro — retorna tudo

    case 'job_leader':
      const teamIds = await getTeamMemberIds(user.id); // funcionários sob responsabilidade
      return { funcionarioId: { in: teamIds } };

    case 'funcionario':
      return { funcionarioId: user.id }; // apenas o próprio registro

    default:
      throw new ForbiddenError('Papel desconhecido');
  }
}
```

### Funções de Autorização

Além do escopo de dados, cada ação requer verificação de permissão pelo papel:

| Ação | Admin | Job Leader | Funcionário |
|------|-------|------------|-------------|
| Criar apontamento | Sim (em nome de qualquer um) | Sim (próprios) | Sim (próprios) |
| Editar apontamento | Sim (qualquer) | Sim (do seu time) | Sim (próprios pendentes/rejeitados) |
| Aprovar linha | Não | Sim (do seu time) | Não |
| Rejeitar linha | Não | Sim (do seu time) | Não |
| Reenviar linha | Não | Não | Sim (próprias rejeitadas) |
| Visualizar dashboard | Todos os dados | Dados do time | Dados próprios |
| Exportar | Todos os dados | Dados do time | Dados próprios |
| Gerenciar parâmetros | Sim | Não | Não |
| Gerenciar usuários | Sim | Não | Não |
| Ver auditoria | Todos os registros | Registros do time | Próprios registros |

### Proteção das Rotas de API

O middleware de autenticação (Auth.js) intercepta todas as requisições a `/api/*`:

1. Verifica existência e validade da sessão
2. Se inválida, retorna `401 Unauthorized`
3. Se válida, injeta o usuário na requisição
4. A service layer utiliza esse usuário para aplicar `scopeFilter`

Rotas que exigem papel específico (ex: admin) validam o papel após a autenticação.

---

## 6. API (Rotas)

### Convenções

- Todas as requisições autenticadas exigem sessão válida (cookie de sessão)
- Resposta de sucesso: objeto com propriedade `data` ou array em `data`
- Resposta de erro: objeto com propriedade `error` contendo `code` e `message`
- Validação de entrada via Zod em todas as rotas POST/PUT/PATCH

### Apontamentos (Time Entries)

| Método | Rota | Descrição | Papel | Escopo |
|--------|------|-----------|-------|--------|
| GET | /api/time-entries | Lista apontamentos (com paginação e filtros) | Todos | Filtrado por escopo |
| POST | /api/time-entries | Cria novo apontamento | Funcionário, Job Leader | Próprio ou do time |
| GET | /api/time-entries/:id | Detalhe de um apontamento | Todos | Filtrado por escopo |
| PUT | /api/time-entries/:id | Atualiza apontamento | Funcionário, Job Leader | Próprio ou do time (status pendente/rejeitado) |
| DELETE | /api/time-entries/:id | Remove apontamento | Admin | Qualquer |
| POST | /api/time-entries/:id/approve | Aprova linha | Job Leader | Do seu time |
| POST | /api/time-entries/:id/reject | Rejeita linha com motivo | Job Leader | Do seu time |
| POST | /api/time-entries/:id/resubmit | Reenvia linha rejeitada | Funcionário | Própria (status rejeitada) |

### Parâmetros (Admin only)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/cost-centers | Lista centros de custo |
| POST | /api/cost-centers | Cria centro de custo |
| PUT | /api/cost-centers/:id | Atualiza centro de custo |
| DELETE | /api/cost-centers/:id | Remove centro de custo |
| GET | /api/disciplines | Lista disciplinas |
| POST | /api/disciplines | Cria disciplina |
| PUT | /api/disciplines/:id | Atualiza disciplina |
| DELETE | /api/disciplines/:id | Remove disciplina |
| GET | /api/locations | Lista locais |
| POST | /api/locations | Cria local |
| PUT | /api/locations/:id | Atualiza local |
| DELETE | /api/locations/:id | Remove local |
| GET | /api/projects | Lista projetos |
| POST | /api/projects | Cria projeto |
| PUT | /api/projects/:id | Atualiza projeto |
| DELETE | /api/projects/:id | Remove projeto |

### Alocações (Admin only)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/allocations | Lista alocações |
| POST | /api/allocations | Cria alocação |
| DELETE | /api/allocations/:id | Remove alocação |

### Usuários e Hierarquia (Admin only)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/users | Lista usuários |
| POST | /api/users | Cria usuário |
| PUT | /api/users/:id | Atualiza usuário |
| DELETE | /api/users/:id | Desativa usuário |
| GET | /api/job-leader-assignments | Lista vínculos job leader/funcionário |
| POST | /api/job-leader-assignments | Cria vínculo |
| DELETE | /api/job-leader-assignments/:id | Remove vínculo |
| GET | /api/user-allowed-options | Lista opções permitidas por usuário |
| POST | /api/user-allowed-options | Define opções permitidas |
| DELETE | /api/user-allowed-options/:id | Remove opção permitida |

### Relatórios e Dashboard

| Método | Rota | Descrição | Papel | Escopo |
|--------|------|-----------|-------|--------|
| GET | /api/reports/hours-by-project | Agregação de horas por projeto | Todos | Filtrado |
| GET | /api/reports/hours-by-employee | Agregação de horas por funcionário | Todos | Filtrado |
| GET | /api/reports/hours-by-cost-center | Agregação de horas por centro de custo | Todos | Filtrado |
| GET | /api/reports/hours-by-discipline | Agregação de horas por disciplina | Todos | Filtrado |
| GET | /api/reports/hours-by-period | Agregação de horas por período | Todos | Filtrado |
| GET | /api/audit-log | Log de auditoria | Todos | Filtrado |

### Exportação

| Método | Rota | Descrição | Papel | Escopo |
|--------|------|-----------|-------|--------|
| POST | /api/export/time-entries | Exporta apontamentos (CSV/Excel) | Todos | Filtrado |
| POST | /api/export/audit-log | Exporta log de auditoria | Todos | Filtrado |

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/login | Login com credenciais |
| POST | /api/auth/logout | Logout e invalidação de sessão |
| GET | /api/auth/session | Retorna sessão atual |

---

## 7. Regras de Negócio → Regras Técnicas

### Aprovação por Linha

A aprovação é sempre individual, por linha de TimeEntry. A service layer implementa validação de status antes de processar a aprovação:

1. Verificar que o status atual é `pendente`
2. Verificar que o usuário logado é o job leader responsável pela linha
3. Executar atualização atômica: `status = 'aprovada'`
4. Registrar em AuditLog

Se a linha já estiver aprovada, retornar erro 409 Conflict.

### Rejeição com Motivo Obrigatório

Ao rejeitar, o campo `motivo_rejeicao` é de preenchimento obrigatório:

1. Validar presença de `motivo_rejeicao` com Zod (não vazio, mínimo de 3 caracteres)
2. Verificar status atual é `pendente`
3. Verificar permissão do job leader
4. Executar atualização atômica: `status = 'rejeitada'`
5. Registrar em AuditLog com o motivo

### Hora Extra Informativa

O campo `hora_extra` é booleano e exclusivamente informativo. Não há:

- Validação de limite de horas extras
- Fluxo de aprovação específico
- Regra de duração diferente

O valor é armazenado como informado pelo funcionário.

### Duração Calculada e Editável

A duração é calculada automaticamente na service layer ao criar ou editar:

```
duracao = (fim - inicio) em horas decimais
```

O campo é persistido no banco e pode ser ajustado manualmente pelo funcionário antes do reenvio. A service layer não recalcula automaticamente após edição manual — assume-se que o valor informado é o correto.

### Bloqueio de Edição em Linha Aprovada

Antes de qualquer edição, a service layer verifica:

```
SE timeEntry.status === 'aprovada'
  ENTÃO retornar erro 400 Bad Request com mensagem "Linha aprovada não pode ser editada"
```

A verificação ocorre em todas as rotas de PUT e DELETE sobre TimeEntry.

### Limitação de Opções por Funcionário

Ao criar ou editar um TimeEntry, a service layer valida:

```
SE UserAllowedOptions existe para user_id + tipo + valor_id
  ENTÃO permitir
  SENÃO retornar erro 400 com "Opção não permitida para este usuário"
```

A validação é feita para `cost_center_id`, `discipline_id` e `location_id`.

### Validação de Alocação

Ao criar TimeEntry, verificar que existe Allocation ativa ligando o funcionário ao projeto:

```
SE NOT exists Allocation(funcionario_id, project_id)
  ENTÃO retornar erro 400 com "Funcionário não alocado neste projeto"
```

---

## 8. Relatórios e Auditoria (Técnico)

### Agregações para Dashboard

Os endpoints de relatórios executam queries agregadas no ORM com GROUP BY. Os dados são filtrados pelo escopo do usuário antes da agregação:

```sql
-- Exemplo: horas por projeto (conceitual)
SELECT 
  p.id AS project_id,
  p.nome AS project_name,
  SUM(te.duracao) AS total_horas
FROM time_entries te
JOIN projects p ON te.project_id = p.id
WHERE <filtros de escopo: funcionario_id IN (...) >
  AND te.status = 'aprovada'
GROUP BY p.id, p.nome
ORDER BY total_horas DESC;
```

Os gráficos exibem os totais agregados. A granularidade (por dia, semana, mês) é parametrizada na requisição.

### Exportação CSV/Excel

A exportação é implementada em endpoint separado que:

1. Aplica o escopo de dados do usuário
2. Aplica filtros adicionais (período, projeto, etc.)
3. Gera arquivo no formato solicitado (biblioteca a definir na spec)
4. Retorna o arquivo para download

### AuditLog

O AuditLog é gravado pela service layer a cada operação de mutação, não por trigger de banco. A estrutura garante que o registro contenha o contexto completo da ação:

- **Criar:** registra o ID da nova linha e snapshot dos dados
- **Editar:** registra o ID da linha alterada, campos modificados e valores antigos/novos
- **Aprovar:** registra o ID da linha, ID do aprovador, timestamp
- **Rejeitar:** registra o ID da linha, ID do rejeitador, motivo informado, timestamp

---

## 9. Erros, Validação e Tratamento

### Formato de Resposta de Erro

Todas as rotas de API seguem formato consistente:

```json
{
  "error": {
    "code": "TIME_ENTRY_NOT_FOUND",
    "message": "Apontamento não encontrado"
  }
}
```

Códigos de erro em maiúsculo separados por underscore.

### Códigos de Erro Comuns

| Código HTTP | Code | Cenário |
|-------------|------|---------|
| 400 | VALIDATION_ERROR | Dados de entrada inválidos |
| 400 | OPTION_NOT_ALLOWED | Disciplina/centro/local não permitido para o usuário |
| 400 | EMPLOYEE_NOT_ALLOCATED | Funcionário não alocado no projeto |
| 400 | APPROVED_ENTRY_EDIT | Tentativa de editar linha já aprovada |
| 400 | REJECTION_WITHOUT_REASON | Rejeição sem motivo obrigatório |
| 401 | UNAUTHORIZED | Sessão inválida ou ausente |
| 403 | FORBIDDEN | Usuário sem permissão para a ação |
| 404 | NOT_FOUND | Recurso não encontrado |
| 409 | CONFLICT | Estado conflitante (ex: aprovar já aprovada) |
| 500 | INTERNAL_ERROR | Erro interno não tratado |

### Validação com Zod

Cada domínio possui schemas Zod que validam entrada na API:

```typescript
// Exemplo conceitual
const CreateTimeEntrySchema = z.object({
  projectId: z.uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  inicio: z.string().regex(/^\d{2}:\d{2}$/),
  fim: z.string().regex(/^\d{2}:\d{2}$/),
  costCenterId: z.uuid(),
  disciplineId: z.uuid(),
  locationId: z.uuid(),
  horaExtra: z.boolean().default(false),
  descricao: z.string().max(1000).optional(),
});
```

### Mensagens de Erro Específicas

Erros de validação retornam a mensagem descritiva, não genérica:

- ✅ "Centro de custo não encontrado ou inativo"
- ❌ "Invalid input"
- ✅ "O campo início deve ser anterior ao campo fim"
- ❌ "Bad request"

### Tratamento de Conflito de Status

Ao processar aprovação ou rejeição, a service layer verifica o status atual:

```typescript
if (timeEntry.status === 'aprovada') {
  throw new ConflictError('LINE_ALREADY_APPROVED', 'Esta linha já foi aprovada');
}
```

---

## 10. Pendências para a Especificação

As seguintes decisões ficam para a especificação detalhada do projeto:

| Item | Opções | Observação |
|------|--------|------------|
| ORM | Prisma ou Drizzle | Prisma: DX maduro, migrations robustas. Drizzle: leve, SQL-like, performance |
| Biblioteca de gráficos | Recharts ou outra | Recharts é opção comum com ecossistema React |
| Biblioteca de exportação | xlsx, exceljs, papaparse | Formato CSV/Excel |
| Provedor de sessão | Cookie-only ou cookie + banco | Auth.js suporta ambos; impacto em escalabilidade |
| Credenciais de auth | Credentials provider ou E-mail (magic link) | Impacta UX e requisitos de infraestrutura |
| Hosting do PostgreSQL | Instância própria, RDS, Supabase, Neon | Impacta custo e operacional |
| Estratégia de migrations | Prisma Migrate, Drizzle Kit, Liquibase | Ferramenta de controle de versão do schema |

---

## 11. Fora de Escopo Técnico

As seguintes funcionalidades foram explicitamente excluídas do projeto e não devem ser implementadas:

- **Integrações externas:** não há integração com sistemas de folha de pagamento, ERP ou quaisquer sistemas externos nesta fase
- **Notificações push ou e-mail:** sem mecanismo de notificação automática nesta fase
- **RLS no banco de dados:** autorização é implementada em código na service layer, por decisão arquitetural
- **Hora extra com fluxo próprio:** campo é exclusivamente informativo, sem validação ou aprovação específica
- **Aprovação em lote:** cada linha requer aprovação individual; não há "aprovar todos"
- **Gerenciamento de conflitos de horário:** validação se dois apontamentos se sobrepõem no mesmo dia fica como melhoria futura

---

*Documento de arquitetura técnica — MCM Sistema de Apontamento de Horas*
