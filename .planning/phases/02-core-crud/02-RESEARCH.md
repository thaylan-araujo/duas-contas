# Phase 2: Core CRUD — Research

**Researched:** 2026-11-23
**Domain:** Next.js 15 Server Actions · Prisma 6 transactions · Recharts 3 · shadcn/ui Sheet/Dialog/Select/Badge/Tabs · Zustand · React Hook Form + Zod
**Confidence:** MEDIUM

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Adicionar modelo `MonthlyBudget` ao schema Prisma: `id (cuid), userId (FK User), month (String "YYYY-MM"), ceilingCents (Int)`.
- **D-02:** Dashboard da Casa (DASH-01) exibe 4 cartões: "Teto do mês", "Planejado" (exibe "--"), "Folga" (teto − gasto total; exibe "--" se teto não definido), "Gasto até hoje".
- **D-03:** Teto editável inline no cartão — clique abre input inline (`font-mono`). Enter ou blur salva via Server Action (upsert no MonthlyBudget).
- **D-04:** Mês sem `MonthlyBudget` copia `ceilingCents` do mês anterior mais próximo; fallback 300000 (R$ 3.000,00).
- **D-05:** Adicionar campo `pairId: String?` ao modelo `Transaction`. Pró-labore: ambos os lançamentos recebem o mesmo UUID (`crypto.randomUUID()`).
- **D-06:** Lançamentos com `pairId !== null` bloqueados para edição individual. Sheet mostra aviso somente leitura + botão "Excluir pró-labore" (exclui par via `prisma.$transaction`).
- **D-07:** Gerenciar categorias: Sheet acessível de /lancamentos com lista organizada por conta. Ícone lápis (editar nome) e lixeira (excluir). Categorias padrão do seed: somente leitura.
- **D-08:** Exclusão de categoria bloqueada se houver lançamentos vinculados. Mensagem: "Esta categoria tem X lançamentos e não pode ser excluída."

### Claude's Discretion

- Estrutura exata da Server Action de upsert do MonthlyBudget (usar `upsert` nativo do Prisma com `where: { userId_month: { userId, month } }`).
- Como renderizar o campo inline do teto no cartão do dashboard (input controlado com `onBlur`).
- Organização interna do Sheet "Gerenciar categorias" (tabs por conta ou lista única com filtro toggle).
- Lógica de cópia automática do teto do mês anterior (Server Component carrega no render vs. Server Action acionada na primeira edição).

### Deferred Ideas (OUT OF SCOPE)

- Dashboard da Empresa (DASH-03, DASH-04) — botão "Empresa" fica desabilitado com tooltip.
- Lançamento rápido mobile (LANC-07).
- "Total planejado" no dashboard — exibe "--" até a Fase 3.
- Editar itens de planejamento via dashboard.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LANC-01 | Usuário pode criar lançamento com data, descrição, valor, tipo, categoria e conta | Server Action pattern + React Hook Form + Zod schema + Prisma `transaction.create` |
| LANC-02 | Usuário pode editar qualquer campo de um lançamento existente | Same Sheet component in edit mode; `transaction.update` Server Action |
| LANC-03 | Usuário pode excluir um lançamento | Dialog de confirmação + `transaction.delete` Server Action; pair check on pairId |
| LANC-04 | Usuário pode listar lançamentos filtrados por conta e mês | Server Component loader + Zustand `mesSelecionado`/`contaAtiva` passed as params |
| LANC-05 | Usuário pode registrar transferência de pró-labore (atomic) | `prisma.$transaction` interactive callback — creates two Transaction records with shared pairId |
| LANC-06 | Usuário pode criar, editar e excluir categorias | Inline "+ Nova categoria" in Select; "Gerenciar categorias" Sheet with server actions |
| DASH-01 | Usuário vê painel da Casa com 4 cartões | MonthlyBudget upsert + aggregation query for spending total |
| DASH-02 | Usuário vê barras por categoria e gráfico semanal | Recharts BarChart (must be `'use client'`) + spending aggregation grouped by category/week |
</phase_requirements>

---

## Summary

Phase 2 delivers the entire CRUD surface for financial transactions plus the Casa dashboard. The technical core is straightforward Next.js 15 App Router work: Server Actions for mutations, Server Components for data loading, and a handful of shadcn/ui components. Two non-trivial pieces require specific patterns: the pró-labore atomic pair (Prisma interactive transaction) and the monthly budget inline edit with upsert on a compound unique key.

The existing codebase (Phase 1) already has the correct foundation: Prisma singleton, `formatBRL`/`formatDate` utilities, Zustand store, feature-per-route colocation, and seven shadcn components installed. Phase 2 extends this by adding four shadcn components (Dialog, Select, Badge, Tabs), one npm package (recharts), two Prisma model changes (add `pairId` to Transaction, new MonthlyBudget model), and two new feature routes replacing the placeholder pages at `/lancamentos` and `/visao-geral`.

No new external service dependencies are introduced. All mutations follow the established pattern: thin Server Action (parse Zod → call service → revalidatePath), with business logic in `*.service.ts`. The only deviation from the established pattern is the Recharts chart component, which must be wrapped in `'use client'` and isolated from Server Components.

**Primary recommendation:** Follow the established colocation pattern exactly. Add the two missing Prisma model changes in a single migration, install recharts, run `npx shadcn@latest add dialog select badge tabs`, then implement in this order: (1) transaction CRUD, (2) pró-labore, (3) category management, (4) Casa dashboard.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Transaction CRUD (create/edit/delete) | API / Backend (Server Action + service) | Frontend Server (Server Component for list load) | Mutations are Server Actions; list is a Server Component render |
| Pró-labore atomic pair | API / Backend (Server Action + Prisma.$transaction) | — | Both records must be created/deleted atomically at DB level |
| Category management | API / Backend (Server Action) | Frontend Server (Server Component for category list) | CRUD on Category model; list loaded server-side |
| Transaction list with filters | Frontend Server (Server Component) | Browser / Client (Zustand store for filter state) | Server Component receives month/account from URL/props fed by Zustand |
| MonthlyBudget inline edit | Browser / Client (controlled input + onBlur) | API / Backend (Server Action upsert) | Inline edit requires client interactivity; persistence is server-side |
| Casa dashboard cards | Frontend Server (Server Component) | — | Aggregation queries at render time, no browser JS needed |
| Recharts weekly bar chart | Browser / Client (must be 'use client') | Frontend Server (data fetched server-side, passed as props) | Recharts uses browser DOM APIs — cannot render on server |
| Category spending bars | Frontend Server (Server Component) | — | Static bar rendering needs no interactivity |

---

## Standard Stack

### Core (all already installed in package.json)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.28 | Full-stack framework, Server Actions, App Router | Project foundation from Phase 1 |
| Prisma | 6.19.3 | ORM, schema migrations | Project foundation from Phase 1 |
| React Hook Form | 7.91.0 | Form state management | Already in package.json; zod resolver also installed |
| Zod | 3.25.76 | Schema validation (client + server) | Already in package.json |
| date-fns | 3.6.0 | Date formatting, week calculations | Already in package.json; ptBR locale |
| Zustand | 5.0.16 | Store for `contaAtiva` + `mesSelecionado` | Already in package.json |
| @hookform/resolvers | 6.0.2 | Zod resolver for React Hook Form | Already in package.json |

### New in Phase 2

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.11.0 | BarChart for weekly spending | Specified in spec.md, CLAUDE.md, and CONTEXT.md; React-native, TypeScript-first |
| @radix-ui/react-select | 2.4.1 | Select primitive (via shadcn) | shadcn Select depends on this Radix primitive |
| @radix-ui/react-tabs | 1.2.1 | Tabs primitive (via shadcn) | shadcn Tabs depends on this Radix primitive |

Note: `@radix-ui/react-dialog` (1.3.1) is already in package.json but `dialog.tsx` shadcn component is NOT yet in `src/components/ui/`. It needs to be generated via `npx shadcn@latest add dialog`.

**Installation:**
```bash
npm install recharts
npx shadcn@latest add dialog select badge tabs
```

**Version verification:** `npm view recharts version` → 3.11.0 [VERIFIED: npm registry — package created 2015-08-07, 71M downloads/week]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts | Chart.js | recharts is React-native and TypeScript-first; Chart.js is canvas-based and needs wrappers; spec.md specifies recharts |
| Server Actions + Zod | tRPC | tRPC adds config overhead for a single-user app; Server Actions cover the use case with less boilerplate |
| Zustand for filter state | URL search params | URL params would work but require Next.js navigation on every filter change; Zustand persists across routes without navigation |

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| recharts | npm | 11 yrs (created 2015) | 71M/wk | github.com/recharts/recharts | SUS (too-new version 3.11.0 pub date) | Approved — package is 11 years old; SUS flag is for the latest patch release date, not the package itself |
| @radix-ui/react-select | npm | Mature | 74M/wk | github.com/radix-ui/primitives | OK | Approved |
| @radix-ui/react-tabs | npm | Mature | 82M/wk | github.com/radix-ui/primitives | OK | Approved |
| @radix-ui/react-dialog | npm | Mature | 101M/wk | github.com/radix-ui/primitives | OK | Already in package.json |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** recharts — flag is a false positive (package age 11 years, 71M weekly downloads, well-known library); planner does NOT need a checkpoint:human-verify gate for this package.

---

## Architecture Patterns

### System Architecture Diagram

```
User Browser
     │
     │ (Zustand: contaAtiva, mesSelecionado)
     ▼
Client Components ('use client')
 ├── TransactionSheet (form: create / edit)
 │     └── React Hook Form + Zod client validation
 │           └── startTransition → Server Action
 ├── DeleteDialog (confirm delete)
 │     └── startTransition → Server Action
 ├── InlineCeilingEditor (onBlur)
 │     └── startTransition → Server Action (upsert MonthlyBudget)
 ├── ManageCategoriesSheet
 │     └── Server Actions (create/update/delete category)
 └── WeeklyBarChart (Recharts, must be 'use client')
           └── props: weeklyData[] passed from Server Component

     │ (Server-side: Next.js App Router)
     ▼
Server Components (data loading)
 ├── LancamentosPage: loads transactions filtered by account+month
 ├── VisaoGeralPage: loads MonthlyBudget, spending totals, category spending, weekly spending
 └── Both pass data as props to Client Components

     │
     ▼
Server Actions (mutations, 'use server')
 ├── createTransaction → service → prisma.transaction.create
 ├── updateTransaction → service → prisma.transaction.update
 ├── deleteTransaction → service → prisma.transaction.delete (or pairId delete via $transaction)
 ├── createProLabore → service → prisma.$transaction([create saida, create entrada])
 ├── upsertMonthlyBudget → service → prisma.monthlyBudget.upsert
 ├── createCategory → service → prisma.category.create
 ├── updateCategory → service → prisma.category.update
 └── deleteCategory → service → check lançamentos count → prisma.category.delete

     │
     ▼
Prisma Services (pure TypeScript, business logic)
     │
     ▼
Prisma Client (singleton from src/lib/prisma.ts)
     │
     ▼
Supabase Postgres (DATABASE_URL port 6543 pooler at runtime)
```

### Recommended Project Structure

```
src/app/(authed)/
├── lancamentos/
│   ├── page.tsx                    # Server Component — loads transactions
│   ├── _components/
│   │   ├── TransactionList.tsx     # Server Component (list render)
│   │   ├── TransactionRow.tsx      # Server Component (single row)
│   │   ├── TransactionSheet.tsx    # 'use client' — create/edit form
│   │   ├── DeleteDialog.tsx        # 'use client' — confirm delete
│   │   ├── ManageCategoriesSheet.tsx # 'use client' — LANC-06
│   │   ├── AccountFilterToggle.tsx # 'use client' — Casa/Empresa/Todos
│   │   └── MonthSelector.tsx       # 'use client' — prev/next month
│   └── _lib/
│       ├── actions.ts              # Server Actions (thin — parse + call service + revalidatePath)
│       ├── service.ts              # Business logic (pure TS, testable)
│       ├── schema.ts               # Zod schemas shared by client and server
│       └── loader.ts               # Data loading functions for Server Components
│
├── visao-geral/
│   ├── page.tsx                    # Server Component — loads dashboard data
│   ├── _components/
│   │   ├── DashboardCards.tsx      # Server Component — 4 summary cards
│   │   ├── InlineCeilingEditor.tsx # 'use client' — inline teto edit (D-03)
│   │   ├── CategorySpendingBars.tsx # Server Component — category bars
│   │   ├── WeeklyBarChart.tsx      # 'use client' — Recharts BarChart
│   │   └── AccountSelector.tsx    # 'use client' — Casa/Empresa toggle
│   └── _lib/
│       ├── actions.ts
│       ├── service.ts
│       ├── schema.ts
│       └── loader.ts
```

### Pattern 1: Thin Server Action

**What:** Server Action parses input with Zod, calls a service function, calls revalidatePath, returns typed result.
**When to use:** Every mutation.

```typescript
// Source: established pattern from Phase 1 / CONTEXT.md code_context
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createTransactionService } from './service'
import { transactionSchema } from './schema'

export async function createTransaction(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  try {
    await createTransactionService(parsed.data)
    revalidatePath('/lancamentos')
    return { success: true }
  } catch (e) {
    return { success: false, error: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' }
  }
}
```

### Pattern 2: Prisma Interactive Transaction (Pró-labore)

**What:** Use `prisma.$transaction(async (tx) => { ... })` to create/delete both records atomically.
**When to use:** pró-labore create and pró-labore delete.

```typescript
// Source: prisma.io/docs/orm/prisma-client/queries/transactions [CITED]
import { prisma } from '@/lib/prisma'
import { TransactionType, ContaType } from '@prisma/client'

export async function createProLabore({
  amountCents, date, userId, categoryId
}: ProLaboreInput) {
  const pairId = crypto.randomUUID()
  return prisma.$transaction(async (tx) => {
    const saida = await tx.transaction.create({
      data: {
        date, description: 'Pró-labore', amountCents, pairId,
        type: TransactionType.SAIDA, account: ContaType.EMPRESA,
        categoryId, userId,
      }
    })
    const entrada = await tx.transaction.create({
      data: {
        date, description: 'Pró-labore', amountCents, pairId,
        type: TransactionType.ENTRADA, account: ContaType.CASA,
        categoryId, userId,
      }
    })
    return { saida, entrada }
  })
}

export async function deleteProLabore(pairId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { pairId, userId } })
  })
}
```

### Pattern 3: Prisma Upsert with Compound Unique (MonthlyBudget)

**What:** Prisma `upsert` on a model with `@@unique([userId, month])`. Where clause uses underscore-joined field name.
**When to use:** MonthlyBudget — create if missing, update if exists.

```typescript
// Source: prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints [CITED]
export async function upsertMonthlyBudget(userId: string, month: string, ceilingCents: number) {
  return prisma.monthlyBudget.upsert({
    where: { userId_month: { userId, month } },
    update: { ceilingCents },
    create: { userId, month, ceilingCents },
  })
}
```

Schema required:
```prisma
model MonthlyBudget {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  month        String   // "YYYY-MM"
  ceilingCents Int
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@unique([userId, month])
}
```

### Pattern 4: React Hook Form + Server Action via startTransition

**What:** Client Component uses React Hook Form for validation; on submit calls Server Action via startTransition.
**When to use:** Transaction form, category form.

```typescript
// Source: dev.to/emmanuel_xs/how-to-use-react-hook-form-with-useactionstate-hook-in-nextjs15 [CITED]
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { transactionSchema, TransactionFormData } from '../_lib/schema'
import { createTransaction } from '../_lib/actions'

export function TransactionSheet() {
  const [isPending, startTransition] = useTransition()
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const onSubmit = form.handleSubmit((data) => {
    startTransition(async () => {
      const result = await createTransaction(data)
      if (result.success) {
        // close sheet
      }
    })
  })

  return <form onSubmit={onSubmit}>{/* fields */}</form>
}
```

### Pattern 5: Recharts BarChart as Client Component

**What:** Recharts MUST be in a `'use client'` component. Data is computed server-side and passed as props.
**When to use:** WeeklyBarChart on the dashboard.

```typescript
// Source: recharts.github.io/en-US/api/BarChart [CITED]
'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatBRL } from '@/lib/format'

type WeekData = { week: string; totalCents: number }

export function WeeklyBarChart({ data }: { data: WeekData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="week" />
        <YAxis tickFormatter={(v) => formatBRL(v)} />
        <Tooltip formatter={(v: number) => formatBRL(v)} />
        <Bar dataKey="totalCents" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### Anti-Patterns to Avoid

- **Recharts in Server Component:** Recharts uses browser DOM APIs. Placing it in a Server Component causes a build error or hydration mismatch. ALWAYS use `'use client'` on any file importing from `recharts`.
- **Formatting inline instead of with utilities:** Never use `Intl.NumberFormat` or `.toFixed(2)` directly in JSX. ALWAYS use `formatBRL()` and `formatDate()` from `src/lib/format.ts`.
- **Business logic in Server Actions:** Actions must be thin. Never put "if pairId then delete both" logic in an action — it belongs in `service.ts`.
- **Float for monetary values:** Never store or pass floats for money. All amounts are `Int` (centavos). Convert to/from display format only at the UI boundary using `formatBRL()`.
- **Editing pró-labore without pair check:** Any update/delete action on a Transaction must check `pairId !== null`. If set, block individual edits and route to the pair-delete flow.
- **Migration against port 6543:** Always use DIRECT_URL (port 5432) for `prisma migrate dev`. Never run migrations via the pooler.
- **Missing revalidatePath:** Every mutation Server Action must call `revalidatePath('/lancamentos')` and/or `revalidatePath('/visao-geral')` as appropriate, or the UI will show stale data.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic dual-record creation | Custom rollback logic | `prisma.$transaction` interactive form | DB-level atomicity; rollback is automatic on error |
| Form validation | Custom validation functions | Zod + zodResolver | Shared schema between client and server; type inference; existing in package.json |
| Accessible dialogs | Custom modal with div | shadcn `Dialog` (Radix UI) | Focus trap, aria-modal, keyboard dismiss — all handled |
| Accessible select dropdowns | Native `<select>` or custom div | shadcn `Select` (Radix UI) | Keyboard nav, screen reader announce, portal rendering |
| Chart rendering | SVG manually | Recharts | Axes, tooltips, responsive layout — hundreds of edge cases |
| Currency input parsing | Regex on value | Normalize string: replace `,` with `.`, parse float, multiply × 100 for centavos | Simple and consistent with the established convention |
| Date formatting | `.toLocaleDateString()` | `formatDate()` from `src/lib/format.ts` | Prevents timezone drift; established pattern from Phase 1 |
| Compound upsert | Manual select then create/update | `prisma.monthlyBudget.upsert` with compound where | Race-condition safe; idiomatic Prisma |

**Key insight:** The hardest bugs in CRUD apps are monetary rounding, timezone drift, and stale cache. All three are already handled by established patterns (Int centavos, explicit date-fns format, revalidatePath). Follow the existing patterns exactly.

---

## Common Pitfalls

### Pitfall 1: Recharts SSR Hydration Mismatch
**What goes wrong:** Page throws "Hydration failed" or renders an empty chart on first load.
**Why it happens:** Recharts accesses `window` during render. If the component is not `'use client'`, Next.js tries to render it on the server.
**How to avoid:** Always add `'use client'` to any file that imports from `recharts`. If still failing, wrap import with `next/dynamic` and `ssr: false`.
**Warning signs:** Console error about `window is not defined` or hydration mismatch.

### Pitfall 2: Missing pairId Check in Edit/Delete
**What goes wrong:** User edits one side of a pró-labore, creating financial inconsistency.
**Why it happens:** Generic edit/delete handler doesn't check `pairId`.
**How to avoid:** Service functions for `updateTransaction` and `deleteTransaction` must check if `pairId !== null` and throw a typed error if someone tries individual edit. The Sheet UI also checks `pairId` to show read-only mode (D-06).
**Warning signs:** Transaction with `pairId !== null` returned from server without blocking edit.

### Pitfall 3: MonthlyBudget Upsert Without @@unique
**What goes wrong:** `prisma.monthlyBudget.upsert` with `where: { userId_month: { ... } }` throws a runtime Prisma error.
**Why it happens:** Prisma requires the `@@unique([userId, month])` attribute in the schema before it generates the compound key accessor. If the migration doesn't include the unique constraint, the upsert call will fail at runtime.
**How to avoid:** Schema must have `@@unique([userId, month])` before running `prisma migrate dev`.
**Warning signs:** Prisma type error `Property 'userId_month' does not exist` at compile time.

### Pitfall 4: Category delete with linked transactions
**What goes wrong:** Prisma throws a foreign key constraint error when deleting a category that has transactions.
**Why it happens:** `Transaction.categoryId` is a FK to `Category.id` with no cascade delete set.
**How to avoid:** Service function for `deleteCategory` must run `prisma.transaction.count({ where: { categoryId } })` before attempting delete. If count > 0, return an error (D-08: "Esta categoria tem X lançamentos e não pode ser excluída."). Never set cascade delete on Category — data integrity is a business requirement.
**Warning signs:** Prisma `ForeignKeyConstraintViolation` error from delete action.

### Pitfall 5: Stale Month/Account Filter
**What goes wrong:** Transaction list shows wrong month's data after navigation.
**Why it happens:** `mesSelecionado` and `contaAtiva` live in Zustand (client-side). Server Component loaders run on the server and don't have access to the store. If the page doesn't receive these values via URL params or props, it defaults to hardcoded values.
**How to avoid:** Page Server Component reads filter from URL search params (`searchParams.month`, `searchParams.account`). Client components update URL params when Zustand state changes. Server Component and Zustand store are kept in sync via URL.
**Warning signs:** List always shows current month even when user navigated to a different month.

### Pitfall 6: Date field timezone drift in Prisma
**What goes wrong:** Lançamento registered on 2026-11-20 appears as 2026-11-19 on the list.
**Why it happens:** JavaScript `new Date()` is in local time; when serialized to UTC for Postgres `DATE`, it shifts by the UTC offset.
**How to avoid:** Follow established pattern: store dates as `DateTime @db.Date`. Parse input dates from the form with `parseISO` from date-fns (not `new Date()`). Display only with `formatDate()`. Never pass JavaScript Date objects across the server/client boundary — pass ISO strings.
**Warning signs:** Dates consistently showing one day earlier than expected.

---

## Code Examples

### Prisma Schema Changes for Phase 2

```prisma
// Add pairId to Transaction (after existing fields)
model Transaction {
  // ... existing fields ...
  pairId    String?    // links two transactions in a pró-labore pair
}

// New model
model MonthlyBudget {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  month        String   // "YYYY-MM"
  ceilingCents Int
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([userId, month])
}
```

### Weekly Spending Aggregation (Prisma query)

```typescript
// Source: spec.md §Regras de cálculo — semanas 1-7, 8-14, 15-21, 22-fim [CITED]
// In loader.ts
export async function getWeeklySpending(userId: string, month: string) {
  const [year, monthNum] = month.split('-').map(Number)
  const startOfMonth = new Date(year, monthNum - 1, 1)
  const endOfMonth = new Date(year, monthNum, 0) // last day

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      account: 'CASA',
      type: 'SAIDA',
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { date: true, amountCents: true },
  })

  // Map to weeks: 1-7 → Sem 1, 8-14 → Sem 2, 15-21 → Sem 3, 22+ → Sem 4
  const weeks = [
    { week: 'Sem 1', totalCents: 0 },
    { week: 'Sem 2', totalCents: 0 },
    { week: 'Sem 3', totalCents: 0 },
    { week: 'Sem 4', totalCents: 0 },
  ]
  for (const t of transactions) {
    const day = t.date.getDate()
    const idx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3
    weeks[idx].totalCents += t.amountCents
  }
  return weeks
}
```

### Category Spending Aggregation

```typescript
// In loader.ts
export async function getCategorySpending(userId: string, month: string) {
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(year, monthNum - 1, 1)
  const end = new Date(year, monthNum, 0)

  return prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId, account: 'CASA', type: 'SAIDA',
      date: { gte: start, lte: end },
    },
    _sum: { amountCents: true },
  })
}
```

### MonthlyBudget Fallback Logic (D-04)

```typescript
// In service.ts
export async function getOrCreateMonthlyBudget(userId: string, month: string) {
  const existing = await prisma.monthlyBudget.findUnique({
    where: { userId_month: { userId, month } },
  })
  if (existing) return existing

  // Find previous month's budget
  const previous = await prisma.monthlyBudget.findFirst({
    where: { userId, month: { lt: month } },
    orderBy: { month: 'desc' },
  })
  const ceilingCents = previous?.ceilingCents ?? 300_000 // R$ 3.000,00 default

  return prisma.monthlyBudget.upsert({
    where: { userId_month: { userId, month } },
    update: {},
    create: { userId, month, ceilingCents },
  })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useFormState` | `useActionState` (React 19) | React 19 release | `useFormState` is deprecated; `useActionState` is the standard for form + Server Action state |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | Supabase 2024 | Old helper is deprecated; `@supabase/ssr` is already installed (Phase 1) |
| `next-pwa` | `@serwist/next` | 2024 | `next-pwa` unmaintained; Serwist is its successor (already installed in Phase 1) |
| Recharts 2.x | Recharts 3.x | 2026 | 3.x is current; API is largely compatible with 2.x but some import paths changed |

**Deprecated/outdated:**
- `useFormState`: replaced by `useActionState` in React 19 — use `useActionState` from `'react'`
- Recharts 2.x `<XAxis dataKey>` with implicit domain: Recharts 3.x has the same API for BarChart; no breaking changes for this use case [ASSUMED]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Recharts 3.x BarChart API is backward-compatible with 2.x for basic BarChart/Bar/XAxis/YAxis/Tooltip/ResponsiveContainer usage | State of the Art, Code Examples | Minor: would need to adjust import paths or prop names; recharts changelog review would resolve this |
| A2 | `useActionState` from React 19 is available without additional imports in Next.js 15 (React 19 is bundled) | Standard Stack | Low risk: package.json shows `react: 19.1.0`; React 19 is confirmed installed |
| A3 | `shadcn@latest add dialog select badge tabs` with existing shadcn@4.22.0 initialization will not break existing components | Architecture Patterns | Low risk: shadcn CLI adds new component files; existing files are untouched unless explicitly overwritten |
| A4 | `crypto.randomUUID()` is available in Next.js 15 Server Actions without polyfill (Node 22 environment) | Code Examples | Very low risk: Node 22.23.0 confirmed; `crypto.randomUUID()` is native in Node 15+ |

---

## Open Questions

1. **Filter state: URL params vs Zustand-only**
   - What we know: `mesSelecionado` and `contaAtiva` are in Zustand (localStorage). Server Components cannot read Zustand directly.
   - What's unclear: Whether to encode filter as URL search params (enabling deep links + server-side filtering) or pass via a client wrapper that fetches data.
   - Recommendation: Use URL search params (`?month=2026-11&account=CASA`) as the source of truth for filter. Zustand store updates the URL; Server Component reads from `searchParams`. This is the idiomatic Next.js App Router pattern and enables deep links.

2. **Category uniqueness for seed vs user-created categories**
   - What we know: Seed creates categories with no `isDefault` flag in the current schema. CONTEXT.md D-07 says "categorias padrão do seed são somente leitura".
   - What's unclear: How to distinguish seed categories from user-created ones — either add `isDefault: Boolean @default(false)` to Category schema, or check `origin` field.
   - Recommendation: Add `isDefault Boolean @default(false)` to Category model in the same migration as `pairId` and `MonthlyBudget`. Update seed to pass `isDefault: true` for the 10 default categories. This is the simplest signal for the UI to show/hide edit controls.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 22.23.0 | — |
| npm | Package install | ✓ | 10.9.8 | — |
| Prisma CLI | Schema migration | ✓ | 6.19.3 (devDependency) | — |
| recharts | Weekly chart (DASH-02) | ✗ (not in package.json) | — | Install: `npm install recharts` |
| shadcn Dialog | Delete confirmation | ✗ (Radix installed, component missing) | — | `npx shadcn@latest add dialog` |
| shadcn Select | Form dropdowns | ✗ | — | `npx shadcn@latest add select` |
| shadcn Badge | Transaction type indicator | ✗ | — | `npx shadcn@latest add badge` |
| shadcn Tabs | Dashboard account selector | ✗ | — | `npx shadcn@latest add tabs` |
| Supabase DB | Persistence | ✓ (Phase 1 running) | Managed | — |
| Vercel | Deploy | ✓ (Phase 1 deployed) | Managed | — |

**Missing dependencies with no fallback:**
- None that block execution. All missing packages have known install commands.

**Missing dependencies with fallback (install required):**
- `recharts` → `npm install recharts` (Wave 0 task)
- shadcn Dialog, Select, Badge, Tabs → `npx shadcn@latest add dialog select badge tabs` (Wave 0 task)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed — Wave 0 must install Vitest or Jest |
| Config file | None — Wave 0 creates vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` (after Wave 0 setup) |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LANC-01 | createTransaction service creates record with correct fields | unit | `npx vitest run tests/lancamentos/service.test.ts` | ❌ Wave 0 |
| LANC-02 | updateTransaction service updates existing record | unit | `npx vitest run tests/lancamentos/service.test.ts` | ❌ Wave 0 |
| LANC-03 | deleteTransaction blocks if pairId set, deletes normally if pairId null | unit | `npx vitest run tests/lancamentos/service.test.ts` | ❌ Wave 0 |
| LANC-04 | loader returns transactions filtered by account and month | unit | `npx vitest run tests/lancamentos/loader.test.ts` | ❌ Wave 0 |
| LANC-05 | createProLabore creates two records with same pairId atomically | unit | `npx vitest run tests/lancamentos/service.test.ts` | ❌ Wave 0 |
| LANC-06 | deleteCategory blocks if category has transactions | unit | `npx vitest run tests/categorias/service.test.ts` | ❌ Wave 0 |
| DASH-01 | getOrCreateMonthlyBudget falls back to previous month then to 300000 | unit | `npx vitest run tests/visao-geral/service.test.ts` | ❌ Wave 0 |
| DASH-02 | getWeeklySpending maps transactions to correct week buckets | unit | `npx vitest run tests/visao-geral/service.test.ts` | ❌ Wave 0 |

**Note:** These are unit tests for pure service functions only. Services accept a Prisma client as a parameter (or via dependency injection) to allow mocking in tests. UI smoke tests (render + interaction) are manual given no E2E framework is configured.

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose` (pure service tests, < 10s)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + manual smoke in browser before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/` directory
- [ ] `vitest.config.ts` — framework install: `npm install -D vitest`
- [ ] `tests/lancamentos/service.test.ts` — covers LANC-01, LANC-02, LANC-03, LANC-05
- [ ] `tests/lancamentos/loader.test.ts` — covers LANC-04
- [ ] `tests/categorias/service.test.ts` — covers LANC-06
- [ ] `tests/visao-geral/service.test.ts` — covers DASH-01, DASH-02

---

## Security Domain

> `security_enforcement: true` and `security_asvs_level: 1` in config.json.

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No (session handled by Supabase Auth, Phase 1) | @supabase/ssr (already in place) |
| V3 Session Management | No (Phase 1 middleware checks session on every request) | middleware.ts from Phase 1 |
| V4 Access Control | Yes — data isolation: users must only see/modify their own records | Add `userId` filter to ALL Prisma queries in services; never query without `where: { userId }` |
| V5 Input Validation | Yes — all form inputs | Zod schema validates on server in every Server Action; client-side Zod via zodResolver |
| V6 Cryptography | No | No passwords or secrets handled in Phase 2 code |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Insecure Direct Object Reference — accessing another user's transactions | Elevation of Privilege | Every service query includes `where: { userId }` — never query by ID alone without user filter |
| Mass assignment in Server Actions | Tampering | Zod schema whitelist: only allowed fields parsed; `Object.fromEntries(formData)` is safe because schema rejects extra fields |
| Cross-Site Request Forgery | Spoofing | Server Actions are CSRF-safe by default in Next.js (same-origin enforcement) [ASSUMED] |
| Monetary manipulation — passing negative amountCents | Tampering | Zod schema: `z.number().int().positive()` for `amountCents` |
| Orphaned pró-labore pair on partial failure | Tampering/data corruption | `prisma.$transaction` interactive mode: atomic — both succeed or both roll back |

### Security Rule for Phase 2

Every service function that reads or mutates a Transaction, Category, or MonthlyBudget MUST accept `userId` and include it in the Prisma `where` clause. The user's ID comes from the authenticated session via `createServerClient` from `@supabase/ssr` (established in Phase 1 middleware). Never trust a `userId` from form data — always read it from the session.

---

## Project Constraints (from CLAUDE.md)

| Directive | Applies to Phase 2 |
|-----------|-------------------|
| Português do Brasil em toda a interface | All copy from 02-UI-SPEC.md copywriting contract |
| Valores em R$ 1.234,56 | Use `formatBRL()` exclusively; never inline |
| Datas em dd/mm/aaaa | Use `formatDate()` exclusively; never inline |
| Banco: Supabase + Prisma | ✓ Schema migration adds pairId + MonthlyBudget |
| Frontend: Next.js + TypeScript + Tailwind CSS | ✓ No new framework |
| Deploy: Vercel desde o início | ✓ No local-only code; migration runs against DIRECT_URL |
| Mobile: PWA, botões mínimo 44px | UI-SPEC enforces `min-h-[44px]` on all interactives |
| Separação de contas inviolável | Pró-labore is the ONLY way money crosses accounts; enforced at service level |
| Trabalhar em uma etapa por vez | Phase 2 is the active phase; no Phase 3 work in this plan |
| Nunca apagar dados sem avisar | No destructive schema changes; pairId is additive; MonthlyBudget is new table |
| Feature-per-route colocation | Each page has `_components/` and `_lib/` subdirectories |
| Server Actions finas | parse Zod → chama service → revalidatePath |
| Lógica de negócio em `*.service.ts` | All business rules in service files |
| `formatBRL()` e `formatDate()` como utilitários únicos | Never format inline |
| `src/lib/prisma.ts` como singleton | Import `prisma` only from this path |

---

## Sources

### Primary (MEDIUM confidence — from official docs via WebSearch)
- [prisma.io/docs/orm/prisma-client/queries/transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) — `$transaction` interactive form patterns
- [prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints) — compound unique upsert
- [recharts.github.io/en-US/api/BarChart](https://recharts.github.io/en-US/api/BarChart/) — BarChart API reference
- [ui.shadcn.com/docs/components/base/dialog](https://ui.shadcn.com/docs/components/base/dialog) — Dialog component

### Secondary (LOW confidence — web articles, confirmed plausible)
- [dev.to/emmanuel_xs/how-to-use-react-hook-form-with-useactionstate-hook-in-nextjs15](https://dev.to/emmanuel_xs/how-to-use-react-hook-form-with-useactionstate-hook-in-nextjs15-1hja) — React Hook Form + useActionState pattern
- [nehalist.io/react-hook-form-with-nextjs-server-actions](https://nehalist.io/react-hook-form-with-nextjs-server-actions/) — RHF + Server Actions integration
- npm registry — package age, downloads, and verdicts for recharts, @radix-ui/react-select, @radix-ui/react-tabs, @radix-ui/react-dialog

### Internal (project canonical)
- `spec.md` — business rules (semanas 1-7, 8-14, 15-21, 22-fim; pró-labore rule)
- `.planning/phases/02-core-crud/02-CONTEXT.md` — all locked decisions (D-01 through D-08)
- `.planning/phases/02-core-crud/02-UI-SPEC.md` — full component specs, copywriting, interaction states
- `.claude/CLAUDE.md` — stack versions, what NOT to use
- `prisma/schema.prisma` — current schema (Transaction, Category, User)
- `prisma/seed.ts` — existing category seeds
- `src/store/conta.ts` — Zustand store interface
- `src/lib/format.ts` — formatBRL, formatDate implementations

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified via npm registry; versions confirmed
- Architecture: MEDIUM — patterns derived from established Phase 1 conventions + official Prisma/Next.js docs
- Pitfalls: MEDIUM — most are based on known framework behavior; timezone/pairId pitfalls are project-specific
- Security: MEDIUM — ASVS Level 1 controls are straightforward for a single-user app

**Research date:** 2026-11-23
**Valid until:** 2026-12-23 (stable stack; Prisma 6, Next.js 15, Recharts 3 are not fast-moving)
