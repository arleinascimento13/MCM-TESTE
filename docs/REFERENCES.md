# Design References

Repository de referências de design usados como base para templates e componentes deste projeto.

## shadcn-admin

- **Repository:** https://github.com/satnaing/shadcn-admin
- **Type:** Dashboard admin template (React + Vite + Tailwind CSS)
- **Stack:** shadcn/ui, Radix UI, Tailwind CSS, Lucide icons
- **License:** MIT

**Usage:** Referência para dashboards e interfaces administrativas — layout com sidebar, topbar,
tabelas de dados, formulários, cards de métricas, gráficos e temas light/dark.

**Padrões a extrair:**

- Estrutura de layout admin (sidebar + header + conteúdo).
- Componentes shadcn/ui aplicados a casos reais (tables, forms, dialogs, dropdowns).
- Organização de pastas e composição de páginas.
- Sistema de theming com CSS variables.

## Attio

- **Repository:** https://attio.com
- **Type:** CRM moderno (SaaS B2B)
- **Stack:** React, TypeScript, Tailwind CSS
- **License:** Proprietário

**Usage:** Referência para CRM data-dense com foco em usabilidade — tabelas de dados,
drawer de detalhes, command palette, formulários, empty states.

**Padrões a extrair:**

- Data table com sort, filter, selection e bulk actions.
- Drawer/detail panel para visualização e edição de registros sem perder contexto.
- Command palette (cmd+k) com busca fuzzy e navegação por teclado.
- Empty states com ilustração e CTA claro.

## Atomic CRM

- **Repository:** https://github.com/nicolasanjones/atomic-crm
- **Type:** CRM open-source
- **Stack:** React, shadcn/ui, Supabase, Tailwind CSS
- **License:** MIT

**Usage:** CRM completo com pipeline Kanban — referência para implementação de deals/pipeline,
tabelas de contatos e empresas, formulários com validação.

**Padrões a extrair:**

- Pipeline Kanban para visualização de deals (drag-and-drop entre stages).
- Tabelas data-dense para contatos e empresas com filtros inline.
- Integração com Supabase para autenticação e dados realtime.
- shadcn/ui aplicado a casos reais de CRM.

## shadcndashboard

- **Repository:** https://github.com/shadcndashboard/shadcndashboard
- **Type:** Admin dashboard kit
- **Stack:** React, Vite, shadcn/ui, Tailwind CSS, Recharts
- **License:** MIT

**Usage:** Kit de admin dashboard com blocos prontos — KPI cards, gráficos, tabelas,
formulários, sidebar navigation.

**Padrões a extrair:**

- Composição de páginas com blocos reutilizáveis (cards, charts, tables).
- KPI cards com tendências e contexto comparativo.
- Gráficos com palette categórica e estados de loading/empty.
- Layout responsivo com sidebar colapsável.

## Salesforce Lightning Design System

- **Repository:** https://www.lightningdesignsystem.com
- **Type:** Design system enterprise (Salesforce)
- **Stack:** CSS, Salesforce Lightning Web Components, React
- **License:** Proprietário (Salesforce)

**Usage:** Design system enterprise para CRM — padrões de data tables, record home,
form layout, navigation.

**Padrões a extrair:**

- Data table com pinned columns, inline editing e row expansion.
- Record home layout com header de objeto e related lists.
- Form layout com field-level validation e inline editing.
- Sistema de tokens para design consistente (cores, spacing, typography).

## Adicionando novas referências

Copie o template acima, ajuste os campos e descreva os padrões que deseja extrair do
repositório.
