# Phase 3: Planning (Planejamento e semanas da Casa) - Pattern Map

**Mapped:** 2026-11-25
**Files analyzed:** 28 (new/modified)
**Analogs found:** 27 / 28 (1 partial — segmented bar has no exact analog)

> Every pattern below is already proven in the Fase 1–2 code. The planner/executor should **copy these analogs**, not reinvent. Paths are relative to repo root; the `(authed)` segment is a route group.

---

## File Classification

### Prisma models (prisma/schema.prisma — modify)

| New model | Role | Data Flow | Closest Analog | Match |
|-----------|------|-----------|----------------|-------|
| `PlanItem` | model | CRUD | `MonthlyBudget` (userId+month scoping) + `Transaction` (categoryId relation) | exact |
| `WeeklySpend` (override, D-02) | model | CRUD | `MonthlyBudget` (`@@unique` composite) | role-match |
| `FixedAccount` | model | CRUD | `MonthlyBudget` / `Category` (userId-scoped) | role-match |
| `AnnualExpense` | model | CRUD | `MonthlyBudget` (userId-scoped) | role-match |
| `Goal` | model | CRUD | `MonthlyBudget` (userId-scoped) | role-match |

### `/planejamento` feature slice (new)

| New file | Role | Data Flow | Closest Analog | Match |
|----------|------|-----------|----------------|-------|
| `planejamento/page.tsx` | route | request-response | `lancamentos/page.tsx` + `visao-geral/page.tsx` | exact |
| `planejamento/_lib/schema.ts` | config (zod) | transform | `lancamentos/_lib/schema.ts` | exact |
| `planejamento/_lib/service.ts` | service | CRUD + transform | `visao-geral/_lib/service.ts` + `lancamentos/_lib/service.ts` | exact |
| `planejamento/_lib/loader.ts` | service | batch | `visao-geral/_lib/loader.ts` + `lancamentos/_lib/loader.ts` | exact |
| `planejamento/_lib/actions.ts` | controller | request-response | `lancamentos/_lib/actions.ts` + `visao-geral/_lib/actions.ts` | exact |
| `planejamento/_components/PlanItemSheet.tsx` | component | request-response | `lancamentos/_components/TransactionSheet.tsx` | exact |
| `planejamento/_components/NewPlanItemButton.tsx` | component | event-driven | `lancamentos/_components/NewTransactionButton.tsx` | exact |
| `planejamento/_components/PlanTable.tsx` | component | request-response | `lancamentos/_components/TransactionList.tsx` + shadcn `Table` | role-match |
| `planejamento/_components/ResumoPlano.tsx` | component | transform | `CategorySpendingBars.tsx` + `DashboardCards.tsx` | role-match |
| `planejamento/_components/SegmentedBar.tsx` | component | transform | `CategorySpendingBars.tsx` (bar track) | **partial** |
| `planejamento/_components/WeekCard.tsx` | component | request-response | `CategorySpendingBars.tsx` + `InlineCeilingEditor.tsx` | role-match |
| `planejamento/_components/InlineGasteiEditor.tsx` | component | request-response | `InlineCeilingEditor.tsx` | exact |
| `planejamento/_components/CopyPlanButton.tsx` | component | event-driven | `NewTransactionButton.tsx` (button + action) | role-match |
| `planejamento/_components/DeletePlanItemDialog.tsx` | component | request-response | `lancamentos/_components/DeleteDialog.tsx` | exact |

### `/contas-fixas` feature slice (new)

| New file | Role | Data Flow | Closest Analog | Match |
|----------|------|-----------|----------------|-------|
| `contas-fixas/page.tsx` | route | request-response | `lancamentos/page.tsx` | exact |
| `contas-fixas/_lib/schema.ts` | config (zod) | transform | `lancamentos/_lib/schema.ts` | exact |
| `contas-fixas/_lib/service.ts` | service | CRUD + transform | `lancamentos/_lib/service.ts` | exact |
| `contas-fixas/_lib/loader.ts` | service | batch | `visao-geral/_lib/loader.ts` | exact |
| `contas-fixas/_lib/actions.ts` | controller | request-response | `lancamentos/_lib/actions.ts` | exact |
| `contas-fixas/_components/FixedAccountSheet.tsx` | component | request-response | `TransactionSheet.tsx` (+ shadcn `Switch`) | exact |
| `contas-fixas/_components/AnnualExpenseSheet.tsx` | component | request-response | `TransactionSheet.tsx` | exact |
| `contas-fixas/_components/GoalSheet.tsx` | component | request-response | `TransactionSheet.tsx` | exact |
| `contas-fixas/_components/GoalCard.tsx` | component | transform | `CategorySpendingBars.tsx` (+ shadcn `Progress`) | role-match |
| `contas-fixas/_components/*Table.tsx` (3×) | component | request-response | `TransactionList.tsx` + shadcn `Table` | role-match |
| `contas-fixas/_components/Delete*Dialog.tsx` (3×) | component | request-response | `lancamentos/_components/DeleteDialog.tsx` | exact |

### Shared lib + integration (new/modify)

| New/Modified file | Role | Data Flow | Closest Analog | Match |
|-------------------|------|-----------|----------------|-------|
| `src/lib/weeks.ts` (new) | utility | transform | `getWeeklySpending` bucket logic in `visao-geral/_lib/service.ts` | exact (extract) |
| `visao-geral/_components/DashboardCards.tsx` (modify) | component | transform | itself (cards 2 & 3 already stubbed `--`) | exact |
| `visao-geral/_lib/loader.ts` (modify) | service | batch | itself (add `getPlanTotal` to `Promise.all`) | exact |
| `vitest.config.ts` + `*.test.ts` (new) | test | — | **none** (no test framework exists) | no analog |

---

## Pattern Assignments

### Prisma models (prisma/schema.prisma)

**Analog:** `MonthlyBudget` (lines 61-71) and `Category`/`Transaction` (lines 30-59).

**userId-scoped + month-scoped model with composite unique** (schema.prisma:61-71):
```prisma
model MonthlyBudget {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  month        String
  ceilingCents Int
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@unique([userId, month])
}
```
Copy this shape for all 5 new models. Conventions proven in repo:
- `id String @id @default(cuid())`; money is always `Int` cents (`ceilingCents`, `amountCents`); `month String` as `'YYYY-MM'`.
- Category relation for `PlanItem` copies `Transaction.category`/`categoryId` (schema.prisma:49-50) — gives the D-03 join to real transactions.
- **MUST add inverse relations on `model User`** (schema.prisma:22-28 currently lists `categories`, `transactions`, `monthlyBudgets`). Add `planItems`, `fixedAccounts`, `annualExpenses`, `goals`, `weeklySpends` or the migration fails.
- Use `@@unique([userId, month, weekIndex, categoryId])` on `WeeklySpend` (same composite-unique idiom as `MonthlyBudget`). Override persisted nullable-by-absence: a row exists → manual override; no row → auto sum (D-02, Pitfall 4).
- Migration runs via `DIRECT_URL` (port 5432) per CLAUDE.md — `npx prisma migrate dev`.

---

### `_lib/schema.ts` (config, zod) — both slices

**Analog:** `lancamentos/_lib/schema.ts` (full file).

**Imports + create/update pair** (schema.ts:3-21):
```typescript
import { z } from 'zod'

export const transactionSchema = z.object({
  amountCents: z.number().int().positive('Digite um valor maior que zero.'),
  categoryId: z.string().min(1, 'Selecione uma categoria.'),
  // ...
})
export type TransactionFormData = z.infer<typeof transactionSchema>

export const updateTransactionSchema = transactionSchema.extend({
  id: z.string().min(1, 'ID obrigatório'),
})
export type UpdateTransactionFormData = z.infer<typeof updateTransactionSchema>
```
Apply to new schemas, using the exact copy strings from the UI-SPEC Copywriting Contract:
- `planItemSchema`: name min 1 (`'O nome é obrigatório.'`), `valuePerCents` positive (`'Digite um valor maior que zero.'`), categoryId (`'Selecione um grupo.'`), and the **4 week booleans with a refine** rejecting 0 marked weeks → `'Marque pelo menos uma semana.'` (Pitfall 2).
- `fixedAccountSchema`: `dueDay` → `z.number().int().min(1).max(31)` message `'Informe um dia entre 1 e 31.'`; `autoDebit` boolean; `amountCents` positive.
- `annualExpenseSchema`: `yearlyCents` positive, `dueMonth` 1–12.
- `goalSchema`: `targetCents`/`savedCents` `.int().nonnegative()` (seed is 0), `deadline` `z.string().regex(/^\d{4}-\d{2}$/).optional()`, refine `savedCents <= targetCents` → `'O valor guardado não pode ser maior que a meta.'`
- `ceilingUpdateSchema` already exists (`visao-geral/_lib/schema.ts:3-6`) — reuse for the teto edit (PLAN-01).

---

### `_lib/service.ts` (service) — both slices

**Analogs:** `visao-geral/_lib/service.ts` (getOrCreate, aggregate, week buckets) + `lancamentos/_lib/service.ts` (CRUD with ownership guard).

**`getOrCreate*` idempotent (D-04 pre-fill, D-06 seed)** — copy `getOrCreateMonthlyBudget` (visao-geral/service.ts:10-30):
```typescript
export async function getOrCreateMonthlyBudget(userId: string, month: string) {
  const existing = await prisma.monthlyBudget.findUnique({
    where: { userId_month: { userId, month } },
  })
  if (existing) return existing
  const previous = await prisma.monthlyBudget.findFirst({
    where: { userId, month: { lt: month } },  // lexicographic 'YYYY-MM' ordering works
    orderBy: { month: 'desc' },
  })
  const ceilingCents = previous?.ceilingCents ?? 300_000
  return prisma.monthlyBudget.upsert({ where: { userId_month: { userId, month } }, update: {}, create: { userId, month, ceilingCents } })
}
```
For `getOrCreatePlan`: adapt to `findMany` → if empty AND `findFirst({ month: { lt: month } })` exists return `[]` (later months start empty, D-04) → else create SPEC_ROUTINE_ITEMS inside `prisma.$transaction`. The seed-two-goals follows the same idempotent shape.

**Atomic multi-write via `prisma.$transaction`** — copy `createProLaboreService` (lancamentos/service.ts:99-133). Use for "Copiar plano do mês anterior" (PLAN-05): read prior `PlanItem`s, recreate in current month inside one `$transaction`.

**Ownership-guarded update/delete** (lancamentos/service.ts:38-86) — the IDOR mitigation (`where: { id, userId }`), apply to every plan item / fixed account / annual / goal mutation:
```typescript
const record = await prisma.transaction.findFirst({ where: { id, userId } })
if (!record) throw new Error('Lançamento não encontrado.')
return prisma.transaction.update({ where: { id }, data: { ...rest } })
```

**Aggregate over Transactions in a date range (auto "Gastei", D-02)** — copy `getTotalSpent` (visao-geral/service.ts:51-67):
```typescript
const result = await prisma.transaction.aggregate({
  _sum: { amountCents: true },
  where: { userId, account: 'CASA', type: 'SAIDA', date: { gte: start, lte: end } },
})
return result._sum.amountCents ?? 0
```
For `getAutoGastei` add `categoryId` to the `where` and build `start`/`end` from `weekDateRange` (see `src/lib/weeks.ts` below). `month`→date-range construction pattern: `new Date(year, monthNum-1, 1)` … `new Date(year, monthNum, 0, 23,59,59,999)` (lancamentos/loader.ts:22-23 and visao-geral/service.ts:54-55).

**Pure calc functions (no Prisma — maximally testable, per RESEARCH Validation).** Keep these in `service.ts` or a `calc.ts`, accepting plain arrays/numbers:
- `countWeeks(item) = [w1,w2,w3,w4].filter(Boolean).length`
- `computePlanSummary(rows, ceilingCents) → { totalPlanejado, folga, acima }` where `folga = ceilingCents - totalPlanejado`.
- `computeGoalMonthly` — guard `meses <= 0 || deadline == null` → return null (Pitfall 3, no divide-by-zero).
- `computeAnnualMonthly = Math.round(yearlyCents / 12)` (Pitfall 1).

---

### `_lib/loader.ts` (service, batch) — both slices

**Analog:** `visao-geral/_lib/loader.ts` (full file, 12-22).

**Parallel fetch via `Promise.all`** (visao-geral/loader.ts:12-22):
```typescript
export async function loadDashboardData(userId: string, month: string) {
  const [budget, totalSpentCents, categorySpending, weeklySpending] = await Promise.all([
    getOrCreateMonthlyBudget(userId, month),
    getTotalSpent(userId, month),
    getCategorySpending(userId, month),
    getWeeklySpending(userId, month),
  ])
  return { budget, totalSpentCents, categorySpending, weeklySpending }
}
```
`loadPlanData` loads in parallel: `getOrCreatePlan`, `getOrCreateMonthlyBudget` (teto — reuse Fase 2), `getFixedAccounts`, categories, and the per-week auto-Gastei + override rows. Month-regex validation guard copied from loader.ts:11 / service.ts:3. Loader is a plain module (no `'use server'`) called directly from the Server Component.

---

### `_lib/actions.ts` (controller, request-response) — both slices

**Analog:** `lancamentos/_lib/actions.ts` (full) + `visao-geral/_lib/actions.ts` (full).

**`getUserId` from session (security T-02-04, NEVER from form)** (lancamentos/actions.ts:32-39, identical in visao-geral/actions.ts:8-15):
```typescript
async function getUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user.id
}
```

**Thin action: parse → userId → service → revalidate** (lancamentos/actions.ts:41-62):
```typescript
'use server'
export async function createTransactionAction(_prev: unknown, data: TransactionFormData) {
  const parsed = transactionSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  try {
    const userId = await getUserId()
    await createTransactionService({ ...parsed.data, userId })
    revalidatePath('/lancamentos')
    revalidatePath('/visao-geral')
    return { success: true }
  } catch {
    return { success: false, error: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' }
  }
}
```
**CRITICAL for all plan mutations:** call `revalidatePath('/planejamento')` AND `revalidatePath('/visao-geral')` (dashboard "Planejado"/"Folga" depend on plan total). The genericerror string must match the UI-SPEC: `'Não foi possível salvar. Verifique sua conexão e tente novamente.'` Update actions extend with `id` and destructure (`const { id, ...rest } = parsed.data`) per actions.ts:75.

---

### Sheet forms: `PlanItemSheet.tsx`, `FixedAccountSheet.tsx`, `AnnualExpenseSheet.tsx`, `GoalSheet.tsx`

**Analog:** `lancamentos/_components/TransactionSheet.tsx` (full file).

Copy wholesale: `'use client'`, react-hook-form + `zodResolver`, `useTransition` for pending state, create/edit in one Sheet, the dual `SheetContent` (mobile `side="bottom" max-h-[90vh]`, desktop `side="right" w-[420px]`) at lines 357-384, the `reset()` pre-fill on open (lines 132-162), and `setError('root', ...)` on server-action failure (lines 261, 279).

**BRL input → cents parsing** (TransactionSheet.tsx:66-74) — reuse `parseBRLInput`, with live preview via `formatBRL(watchedAmountCents)` (lines 174-176, 569-571).

**Category `Select` with inline "+ Nova categoria…"** (lines 584-652) — `PlanItemSheet`'s "Grupo" field copies this verbatim (D-03 reuses Casa categories, filtered `c.account === 'CASA'`).

**New shadcn components inside Sheets:**
- `PlanItemSheet` — 4 `Checkbox` inside a `<fieldset><legend>Em quais semanas?</legend>` (a11y per UI-SPEC); labels "1" "2" "3" "4"; `Controller`-wrapped like the `account` field (TransactionSheet.tsx:456-487).
- `FixedAccountSheet` — `Switch` for "Débito automático", label-left/switch-right, touch target ≥44px.
- `GoalSheet` — `Prazo` uses `<Input type="month">`.

Submit button copy (UI-SPEC): `'Salvar'` / `'Salvar alterações'` / `'Salvando…'`.

---

### Open-sheet trigger buttons: `NewPlanItemButton`, `CopyPlanButton`, `+ Nova conta fixa` etc.

**Analog:** `lancamentos/_components/NewTransactionButton.tsx` (full, 32 lines).
```typescript
'use client'
export function NewTransactionButton({ categories }: Props) {
  const [open, setOpen] = useState(false)
  return (<>
    <Button onClick={() => setOpen(true)} className="min-h-[44px]">
      <Plus size={16} className="mr-2" aria-hidden="true" />Novo lançamento
    </Button>
    <TransactionSheet open={open} onClose={() => setOpen(false)} categories={categories} />
  </>)
}
```
`CopyPlanButton` is the same shell but variant `outline` + `Copy` icon, calling the action directly inside `useTransition` (no sheet); disabled with tooltip `'Nenhum plano no mês anterior.'` when no prior month.

---

### Inline "Gastei R$" editor: `InlineGasteiEditor.tsx`

**Analog:** `visao-geral/_components/InlineCeilingEditor.tsx` (full file, 65 lines).

Copy the click-to-edit → blur/Enter → `useTransition` → Server Action pattern (lines 18-29), the cents parse (`parseFloat` → `Math.round(parsed*100)`), and the `Skeleton` pending state. Differences for D-02:
- Debounce not needed; on blur call `saveGasteiAction` (persists `WeeklySpend` override).
- Show `Pencil` 12px + "Recalcular" micro-action when an override row exists; "Recalcular" calls an action that deletes the `WeeklySpend` row (`null` → back to auto sum). Default displayed value = `manualCents ?? autoGasteiCents`.

---

### Delete dialogs: `DeletePlanItemDialog`, `DeleteFixedAccountDialog`, etc.

**Analog:** `lancamentos/_components/DeleteDialog.tsx` (full, 96 lines).

Copy the `Dialog` + `useTransition` + `errorMsg` state shell. Use the UI-SPEC destructive copy per entity (e.g. title `'Excluir item do plano?'`, body with `<strong>[nome]</strong>`, cancel `'Manter'`, confirm `'Excluir'`, loading `'Excluindo…'`). `onOpenChange` guards against closing while pending (line 51).

---

### Tables: `PlanTable.tsx`, fixed-account/annual tables

**Analog:** `lancamentos/_components/TransactionList.tsx` (list→row composition) + new shadcn `Table`.

Desktop uses shadcn `Table` with `<th scope="col">` headers in `text-xs uppercase tracking-wide text-text-secondary`; mobile collapses to card-list (UI-SPEC Responsive). Row click opens the Sheet; desktop hover reveals `Pencil`+`Trash2` (red-600). Fixed-account rows in the plan table are **read-only derived rows** (Pattern 3, D-05) with a `Lock` 14px icon + tooltip `'Vem das Contas fixas — edite na seção Contas fixas.'` — derived in the service, not persisted.

---

### Bars: `SegmentedBar.tsx` (PLAN-03), `GoalCard` progress (META-01)

**Analog:** `visao-geral/_components/CategorySpendingBars.tsx` (bar track, lines 31-38).

**Manual bar track** (CategorySpendingBars.tsx:31-38) — the repo idiom for bars:
```tsx
<div className="flex-[2] h-2 rounded-full bg-border">
  <div className="bg-casa h-full rounded-full" style={{ width: `${pct}%` }} />
</div>
```
- `GoalCard` progress: `bg-casa` fill (or shadcn `Progress`), `bg-positive` + "Concluída" badge when `savedCents >= targetCents`. 0% dashed when seed.
- `SegmentedBar` (**partial — no exact analog**): extend the manual track to **multiple adjacent segments** (one per group in its categorical color + a final `bg-border` "Folga" segment). No existing multi-segment bar in the repo; build from the single-bar idiom above. Add `role="img"`/`aria-label` + textual legend (a11y per UI-SPEC). Group colors come from the UI-SPEC categorical palette; the colored dot is `aria-hidden`.

---

### Page composition: `planejamento/page.tsx`, `contas-fixas/page.tsx`

**Analog:** `lancamentos/page.tsx` (full) + `visao-geral/page.tsx` (full). Replaces the stub at `planejamento/page.tsx` (lines 1-9) and `contas-fixas/page.tsx`.

**Server Component boilerplate** (visao-geral/page.tsx:12-24, lancamentos/page.tsx:15-31):
```typescript
export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user!.id
  const currentMonth = month ?? new Date().toISOString().slice(0, 7)
  const data = await loadPlanData(userId, currentMonth)
  // render ...
}
```
No `'use client'`. `month` resolved from `searchParams` with `new Date().toISOString().slice(0,7)` fallback (store `mesSelecionado` is client-side in `src/store/conta.ts`; the month also flows via URL — follow the existing `MonthSelector` pattern that pushes `?month=`). Header: `h1 text-xl font-semibold text-text-primary` + action buttons right-aligned.

---

### `src/lib/weeks.ts` (new utility — EXTRACT, don't duplicate)

**Analog:** the week-bucket logic inside `getWeeklySpending` (visao-geral/_lib/service.ts:142-155):
```typescript
const day = new Date(tx.date).getDate()
let index: number
if (day <= 7) index = 0
else if (day <= 14) index = 1
else if (day <= 21) index = 2
else index = 3
```
Extract this into `src/lib/weeks.ts` as `weekIndexForDay(day)` + `weekDateRange(month, weekIndex)` (RESEARCH Pattern 4) and **refactor `getWeeklySpending` to import it** so the dashboard chart and the weekly cards agree (anti-pattern: duplicating the ranges). `weekDateRange` builds `start`/`end` using the same `new Date(y, m-1, startDay)` / `new Date(y, m, 0)` idiom as loader.ts:22-23. This is the highest-risk calc surface — cover with property tests (Feb 28/29, 30/31-day months, boundary days 7/8/14/15/21/22/last).

---

### `DashboardCards.tsx` (MODIFY)

**Analog:** itself. Cards 2 ("Planejado") and 3 ("Folga") currently show `--` / use `teto − gastoHoje` (DashboardCards.tsx:28-46). Wire card 2 to the real plan total (new `planTotalCents` prop from loader) and card 3 to `ceilingCents − planTotalCents` using the existing positive/warning color logic (lines 36-46). Keep `--` fallback when no plan exists. Add `getPlanTotal` into `loadDashboardData`'s `Promise.all` (visao-geral/loader.ts:13-19).

---

## Shared Patterns

### Authentication / Access Control (ASVS V3/V4)
**Source:** `getUserId()` in `lancamentos/_lib/actions.ts:32-39`.
**Apply to:** every `actions.ts`. `userId` ALWAYS from `supabase.auth.getUser()`, never from the form (mass-assignment guard — Zod schemas contain no `userId`). Every service update/delete uses `where: { id, userId }` (IDOR guard — lancamentos/service.ts:43, 71).
```typescript
async function getUserId() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user.id
}
```

### Error handling + response envelope
**Source:** `lancamentos/_lib/actions.ts` (every action).
**Apply to:** all actions. Return `{ success: boolean; error?: string }`. Zod failure → `parsed.error.issues[0].message`. `catch` → generic pt-BR message. Client reads `result.success` and routes the message to `setError('root', ...)` (TransactionSheet) or local `errorMsg` state (DeleteDialog).

### Money + date formatting
**Source:** `src/lib/format.ts` (`formatBRL`, `formatDate`).
**Apply to:** all display. Money is `Int` cents end-to-end; render only via `formatBRL()` in `font-mono`. Never `toFixed`/`Intl` inline, never `toLocaleDateString`. Date strings `'YYYY-MM-DD'` → `parseISO` (date-fns) in services (lancamentos/service.ts:3, 30).

### Prisma access
**Source:** `src/lib/prisma.ts` singleton.
**Apply to:** all services/loaders. `import { prisma } from '@/lib/prisma'`. Atomic multi-row writes via `prisma.$transaction` (lancamentos/service.ts:104, 140). Composite-unique lookups via `where: { userId_month: {...} }` (visao-geral/service.ts:12).

### Client-side state
**Source:** `src/store/conta.ts` (`useContaStore` — `mesSelecionado`, `contaAtiva`, zustand+persist).
**Apply to:** month/account-aware client components. `min-h-[44px]` on every interactive element (incl. Checkbox/Switch) — inviolable spec rule.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/app/(authed)/planejamento/_components/SegmentedBar.tsx` | component | transform | Repo has only single-fill bars (`CategorySpendingBars`); multi-segment bar with a trailing "Folga" segment is new — build from the single-bar idiom. **Partial**, not a true no-analog. |
| `vitest.config.ts`, `src/lib/weeks.test.ts`, `*/service.test.ts` | test/config | — | No test framework exists in the repo (`[VERIFIED: no *.test.ts / vitest config]`). Wave 0 installs Vitest (run Package Legitimacy gate first) and authors these — use RESEARCH §Validation Architecture, not a code analog. |

---

## Metadata

**Analog search scope:** `src/app/(authed)/{visao-geral,lancamentos}/**`, `src/lib/**`, `src/store/**`, `src/components/ui/**`, `prisma/schema.prisma`.
**Files scanned:** ~22 read in full (both feature slices end-to-end + shared libs + schema + stub pages).
**Pattern extraction date:** 2026-11-25
