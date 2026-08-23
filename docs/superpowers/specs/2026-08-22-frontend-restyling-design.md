# Spec — Restyling do Frontend MCM Apontamento de Horas

**Data:** 2026-08-22
**Status:** Aguardando revisão
**Referência:** `docs/reference/` (3 HTMLs: Dashboard Funcionário, Dashboard Job Leader, Painel Admin)

## 1. Contexto e objetivo

O app Next.js 16 (App Router, Tailwind v4, shadcn-style sobre @base-ui/react) está funcional mas com styling incompleto: os primitives consomem tokens semânticos (`bg-primary`, `bg-card`, `ring-ring`) que **não estão definidos** no `globals.css`. A pasta `docs/reference` contém mockups HTML de alta fidelidade que definem o design system alvo.

**Objetivo:** aplicar o design da referência ao app existente via **restyling puro** — rotas, fluxos, dados e APIs permanecem intactos. A abordagem é **token-first**: a referência é abstraída em sistema (tokens + primitives + padrões de página), nunca copiada como markup.

### Decisões de escopo (aprovadas)

| Decisão | Escolha |
|---|---|
| Escopo | Restyling apenas; rotas e fluxos mantidos |
| Dark mode | Removido — tema light-only |
| Sino de notificações | Omitido (sem feature real) |
| Export CSV/Excel | Omitido (sem feature real) |
| Responsividade | Incluída (sidebar drawer <lg, grids colapsam) |
| Charts | recharts mantido (Plotly da referência descartado) |
| Ícones | lucide-react mantido (FontAwesome da referência mapeado 1:1) |
| Novo apontamento | Continua página `/time-entries/new` (não vira modal) |
| Admin | Continua páginas separadas (não vira tabs) |

## 2. Design system abstrato da referência

Princípios extraídos dos 3 HTMLs:

- **Hierarquia fundo→card:** body `gray-50`; cards brancos `rounded-xl border gray-200`; conteúdo vive em cards
- **Cor com significado semântico consistente:** âmbar = pendente, emerald = aprovado/ativo, red = rejeitado/inativo, indigo = primário/marca. Badges-pílula com dot colorido; linha inativa com `opacity-60`
- **Header contextual por página:** título + subtítulo à esquerda, ações à direita — cada página declara as suas
- **Sidebar informativa:** papel do usuário define itens; grupos com label; footer com identidade (avatar/nome/papel/logout)
- **Regras de negócio visíveis:** linha aprovada imutável (cadeado); rejeição exige motivo exibido ao funcionário para reenvio
- **Tipografia Inter**, escala compacta (títulos de card `text-sm font-semibold`, labels `text-xs uppercase tracking-wide`)

## 3. Arquitetura da solução

Três camadas, nesta ordem de implementação:

1. **Tokens** (`globals.css`) — fonte única de verdade visual
2. **Shell** (Sidebar, PageHeader, responsividade) — estrutura global
3. **Primitives → feature components → páginas** — aplicação dos padrões

### 3.1 Camada 1 — Tokens (`src/app/globals.css`)

Reescrita completa. Remove blocos dark mode (`prefers-color-scheme` e `.dark`). Conjunto shadcn-style completo mapeado da paleta da referência:

```css
:root {
  --primary: #4f46e5;          /* indigo-600 — CTAs, item ativo */
  --primary-hover: #4338ca;    /* indigo-700 */
  --primary-subtle: #eef2ff;   /* indigo-50 — fundo ativo/chips */
  --primary-foreground: #ffffff;

  --background: #f9fafb;       /* gray-50 */
  --foreground: #1f2937;       /* gray-800 */
  --card: #ffffff;
  --card-foreground: #1f2937;

  --muted: #f3f4f6;            /* gray-100 — thead, hover */
  --muted-foreground: #6b7280; /* gray-500 */
  --border: #e5e7eb;           /* gray-200 */
  --input: #d1d5db;            /* gray-300 */
  --ring: #818cf8;             /* indigo-400 */

  --secondary: #f3f4f6;
  --secondary-foreground: #374151;

  --success: #059669;          /* emerald-600 */
  --warning: #d97706;          /* amber-600 */
  --destructive: #dc2626;      /* red-600 */
  --info: #0891b2;             /* cyan-600 */

  --radius: 0.75rem;           /* rounded-xl nos cards */
}
```

Mapear todos via `@theme inline` para `--color-*` (incluindo `--color-primary-subtle`, `--color-primary-hover`), de modo que `bg-primary-subtle` etc. existam como utilitários.

Fontes: Inter já carregada via `next/font` (`--font-inter`) — sem alteração.

**Efeito esperado:** utilitários hoje "mortos" passam a aplicar cor — o app inteiro muda já nesta camada. Verificar build logo após.

### 3.2 Camada 2 — Shell

#### Sidebar (`src/components/layout/sidebar.tsx` — reconstruída)

- Container: `hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-40`
- Header h-16 `border-b`: badge "M" (`w-8 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-bold`) + "MCM" (`text-lg font-bold`)
- Itens de nav: `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground`
  - Ativo: `bg-primary-subtle text-primary` (substitui o atual `border-l-[3px]`)
- Grupos: campo opcional `group` no config; label renderizada como `px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground`
- Footer `border-t p-4`: avatar com iniciais (`w-9 h-9 rounded-full bg-primary-subtle text-primary text-sm font-semibold`), nome truncado + papel em xs muted, ícone logout à direita (ação existente do UserMenu)
- Recebe `user` (nome + papel) do `(app)/layout.tsx` — hoje só recebe `papel`

Config de nav por papel:

```
Base (todos):        Dashboard /, Apontamentos /time-entries,
                     Relatórios /reports, Auditoria /audit
JOB_LEADER:          + Aprovações /approvals
ADMIN:               + grupo "Parametrização":
                       Cadastros → /admin (hub)
                       Usuários & Permissões → /admin/usuarios
```

Ícones lucide equivalentes aos FontAwesome da referência: gauge, clock, list-check/check-square, users, bar-chart-3, clock-rotate-left/history, sliders, users-gear, settings.

#### PageHeader (novo: `src/components/layout/page-header.tsx`)

Substitui o Topbar global quase vazio:

- Server component: `<PageHeader title subtitle? actions?>`
- Estilo: `sticky top-0 z-20 h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6`
- Esquerda: `<MobileSidebarTrigger />` (`lg:hidden`) + título (`text-lg font-bold`) + subtítulo (`text-xs text-muted-foreground hidden sm:block`)
- Direita: slot `actions` (client components como o `PeriodFilter` existente) + trigger do CommandPalette (ícone busca, atalho ⌘K preservado)
- Cada página renderiza o seu header dentro do próprio tree (padrão idiomático p/ server components)

`(app)/layout.tsx` passa a:

```tsx
<div className="min-h-dvh">
  <Sidebar user={user} />
  <div className="lg:pl-64">{children}</div>
</div>
```

Topbar fixo global removido; CommandPalette migra para o PageHeader.

#### Responsividade

- Padrão mínimo estilo shadcn-sidebar: `SidebarProvider` (client context, estado open/close do drawer mobile) no `(app)/layout.tsx`; conteúdo da sidebar extraído para componente compartilhado desktop/drawer; `<MobileSidebarTrigger />` consumido pelo PageHeader; drawer renderizado uma vez no layout usando `ui/drawer`
- Grids colapsam: KPIs `grid-cols-2 lg:grid-cols-4` (admin `lg:grid-cols-5`), gráfico+card lateral `grid-cols-1 lg:grid-cols-3` (gráfico `lg:col-span-2`)

### 3.3 Camada 3a — Primitives (ajustes cirúrgicos, APIs preservadas)

| Primitive | Mudança |
|---|---|
| Card | `ring-1 ring-foreground/10` → `border border-border`; `--card-spacing` 4→5 (padding p-5) |
| Button | hover do default → `bg-primary-hover` |
| Badge | suporte a *dot* interno (`w-1.5 h-1.5 rounded-full`) |
| Table | thead `bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground`; linhas `divide-y divide-border hover:bg-muted/50`; células `px-5 py-3.5` |
| Input/Select/Textarea | `h-9 rounded-lg border-input focus-visible:border-ring focus-visible:ring-ring/50` |

Skeleton, Dialog, Drawer, DropdownMenu, Tooltip, Checkbox, Label: sem mudança estrutural (herdam tokens).

### 3.4 Camada 3b — Feature components

| Componente | Mudança |
|---|---|
| `kpi-card.tsx` | Duas variantes: **rich** (label xs uppercase muted + chip de ícone `w-8 h-8 rounded-lg` com tom à direita; valor `text-2xl font-bold`; sub xs muted) e **simple** (label + valor apenas). Props: `label, value, sub?, icon?, tone?: "primary"\|"warning"\|"success"\|"destructive"` |
| `status-badge.tsx` | Pílula + dot colorido (padrão da referência); cores via tokens semânticos |
| `data-table.tsx` | Slot opcional `toolbar` (controles de busca/filtro só quando houver query param já suportado pela API da rota — se não houver, o controle é omitido, não fica desabilitado); footer "Mostrando X–Y de Z" + paginação numerada compacta (`w-7 h-7 rounded-lg`, página atual `bg-primary text-primary-foreground`); remove borda dupla externa (card já dá borda) |
| `chart-card.tsx` | Header: título `text-sm font-semibold` + hint de período `text-xs text-muted-foreground` à direita |
| `bar-chart/period-chart/projeto-chart` | Cores via tokens CSS (`var(--primary)`, `var(--border)` para grid); dados intactos |
| `time-entry-form.tsx` | Reagrupamento visual: Data/JL → Início/Fim (grid-cols-2) → Duração auto-calculada → CC/Disciplina (grid-cols-2) → Local → Descrição → checkbox hora extra. Lógica e schema intactos |
| `approval-drawer.tsx`, `time-entry-detail-drawer.tsx` | Mantêm fluxo; herdam visual dos primitives |

### 3.5 Camada 3c — Páginas (rotas e dados intactos)

| Rota | Restyle |
|---|---|
| `/` (dashboard funcionário) | PageHeader "Meus Apontamentos" + PeriodFilter nas ações; KPIs rich ×4; grid `lg:grid-cols-3`: gráfico semanal `col-span-2` + card **Ações necessárias** (rejeitadas com motivo + link "Editar e reenviar" → rota existente); tabela de apontamentos com toolbar/paginação |
| `/approvals` | PageHeader "Aprovações da Equipe"; KPIs rich JL; gráfico aprovadas vs rejeitadas (recharts grouped bar, success/destructive) + card **Pendências por colaborador**; fila com botões inline Aprovar (success) / Rejeitar (destructive outline) — fluxo ApprovalDrawer preservado; linha aprovada mostra cadeado desabilitado |
| `/reports`, `/audit` | Tokens, tabela e charts padrão aplicados |
| `/admin` (hub) | Cards de link restilizados no padrão de card |
| `/admin/cost-centers`, `disciplines`, `locations`, `projects`, `vinculos`, `opcoes`, `usuarios` | Tabelas CRUD no padrão; forms em Dialog restilizados; StatusBadge para ativo/inativo (dot + `opacity-60` na linha inativa) |
| `/time-entries/new`, `/time-entries/[id]` | Form/drawer restilizados |
| `/login` | Alinhamento ao tema light/indigo |

## 4. Fora de escopo

Sino de notificações, export CSV/Excel, dark mode, tabs unificadas no admin, modal de novo apontamento, agrupamentos de sidebar além do especificado, qualquer endpoint/API nova.

## 5. Testes e verificação

1. Testes vitest existentes: atualizar queries/classes onde os componentes mudarem (StatusBadge ganha dot; DataTable footer muda texto)
2. `npm run lint` e `npm run test` verdes
3. `npm run build` (typecheck incluso) verde
4. Smoke visual manual por página contra a referência: `/`, `/approvals`, `/admin`, `/admin/cost-centers`, `/time-entries/new`, `/login` — desktop e viewport estreito (<lg valida drawer)

## 6. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Tokens revelarem estilos implícitos quebrados em componentes não previstos | Build + smoke após Camada 1 antes de prosseguir |
| PageHeader por página duplicar markup | Componente único com props; layout não sabe o título — aceito (trade-off do padrão App Router server-first) |
| Drawer mobile conflitar com sticky header | Contexto único + drawer renderizado uma vez; trigger é só botão |
| Drift visual futuro fora dos tokens | Convenção: cores apenas via tokens/primitives — nada hardcoded em feature components |
