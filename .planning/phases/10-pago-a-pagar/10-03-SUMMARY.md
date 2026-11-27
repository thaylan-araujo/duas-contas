---
phase: 10-pago-a-pagar
plan: 03
subsystem: casa-pago-a-pagar
tags: [casa, lancamentos, pago-a-pagar, C1, status, dueDate]
requires:
  - "Transaction.status/dueDate (fatia 01 — migração 20261127165023, aplicada pelo orquestrador)"
  - "createTransactionService/updateTransactionService (lancamentos/_lib/service.ts)"
  - "shadcn Switch (@/components/ui/switch) + Controller (react-hook-form)"
provides:
  - "status (enum PAGO|EM_ABERTO, default PAGO) + dueDate (string opcional) no transactionSchema"
  - "TransactionFormInput (z.input) vs TransactionFormData (z.infer) para casar input/output do .default()"
  - "createTransactionService/updateTransactionService estendidos: parseISO(dueDate) só quando presente; status via ...rest"
  - "toggle 'Deixar em aberto (a pagar)' + campo Vencimento no TransactionSheet (criar e editar)"
affects:
  - "src/app/(authed)/lancamentos"
tech-stack:
  added: []
  patterns:
    - "useForm<TInput, unknown, TOutput> para resolver o friction do zod .default() (RHF 7.91 + @hookform/resolvers 6)"
    - "campo condicional por string vazia (dueDate '' = sem vencimento; parseISO ignora)"
    - "Switch via Controller + setValue (padrão do autoDebit/isVariableAmount do FixedAccountSheet)"
key-files:
  created: []
  modified:
    - "src/app/(authed)/lancamentos/_lib/schema.ts"
    - "src/app/(authed)/lancamentos/_lib/service.ts"
    - "src/app/(authed)/lancamentos/_components/TransactionSheet.tsx"
    - "src/app/(authed)/lancamentos/_lib/service.test.ts"
decisions:
  - "Vencimento visível só quando o toggle está em 'em aberto' (mais simples que sempre-visível-desabilitado; mantém ≥44px)"
  - "useForm tipado com TransactionFormInput (status opcional) como TFieldValues e TransactionFormData (status obrigatório) como TTransformedValues — necessário porque z.enum().default() torna o input opcional e o output obrigatório, quebrando useForm<TransactionFormData> single-generic"
  - "actions.ts NÃO alterado: createTransaction/updateTransaction já espalham parsed.data, então status/dueDate fluem sem toque"
metrics:
  duration: "~8min"
  completed: "2026-11-27"
  tasks_completed: 2
  files_created: 0
  files_modified: 4
status: complete
---

# Phase 10 Plan 03: Casa "Pago e A Pagar" — Fatia 3 Summary

Despesa avulsa da Casa também pode nascer EM_ABERTO com vencimento: `transactionSchema` ganha `status` (default PAGO) + `dueDate` opcional, `createTransactionService`/`updateTransactionService` foram REUSADOS (estendidos com `parseISO(dueDate)`), e o `TransactionSheet` ganhou um toggle pago/em aberto + campo vencimento — ambos ocultos no modo pró-labore.

## O que foi feito

### Task 1 — status + dueDate no schema e no service (TDD RED `8cef141` → GREEN `0e54346`)
- **Schema:** `transactionSchema` ganha `status: z.enum(['PAGO','EM_ABERTO']).default('PAGO')` e `dueDate: z.string().optional()` (string vazia = sem vencimento). `updateTransactionSchema.extend` herda. Exportado também `TransactionFormInput = z.input<...>` (status opcional) ao lado de `TransactionFormData = z.infer<...>` (status obrigatório).
- **Service (REUSADO, não reimplementado):** em `createTransactionService`, desestruturado `dueDate` junto de `date`/`userId`; o `data` do create passa `...rest` (carrega `status`) + `date: parseISO(date)` + `...(dueDate ? { dueDate: parseISO(dueDate) } : {})`. Em `updateTransactionService`, espelhado o tratamento condicional do `date` para `dueDate`; `status` flui por `...rest`. Guards de ownership (`findFirst({id,userId})`) e `pairId` (PAIRED_TRANSACTION) **intactos**.
- **Testes (TDD):** 9 novos em `service.test.ts` — schema (default PAGO, aceita EM_ABERTO, rejeita fora do enum T-10-10, dueDate opcional), `createTransactionService` (persiste status; EM_ABERTO+dueDate grava parseISO; dueDate vazio não grava), `updateTransactionService` (dueDate condicional presente/ausente).
- **Blocking fix (Rule 3):** o `.default('PAGO')` do zod criou um input≠output type mismatch que quebrou `useForm<TransactionFormData>` no build. Resolvido tipando o form com `useForm<TransactionFormInput, unknown, TransactionFormData>` — padrão oficial do RHF 7.91 para schemas com `.default()`. `actions.ts` não precisou de toque (espalha `parsed.data`).

### Task 2 — Toggle pago/em aberto + campo vencimento no TransactionSheet (commit `d61c64c`)
- `ExistingTransaction` ganha `status?`/`dueDate?`; `defaultValues` e os dois `reset()` (editar/novo) carregam `status` (`transaction.status ?? 'PAGO'` no editar, `'PAGO'` no novo) e `dueDate` (`transaction.dueDate ? formatDateInput(...) : ''`, `''` no novo).
- **Toggle:** Switch shadcn via `<Controller name="status">` (checked = `status === 'EM_ABERTO'`; `onCheckedChange` → `setValue('status', 'EM_ABERTO'/'PAGO')`), Label PT-BR "Deixar em aberto (a pagar)", wrapper `min-h-[44px]` (padrão do `isVariableAmount`/`autoDebit` do FixedAccountSheet). Default desligado = PAGO.
- **Vencimento:** `<Input id="dueDate" type="date" {...register('dueDate')} className="min-h-[44px]">` com Label "Vencimento (opcional)", visível só quando `watchedStatus === 'EM_ABERTO'`.
- **Pró-labore:** AMBOS os campos dentro de `{!isProLabore && (...)}` — o par atômico continua sempre efetivado (PAGO) e não ganha status; o fluxo pró-labore existente não muda.
- `watchedStatus`, `control` e `Controller` passam pelo `sharedFormProps` (os dois lados bottom/right renderizam igual).

## Verification
- `npx vitest run` → **240 passed (23 files)** (baseline 231 + 9 novos desta fatia).
- `npm run build` → **limpo** (Compiled successfully; rota `/lancamentos` compila). Warnings restantes em `TransactionSheet.tsx`: `cn` e `clearErrors` não usados — **pré-existentes** (documentados no 10-02-SUMMARY linha 90); minhas mudanças inclusive resolveram 2 dos 4 warnings anteriores (`Controller`/`control` agora usados).
- DB/schema/migrations: **não tocados** (`git diff c7de94e..HEAD --name-only | grep prisma` → 0).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] zod `.default('PAGO')` quebrou o typing do useForm**
- **Found during:** Task 1 (primeiro `npm run build` após o schema)
- **Issue:** `z.enum([...]).default('PAGO')` faz o *input type* ter `status` opcional e o *output type* ter `status` obrigatório. O `zodResolver` infere o input type, que deixa de ser atribuível a `useForm<TransactionFormData>` (single-generic, output). Type error no resolver.
- **Fix:** exportado `TransactionFormInput = z.input<...>` no schema e tipado o form como `useForm<TransactionFormInput, unknown, TransactionFormData>` (três genéricos: input/context/transformed). `onSubmit` continua recebendo o output type (status garantido). Padrão oficial do react-hook-form 7.91 para schemas com `.default()`.
- **Files modified:** `src/app/(authed)/lancamentos/_lib/schema.ts`, `src/app/(authed)/lancamentos/_components/TransactionSheet.tsx`
- **Commit:** `0e54346`

### Decisões de implementação (dentro da discrição do builder)
- **Vencimento visível só quando "em aberto"** (das duas opções que o plano ofereceu) — mais simples e evita um campo desabilitado ruidoso no fluxo comum (PAGO).
- **`actions.ts` intacto** — como o plano previa, os campos fluem por `parsed.data`.

## Known Stubs
Nenhum. O toggle e o vencimento gravam dados reais via `createTransactionService`/`updateTransactionService`. Uma avulsa EM_ABERTO entra no comprometido do hero (fatia 01) e ganha "marcar pago" (ação genérica da fatia 02) sem código novo aqui — esta fatia só grava o status; não altera leitores (prohibition R-1 respeitada).

## Threat Flags
Nenhuma superfície nova fora do `<threat_model>` do plano. T-10-10 (tampering em status) mitigado pelo `z.enum` que rejeita valores fora do enum + `parseISO` que ignora `dueDate` vazio (sem injeção de data inválida — teste cobre). T-10-11 (R-1): esta fatia NÃO toca leitores de gasto. T-10-12 (pró-labore): campos ocultos no modo pró-labore, par atômico permanece PAGO, guards pairId intactos. T-10-SC: nenhuma dependência nova (reusa shadcn Switch/Input + zod + react-hook-form já instalados).

## Self-Check: PASSED
- schema.ts / service.ts / TransactionSheet.tsx — FOUND
- Commits `8cef141` (test) · `0e54346` (feat) · `d61c64c` (feat) — presentes no git log
- prisma/ não tocado entre c7de94e..HEAD
