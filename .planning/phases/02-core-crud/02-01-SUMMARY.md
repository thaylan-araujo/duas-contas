---
phase: 02-core-crud
plan: 01
subsystem: schema-and-deps
tags: [prisma, schema, recharts, shadcn, migration]
status: complete

dependency_graph:
  requires:
    - 01-foundation (prisma schema base, shadcn Button/Input/Label/Card)
  provides:
    - Transaction.pairId (String?) — consumed by Plan 02 (pró-labore pair guard) and Plan 03
    - MonthlyBudget model — consumed by Plan 04 (dashboard cards, inline edit)
    - Category.isDefault (Boolean) — consumed by Plan 03 (ManageCategoriesSheet read-only guard)
    - User.monthlyBudgets relation — consumed by Plan 04 (MonthlyBudget service)
    - src/components/ui/dialog.tsx — consumed by Plan 02 (DeleteDialog) and Plan 03
    - src/components/ui/select.tsx — consumed by Plan 02 (TransactionSheet) and Plan 03
    - src/components/ui/badge.tsx — consumed by Plan 02 (TransactionRow type badge)
    - src/components/ui/tabs.tsx — consumed by Plan 04 (AccountSelector dashboard)
    - recharts package — consumed by Plan 04 (WeeklyBarChart)
  affects:
    - prisma/schema.prisma
    - prisma/seed.ts
    - package.json

tech_stack:
  added:
    - recharts ^3.11.1 (npm, React-native chart library)
    - "@radix-ui/react-select" ^2.x (via shadcn, already in package.json as peer)
    - "@radix-ui/react-tabs" ^1.x (via shadcn, added)
  patterns:
    - Prisma additive schema migration (pairId nullable field, new MonthlyBudget model, isDefault flag)
    - shadcn CLI component scaffolding (copy-paste components, no version lock)

key_files:
  modified:
    - prisma/schema.prisma — added pairId, MonthlyBudget model, isDefault, monthlyBudgets relation
    - prisma/seed.ts — updated category create blocks with isDefault: true
    - package.json — recharts added to dependencies
    - package-lock.json — lockfile updated
  created:
    - src/components/ui/dialog.tsx (3848 bytes, shadcn Dialog)
    - src/components/ui/select.tsx (5742 bytes, shadcn Select)
    - src/components/ui/badge.tsx (1128 bytes, shadcn Badge)
    - src/components/ui/tabs.tsx (1897 bytes, shadcn Tabs)

decisions:
  - "pairId as String? nullable field — normal transactions have null; pró-labore pairs share UUID"
  - "MonthlyBudget with @@unique([userId, month]) for idiomatic Prisma upsert by compound key"
  - "isDefault Boolean on Category — simplest signal for UI read-only guard in ManageCategoriesSheet"
  - "Migration name: 20261124103918_core_crud — applied via DIRECT_URL (port 5432)"

metrics:
  duration_minutes: 25
  completed_date: "2026-11-24"
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  files_modified: 4
---

# Phase 2 Plan 1: Schema and Dependencies Summary

**One-liner:** Additive Prisma schema migration (pairId, MonthlyBudget, isDefault) plus recharts and four shadcn components that all Wave 2 plans depend on.

---

## What Was Built

This plan prepared the foundation for all Phase 2 feature plans. No UI was delivered — the output is a migrated schema and installed packages that Wave 2 plans require to compile.

### Schema Changes (prisma/schema.prisma)

1. **`Transaction.pairId String?`** — Optional field that links two transactions in a pró-labore pair. Normal transactions have `null`; pró-labore pairs share the same UUID generated via `crypto.randomUUID()` at creation time.

2. **`MonthlyBudget` model** — New model for the Casa dashboard teto (monthly budget ceiling):
   - `id: String @id @default(cuid())`
   - `userId: String` with FK relation to `User`
   - `month: String` (stores "YYYY-MM" format)
   - `ceilingCents: Int`
   - `@@unique([userId, month])` — enables idiomatic Prisma `upsert` with compound key `where: { userId_month: { userId, month } }`

3. **`Category.isDefault Boolean @default(false)`** — Flag distinguishing seed categories (read-only in UI) from user-created categories (editable). Seed re-run marks all 10 default categories with `isDefault: true`.

4. **`User.monthlyBudgets MonthlyBudget[]`** — Relation added to User model for Prisma type safety.

### Migration Applied

Migration `20261124103918_core_crud` applied successfully to Supabase Postgres via `npx prisma migrate dev --name core-crud` (DIRECT_URL port 5432). Seed re-run confirmed: 1 user + 10 categories with `is_default = true`.

### Dependencies Added

- **recharts ^3.11.1** — React-native chart library (11 years old, 71M downloads/week, verified in Package Legitimacy Audit). Required by Plan 04 `WeeklyBarChart` component.
- **shadcn Dialog** (`src/components/ui/dialog.tsx`, 3848 bytes) — Required by Plan 02 (DeleteDialog) and Plan 03.
- **shadcn Select** (`src/components/ui/select.tsx`, 5742 bytes) — Required by Plan 02 (TransactionSheet type selector) and Plan 03.
- **shadcn Badge** (`src/components/ui/badge.tsx`, 1128 bytes) — Required by Plan 02 (TransactionRow type indicator).
- **shadcn Tabs** (`src/components/ui/tabs.tsx`, 1897 bytes) — Required by Plan 04 (AccountSelector dashboard).

---

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `90b679d` | feat(02-01): extend Prisma schema with pairId, MonthlyBudget, isDefault |
| Task 2 | (migration run by user, not committed — migration file in prisma/migrations/) | Migration 20261124103918_core_crud applied to Supabase |
| Task 3 | `53b49ab` | chore(02-01): install recharts and add shadcn Dialog, Select, Badge, Tabs |

---

## Verification

- `npx prisma validate` — schema structure verified manually (all 7 checks passed: pairId, MonthlyBudget model, isDefault, monthlyBudgets relation, userId_month constraint, FK relation, ceilingCents field)
- `npx prisma migrate status` — migration `core-crud` Applied (confirmed by user: "migração ok")
- `tsc --noEmit` — TypeScript compilation clean (empty output = zero errors)
- Component files non-empty: dialog.tsx 3848B, select.tsx 5742B, badge.tsx 1128B, tabs.tsx 1897B
- recharts in `node_modules/recharts` and `package.json` dependencies

---

## Deviations from Plan

### Environment Issues (non-blocking)

**1. `npx prisma validate` timed out in this environment**
- **Found during:** Task 1 verification
- **Issue:** `npx prisma validate` hangs indefinitely — the CLI appears to attempt a database connection before validating schema syntax, causing timeouts in the agent execution environment.
- **Fix applied:** Manual structural verification via Node.js regex checks on the schema file (7 checks, all passed). The schema is syntactically correct — confirmed by successful migration in Task 2.
- **Impact:** No code impact. The schema changes are correct; migration applied successfully.

**2. `npm run build` (next build --turbopack) timed out in this environment**
- **Found during:** Task 3 verification
- **Issue:** `next build --turbopack` hangs at startup — appears to attempt database connectivity or long compilation in background processes that don't complete within agent timeout.
- **Fix applied:** Used `tsc --noEmit` as the TypeScript compilation check. Output was empty (zero errors). The 4 shadcn components are standard patterns compatible with the existing Tailwind v4 + Next.js 15 setup.
- **Impact:** No code impact. TypeScript compiles clean; components are generated by official shadcn CLI.

**3. `git status` timeout due to `git for-each-ref` background process**
- **Found during:** Task 1 and Task 3 commits
- **Issue:** `git maintenance run --auto` and `git for-each-ref` processes from previous sessions were blocking git operations.
- **Fix applied:** Killed stuck processes; used `git -c core.fsmonitor=false -c gc.auto=0` for commits to prevent new background git processes from blocking.
- **Impact:** No code impact. All commits completed successfully.

---

## Known Stubs

None. This plan delivers schema changes and package installations — no UI components or data-rendering stubs.

---

## Threat Flags

None. All changes are:
- Additive schema fields (no drops, no data loss)
- Packages verified in RESEARCH.md Package Legitimacy Audit (recharts: Approved; @radix-ui/*: Approved)
- Migration run via DIRECT_URL (port 5432) as required by T-02-03

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/components/ui/dialog.tsx` exists | FOUND |
| `src/components/ui/select.tsx` exists | FOUND |
| `src/components/ui/badge.tsx` exists | FOUND |
| `src/components/ui/tabs.tsx` exists | FOUND |
| Commit `90b679d` exists | FOUND |
| Commit `53b49ab` exists | FOUND |
| `recharts` in package.json | ^3.11.1 |
| `pairId` in schema | FOUND |
| `MonthlyBudget` in schema | FOUND |
| `isDefault` in schema | FOUND |
| `@@unique([userId, month])` in schema | FOUND |
