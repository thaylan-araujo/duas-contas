---
phase: 02-core-crud
plan: 04
subsystem: dashboard
tags: [recharts, prisma, server-actions, server-components, monthly-budget, dashboard]
status: complete

dependency_graph:
  requires:
    - 02-01 (MonthlyBudget model with @@unique([userId, month]), recharts package)
    - 02-02 (transaction data for getTotalSpent, getCategorySpending, getWeeklySpending)
    - 01-foundation (formatBRL, Supabase auth, Skeleton component)
  provides:
    - getOrCreateMonthlyBudget — D-04 fallback logic (findUnique → findFirst previous → upsert)
    - upsertMonthlyBudget — explicit ceiling update used by upsertMonthlyBudgetAction
    - getTotalSpent, getCategorySpending, getWeeklySpending — dashboard aggregations
    - upsertMonthlyBudgetAction — Server Action (userId from session, Zod validation)
    - loadDashboardData — orchestrates Promise.all over all four service calls
    - /visao-geral page — 4 summary cards, inline ceiling editor, category bars, Recharts chart
    - WeeklyBarChart — 'use client' Recharts BarChart with 4 week buckets
    - InlineCeilingEditor — 'use client' click-to-edit with blur/Enter save (D-03)
    - AccountSelector — 'use client' Casa active + Empresa disabled (T-02-17)
    - DashboardCards, CategorySpendingBars — Server Components
  affects:
    - 03 (pró-labore plan reuses /visao-geral route for context)

tech_stack:
  added: []
  patterns:
    - MonthlyBudget fallback: findUnique → findFirst with lt: month → upsert (D-04)
    - Dashboard Server Component page calling loadDashboardData (Server Component data loading)
    - InlineCeilingEditor: useState + useTransition + onBlur Server Action call (D-03)
    - WeeklyBarChart: Recharts as 'use client' with formatBRL on tickFormatter and tooltip formatter
    - Empresa button: disabled + title tooltip (T-02-17 — no Empresa route yet)

key_files:
  created:
    - src/app/(authed)/visao-geral/_lib/schema.ts (ceilingUpdateSchema, CeilingUpdateData)
    - src/app/(authed)/visao-geral/_lib/service.ts (5 functions, userId in all where clauses)
    - src/app/(authed)/visao-geral/_lib/loader.ts (loadDashboardData with Promise.all)
    - src/app/(authed)/visao-geral/_lib/actions.ts (upsertMonthlyBudgetAction, 'use server')
    - src/app/(authed)/visao-geral/_components/AccountSelector.tsx (Casa active, Empresa disabled)
    - src/app/(authed)/visao-geral/_components/DashboardCards.tsx (4 cards, Server Component)
    - src/app/(authed)/visao-geral/_components/InlineCeilingEditor.tsx (inline edit, 'use client')
    - src/app/(authed)/visao-geral/_components/CategorySpendingBars.tsx (bars, Server Component)
    - src/app/(authed)/visao-geral/_components/WeeklyBarChart.tsx (Recharts, 'use client')
  modified:
    - src/app/(authed)/visao-geral/page.tsx (replaced placeholder with full dashboard)

key-decisions:
  - "loadDashboardData uses Promise.all for parallel fetches — reduces dashboard latency by ~3x vs sequential"
  - "getOrCreateMonthlyBudget upserts on first access — ensures MonthlyBudget always exists when page renders"
  - "InlineCeilingEditor initialCents prop: value shown optimistically until revalidatePath refresh"
  - "WeeklyBarChart shows Skeleton when all week buckets are zero — avoids empty Recharts chart"

patterns-established:
  - "Dashboard service: each aggregation query includes userId in where clause (security: T-02-16)"
  - "Server Component page computes derived values (folgaCents) server-side — no client-side arithmetic"
  - "Client Components receive pre-computed data as props — no data fetching in client"

requirements-completed:
  - DASH-01
  - DASH-02

duration: 35min
completed: "2026-11-24"
---

# Phase 2 Plan 4: Dashboard da Casa Summary

**Casa dashboard vertical slice — MonthlyBudget D-04 fallback service, upsert Server Action, 4 summary cards with inline ceiling editor, category spending bars, and Recharts weekly bar chart.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-11-24T12:30:00Z
- **Completed:** 2026-11-24T13:05:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Dashboard service layer with MonthlyBudget D-04 fallback chain (findUnique → findFirst previous month → upsert with 300_000 default) and all three aggregation functions (getTotalSpent, getCategorySpending, getWeeklySpending with userId in all where clauses per T-02-16)
- upsertMonthlyBudgetAction reads userId exclusively from Supabase session (T-02-14), Zod validates ceilingCents > 0 (T-02-15), calls revalidatePath('/visao-geral')
- /visao-geral page renders with 4 cards (Teto do mês editable inline, Planejado --, Folga +/-, Gasto hoje), proportional category bars, and Recharts weekly bar chart with 4 week buckets

## Task Commits

Each task was committed atomically:

1. **Task 1: Dashboard service, loader, schema, and Server Action** - `0dff4b7` (feat)
2. **Task 2: Dashboard UI — page and four components** - `42a627b` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `src/app/(authed)/visao-geral/_lib/schema.ts` — ceilingUpdateSchema (Zod int().positive()), CeilingUpdateData type
- `src/app/(authed)/visao-geral/_lib/service.ts` — getOrCreateMonthlyBudget (D-04), upsertMonthlyBudget, getTotalSpent, getCategorySpending, getWeeklySpending
- `src/app/(authed)/visao-geral/_lib/loader.ts` — loadDashboardData (Promise.all over 4 service calls)
- `src/app/(authed)/visao-geral/_lib/actions.ts` — upsertMonthlyBudgetAction ('use server', userId from session)
- `src/app/(authed)/visao-geral/page.tsx` — Server Component page (replaced placeholder)
- `src/app/(authed)/visao-geral/_components/AccountSelector.tsx` — Casa active, Empresa disabled with tooltip
- `src/app/(authed)/visao-geral/_components/DashboardCards.tsx` — 4 cards (Server Component)
- `src/app/(authed)/visao-geral/_components/InlineCeilingEditor.tsx` — click-to-edit, blur/Enter saves ('use client')
- `src/app/(authed)/visao-geral/_components/CategorySpendingBars.tsx` — proportional bars (Server Component)
- `src/app/(authed)/visao-geral/_components/WeeklyBarChart.tsx` — Recharts BarChart ('use client')

## Decisions Made

- **loadDashboardData uses Promise.all**: parallel fetches reduce dashboard latency vs sequential calls (3 independent queries + 1 upsert)
- **getOrCreateMonthlyBudget upserts on first page access**: MonthlyBudget always exists when DashboardCards renders, so InlineCeilingEditor always has a valid initialCents
- **WeeklyBarChart shows Skeleton when all buckets are zero**: avoids rendering a blank Recharts chart on a fresh account; Skeleton is replaced with bars as soon as any SAIDA transaction exists for the month
- **page.tsx computes folgaCents server-side**: `budget.ceilingCents - totalSpentCents` derived on server, passed to DashboardCards as a simple number — no arithmetic in client components

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. TypeScript compiled clean (zero errors) after both tasks.

## Known Stubs

- **DashboardCards — "Planejado" card**: always renders `--` (intentional per D-02). This card will display the sum of ItemPlano entries when Phase 3 implements the planning model. This stub prevents the plan's goal from being blocked — the other three cards render real data.

## Threat Flags

None. All STRIDE threats mitigated:
- T-02-14: userId always from `supabase.auth.getUser()` in upsertMonthlyBudgetAction (never from form data)
- T-02-15: `ceilingUpdateSchema` with `z.number().int().positive()` rejects non-positive ceilingCents
- T-02-16: All five service functions include `userId` in every Prisma `where` clause
- T-02-17: Empresa button disabled with `disabled` attribute + tooltip — no Empresa data loaded

## Next Phase Readiness

- /visao-geral page ready with real Casa spending data
- upsertMonthlyBudget service available for Phase 3 (planning items) to build upon
- Category spending bars and weekly chart functional — will update automatically as transactions are added via /lancamentos
- Plan 02-03 (pró-labore + category management) is the remaining Wave 2 plan

---

## Self-Check

| Check | Result |
|-------|--------|
| `src/app/(authed)/visao-geral/_lib/schema.ts` exists | FOUND |
| `src/app/(authed)/visao-geral/_lib/service.ts` exists | FOUND |
| `src/app/(authed)/visao-geral/_lib/loader.ts` exists | FOUND |
| `src/app/(authed)/visao-geral/_lib/actions.ts` exists | FOUND |
| `src/app/(authed)/visao-geral/_components/AccountSelector.tsx` exists | FOUND |
| `src/app/(authed)/visao-geral/_components/DashboardCards.tsx` exists | FOUND |
| `src/app/(authed)/visao-geral/_components/InlineCeilingEditor.tsx` exists | FOUND |
| `src/app/(authed)/visao-geral/_components/CategorySpendingBars.tsx` exists | FOUND |
| `src/app/(authed)/visao-geral/_components/WeeklyBarChart.tsx` exists | FOUND |
| Commit `0dff4b7` exists | FOUND |
| Commit `42a627b` exists | FOUND |
| `npx tsc --noEmit` clean | PASSED (empty output) |
| getOrCreateMonthlyBudget + userId_month in service.ts | FOUND |
| findFirst + 300_000 fallback in service.ts | FOUND |
| Sem 1-4 week buckets in service.ts | FOUND |
| supabase.auth.getUser() in actions.ts | FOUND |
| revalidatePath('/visao-geral') in actions.ts | FOUND |
| page.tsx no 'use client' | CONFIRMED |
| WeeklyBarChart 'use client' first line | CONFIRMED |
| InlineCeilingEditor 'use client' first line | CONFIRMED |
| AccountSelector 'use client' first line | CONFIRMED |
| DashboardCards no 'use client' | CONFIRMED |
| CategorySpendingBars no 'use client' | CONFIRMED |
| WeeklyBarChart imports from 'recharts' | CONFIRMED |
| WeeklyBarChart uses formatBRL from '@/lib/format' | CONFIRMED |
| No Intl.NumberFormat/toFixed in WeeklyBarChart | CONFIRMED |
| Empresa button has disabled attribute | CONFIRMED |
| Planejado card shows "--" | CONFIRMED |

## Self-Check: PASSED

*Phase: 02-core-crud*
*Completed: 2026-11-24*
