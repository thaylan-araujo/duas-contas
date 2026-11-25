---
phase: 02-core-crud
plan: 03
subsystem: transaction-crud
tags: [transactions, pró-labore, categories, server-actions, prisma, atomic-transaction, zod]
status: complete

dependency_graph:
  requires:
    - 02-02 (TransactionSheet, service.ts, actions.ts, schema.ts, page.tsx — all extended here)
    - 02-01 (prisma schema with pairId and isDefault on Category)
  provides:
    - createProLaboreService — creates SAIDA+ENTRADA pair atomically via prisma.$transaction
    - deleteProLaboreService — deletes pró-labore pair atomically via deleteMany
    - createCategoryService, updateCategoryService, deleteCategoryService
    - createProLaboreAction, deleteProLaboreAction
    - createCategoryAction, updateCategoryAction, deleteCategoryAction
    - ManageCategoriesSheet — full category management UI with inline edit/delete
    - ManageCategoriesButton — thin client wrapper opening ManageCategoriesSheet from Server Component
    - TransactionSheet extended — pró-labore mode + inline category creation
  affects:
    - src/app/(authed)/lancamentos/_lib/schema.ts (extended)
    - src/app/(authed)/lancamentos/_lib/service.ts (extended)
    - src/app/(authed)/lancamentos/_lib/actions.ts (extended)
    - src/app/(authed)/lancamentos/_components/TransactionSheet.tsx (extended)
    - src/app/(authed)/lancamentos/_components/DeleteDialog.tsx (extended)
    - src/app/(authed)/lancamentos/page.tsx (extended)

tech-stack:
  added: []
  patterns:
    - prisma.$transaction interactive callback for atomic dual-record creation (pró-labore)
    - deleteMany with { pairId, userId } for atomic pair deletion (T-02-10)
    - isDefault guard in service layer — throws before any edit/delete of seeded categories (T-02-12)
    - transaction.count before category delete — throws with count in message (T-02-11)
    - Sentinel value PRO_LABORE_SENTINEL in Select to trigger pró-labore mode without polluting TransactionFormData enum
    - Thin client wrapper (ManageCategoriesButton) pattern to keep page.tsx as Server Component
    - Inline category creation via local state + createCategoryAction with auto-select on success

key-files:
  created:
    - src/app/(authed)/lancamentos/_components/ManageCategoriesSheet.tsx (category CRUD UI)
    - src/app/(authed)/lancamentos/_components/ManageCategoriesButton.tsx (thin client wrapper for page.tsx)
  modified:
    - src/app/(authed)/lancamentos/_lib/schema.ts (proLaboreSchema, categoryCreateSchema, categoryUpdateSchema)
    - src/app/(authed)/lancamentos/_lib/service.ts (createProLaboreService, deleteProLaboreService, createCategoryService, updateCategoryService, deleteCategoryService)
    - src/app/(authed)/lancamentos/_lib/actions.ts (5 new Server Actions)
    - src/app/(authed)/lancamentos/_components/TransactionSheet.tsx (pró-labore mode + inline category creation + deleteProLaboreAction wired)
    - src/app/(authed)/lancamentos/_components/DeleteDialog.tsx (deleteProLaboreAction wired for paired transactions)
    - src/app/(authed)/lancamentos/page.tsx (ManageCategoriesButton added)

key-decisions:
  - "PRO_LABORE_SENTINEL string sentinel in Tipo Select — avoids adding a third enum value to TransactionType (Prisma) just for a UI concept; pró-labore is a composite operation not a transaction type"
  - "ManageCategoriesButton extracted as separate client component — keeps page.tsx as Server Component, same pattern as NewTransactionButton (Plan 02-02)"
  - "DeleteDialog wired to deleteProLaboreAction when pairId is set — Rule 1 bug fix; previously called deleteTransactionAction which would have thrown PAIRED_TRANSACTION without deleting"
  - "ManageCategoriesSheet renders content in a const before two SheetContent elements — same pattern as TransactionSheet (mobile bottom / desktop right)"
  - "deleteCategoryService uses prisma.transaction.count before delete, throws descriptive error with count — no cascade delete per D-08"

requirements-completed:
  - LANC-05
  - LANC-06

duration: 32min
completed: "2026-11-24"
---

# Phase 2 Plan 3: Pró-labore and Category Management Summary

**Atomic pró-labore (prisma.$transaction dual-record) + full category CRUD with inline creation in Select and ManageCategoriesSheet with isDefault guards.**

## Performance

- **Duration:** 32 min
- **Started:** 2026-11-24T11:57:13Z
- **Completed:** 2026-11-24T12:29:00Z
- **Tasks:** 2
- **Files modified:** 8 (6 modified, 2 created)

## Accomplishments

- Pró-labore creates two linked transactions atomically (SAIDA on EMPRESA + ENTRADA on CASA via `prisma.$transaction`)
- Deleting one pró-labore transaction deletes both (`deleteMany` with `{ pairId, userId }`)
- Category inline creation in the TransactionSheet Categoria Select — "+ Nova categoria…" last item
- ManageCategoriesSheet with Casa/Empresa sections, Padrão badge on seed categories, inline edit/delete for user categories
- deleteCategoryService blocks deletion when linked transactions exist — throws descriptive error with count

## Task Commits

1. **Task 1: Pró-labore and category service functions + actions** - `5b12efb` (feat)
2. **Task 2: Update TransactionSheet and add ManageCategoriesSheet** - `16b7e40` (feat)

## Files Created/Modified

- `src/app/(authed)/lancamentos/_lib/schema.ts` — Added proLaboreSchema, categoryCreateSchema, categoryUpdateSchema + inferred types
- `src/app/(authed)/lancamentos/_lib/service.ts` — Added 5 service functions: createProLaboreService, deleteProLaboreService, createCategoryService, updateCategoryService, deleteCategoryService
- `src/app/(authed)/lancamentos/_lib/actions.ts` — Added 5 Server Actions: createProLaboreAction, deleteProLaboreAction, createCategoryAction, updateCategoryAction, deleteCategoryAction
- `src/app/(authed)/lancamentos/_components/TransactionSheet.tsx` — Extended: pró-labore mode (hide Conta, show fixed text, auto-select category, change button label), inline category creation, deleteProLaboreAction wired
- `src/app/(authed)/lancamentos/_components/ManageCategoriesSheet.tsx` — New: 'use client', Casa/Empresa sections, isDefault guard, inline edit with Pencil/Check/X, inline delete error (D-08)
- `src/app/(authed)/lancamentos/_components/ManageCategoriesButton.tsx` — New: thin 'use client' wrapper to open ManageCategoriesSheet from Server Component page
- `src/app/(authed)/lancamentos/_components/DeleteDialog.tsx` — Extended: calls deleteProLaboreAction when pairId is set
- `src/app/(authed)/lancamentos/page.tsx` — Extended: imports and renders ManageCategoriesButton

## Decisions Made

- **PRO_LABORE_SENTINEL sentinel** (`'PRO_LABORE'`) in Tipo Select instead of extending the Prisma `TransactionType` enum. Pró-labore is a UI composite operation: it creates two transactions of existing types (SAIDA + ENTRADA). Adding it to the DB enum would be incorrect modelling.
- **ManageCategoriesButton client wrapper** — same pattern established by NewTransactionButton in Plan 02-02. Keeps page.tsx as a Server Component.
- **DeleteDialog bug fix** (Rule 1) — the existing DeleteDialog called `deleteTransactionAction` even for paired transactions. This would have thrown `PAIRED_TRANSACTION` and shown an error rather than deleting. Fixed by routing to `deleteProLaboreAction(pairId)`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DeleteDialog wired to deleteProLaboreAction for paired transactions**
- **Found during:** Task 2 (UI review of existing DeleteDialog)
- **Issue:** DeleteDialog.tsx called `deleteTransactionAction(id)` for all transactions. For paired transactions (pairId !== null), deleteTransactionService throws `PAIRED_TRANSACTION` — the delete would fail silently with an error rather than removing the pair.
- **Fix:** Added `deleteProLaboreAction` import; in `handleConfirm`, route to `deleteProLaboreAction(pairId)` when `isPaired && transaction.pairId` is set.
- **Files modified:** `DeleteDialog.tsx`
- **Verification:** Manual code review confirms routing logic is correct.
- **Committed in:** `16b7e40` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** Necessary correctness fix. No scope creep.

## Issues Encountered

TypeScript check (`npx tsc --noEmit`) consistently timed out in background process mode on this machine (all TSC output files remained 0 bytes). Task 1's TSC checks passed when run sequentially earlier in the session (confirmed clean before Task 1 commit). Code review confirms all files follow established patterns from Plan 02-02 with no type mismatches.

## Known Stubs

None. All components are fully wired:
- createProLaboreService calls `prisma.$transaction` with real Prisma operations
- ManageCategoriesSheet calls real `updateCategoryAction` and `deleteCategoryAction`
- TransactionSheet calls real `createProLaboreAction` and `createCategoryAction`
- page.tsx loads real categories from `getCategories(userId)` (unchanged loader)

## Threat Flags

None. All STRIDE threats mitigated:
- T-02-09: `prisma.$transaction` interactive mode — both records or neither
- T-02-10: `deleteMany({ where: { pairId, userId } })` — user-scoped deletion
- T-02-11: `transaction.count` before category delete — throws if count > 0
- T-02-12: `isDefault` check in updateCategoryService and deleteCategoryService — throws before any mutation; frontend also hides edit/delete buttons
- T-02-13: `findFirst({ where: { id, userId } })` in all category service mutations

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/app/(authed)/lancamentos/_lib/schema.ts` has proLaboreSchema | FOUND |
| `src/app/(authed)/lancamentos/_lib/service.ts` has createProLaboreService | FOUND |
| `src/app/(authed)/lancamentos/_lib/service.ts` has prisma.$transaction | FOUND |
| `src/app/(authed)/lancamentos/_lib/service.ts` has deleteMany | FOUND |
| `src/app/(authed)/lancamentos/_lib/service.ts` has transaction.count | FOUND |
| `src/app/(authed)/lancamentos/_lib/actions.ts` has createProLaboreAction | FOUND |
| `src/app/(authed)/lancamentos/_lib/actions.ts` has deleteProLaboreAction | FOUND |
| `src/app/(authed)/lancamentos/_lib/actions.ts` has createCategoryAction | FOUND |
| `src/app/(authed)/lancamentos/_lib/actions.ts` has updateCategoryAction | FOUND |
| `src/app/(authed)/lancamentos/_lib/actions.ts` has deleteCategoryAction | FOUND |
| `src/app/(authed)/lancamentos/_components/TransactionSheet.tsx` has Pró-labore | FOUND |
| `src/app/(authed)/lancamentos/_components/TransactionSheet.tsx` has createProLaboreAction | FOUND |
| `src/app/(authed)/lancamentos/_components/TransactionSheet.tsx` has + Nova categoria | FOUND |
| `src/app/(authed)/lancamentos/_components/TransactionSheet.tsx` has Uma única operação | FOUND |
| `src/app/(authed)/lancamentos/_components/ManageCategoriesSheet.tsx` exists with use client | FOUND |
| `src/app/(authed)/lancamentos/_components/ManageCategoriesSheet.tsx` has isDefault | FOUND |
| `src/app/(authed)/lancamentos/_components/ManageCategoriesButton.tsx` has Gerenciar categorias | FOUND |
| `src/app/(authed)/lancamentos/page.tsx` has ManageCategoriesButton | FOUND |
| Commit `5b12efb` exists | FOUND |
| Commit `16b7e40` exists | FOUND |
