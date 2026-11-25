---
phase: "02"
fixed_at: "2026-11-24T23:37:21Z"
review_path: ".planning/phases/02-core-crud/02-REVIEW.md"
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 02: Relatório de Correções do Code Review

**Corrigido em:** 2026-11-24T23:37:21Z
**Revisão de origem:** .planning/phases/02-core-crud/02-REVIEW.md
**Iteração:** 1

**Resumo:**
- Findings em escopo: 7
- Corrigidos: 7
- Pulados: 0

## Issues Corrigidos

### CR-01: `service.ts` (visao-geral) — `end date` com dia 31 fixo ultrapassa para o próximo mês

**Arquivos modificados:** `src/app/(authed)/visao-geral/_lib/service.ts`
**Commit:** 88d0913
**Correção aplicada:** Substituído `new Date(year, monthNum - 1, 31, 23, 59, 59, 999)` por `new Date(year, monthNum, 0, 23, 59, 59, 999)` nas três funções de agregação (`getTotalSpent`, `getCategorySpending`, `getWeeklySpending`). O padrão "dia 0 do mês seguinte" retorna sempre o último dia do mês atual, independentemente de quantos dias ele tem — idêntico ao que `loader.ts` já usava corretamente.

---

### CR-02: `TransactionSheet.tsx` — `formatDateInput` usa timezone do browser

**Arquivos modificados:** `src/app/(authed)/lancamentos/_components/TransactionSheet.tsx`
**Commit:** 53e5f95
**Correção aplicada:** Substituídos `getFullYear()`, `getMonth()` e `getDate()` por `getUTCFullYear()`, `getUTCMonth()` e `getUTCDate()` na função `formatDateInput`. Datas armazenadas em UTC (meia-noite UTC) agora são lidas em UTC, evitando o desvio de 1 dia para usuários no fuso UTC-3 (Brasil).

---

### WR-01: `DeleteDialog.tsx` — `onClose` chamado sem verificar resultado da action

**Arquivos modificados:** `src/app/(authed)/lancamentos/_components/DeleteDialog.tsx`
**Commit:** 904339b
**Correção aplicada:** Adicionado `useState('')` para `errorMsg`. O resultado das actions `deleteTransactionAction` e `deleteProLaboreAction` agora é capturado em `result`; `onClose()` só é chamado se `result.success` for verdadeiro. Em caso de falha, a mensagem de erro é exibida abaixo do footer do dialog (`role="alert"`). Bonus: `isPaired` foi movido para antes de `handleConfirm`, resolvendo também IN-03.

---

### WR-02: `actions.ts` (lancamentos) — `createTransactionAction` e `updateTransactionAction` não revalidam `/visao-geral`

**Arquivos modificados:** `src/app/(authed)/lancamentos/_lib/actions.ts`
**Commit:** 09ae039
**Correção aplicada:** Adicionado `revalidatePath('/visao-geral')` imediatamente após `revalidatePath('/lancamentos')` em `createTransactionAction` (linha 54) e `updateTransactionAction` (linha 78). Agora criar ou editar um lançamento invalida o cache do dashboard imediatamente.

---

### WR-03: `loader.ts` e `service.ts` — parâmetro `month` sem validação de formato

**Arquivos modificados:** `src/app/(authed)/lancamentos/_lib/loader.ts`, `src/app/(authed)/visao-geral/_lib/service.ts`
**Commit:** bf38b7a
**Correção aplicada:** Adicionada a constante `monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/` em ambos os arquivos. Em `loader.ts`, a validação protege `getTransactions`. Em `service.ts`, as três funções (`getTotalSpent`, `getCategorySpending`, `getWeeklySpending`) lançam `Error('Formato de mês inválido')` antes de qualquer `split`/`map` se o formato não for válido.

---

### WR-04: `actions.ts` (visao-geral) — autenticação ocorre antes da validação Zod

**Arquivos modificados:** `src/app/(authed)/visao-geral/_lib/actions.ts`
**Commit:** e892746
**Correção aplicada:** Em `upsertMonthlyBudgetAction`, o `ceilingUpdateSchema.safeParse(data)` foi movido para antes do `try/catch`, fora do bloco que chama `getUserId()`. Se o input for inválido, retorna erro imediatamente sem fazer round-trip ao Supabase. Padrão agora consistente com todas as outras Server Actions do projeto.

---

### WR-05: `AccountFilterToggle.tsx` — Zustand store não resetado ao selecionar "Todos"

**Arquivos modificados:** `src/app/(authed)/lancamentos/_components/AccountFilterToggle.tsx`
**Commit:** c0d4fd1
**Correção aplicada:** Adicionado `setContaAtiva('CASA')` no branch `value === 'ALL'` de `handleChange`. O valor `'CASA'` foi escolhido por ser o valor padrão de inicialização do store (definido em `src/store/conta.ts`), mantendo consistência com o tipo `ContaAtiva = 'CASA' | 'EMPRESA'` que não aceita `null`.

---

_Corrigido: 2026-11-24T23:37:21Z_
_Corretor: Claude (gsd-code-fixer)_
_Iteração: 1_
