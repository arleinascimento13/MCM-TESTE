---
version: "alpha"
name: "CRM/ERP Data-Dense Dashboard"
description: "Data-dense dashboard design system for CRM/ERP. Optimized for information-rich interfaces with tables, KPIs, and complex workflows."
colors:
  primary: "#3B82F6"
  secondary: "#64748B"
  tertiary: "#FFFFFF"
  neutral: "#0F172A"
  surface: "#1E293B"
  background: "#0F172A"
  accent: "#3B82F6"
  success: "#22C55E"
  warning: "#F59E0B"
  danger: "#EF4444"
  info: "#06B6D4"
  border: "#334155"
  muted: "#475569"
typography:
  h1:
    fontFamily: Inter
    fontSize: 1.875rem
    fontWeight: 600
  h2:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: 600
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
  mono:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: 400
rounded:
  sm: 4px
  md: 6px
  lg: 8px
spacing:
  density-dense: 36px
  density-comfortable: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.tertiary}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  data-table-row-dense:
    height: "{spacing.density-dense}"
    fontSize: "0.8125rem"
  data-table-row-comfortable:
    height: "{spacing.density-comfortable}"
    fontSize: "0.875rem"
---

## Overview

Data-dense dashboard design system for CRM/ERP applications. Built for interfaces where information density, scannability, and operational efficiency are paramount — not marketing-first SaaS landing pages.

This system rejects the airy, hero-driven paradigm of marketing sites in favor of a chrome-minimal, data-forward approach. The sidebar stays fixed, the content area maximizes vertical space, and every pixel serves the workflow. Think Linear's precision meets Salesforce's depth.

The core tension in CRM/ERP design is density vs. clarity. Users live in these interfaces 8+ hours/day. Airy spacing that looks elegant in a screenshot becomes frustrating in daily use. The solution is controlled density with clear visual hierarchy — not a uniform 3/10 density, but context-appropriate density that users can understand at a glance.

- **Density:** 7/10 — Dense
- **Variance:** 4/10 — Structured with flexibility
- **Motion:** 4/10 — Functional, not decorative

- **Style:** Precise, Functional, Information-Dense
- **Keywords:** data-dense, dashboard, CRM, ERP, tables, KPIs, command palette, drawer, form layout, skeleton states
- **Era:** Contemporary, Enterprise-grade
- **Light/Dark:** ✓ Dark-first / ✓ Light mode supported

## Colors

### Neutral Family (Chrome)
- **Background Dark:** #0F172A — Primary app background
- **Surface Dark:** #1E293B — Cards, panels, table rows
- **Border:** #334155 — Dividers, table borders, input strokes
- **Muted:** #475569 — Secondary text, disabled states
- **Secondary Text:** #64748B — Labels, placeholders

### Accent & Actions
- **Primary Blue:** #3B82F6 — Primary actions, links, active states, selected rows
- **Primary Hover:** #2563EB — Hover state for primary actions

### Semantic Colors (State Only — Never Decoration)
- **Success:** #22C55E — Positive status, completed, won, paid
- **Warning:** #F59E0B — Attention needed, pending, at-risk
- **Danger:** #EF4444 — Errors, lost, overdue, destructive actions
- **Info:** #06B6D4 — Informational, neutral status badges

### Usage Rules
- Semantic colors communicate **state only**: table row badges, status pills, inline indicators
- Never paint large surfaces (cards, backgrounds) with semantic colors
- Dark mode uses dark neutrals for chrome; light mode uses light neutrals
- Maintain WCAG AA contrast (4.5:1 minimum) for all text

## Typography

### Font Stack
- **UI Font:** Inter — Primary for all interface text, labels, navigation
- **Mono Font:** JetBrains Mono — Numbers, IDs, codes, technical values, timestamps

### Type Scale
- **H1 (Page Title):** Inter 600, 1.875rem (30px), tight leading (1.2)
- **H2 (Section Header):** Inter 600, 1.25rem (20px), leading 1.4
- **Body:** Inter 400, 0.875rem (14px), leading 1.5
- **Small/Labels:** Inter 500, 0.75rem (12px), leading 1.4, slight tracking (+0.02em)
- **Mono Values:** JetBrains Mono 400, 0.8125rem (13px), tabular-nums

### Critical: Tabular Numerals
All numeric data in tables MUST use `font-variant-numeric: tabular-nums` to ensure column alignment:
```css
font-variant-numeric: tabular-nums;
font-feature-settings: "tnum";
```

### Alignment Rules
- Text: left-aligned
- Numbers: right-aligned
- Status badges: centered
- Actions: right-aligned or icon-only
- IDs/Codes: left-aligned with mono font

## Layout

### Application Shell
- **Sidebar:** Fixed 240-280px width. Dark background (#0F172A). Contains navigation, user menu, settings.
- **Topbar:** Fixed height 56-64px. Contains breadcrumbs, search (cmd+k trigger), user actions, notifications.
- **Content Area:** Flexible. Scrollable. Max-width ~1600px or full-bleed depending on data needs.
- **Detail Drawer:** Slides from right. 400-600px width. For record detail/edit without leaving context.

### Sidebar Structure
```
[Logo / App Name]
─────────────────
[Search (cmd+k)]
─────────────────
[Nav Section: Main]
  • Dashboard
  • Contacts
  • Companies
  • Deals
─────────────────
[Nav Section: Operations]
  • Tasks
  • Reports
─────────────────
[Nav Section: Settings]
  • Integrations
  • Team Settings
─────────────────
[User Avatar + Name]
[Logout]
```

### Content Grid
- CSS Grid with `auto-fill` for responsive columns
- KPI cards: 3-4 columns on desktop, 2 on tablet, 1 on mobile
- Tables: Full-width within content area, horizontal scroll if needed
- Detail panels: Fixed width drawer, not modal

### Spacing Rhythm
- Base unit: 4px
- Compact padding: 8px (dense tables, badges)
- Standard padding: 12-16px (cards, inputs)
- Section gaps: 24px
- Page margins: 24px desktop, 16px mobile

### z-index Contract
- base: 0
- sidebar: 50
- header: 100
- dropdown: 200
- drawer: 300
- modal: 400
- toast: 500

## Elevation & Depth

### Shadows (Use Sparingly — Dark Mode Inverts Perception)
- **Elevation 1:** `0 1px 2px rgba(0,0,0,0.3)` — Subtle separation, table rows
- **Elevation 2:** `0 4px 6px rgba(0,0,0,0.3)` — Dropdowns, popovers
- **Elevation 3:** `0 10px 15px rgba(0,0,0,0.4)` — Drawers, modals

### Borders Over Shadows
- In dark mode, borders (`#334155`) create better separation than shadows
- Use borders for component grouping; reserve shadows for elevation emphasis
- Hover states: subtle background color shift, not shadow

### Motion Principles
- **Duration:** 150-200ms for micro-interactions, 250-300ms for panels/drawers
- **Easing:** `ease-out` for entries, `ease-in` for exits
- **What to animate:** opacity, transform (translate, scale), background-color
- **What NOT to animate:** width, height, layout properties
- **Reduced motion:** Respect `prefers-reduced-motion`

## Shapes

### Border Radius
- **Buttons, Inputs, Badges:** 4px (rounded-sm)
- **Cards, Panels:** 6px (rounded-md)
- **Modals, Drawers:** 8px (rounded-lg)
- **Avatars:** 50% (circular)
- No fully-rounded (pill) shapes — corners should look precise, not soft

## Components

### Data Table (Central Component)
The data table is the workhorse of CRM/ERP. It must be fully featured:

**Header:**
- Sticky on scroll (position: sticky, top: 0)
- Multi-column sort with visible state (↑↓ indicators)
- Filter inline below or above header row
- Column resizing handles

**Body:**
- Row height: 36px (dense) or 48px (comfortable)
- Row selection: checkbox column, shift+click range select
- Expandable rows: click to reveal related data
- Hover: subtle background highlight
- Zebra striping optional (use borders instead for better dark mode)

**Footer:**
- Pagination controls: Previous | Page 1 of 24 | Next
- Rows per page selector: 25, 50, 100
- Bulk action bar appears when rows selected: "23 selected | Delete | Export | Assign"

**Columns:**
- Text: left-aligned
- Numbers: right-aligned, tabular-nums
- Status/Badges: centered
- Actions (edit/delete): right-aligned
- Checkbox: leftmost column

### KPI / Stat Card
```
┌─────────────────────────────────────┐
│ Deal Value                    ▲ 12% │
│ $847,500                    vs last │
│                              month  │
└─────────────────────────────────────┘
```
- Value: Large, mono font
- Label: Small, secondary text
- Trend: Inline badge (green/red) with arrow + percentage
- Context line: "vs last month" or "vs target"

### Sidebar Navigation
- Fixed position, full height
- Collapsible sections with chevron
- Active item: primary blue left border (3px) + background highlight
- Hover: subtle background change
- Icons: 20px Lucide, color matches text state

### Command Palette (Cmd+K)
- Triggered by cmd+k or search icon
- Modal overlay with search input
- Results grouped: Recent, Contacts, Companies, Actions
- Keyboard navigation: arrow keys + enter
- Fuzzy search with highlighting

### Form Layout
- Label above input (not floating)
- 1px border stroke on inputs
- Focus ring: 2px primary blue offset
- Error state: red border + error text below
- Required indicator: asterisk, not "required" text
- Inline validation on blur
- Grouped fieldsets with legend

### Drawer / Detail Panel
- Slides from right edge
- 400-600px width
- Header with title + close button
- Scrollable content area
- Sticky footer with action buttons
- Backdrop click closes

### Dialog / Modal
- Centered overlay
- Max-width: 480px (small), 640px (medium)
- Header with title + close X
- Scrollable body if needed
- Footer with cancel/confirm actions
- Focus trap when open

### Empty States
- Centered in container or table
- Icon (48px, muted color)
- Headline: "No contacts yet"
- Description: "Add your first contact to get started"
- CTA button: Primary action
- NOT a blank space

### Skeleton Loading
- Shimmer animation (not spinner)
- Matches exact dimensions of content
- Table: row skeletons with cell widths matching columns
- Cards: card-shaped skeletons
- Never show a spinner for content loading

### Badge / Status Pill
- Height: 20-24px
- Padding: 4px 8px
- Font: 0.75rem, weight 500
- Semantic colors only for status:
  - Success (#22C55E): Active, Won, Paid, Completed
  - Warning (#F59E0B): Pending, At Risk, In Progress
  - Danger (#EF4444): Lost, Overdue, Error
  - Info (#06B6D4): New, Neutral, Informational
  - Default (muted): Archived, Inactive

### Charts
- Categorical palette (up to 8 series distinguishable)
- Include empty/error states
- Tooltips match app theme
- Legend positioned outside chart area
- Responsive: stack vertically on mobile

## Do's and Don'ts

### Universal Good Practices
- No emojis in UI — use icon system only (Lucide icons)
- No decorative gradients — functional color only
- No shadows heavier than `0 10px 15px rgba(0,0,0,0.4)`
- No pure black (#000000) — use #0F172A or #1E293B for dark surfaces
- No oversaturated accent colors (saturation cap: 80%)
- No 3-column equal-width layouts for features
- No AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen"
- No broken external image links
- No generic lorem ipsum in demos
- Use `min-h-[100dvh]` not `h-screen`
- Use `rem` not `px` for font sizes

### Data-Dense Specific
- **DO** use semantic colors only for state communication (badges, indicators, inline status)
- **DO NOT** paint large surfaces with semantic colors (card backgrounds, table row backgrounds)
- **DO** use tabular-nums for all numeric columns
- **DO** align numbers right, text left, status badges centered
- **DO** implement density contextually (tables dense, detail views comfortable)
- **DO NOT** force a single global density toggle — let each context decide
- **DO** use sticky headers and pinned columns for large tables
- **DO** show bulk action bars when rows are selected
- **DO** use pagination over infinite scroll for data tables
- **DO** include empty states with clear CTAs
- **DO** show skeleton loaders during data fetch
- **DO** use JetBrains Mono for IDs, codes, and technical values
- **DO** include trend context in KPI cards ("▲12% vs last month")
- **DO NOT** use colored backgrounds for large containers to indicate state
- **DO NOT** show more than 8 chart series with distinct colors (merge or group)
- **DO** ensure charts have empty state and loading state

### Form & Input
- Labels above inputs (not floating/placeholder-only)
- Required fields marked with asterisk, not "required" text
- Inline validation on blur, not on every keystroke
- Error messages specific: "Email is required" not "Invalid"
- Group related fields in fieldsets

### Navigation & Information Architecture
- Fixed sidebar (don't hide on scroll)
- Breadcrumbs for deep hierarchies
- Cmd+k for global search
- Drawers for detail views (preserve context)
- Modals only for quick confirmations or forms < 3 fields

## References

- **Linear** (https://linear.app) — Precision UI, keyboard shortcuts, density control
- **Attio** (https://attio.com) — Modern CRM with excellent data table UX
- **Salesforce Lightning Design System** (https://www.lightningdesignsystem.com/) — Enterprise CRM patterns
- **Stripe Dashboard** (https://dashboard.stripe.com) — Data-dense yet scannable
- **Grafana** (https://grafana.com) — Dashboard with KPI cards and data tables
- **IBM Carbon Design System** (https://carbondesignsystem.com) — Data table density tokens

## Use Case

CRM systems, ERP dashboards, admin panels, data management interfaces, B2B SaaS with complex data workflows.
