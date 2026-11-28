# Phase 11: Reorganização da Casa (IA) - Pattern Map

**Mapped:** 2026-11-28
**Files analyzed:** 8 change areas (nav x2, visao-geral, lancamentos, contas-fixas, planejamento, /metas, redirects)
**Analogs found:** 7 / 8 (redirect config for old routes is net-new; all component patterns exist)

> **Scope guard:** This phase is MOVE + COMPOSE + READ-ONLY transform + route wiring only.
> NO service/calc/DB changes. The `_lib/` loaders, actions, services, schemas, and tests
> of every area stay byte-for-byte unchanged. If any plan proposes editing a `_lib/*.ts`,
> `service.ts`, `actions.ts`, `schema.ts`, or a Prisma migration — **flag it as scope creep**.

---

## File Classification

| Change | File(s) | Role | Nature | Analog / Source | Match |
|--------|---------|------|--------|-----------------|-------|
| Casa menu (desktop) | `src/app/(authed)/_components/Sidebar.tsx` | nav | EDIT (array only) | self — existing `navItems` | exact |
| Casa menu (mobile) | `src/app/(authed)/_components/BottomNav.tsx` | nav | EDIT (array only) | self — `primaryItems`/`sheetItems` | exact |
| Tabs primitive | `src/components/ui/tabs.tsx` | ui | **ALREADY EXISTS** — reuse | shadcn Tabs, Radix installed | exact |
| Visão Geral read-only | `src/app/(authed)/visao-geral/page.tsx` + `_components/*` | page/component | READ-ONLY transform | self | exact |
| Lançamentos hub | `src/app/(authed)/lancamentos/page.tsx` | page | COMPOSE (add tabs) | self (server page + searchParams) | exact |
| Contas fixas → tab | `src/app/(authed)/contas-fixas/page.tsx` body | page/component | MOVE | self | exact |
| Tetos → tab | `src/app/(authed)/planejamento/page.tsx` body | page/component | MOVE | self | exact |
| Metas → `/metas` | new `src/app/(authed)/metas/page.tsx` | route | NET-NEW (move Goal block) | `contas-fixas/page.tsx` §3.3 | role-match |
| Old route redirects | `/planejamento`, `/contas-fixas` | route | NET-NEW | `(authed)/page.tsx` redirect + `next.config` | partial |

---

## Pattern Assignments

### 1. Sidebar.tsx — Casa NavItem array (EDIT only)

**File:** `src/app/(authed)/_components/Sidebar.tsx`
**Convention:** `NavItem[]` with `group` + `context` fields (lines 19-42). `showInContext`
(lines 62-65) filters `casa` items to `!empresaId`. `hrefWith` (lines 58-59) appends
`?empresaId=`. Do NOT touch the filtering/render logic — only edit the array.

**REMOVE (lines 32-34, Casa group):**
```typescript
{ label: 'Planejamento e semanas', href: '/planejamento', icon: CalendarDays, group: 'Casa', context: 'casa' },
{ label: 'Contas fixas e metas', href: '/contas-fixas', icon: Receipt, group: 'Casa', context: 'casa' },
```

**ADD (Casa group) — final Casa menu = Visão Geral · Lançamentos · Metas:**
Note: `Visão geral` + `Lançamentos` already exist as `group: 'ungrouped', context: 'shared'`
(lines 30-31) and render for both contexts — keep them. Add only Metas:
```typescript
{ label: 'Metas', href: '/metas', icon: Target, group: 'Casa', context: 'casa' },
```
Import `Target` (or reuse `Receipt`/`PiggyBank`-style) from `lucide-react` (import block lines 7-17).

---

### 2. BottomNav.tsx — Casa NavItem arrays (EDIT only)

**File:** `src/app/(authed)/_components/BottomNav.tsx`
**Convention:** two arrays — `primaryItems` (lines 36-41, the 4 bottom-bar slots) and
`sheetItems` (lines 43-49, the "Mais" sheet). Same `context`/`showInContext`/`hrefWith`
pattern as Sidebar (lines 65-72).

**REMOVE from `primaryItems` (line 39):**
```typescript
{ label: 'Planejamento', href: '/planejamento', icon: CalendarDays, context: 'casa' },
```
**REMOVE from `sheetItems` (line 44):**
```typescript
{ label: 'Contas fixas e metas', href: '/contas-fixas', icon: Receipt, context: 'casa' },
```
**ADD `Metas`** — put in `primaryItems` to fill the Casa slot freed by Planejamento:
```typescript
{ label: 'Metas', href: '/metas', icon: Target, context: 'casa' },
```
(Visão geral + Lançamentos already in `primaryItems` as `shared`, lines 37-38.)

---

### 3. Tabs primitive — ALREADY EXISTS (no net-new)

**File:** `src/components/ui/tabs.tsx` (exports `Tabs, TabsList, TabsTrigger, TabsContent`).
`@radix-ui/react-tabs` is in `package.json` (`^1.2.1`). **No new component needed.**
Use directly in the Lançamentos page. `TabsTrigger` default height is small — add
`className="min-h-[44px]"` to satisfy the ≥44px PWA rule (UI-SPEC §interações).

---

### 4. Visão Geral → read-only transform

**File:** `src/app/(authed)/visao-geral/page.tsx` (lines 67-118) — Server Component.
**Convention:** `empresaIdContexto` from `searchParams` (lines 16-34); `isCasa` gate
(line 34); `Promise.all` loaders (lines 39-65). Keep all of this unchanged.

**Components that render ACTION buttons (must become read-only):**
- `ContasFixasBloco` — `src/app/(authed)/visao-geral/_components/ContasFixasBloco.tsx`.
  Action controls to strip in the VG instance:
  - "Gerar contas do mês" button — lines 59-69 (calls `gerarContasDoMesAction`, line 13).
  - "Marcar pago" button — lines 126-134, and `MarcarPagoDialog` — lines 141-152.
  - The read-only version keeps the list + `StatusPill` (line 124) + totals (lines 32-38)
    and the `formatBRL`/`formatDate` layout (lines 88-139).
  **Recommended approach (matches discretion in CONTEXT):** add a `readOnly?: boolean` prop
  to `ContasFixasBloco`; when true, drop the `useTransition`/`useState` handlers and the two
  buttons + dialog, render list only. Same component used read-only in VG and interactive in
  the Lançamentos tab → single source of truth, honours "reaproveitar, não reescrever".
- `CategoriaTetoList` — `src/app/(authed)/planejamento/_components/CategoriaTetoList.tsx`.
  It renders `InlineCategoriaTetoEditor` per row (lines 7, 44-48) — the teto EDIT control.
  VG must NOT allow editing tetos (UI-SPEC §1 "sem editar teto"). Add a `readOnly` prop that
  omits `InlineCategoriaTetoEditor`, keeping the "gastei X de Y" + progress bar (lines 51-73).
- `GastoSemanalAuto` — already read-only (acompanhamento display); reuse as-is (page lines 101, 13).
- `InlineCeilingEditor` — `src/app/(authed)/visao-geral/_components/InlineCeilingEditor.tsx`
  (the "dinheiro do mês"/teto inline editor). UI-SPEC §1 "Remover: editor inline". It is NOT
  currently rendered in `visao-geral/page.tsx` (not imported) — confirm no re-introduction;
  if it appears elsewhere in VG components, drop it. Its action lives in `visao-geral/_lib/service.ts`.

**Already read-only (reuse untouched):** `HeroPossoGastar` (purely presentational, no Prisma —
header comment lines 3-12), `DashboardCards`, `RendaFamiliarPorOrigem`, `CategorySpendingBars`,
`WeeklyBarChart`.

---

### 5. Lançamentos → tabbed hub (COMPOSE)

**File:** `src/app/(authed)/lancamentos/page.tsx` — Server Component.
**Convention to preserve:** `searchParams: Promise<{ month?: string; empresaId?: string }>`
(lines 10-15); `empresaIdContexto` (line 29) passed down to `NewTransactionButton`
(lines 43-46) and `TransactionList` (lines 56-61). Tabs must NOT drop `empresaId`/`month`.

**Composition pattern (NET-NEW wiring, reusing existing pieces):**
- Deep-link tab state via `?aba=` (UI-SPEC §2). Read `aba` from the same `searchParams`
  destructure (extend line 15). shadcn `Tabs` is a client component — use a small
  `'use client'` wrapper that reads/writes `aba` via `next/navigation` (mirror how
  `MonthSelector` / `ContaSelector` drive searchParams), OR keep `Tabs` controlled with
  `value={aba}` and `TabsTrigger` links. Render each tab's server-loaded content as children.
- **Tab "Lançamentos" (default):** the existing body (lines 38-62) verbatim.
- **Tab "Contas fixas":** render the INTERACTIVE `ContasFixasBloco` (no `readOnly`) + the
  `/contas-fixas` FixedAccount CRUD (see §6). Loader: `visao-geral/_lib/contas-fixas-bloco.ts`
  already produces `contasFixasLinhas`/`temFixasCadastradas` (used by VG page lines 86-90) —
  reuse the same loader call; do not rewrite.
- **Tab "Tetos & categorias":** render INTERACTIVE `CategoriaTetoList` (with
  `InlineCategoriaTetoEditor`) + `ManageCategoriesButton`
  (`lancamentos/_components/ManageCategoriesButton.tsx`, already imported line 8). Loader:
  `planejamento/_lib/loader.ts#loadAcompanhamentoData` (same call VG uses, page line 63).

**Note:** Lançamentos page currently has no `empresaId`-vs-Casa filtering beyond the context
param — the Contas fixas / Tetos tabs are Casa concepts. Either render those tabs only when
`empresaIdContexto === null` (mirror VG's `isCasa` gate, VG lines 34/73/85/95), or leave as-is
if empresa context should not reach `/lancamentos` tabs. Builder's discretion — flag for planner.

---

### 6. Contas fixas → Lançamentos tab (MOVE)

**File:** `src/app/(authed)/contas-fixas/page.tsx`.
**Convention:** three stacked `<section>` cards (lines 39-93). Loader
`contas-fixas/_lib/loader.ts#loadContasFixasData` returns `{ fixedAccounts, annualExpenses, goals }`
(line 23). Components all exist: `FixedAccountTable`, `AnnualExpenseTable`, `NewFixedAccountButton`,
`NewAnnualExpenseButton` (imports lines 7-14).

**Move map:**
- **§3.1 "Contas fixas e assinaturas"** (lines 39-52) + **§3.2 "Gastos do ano"** (lines 55-68)
  → **Lançamentos "Contas fixas" tab.** Keep `FixedAccountSheet` (`isVariableAmount` toggle),
  `DeleteEntityDialog` as-is.
- **§3.3 "Metas e reserva"** (lines 71-93: `GoalCard`, `NewGoalAddCard`) → **`/metas`** (see §8).

`loadContasFixasData` stays unchanged; the new tab calls it (or just the fields it needs).
The old `contas-fixas/page.tsx` route becomes a redirect (see §9).

---

### 7. Planejamento → split (MOVE + READ-ONLY)

**File:** `src/app/(authed)/planejamento/page.tsx`.
**Convention:** loads `loadAcompanhamentoData` (line 36) → `MesBar`, `CategoriaTetoList`,
`GastoSemanalAuto` (lines 53-63).

**Split map:**
- **Acompanhamento (VER)** → **Visão Geral** read-only: `MesBar` + read-only `CategoriaTetoList`
  + `GastoSemanalAuto`. VG already imports `CategoriaTetoList`/`GastoSemanalAuto` from the
  planejamento folder (VG page lines 11-14, 97-102) — this wiring already exists; just enforce
  read-only (§4) and optionally add `MesBar`.
- **Definir tetos (EDITAR)** → **Lançamentos "Tetos & categorias" tab**: interactive
  `CategoriaTetoList` + `InlineCategoriaTetoEditor` (see §5).
- Old `/planejamento` route → redirect (see §9). The `planejamento/_components` and `_lib`
  files STAY in place (imported cross-folder); only the page route is retired.

---

### 8. `/metas` route (NET-NEW, move Goal block)

**New file:** `src/app/(authed)/metas/page.tsx` — Server Component.
**Analog:** `contas-fixas/page.tsx` lines 16-24 (page skeleton: supabase server client +
`user!.id` + loader) and §3.3 (lines 71-93, the Goal grid).
**Pattern to copy:**
```typescript
const supabase = await createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
const userId = user!.id
const { goals } = await loadContasFixasData(userId)   // reuse existing loader; use goals only
```
Render the Metas grid: `GoalCard` (`contas-fixas/_components/GoalCard.tsx`, already `'use client'`)
+ `GoalSheet` + `NewGoalAddCard`. CRUD actions live in `contas-fixas/_lib/actions.ts` — reuse,
do not duplicate. (Loader reuse means zero new `_lib`; flag if planner wants a dedicated loader.)

---

### 9. Old-route redirects (NET-NEW)

Two analogs exist; pick per builder discretion (UI-SPEC: "308 × sub-rota"):

**Option A — `next.config` redirects (no analog yet; cleanest for 308):**
`next.config.*` has NO `redirects()` today — net-new block:
```typescript
async redirects() {
  return [
    { source: '/contas-fixas', destination: '/lancamentos?aba=contas-fixas', permanent: true },
    { source: '/planejamento', destination: '/visao-geral', permanent: true },
  ]
}
```
(`permanent: true` = 308. Note: query strings on the incoming request need `has`/explicit handling.)

**Option B — in-page `redirect()` (analog: `src/app/(authed)/page.tsx` lines 3-6):**
Keep the route files, replace their body with `redirect('/lancamentos?aba=contas-fixas')`
from `next/navigation`. Simplest, preserves the `(authed)` auth layout.
```typescript
import { redirect } from 'next/navigation'
export default function Page() { redirect('/visao-geral') }
```
`middleware.ts` (lines 46, 53) also uses `NextResponse.redirect` but is auth-scoped — not the
right layer for these product redirects.

---

## Shared Patterns

### empresaId / context flow (apply to all pages + tabs)
**Source:** `Sidebar.tsx` lines 57-65 (`empresaIdDoContexto`, `hrefWith`, `showInContext`);
pages read `searchParams.empresaId` → `empresaIdContexto` (`lancamentos/page.tsx` lines 27-29,
`visao-geral/page.tsx` lines 31-34). **Apply to:** `/metas` and all new tab links — always
propagate `empresaId` (and `month`) via `hrefWith`/searchParams so context survives navigation.
Casa-only blocks gate on `isCasa` (VG line 34).

### Server page skeleton
**Source:** `lancamentos/page.tsx` lines 3-34 / `contas-fixas/page.tsx` lines 16-24.
`createSupabaseServerClient()` → `supabase.auth.getUser()` → `user!.id` → loader(s) in
`Promise.all`. **Apply to:** `/metas` page and any new tab server content.

### Formatting
**Source:** `src/lib/format.ts` (`formatBRL`, `formatDate`), used throughout
(`ContasFixasBloco` line 10, `CategoriaTetoList` line 6). pt-BR, R$ 1.234,56, dd/mm/aaaa.
**Apply to:** every moved/new block (no raw number/date rendering).

### 44px targets
Every button/tab trigger ≥44px (`ContasFixasBloco` buttons use `min-h-[44px]`, lines 65/130).
Add `min-h-[44px]` to `TabsTrigger` instances.

---

## No Analog Found

| Item | Why | Planner guidance |
|------|-----|------------------|
| `next.config` `redirects()` block | No `redirects()` exists in `next.config` today | Net-new; or use in-page `redirect()` (analog: `(authed)/page.tsx`) |
| `?aba=` tab deep-link wrapper | No existing Tabs usage drives searchParams | Mirror `MonthSelector`/`ContaSelector` searchParams pattern; Radix Tabs primitive already present |

---

## Scope Flags (NO service/calc/DB changes expected)

- All moves REUSE existing loaders/actions: `contas-fixas/_lib/loader.ts` + `actions.ts`,
  `planejamento/_lib/loader.ts` + `actions.ts`, `visao-geral/_lib/contas-fixas-bloco.ts` +
  `geracao-mensal.ts` + `actions.ts`. **Do not edit these.**
- `readOnly` props on `ContasFixasBloco` / `CategoriaTetoList` are presentational prop additions,
  not logic changes — acceptable. If a plan proposes forking these into separate components,
  that's allowed too but heavier; prefer the prop.
- `/metas` reusing `loadContasFixasData` means zero new `_lib`. **If any plan adds a new
  service/schema/migration — flag as out of scope** (CONTEXT: "SEM migração; SEM mudar service/cálculo").

---

## Metadata

**Analog search scope:** `src/app/(authed)/**`, `src/components/ui/`, `src/middleware.ts`, `next.config.*`, `package.json`
**Files scanned:** ~15 read in full/targeted
**Pattern extraction date:** 2026-11-28

## PATTERN MAPPING COMPLETE
