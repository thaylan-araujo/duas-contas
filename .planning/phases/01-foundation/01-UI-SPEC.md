---
phase: 1
slug: foundation
status: draft
shadcn_initialized: true
preset: detected-from-stack
created: 2026-10-29
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for Phase 1: Foundation.
> Covers the login screen and the complete navigation shell (sidebar on desktop, bottom nav on mobile).
> All decisions pre-populated from CONTEXT.md and spec.md — no design ambiguity remains for this phase.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn/ui (to be initialized via `npx shadcn init`) |
| Preset | Default (CSS variables mode, Tailwind v4 compatible) |
| Component library | Radix UI (via shadcn/ui) |
| Icon library | lucide-react (bundled with shadcn/ui) |
| Font (UI) | Manrope — loaded via `next/font/google` |
| Font (monetary values) | IBM Plex Mono — loaded via `next/font/google` |

Source: CONTEXT.md §Specific Ideas, spec.md §Visual

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-label gaps, badge padding |
| sm | 8px | Input inner padding, compact list items |
| md | 16px | Card padding, form field spacing, nav item padding |
| lg | 24px | Card gap, section padding |
| xl | 32px | Layout column gap, page horizontal padding (desktop) |
| 2xl | 48px | Major section breaks, login card vertical padding |
| 3xl | 64px | Page-level top/bottom margin |

Exceptions:
- Touch targets (buttons, nav items, form fields): **minimum 44px height** on all breakpoints. This overrides the spacing scale for height-only. Source: spec.md §Visual, CLAUDE.md §Constraints.
- Sidebar width: 240px (desktop). Bottom nav height: 64px (mobile). These are layout-level values, not spacing tokens.

---

## Typography

All text in Brazilian Portuguese. Monetary values always use IBM Plex Mono. All other text uses Manrope.

| Role | Font | Size | Weight | Line Height | Usage |
|------|------|------|--------|-------------|-------|
| Display | Manrope | 28px | 600 (SemiBold) | 1.2 | Page titles (login screen heading only in Phase 1) |
| Heading | Manrope | 20px | 600 (SemiBold) | 1.3 | Section headings, nav group labels |
| Body | Manrope | 16px | 400 (Regular) | 1.5 | Nav item labels, form labels, descriptions |
| Label / Small | Manrope | 14px | 400 (Regular) | 1.4 | Input placeholder text, helper text, secondary labels |
| Monetary | IBM Plex Mono | 16px | 400 (Regular) | 1.4 | All R$ values — reserved exclusively for this font |

Rules:
- Maximum 4 type sizes in Phase 1: 14, 16, 20, 28.
- Exactly 2 weights: 400 (Regular) and 600 (SemiBold). No other weights permitted.
- **Never** use Manrope for monetary values. **Never** use IBM Plex Mono for anything other than monetary values.
- Monetary format: `R$ 1.234,56` — no exceptions. Rendered via `formatBRL()` utility only.
- Date format: `dd/mm/aaaa` — rendered via `formatDate()` utility only.

Source: spec.md §Visual, CONTEXT.md §Specific Ideas

---

## Color

Full palette from spec.md §Visual. Phase 1 uses a subset (login + shell only).

### Base Palette

| Token | Hex | Role |
|-------|-----|------|
| `--color-bg` | `#F3F5F7` | Page background — dominant surface (60%) |
| `--color-card` | `#FFFFFF` | Cards, panels, sidebar background, login card (30%) |
| `--color-border` | `#E3E7EC` | Borders, input outlines, bar rails |
| `--color-text-primary` | `#0F1B2D` | Primary text, nav labels, menu items |
| `--color-text-secondary` | `#5B6675` | Placeholder text, helper text, nav group labels |

### Semantic / Brand Colors

| Token | Hex | Light Background Hex | Usage |
|-------|-----|---------------------|-------|
| `--color-casa` | `#1D4ED8` | `#DCEBFF` | Casa account — active nav indicator, Casa badge, accent on Casa screens |
| `--color-empresa` | `#B45309` | `#FDEBD8` | Empresa account — active nav indicator, Empresa badge, accent on Empresa screens |
| `--color-positive` | `#0F766E` | — | Positive balance, surplus states (Phase 2+) |
| `--color-warning` | `#8A3A06` | — | Budget overrun, overdue alerts (Phase 3+) |
| `--color-destructive` | `#DC2626` | — | Destructive actions only (delete buttons, error states) |

### 60/30/10 Split for Phase 1

| Split | Color | Elements |
|-------|-------|---------|
| 60% Dominant | `#F3F5F7` | Page background |
| 30% Secondary | `#FFFFFF` | Login card, sidebar, nav items background |
| 10% Accent | `#1D4ED8` (Casa) / `#B45309` (Empresa) | Active nav item highlight, account indicator dot, primary CTA button |

**Accent (`--color-casa` #1D4ED8) is reserved ONLY for:**
1. The primary login button ("Entrar")
2. The active/selected state of nav items
3. The account indicator when Casa is active

**Accent (`--color-empresa` #B45309) is reserved ONLY for:**
1. The account indicator when Empresa is active
2. Nav section label for "Empresa" group (icon tint only)

Do NOT use either accent color for backgrounds, borders, or hover states of non-selected items.

Source: spec.md §Visual, CONTEXT.md §Specific Ideas

---

## Screens in Scope — Phase 1

### Screen 1: Login

**Route:** `/login` (public, unauthenticated)

**Layout:**
- Centered card on `#F3F5F7` background
- Card: white, 16px border radius, `2xl` (48px) vertical padding, `xl` (32px) horizontal padding
- Card max-width: 400px
- Logo/app name "Duas Contas" above the form — Manrope 28px SemiBold (600), `#0F1B2D`
- Subtitle: Manrope 14px Regular, `#5B6675`

**Form elements:**
- Email field: `<input type="email">` — 44px height minimum, full-width, border `#E3E7EC`, rounded 8px
- Password field: `<input type="password">` — 44px height minimum, full-width
- "Entrar" button: full-width, 44px height minimum, background `#1D4ED8`, white text, Manrope 16px SemiBold (600)
- No "Esqueci minha senha" link visible in the form (magic link flow is admin-initiated, not user-self-service in Phase 1)

**States:**
- Default: fields empty, button enabled
- Loading: button shows spinner, disabled, label remains "Entrar" (no text change)
- Error: inline message below the form — see Copywriting Contract

### Screen 2: Navigation Shell

**Route:** All authenticated routes (`/` and `/(authed)/*`)

**Desktop layout (breakpoint ≥ 1024px):**
- Fixed left sidebar, 240px wide, white background, right border `#E3E7EC`
- Sidebar sections (top to bottom):
  1. App logo / brand — "Duas Contas", Manrope 16px SemiBold
  2. Nav group "Visão geral": single item — icon + "Visão geral"
  3. Nav group "Casa" (label in `#5B6675` 14px): items — "Lançamentos", "Planejamento e semanas", "Contas fixas e metas"
  4. Nav group "Empresa" (label in `#5B6675` 14px): items — "Canais e caixa", "Dívidas"
  5. Nav group "Geral" (label in `#5B6675` 14px): items — "Calendário", "Relatório mensal"
- Nav items: 44px height, horizontal padding 16px, icon (20px) + label (Manrope 16px Regular `#0F1B2D`)
- Active nav item: background `#DCEBFF` (Casa screens) or `#FDEBD8` (Empresa screens), text/icon `#1D4ED8` (Casa) or `#B45309` (Empresa)
- Hover state: background `#F3F5F7`
- Content area: remaining width, background `#F3F5F7`, padding `xl` (32px)

**Mobile layout (breakpoint < 1024px):**
- No sidebar — hidden entirely
- Bottom navigation bar: fixed, full-width, 64px height, white background, top border `#E3E7EC`
- Bottom nav items: 5 icons maximum (prioritize most-used)
  - "Visão geral" — grid icon
  - "Lançamentos" — plus-circle icon (Casa context)
  - "Planejamento" — calendar-days icon
  - "Empresa" — briefcase icon (leads to Canais e caixa)
  - "Mais" — menu icon (opens a drawer with remaining nav items: Contas fixas e metas, Dívidas, Calendário, Relatório mensal)
- Icon size: 24px. Label below icon: Manrope 11px Regular `#5B6675`
- Active item icon: `#1D4ED8` (when on Casa section) or `#B45309` (when on Empresa section)
- Content area: full width, padding `md` (16px), background `#F3F5F7`
- Safe area inset: add `padding-bottom: env(safe-area-inset-bottom)` to bottom nav

**Placeholder screens ("Em breve"):**
- All screens except login and shell structure show a centered placeholder
- Heading: Manrope 20px SemiBold `#0F1B2D` — "Em breve"
- Body: Manrope 16px Regular `#5B6675` — "Esta funcionalidade será disponibilizada em breve."
- No button, no illustration — text only

Source: CONTEXT.md §D-07, §D-08, spec.md §Telas e funcionalidades

---

## Component Inventory — Phase 1

These are the shadcn/ui components required for this phase only. Add with `npx shadcn add <name>`.

| Component | shadcn Name | Usage in Phase 1 |
|-----------|-------------|-----------------|
| Button | `button` | Login CTA "Entrar", loading state |
| Input | `input` | Email field, password field |
| Label | `label` | Form field labels |
| Card | `card` | Login card container |
| Separator | `separator` | Nav group dividers in sidebar |
| Sheet | `sheet` | "Mais" drawer on mobile bottom nav |
| Skeleton | `skeleton` | Loading state for nav shell (Phase 2+ but initialize now) |

No third-party registries. No third-party blocks.

---

## Copywriting Contract

All copy in Brazilian Portuguese (pt-BR). Formal register (você, not tu).

| Element | Copy |
|---------|------|
| App name | Duas Contas |
| Login page title | Duas Contas |
| Login page subtitle | Controle financeiro pessoal |
| Email field label | E-mail |
| Email field placeholder | seu@email.com |
| Password field label | Senha |
| Password field placeholder | ••••••••• |
| Primary CTA (login button) | Entrar |
| Button loading state | Entrando… |
| Auth error — invalid credentials | E-mail ou senha incorretos. Tente novamente. |
| Auth error — network/server | Não foi possível conectar. Verifique sua conexão e tente novamente. |
| Auth error — empty fields | Preencha o e-mail e a senha para continuar. |
| Nav group label — Casa | Casa |
| Nav group label — Empresa | Empresa |
| Nav group label — Geral | Geral |
| Nav item — dashboard | Visão geral |
| Nav item — transactions | Lançamentos |
| Nav item — planning | Planejamento e semanas |
| Nav item — fixed bills | Contas fixas e metas |
| Nav item — channels | Canais e caixa |
| Nav item — debts | Dívidas |
| Nav item — calendar | Calendário |
| Nav item — report | Relatório mensal |
| Bottom nav — more | Mais |
| Placeholder screen heading | Em breve |
| Placeholder screen body | Esta funcionalidade será disponibilizada em breve. |

No destructive actions in Phase 1.

---

## Interaction Contract

### Login Form

- Submit on Enter key press in any field (no need to click button)
- Password field: show/hide toggle icon on the right side (lucide `Eye` / `EyeOff`)
- Validation on submit only — no inline real-time validation while typing
- Button disabled while request is in-flight
- Error message appears below the button, inside the card
- On success: redirect to `/` (dashboard placeholder)

### Navigation

- Active route highlighted immediately on navigation (no delay)
- No animation for route transitions in Phase 1 (plain Next.js navigation)
- Mobile bottom nav "Mais" item: opens a Sheet (bottom drawer) with the remaining nav items listed vertically
- Sheet backdrop closes the drawer on tap outside

### Responsive Breakpoints

| Breakpoint | Behavior |
|-----------|---------|
| < 1024px | Sidebar hidden; bottom navigation bar shown |
| ≥ 1024px | Bottom navigation bar hidden; sidebar shown |

No intermediate breakpoints needed in Phase 1.

---

## Accessibility Contract

- All form inputs have associated `<label>` elements (not placeholder-only)
- Login button has `aria-busy="true"` during loading state
- Nav items use `aria-current="page"` on the active route
- Color is never the only differentiator — active nav item also has background change
- All interactive elements meet 44px minimum touch target (height)
- Focus ring: default browser/Radix focus ring preserved — do NOT suppress with `outline: none` globally
- Password visibility toggle (lucide `Eye` / `EyeOff`): icon-only button must carry `aria-label="Mostrar senha"` when eye is visible (password hidden) and `aria-label="Ocultar senha"` when eye-off is visible (password shown)

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | button, input, label, card, separator, sheet, skeleton | Not required — official registry |

No third-party registries declared for Phase 1.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

*Phase: 1 — Foundation*
*UI contract created: 2026-10-29*
*Sources: CONTEXT.md (11 decisions used), spec.md §Visual (full palette), CLAUDE.md §Constraints (touch targets, PWA)*
