---
phase: 02-core-crud
plan: 02
subsystem: transaction-crud
tags: [transactions, crud, server-actions, server-components, prisma, zod, react-hook-form]
status: complete

dependency_graph:
  requires:
    - 02-01 (prisma schema with pairId, shadcn Dialog, Select, Badge, Sheet)
    - 01-foundation (formatBRL, formatDate, Button, Input, Label, Supabase auth)
  provides:
    - createTransactionService — consumed by Plan 03 (pró-labore: extends with pairId)
    - updateTransactionService — consumed by Plan 03
    - deleteTransactionService — consumed by Plan 03 (extends for pairId pair delete)
    - getTransactions (loader) — consumed by page.tsx (also basis for Plan 04 dashboard)
    - getCategories (loader/service) — consumed by page.tsx and Plan 03
    - createTransactionAction — consumed by TransactionSheet.tsx
    - updateTransactionAction — consumed by TransactionSheet.tsx
    - deleteTransactionAction — consumed by DeleteDialog.tsx
    - transactionSchema — consumed by TransactionSheet.tsx
    - TransactionSheet — consumed by Plan 03 (reused for pró-labore)
    - DeleteDialog — consumed by Plan 03 (extended for pró-labore copy)
    - /lancamentos page — navigation, Plan 03 (category management)
  affects:
    - src/app/(authed)/lancamentos/page.tsx
    - src/app/(authed)/lancamentos/_lib/ (all 4 files)
    - src/app/(authed)/lancamentos/_components/ (all 7 files)

tech_stack:
  added: []
  patterns:
    - Server Component page (no 'use client') with await searchParams (Next.js 15 App Router)
    - Thin Server Action pattern (parse → userId from session → service → revalidatePath)
    - userId always from session in Server Actions (never from form data) — T-02-04
    - pairId guard in service.ts before any edit/delete — D-06
    - parseISO (date-fns) for YYYY-MM-DD → Date conversion (timezone drift prevention)
    - React Hook Form + zodResolver + Controller for Select/toggle fields
    - useTransition for Server Action calls (non-blocking, keeps UI responsive)
    - URL-synced filters: ?month=YYYY-MM and ?account=CASA|EMPRESA via useRouter + useSearchParams
    - Mobile stacked card / Desktop table responsive layout (lg: breakpoint)

key_files:
  created:
    - src/app/(authed)/lancamentos/_lib/schema.ts (Zod transactionSchema + updateTransactionSchema)
    - src/app/(authed)/lancamentos/_lib/service.ts (create/update/delete with userId + pairId guard)
    - src/app/(authed)/lancamentos/_lib/loader.ts (getTransactions + getCategories)
    - src/app/(authed)/lancamentos/_lib/actions.ts (Server Actions, userId from session)
    - src/app/(authed)/lancamentos/_components/TransactionList.tsx (mobile + desktop list)
    - src/app/(authed)/lancamentos/_components/TransactionRow.tsx (single row, edit/delete triggers)
    - src/app/(authed)/lancamentos/_components/TransactionSheet.tsx (create/edit form)
    - src/app/(authed)/lancamentos/_components/DeleteDialog.tsx (confirm delete)
    - src/app/(authed)/lancamentos/_components/AccountFilterToggle.tsx (Todos/Casa/Empresa)
    - src/app/(authed)/lancamentos/_components/MonthSelector.tsx (prev/next month navigation)
    - src/app/(authed)/lancamentos/_components/NewTransactionButton.tsx (header button wrapper)
  modified:
    - src/app/(authed)/lancamentos/page.tsx (replaced placeholder with full Server Component)

decisions:
  - "TransactionRow as 'use client' — click handlers for Sheet/Dialog open state require client runtime"
  - "TransactionList as 'use client' — renders TransactionRow (client component); also manages create Sheet state"
  - "NewTransactionButton extracted as separate client component — page.tsx stays Server Component"
  - "Sheet rendered twice (bottom/right sides) with same form content extracted as SheetFormContent — avoids duplicating form state"
  - "amountCents input uses uncontrolled onChange + setValue pattern — avoids controlled field reformatting on each keypress"
  - "end date uses 23:59:59.999 (not new Date(year, monthNum, 0)) — Prisma Date fields with lte need inclusive end of day"

metrics:
  duration_minutes: 50
  completed_date: "2026-11-24"
  tasks_completed: 2
  tasks_total: 2
  files_created: 11
  files_modified: 1
---

# Phase 2 Plan 2: Transaction CRUD Summary

**One-liner:** Complete transaction CRUD vertical slice — Zod schema, Prisma service with userId+pairId guards, Server Actions, and responsive list page with Sheet form and delete Dialog.

---

## What Was Built

This plan delivers the core value of the app: creating, editing, and deleting financial transactions. After this plan, the `/lancamentos` page is fully functional.

### Task 1: Service Layer (_lib/)

**schema.ts** — Zod-only file (no directives):
- `transactionSchema`: validates date, description, amountCents (int positive), type (ENTRADA|SAIDA), account (CASA|EMPRESA), categoryId, notes (optional max 200)
- `updateTransactionSchema`: extends transactionSchema with id field
- Exports `TransactionFormData` and `UpdateTransactionFormData` types

**service.ts** — Pure TypeScript, no 'use server':
- `createTransactionService`: uses `parseISO` from date-fns (not `new Date()`) to prevent timezone drift
- `updateTransactionService`: findFirst with `{ id, userId }` ownership check; throws `PAIRED_TRANSACTION` if pairId ≠ null (D-06 guard)
- `deleteTransactionService`: same ownership and pairId guard
- `getCategories`: ordered by name

**loader.ts** — Server-side data loading:
- `getTransactions`: parses "YYYY-MM" month string, builds date range, filters by account, includes category relation, ordered date desc
- `getCategories`: same as service (loader used by page; service used by actions)

**actions.ts** — 'use server' thin actions:
- `getUserId()`: private helper reads userId from `supabase.auth.getUser()` — never from form input (T-02-04)
- `createTransactionAction`, `updateTransactionAction`, `deleteTransactionAction`
- All return `{ success: boolean; error?: string }`
- `deleteTransactionAction` revalidates both `/lancamentos` and `/visao-geral`

### Task 2: UI Components (_components/ + page.tsx)

**page.tsx** (Server Component — no 'use client'):
- Awaits searchParams for `month` and `account` (Next.js 15 pattern)
- Gets userId from Supabase session via `createSupabaseServerClient`
- Loads transactions + categories in parallel with `Promise.all`
- Passes all data as props to Client Components (no data fetching in clients)

**TransactionList** ('use client' — renders TransactionRow client components):
- Empty state: `ArrowLeftRight` icon 48px, heading with month label, "+ Novo lançamento" button
- Mobile: stacked card divs
- Desktop: `<table>` with 7 columns (`<th scope="col">` per WCAG)

**TransactionRow** ('use client' — click handlers):
- Mobile layout: badge + description + (category · date · pill conta) + value
- Desktop layout: table row with Pencil/Trash2 icon buttons (min-h-[44px])
- Manages local state for Sheet open and Dialog open

**TransactionSheet** ('use client'):
- Uses `useForm` with `zodResolver(transactionSchema)` and `Controller` for Select/toggle fields
- Conta toggle: Casa/Empresa buttons with `bg-casa-light text-casa` / `bg-empresa-light text-empresa` active styles
- Valor input: `inputMode="decimal"`, uncontrolled `onChange` → `parseBRLInput()` → `setValue('amountCents', cents)`, formatted preview below field
- Sheet rendered for bottom (mobile) and right (desktop) sides; form content shared via `SheetFormContent` sub-component
- pairId guard: when `transaction.pairId !== null`, renders read-only mode with warning and "Excluir pró-labore" destructive button
- Submit button text: "Salvar lançamento" / "Salvar alterações" → "Salvando…" when isPending

**DeleteDialog** ('use client'):
- Normal copy: "Esta ação não pode ser desfeita. O lançamento **[desc]** de **[valor]** será removido permanentemente."
- Paired copy: "Este lançamento faz parte de um pró-labore. Ambos os lançamentos..."
- Confirm: "Excluir lançamento" (destructive), Cancel: "Manter lançamento" (outline)

**AccountFilterToggle** ('use client'):
- Reads active filter from URL (not Zustand) to match server-rendered state
- Three buttons: Todos / Casa (bg-casa active) / Empresa (bg-empresa active)
- Updates URL ?account= param and Zustand store

**MonthSelector** ('use client'):
- ChevronLeft / ChevronRight navigation with date-fns `addMonths` + `format` (ptBR locale)
- Month label capitalized (e.g. "novembro 2026")

**NewTransactionButton** ('use client'):
- Extracted from page.tsx to keep page as Server Component
- Manages create Sheet open state

---

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `f98333f` | feat(02-02): add transaction CRUD service, actions, schema and loader |
| Task 2 | `8228f95` | feat(02-02): add transaction list page and all UI components |

---

## Verification

- `npx tsc --noEmit` — empty output (zero TypeScript errors) after both tasks
- All acceptance criteria checks passed:
  - schema.ts: no 'use server' or 'use client' directives
  - service.ts: no 'use server' directive; `where: { id, userId }` on all mutations; `pairId` guard confirmed
  - actions.ts: 'use server' as first line; `supabase.auth.getUser()` present; userId never from form
  - page.tsx: no 'use client' directive (Server Component)
  - TransactionSheet, DeleteDialog, AccountFilterToggle, MonthSelector, NewTransactionButton: 'use client' as first line
  - No inline formatting (`Intl.NumberFormat`, `toFixed`, `toLocaleDateString` grep returned no matches)
  - All formatBRL/formatDate calls import from '@/lib/format'
  - min-h-[44px] on all interactive elements (10 occurrences in TransactionSheet, 2 in DeleteDialog)

---

## Deviations from Plan

### Auto-added Components

**1. [Rule 2 - Missing Critical Functionality] NewTransactionButton component**
- **Found during:** Task 2
- **Issue:** page.tsx is a Server Component; it cannot directly manage `open` state for a Sheet. The plan's page.tsx spec included a "+ Novo lançamento" Button but didn't account for the state management needed to open TransactionSheet from the page header.
- **Fix:** Extracted `NewTransactionButton` as a thin 'use client' wrapper that manages the Sheet open state. page.tsx remains a Server Component and passes `categories` as a prop.
- **Files modified:** `NewTransactionButton.tsx` (created), `page.tsx` (uses NewTransactionButton)

### Architectural Note: TransactionRow and TransactionList as 'use client'

The plan specified TransactionRow and TransactionList as Server Components. After implementing, they were changed to 'use client' because:
- **TransactionRow** requires `useState` for Sheet/Dialog open state (click event handlers)
- **TransactionList** renders TransactionRow (a client component) and manages its own create Sheet state

This is consistent with Next.js App Router patterns: Server Components can pass data as props to Client Components, but once a subtree includes interactivity (useState, event handlers), that subtree must be Client Components. All data loading stays in `page.tsx` (Server Component); no data fetching occurs in the Client Components.

---

## Known Stubs

None. All components are fully wired:
- page.tsx loads real Prisma data from Supabase
- TransactionSheet submits to real Server Actions
- DeleteDialog calls real deleteTransactionAction
- AccountFilterToggle and MonthSelector update real URL params

---

## Threat Flags

None. All STRIDE threats mitigated:
- T-02-04: Every service function uses `{ id, userId }` in where clause (never id alone)
- T-02-05: `z.number().int().positive()` enforces amountCents > 0
- T-02-06: `transactionSchema.safeParse()` whitelist — only declared fields reach the service
- T-02-08: pairId !== null check in both updateTransactionService and deleteTransactionService throws PAIRED_TRANSACTION before any mutation

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/app/(authed)/lancamentos/_lib/schema.ts` exists | FOUND |
| `src/app/(authed)/lancamentos/_lib/service.ts` exists | FOUND |
| `src/app/(authed)/lancamentos/_lib/loader.ts` exists | FOUND |
| `src/app/(authed)/lancamentos/_lib/actions.ts` exists | FOUND |
| `src/app/(authed)/lancamentos/_components/TransactionSheet.tsx` exists | FOUND |
| `src/app/(authed)/lancamentos/_components/DeleteDialog.tsx` exists | FOUND |
| `src/app/(authed)/lancamentos/_components/TransactionRow.tsx` exists | FOUND |
| `src/app/(authed)/lancamentos/_components/TransactionList.tsx` exists | FOUND |
| `src/app/(authed)/lancamentos/_components/AccountFilterToggle.tsx` exists | FOUND |
| `src/app/(authed)/lancamentos/_components/MonthSelector.tsx` exists | FOUND |
| Commit `f98333f` exists | FOUND |
| Commit `8228f95` exists | FOUND |
| `npx tsc --noEmit` clean | PASSED (empty output) |
| pairId guard in service.ts | FOUND (line 51 + 79) |
| userId in all Prisma where clauses | FOUND (lines 12, 44, 72) |
| 'use server' in actions.ts line 1 | FOUND |
| supabase.auth.getUser() in actions.ts | FOUND (line 25) |
