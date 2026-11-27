# Phase 10: Casa "Pago e A Pagar" - Pattern Map

**Mapped:** 2026-11-27
**Files analyzed:** ~15 (mostly MODIFY; 3 net-new)
**Analogs found:** all areas have an in-repo analog

> This phase EXTENDS the existing Casa. Almost everything is an **edit to an existing file**
> following a pattern already present in that same file or a sibling. Net-new items are flagged.

---

## File Classification

| File (new/modified) | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `prisma/schema.prisma` (modify) | model | migration | `20261126125639_add_origem_empresa_id` + `TransactionType` enum | exact |
| new migration SQL (new) | migration | DDL | `20261126125639_add_origem_empresa_id/migration.sql` | exact |
| `visao-geral/_lib/service.ts` (modify) | service | CRUD/aggregate | self (`getTotalSpent` etc.) | exact |
| `visao-geral/_lib/loader.ts` (modify) | service | request-response | self (`loadDashboardData`) | exact |
| `planejamento/_lib/service.ts` (modify) | service | CRUD/aggregate | self + visao-geral twin | exact |
| `planejamento/_lib/acompanhamento.ts` (modify) | utility | transform (pure) | self (`computeRestanteMes`) | exact |
| new pure fn "comprometido/estimativa" (new) | utility | transform (pure) | `acompanhamento.ts` + `contas-fixas/service.ts` pure fns | exact |
| new pure fn test (new) | test | — | `acompanhamento.test.ts` | exact |
| monthly-generation Server Action (new) | action | batch write (idempotent) | `getOrCopyCategoryBudgets` + `createProLaboreService` + `createTransactionAction` | role-match (net-new) |
| `lancamentos/_lib/schema.ts` (modify) | model | — | self (`transactionSchema`) | exact |
| `lancamentos/_lib/service.ts` (modify) | service | CRUD | self (`createTransactionService`) | exact |
| `lancamentos/_lib/actions.ts` (modify) | action | request-response | self (`createTransactionAction`) | exact |
| `lancamentos/_components/TransactionSheet.tsx` (modify) | component | form | self + `FixedAccountSheet` Switch | exact |
| `contas-fixas/_lib/schema.ts` (modify) | model | — | self (`fixedAccountSchema`) | exact |
| `contas-fixas/_components/FixedAccountSheet.tsx` (modify) | component | form | self (`autoDebit` Switch) | exact |
| "marcar pago" action/dialog (new) | action+component | request-response | `deleteTransactionAction` + `DeleteDialog` | role-match |
| status pill component (new) | component | presentational | `DashboardCards` card markup + globals tokens | role-match (net-new) |
| hero card component (new) | component | presentational | `DashboardCards` (`visao-geral/_components`) | role-match (net-new) |

---

## Shared Patterns (apply to all relevant files)

- **Dinheiro = `Int` centavos.** Every amount field is `amountCents: Int`. New fields follow: `estimatedCents Int?`.
- **Formatação só via `src/lib/format.ts`** — `formatBRL(cents)` → "R$ 1.234,56"; `formatDate(date)` → dd/mm/aaaa. Never format inline, never `toLocaleDateString`.
- **Datas do form:** string `"YYYY-MM-DD"` no schema → `parseISO(date)` no service (date-fns) para evitar timezone drift. See `lancamentos/service.ts:3,28,61`.
- **Casa = `empresaId: null`.** All Casa queries hard-code `empresaId: null`.
- **Janela de mês:** `start = new Date(year, m-1, 1)`, `end = new Date(year, m, 0, 23,59,59,999)`; `monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/`. Repeated verbatim in `visao-geral/service.ts:4,59-61` and `planejamento/service.ts:8,11-15` (`monthRange`).
- **userId sempre da sessão, nunca do form** — `getUserId()` via `createSupabaseServerClient()`. See `lancamentos/actions.ts:32-39` and `contas-fixas/actions.ts:40-47`.
- **Server Action shape:** `'use server'` → `schema.safeParse(data)` → `getUserId()` → service → `revalidatePath(...)` → `{ success, error? }`. Generic PT-BR error on catch.
- **Default `status = PAGO`** no banco: lançamentos antigos e todas as empresas entram normalmente nos leitores filtrados por PAGO sem backfill.

---

## Pattern Assignments

### `prisma/schema.prisma` (modify — additive)

**Analog:** the `origemEmpresaId` addition (schema lines 106-116) + `TransactionType` enum (lines 24-27).

Enum declaration style — top-level `enum`, UPPERCASE members:
```prisma
enum TransactionType {
  ENTRADA
  SAIDA
}
```
Add `enum TransactionStatus { PAGO EM_ABERTO }`. New `Transaction` fields mirror the `origemEmpresa` relation block (lines 100-116), which already shows: nullable FK, inverse relation, `@@index`, and a doc comment in PT-BR. For `fixedAccountId` use `onDelete: SetNull` (R-4) — note existing relations use `Restrict`/`Cascade`; SetNull is new here, so the FK column must be nullable (`String?`). Add inverse `transactions Transaction[]` to `FixedAccount` and `isVariableAmount Boolean @default(false)` (mirror `autoDebit Boolean @default(false)`, schema line 159).

Suggested fields on `Transaction`:
```prisma
status          TransactionStatus @default(PAGO)
dueDate         DateTime?         @db.Date   // mirror `date DateTime @db.Date` (line 93)
estimatedCents  Int?
fixedAccount    FixedAccount?     @relation(fields: [fixedAccountId], references: [id], onDelete: SetNull)
fixedAccountId  String?
```

### new migration SQL (new)

**Analog:** `prisma/migrations/20261126125639_add_origem_empresa_id/migration.sql` (the freshest additive FK migration) and `20261127082556_add_whatsapp_tables` (latest migration overall).

The origem migration is the exact template for adding a nullable FK column + index + constraint:
```sql
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "origemEmpresaId" TEXT;
-- CreateIndex
CREATE INDEX "Transaction_origemEmpresaId_idx" ON "Transaction"("origemEmpresaId");
-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_origemEmpresaId_fkey"
  FOREIGN KEY ("origemEmpresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```
For Phase 10: `ADD COLUMN "status" ... DEFAULT 'PAGO'`, `ADD COLUMN "dueDate" DATE`, `ADD COLUMN "estimatedCents" INTEGER`, `ADD COLUMN "fixedAccountId" TEXT`, a `CREATE TYPE "TransactionStatus" AS ENUM (...)`, the FK with **`ON DELETE SET NULL`** (not RESTRICT — R-4), plus a unique/index supporting idempotency on `(fixedAccountId, month)` — Claude's discretion on exact shape (see CONTEXT discretion).

**Migration conventions (CLAUDE.md + CONTEXT):** additive only; backup first; `npx prisma migrate dev` / `migrate deploy` always via **DIRECT_URL (port 5432)**, never the 6543 pooler; never shadow-db against the real database. All migrations here are hand-reviewable SQL in `prisma/migrations/`.

---

### `visao-geral/_lib/service.ts` (modify) — R-1 core

**Analog:** itself. Four aggregate readers share one `where` shape. Add `status: 'PAGO'` to the SAIDA readers.

`getTotalSpent` (lines 53-73) — the canonical "gasto real" reader:
```typescript
const result = await prisma.transaction.aggregate({
  _sum: { amountCents: true },
  where: { userId, empresaId, type: 'SAIDA', date: { gte: start, lte: end } },
})
```
→ add `status: 'PAGO'` to this where. Same edit to `getCategorySpending` (groupBy, lines 152-161) and `getWeeklySpending` (findMany, lines 196-204). **Do NOT** add the filter to `getTotalEntradas` (line 90) or `getRendaPorOrigem` (line 121) — entradas are not affected (empresas stay default PAGO; EM_ABERTO is Casa-SAIDA only this phase).

The **hero "comprometido"** needs a NEW reader here that sums EM_ABERTO (`amountCents` or `estimatedCents` when "a definir"). Model it on `getTotalSpent` but return the EM_ABERTO rows (findMany with `select: { amountCents, estimatedCents }`) and let the pure fn combine — see new pure fn below.

### `visao-geral/_lib/loader.ts` (modify)

**Analog:** itself — `loadDashboardData` (lines 31-53) fans out readers via `Promise.all` then calls the pure `computeRestanteMes`. Add the new EM_ABERTO reader to the `Promise.all` and compute `comprometido` / `possoGastar` via the new pure fn (same orchestration shape as `restanteCents` on line 44).

### `planejamento/_lib/service.ts` (modify) — R-1 twins

**Analog:** itself. `getCasaCategorySpending` (lines 22-38) and `getCasaWeeklyTransactions` (lines 122-143) are the Casa-fixed twins of the visao-geral readers. Both hard-code `empresaId: null, type: 'SAIDA'`. Add `status: 'PAGO'` to both `where` blocks. `getCategoryBudgets`/`getOrCopyCategoryBudgets` touch `categoryBudget`, not `transaction` — leave untouched.

### `planejamento/_lib/acompanhamento.ts` (modify)

**Analog:** itself. `computeRestanteMes(dinheiro, despesas)` (lines 16-21) is the one-liner the hero replaces/extends. Keep it pure (no Prisma). New "comprometido/possoGastar" logic goes here as sibling pure functions.

---

### new pure fn — "comprometido" + estimate lookup (NET-NEW — closest analog `acompanhamento.ts`)

**Analog:** `planejamento/_lib/acompanhamento.ts` (pure, no Prisma, exported interfaces, PT-BR doc comments) and the pure display calcs in `contas-fixas/_lib/service.ts:22-58` (`computeAnnualMonthly`, `computeGoalMonthly` — `Math.round`, divide-by-zero guards).

Convention to replicate:
```typescript
export interface EmAbertoLinha { amountCents: number; estimatedCents: number | null; isVariableAmount: boolean }

/** comprometido = Σ pagos + Σ em-aberto(valor real ou estimativa). R-2. */
export function computeComprometido(pagosCents: number, emAberto: EmAbertoLinha[]): number { ... }

/** posso gastar = entradas − comprometido (pode ser negativo). */
export function computePossoGastar(entradasCents: number, comprometidoCents: number): number {
  return entradasCents - comprometidoCents
}
```
The "estimativa = valor PAGO do mês anterior" **lookup** (R-5) is a Prisma query → it lives in a `service.ts`, not the pure file. Model the "find most recent prior month" on `getOrCopyCategoryBudgets` (`planejamento/service.ts:79-115`, `findFirst` with `month: { lt: month }, orderBy: { month: 'desc' }`) and `getOrCreateMonthlyBudget` (`visao-geral/service.ts:11-31`).

### new pure fn test (NET-NEW — closest analog `acompanhamento.test.ts`)

**Analog:** `planejamento/_lib/acompanhamento.test.ts` (lines 1-23 show the exact Vitest style). Co-locate as `*.test.ts` next to the pure module. Use cents literals with underscores (`320_000`) and `describe/it/expect`. `contas-fixas/_lib/service.test.ts` is the other precedent for testing pure fns that live in a service file.

---

### monthly-generation Server Action (NET-NEW — closest analogs below)

**Analogs (combine three):**
1. **Idempotency / "generate once per month"** → `getOrCopyCategoryBudgets` (`planejamento/service.ts:79-115`): `count({ where: { userId, month } })` → early-return if exists → else build rows → `prisma.$transaction([...upserts])`. For Phase 10 the idempotency key is `(fixedAccountId, month)` — check existing linked rows before creating.
2. **Atomic multi-row write + building Transaction rows** → `createProLaboreService` (`lancamentos/service.ts:155-209`): `prisma.$transaction(async (tx) => { await tx.transaction.create(...) })`, IDOR check first, `parseISO` for dates.
3. **Action wrapper** → `createTransactionAction` (`lancamentos/actions.ts:41-62`): `getUserId()` from session → service → `revalidatePath('/visao-geral')` + the Casa route(s) → `{ success, error? }`.

Generated row shape (from design §7/R-3): `type: 'SAIDA'`, `status: 'EM_ABERTO'`, `empresaId: null`, categoria "Contas fixas", `fixedAccountId`, `dueDate` = dia do vencimento no mês, **`date = dueDate`** (R-3 — cai na janela que os leitores já usam), `amountCents` = `fixedAccount.amountCents` (ou `estimatedCents` do mês-anterior-PAGO quando `isVariableAmount`). Must be an explicit action (button), **never written during render** (R-3).

### "marcar pago" action + dialog (NET-NEW — closest analog `DeleteDialog` + `updateTransactionAction`)

**Analogs:** `updateTransactionService` (`lancamentos/service.ts:38-64`, ownership `findFirst({ id, userId })` guard) + `updateTransactionAction` (`actions.ts:64-92`) for the write; `lancamentos/_components/DeleteDialog.tsx` for a shadcn confirm/mini-form dialog. "Marcar pago" = set `status: 'PAGO'` (and, for "a definir", capture the real `amountCents`). Optimistic feedback per UI-SPEC §Interações.

---

### `lancamentos/_lib/schema.ts` (modify)

**Analog:** `transactionSchema` (lines 5-13). Add `status: z.enum(['PAGO','EM_ABERTO']).default('PAGO')` and `dueDate: z.string().optional()` (empty = none). `updateTransactionSchema.extend` (line 17) inherits automatically.

### `lancamentos/_lib/service.ts` (modify)

**Analog:** `createTransactionService` (lines 21-32) — spreads `...rest`, `date: parseISO(date)`. `status`/`dueDate` flow through `...rest`; `dueDate` needs the same `parseISO` treatment as `date` (and skip when empty). `updateTransactionService` (lines 38-64) already conditionally parses `date` (line 61) — mirror that for `dueDate`.

### `lancamentos/_lib/actions.ts` (modify)

**Analog:** `createTransactionAction` (lines 41-62). No structural change — the extended schema carries the new fields through `parsed.data`. Keep the `revalidatePath('/visao-geral')` + lancamentos pair; add the Casa route if blocks move elsewhere.

### `lancamentos/_components/TransactionSheet.tsx` (modify)

**Analog:** itself (the whole form) + `FixedAccountSheet` for the Switch pattern.
- **Toggle pago/em aberto:** use shadcn `Switch` via `<Controller>` exactly like `autoDebit` in `FixedAccountSheet.tsx:152-164`.
- **Vencimento:** copy the existing "Data" field block (`TransactionSheet.tsx:498-511`) — `<Input type="date" {...register('dueDate')}>`, `min-h-[44px]`.
- Add new fields to both `defaultValues` (line 125) and the `reset()` calls (lines 145, 155) and to the `SheetFormContentProps` wiring (lines 347-372).
- All inputs/buttons keep `min-h-[44px]` (PWA 44px rule).

### `contas-fixas/_lib/schema.ts` (modify)

**Analog:** `fixedAccountSchema` (lines 7-16). Add `isVariableAmount: z.boolean()` (mirrors `autoDebit: z.boolean()`, line 15). `updateFixedAccountSchema.extend` inherits.

### `contas-fixas/_components/FixedAccountSheet.tsx` (modify)

**Analog:** the `autoDebit` Switch block (lines 148-165) — copy verbatim for `isVariableAmount` ("Valor variável (a definir)"). Add to `defaultValues` (line 57) and both `reset()` calls (lines 64-71). Service (`createFixedAccountService` line 71-75) already does `prisma.fixedAccount.create({ data })` — new field flows automatically.
`contas-fixas/_lib/service.ts` + `actions.ts` need no structural change; the generate action's button likely lives on this page (R-4, Claude's discretion).

---

### UI blocks (NET-NEW presentational — closest analog `DashboardCards`)

**Analog:** `visao-geral/_components/DashboardCards.tsx` (card markup) + globals.css tokens.

Card shell convention: `rounded-2xl shadow-sm border border-border p-6 bg-card`; value `text-2xl font-semibold font-mono`; label `text-sm text-text-secondary font-sans`; negative-value treatment uses `text-warning` (DashboardCards lines 62-70). All money via `formatBRL`.

**Tailwind tokens (confirmed in `globals.css:4-50`):**
- Casa blue: `--color-casa` `#1D4ED8` → class `bg-casa` / `text-casa`; light `--color-casa-light` `#DCEBFF`.
- **"verde" (pago)** — no generic `--color-green`; use the semantic **`--color-positive` `#0F766E`** → `text-positive` (already the "restante positivo" color, DashboardCards:63).
- **"âmbar/laranja" (em aberto)** — use **`--color-warning` `#8A3A06`** (`text-warning`) or the empresa amber `--color-empresa-ambar` `#A16207`. No dedicated amber "status" token exists → the planner/builder may add one in `@theme` following the existing naming (`--color-...`).
- Alert (comprometido ≥ 100%): `--color-destructive` `#DC2626` → `text-destructive`.
- Hero "gradiente casa": no gradient token exists yet — build from `--color-casa` → net-new, keep within existing tokens per UI-SPEC ("nada de biblioteca nova").

Status pill + hero card are **net-new components** — no pill exists in the repo today. Build them from the card shell + tokens above; place under `visao-geral/_components` (or the chosen Casa route).

---

## R-1 Audit — every existing `Transaction` reader that filters by type/date

The planner must decide, per reader, whether to add `status: 'PAGO'`. Classification per R-1 (only the hero sums EM_ABERTO; EM_ABERTO is Casa-SAIDA-only this phase; empresas untouched).

| Reader (file:fn) | Filters | Add `status=PAGO`? | Why |
|---|---|---|---|
| `visao-geral/service.ts:getTotalSpent` (53) | SAIDA + date + empresaId | **YES** | gasto real |
| `visao-geral/service.ts:getCategorySpending` (142) | SAIDA + date | **YES** | tetos/categoria |
| `visao-geral/service.ts:getWeeklySpending` (186) | SAIDA + date | **YES** | semanal |
| `visao-geral/service.ts:getTotalEntradas` (80) | ENTRADA + date | NO | entradas; empresas default PAGO |
| `visao-geral/service.ts:getRendaPorOrigem` (112) | ENTRADA + date | NO | entradas |
| `planejamento/service.ts:getCasaCategorySpending` (22) | SAIDA + date + Casa | **YES** | tetos (twin) |
| `planejamento/service.ts:getCasaWeeklyTransactions` (122) | SAIDA + date + Casa | **YES** | semanal (twin) |
| `consolidado/loader.ts:loadProjecaoData` (161) — calls `getTotalSpent(_, _, null)` (180) | via getTotalSpent | **INHERITED** | Casa variável projection reuses `getTotalSpent`; adding PAGO there changes projection too. **Flag:** decide if projection should include EM_ABERTO (likely NO — keep PAGO; aligns with "gasto real"). Also sums `getFixedAccounts` separately (line 171) — watch for double-count once fixas also generate EM_ABERTO rows. |
| `consolidado/loader.ts` empresa branch — `getTotalSpent(_, _, empresa.id)` (201) | via getTotalSpent | N/A | empresa context, default PAGO, no EM_ABERTO generated |
| `consolidado/loader.ts:69` pró-labore SAIDA aggregate | SAIDA + origemEmpresaId + empresa | NO | empresa pró-labore; default PAGO |
| `canais/service.ts:getTotaisPorCategoria` (used for P&L) (29) | type + date + empresaId | NO (empresa) | empresas intact per R-1; **but** it also serves Casa if ever called with `empresaId: null` — confirm callers are empresa-only |
| `lancamentos/loader.ts` (25) listagem | optional empresaId + date | NO | listing shows all statuses (the list is where the pill renders) |
| `empresas/loader.ts`, `empresas/service.ts` | counts/ownership | NO | not spend readers |

**Double-count warning for the planner:** `consolidado/loader.ts:171-187` already adds `contasFixasCents` (from `getFixedAccounts`) on top of `getTotalSpent(Casa)`. Once generated fixas become real EM_ABERTO `Transaction` rows, if that projection ever starts counting EM_ABERTO it would double-count with `getFixedAccounts`. Keep projection on PAGO-only and treat as out-of-scope for this phase (CONTEXT: "projeção futura" is deferred), but call it out in the plan.

---

## Metadata

**Analog search scope:** `src/app/(authed)/{visao-geral,planejamento,lancamentos,contas-fixas,consolidado,canais,empresas}`, `prisma/`, `src/lib/`.
**Key conventions:** money-as-cents `Int`; `status` default `PAGO`; dates via date-fns `parseISO`/`format`; pure fns + co-located Vitest; react-hook-form + zod + shadcn Sheet/Switch; Server Action = parse→getUserId→service→revalidatePath; migrations additive via DIRECT_URL.

## PATTERN MAPPING COMPLETE
