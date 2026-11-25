---
phase: 02-core-crud
verified: 2026-11-24T14:00:00Z
status: human_needed
score: 4/5 must-haves verified
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "Teto do mês editável inline — alteração persiste após Enter/blur via Server Action e sobrevive à navegação"
    test: "Abrir /visao-geral, clicar no valor do teto, digitar novo valor, pressionar Enter; navegar para outra página e voltar"
    expected: "O novo valor persiste — MonthlyBudget foi salvo no banco e getOrCreateMonthlyBudget retorna o novo ceilingCents"
    why_human: "O invariante envolve uma mutação DB via upsertMonthlyBudgetAction + revalidatePath + re-render; o código está totalmente cabeado, mas a prova real requer round-trip browser→Server Action→Prisma→re-render"
human_verification:
  - test: "Verificar persistência do teto do mês"
    expected: "Clicar no valor 'Teto do mês', digitar um novo valor (ex.: 5000), pressionar Enter — o valor muda para R$ 5.000,00. Navegar para /lancamentos e voltar para /visao-geral — o valor novo ainda aparece"
    why_human: "Estado persistido via Server Action + prisma.upsert; exige round-trip real com banco de dados"
---

# Fase 2: Core CRUD — Relatório de Verificação

**Objetivo da Fase:** Usuário pode registrar, editar, excluir e consultar todos os lançamentos financeiros de Casa e Empresa, incluindo transferências de pró-labore, e ver o resumo mensal no dashboard da Casa
**Verificado em:** 2026-11-24
**Status:** human_needed
**Re-verificação:** Não — verificação inicial

---

## Objetivos Alcançados

### Verdades Observáveis

| #   | Verdade | Status | Evidência |
| --- | ------- | ------ | --------- |
| 1 | Usuário pode criar um lançamento (data, descrição, valor, tipo, categoria, conta) e vê-lo na lista filtrada por conta e mês | ✓ VERIFIED | `TransactionSheet` → `createTransactionAction` → `createTransactionService` → `prisma.transaction.create`; `getTransactions` carrega com filtros reais de userId + mês + conta |
| 2 | Usuário pode editar qualquer campo de um lançamento existente; alteração refletida imediatamente | ✓ VERIFIED | `updateTransactionService` com guard de ownership `{id, userId}` + guard pairId; `updateTransactionAction` chama `revalidatePath('/lancamentos')` |
| 3 | Usuário pode excluir um lançamento e ele desaparece da lista | ✓ VERIFIED | `DeleteDialog` → `deleteTransactionAction` (ou `deleteProLaboreAction` quando pairId presente) → `deleteTransactionService` → `prisma.transaction.delete`; `revalidatePath` acionado |
| 4 | Usuário pode registrar transferência de pró-labore: uma única operação cria saída na Empresa e entrada na Casa atomicamente | ✓ VERIFIED | `createProLaboreService` usa `prisma.$transaction` com dois `tx.transaction.create`; `deleteProLaboreService` usa `tx.transaction.deleteMany({where:{pairId,userId}})` |
| 5 | Usuário vê dashboard da Casa com teto do mês, total planejado, folga e gasto até hoje, além de barras por categoria e gráfico semanal | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Cards, barras e gráfico: wired e substanciais (ver detalhe abaixo). **Invariante comportamental não coberto por teste:** a edição inline do teto persiste corretamente após Enter/blur via `upsertMonthlyBudgetAction` |

**Pontuação:** 4/5 verdades verificadas (1 presente, comportamento não exercido por teste)

---

### Detalhe SC-5 — Dashboard da Casa

Os seguintes aspectos de SC-5 estão **totalmente verificados por análise de código**:

| Aspecto | Status | Evidência |
| ------- | ------ | --------- |
| 4 cartões renderizados com dados reais | ✓ VERIFIED | `loadDashboardData` chama `Promise.all([getOrCreateMonthlyBudget, getTotalSpent, getCategorySpending, getWeeklySpending])` — todos com queries Prisma reais e filtro userId |
| Folga positiva (verde) / negativa (vermelho) | ✓ VERIFIED | `folgaCents = budget.ceilingCents - totalSpentCents` computado em `page.tsx`; `DashboardCards` aplica `text-positive` ou `text-warning` condicionalmente |
| Fallback teto R$ 3.000,00 (D-04) | ✓ VERIFIED | `getOrCreateMonthlyBudget`: `findUnique` → `findFirst { lt: month }` → `upsert { ceilingCents: 300_000 }` |
| Barras por categoria proporcionais | ✓ VERIFIED | `CategorySpendingBars` renderiza `width: (item.totalCents / maxCents) * 100 %` com dados reais de `getCategorySpending` |
| Gráfico semanal Recharts (Sem 1–4) | ✓ VERIFIED | `WeeklyBarChart` importa `BarChart` de `recharts`, renderiza `data` real de `getWeeklySpending`; Skeleton quando todos os buckets são zero |
| Empresa button desabilitado com tooltip | ✓ VERIFIED | `AccountSelector`: botão Empresa tem atributo `disabled` e `title="Disponível na próxima fase."` |
| Cartão Planejado mostra "--" (intencional) | ✓ VERIFIED | `DashboardCards` linha 31: `<span>--</span>` — deferido para Fase 3 (D-02) |
| **Edição inline do teto persiste após save** | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `InlineCeilingEditor` → `upsertMonthlyBudgetAction` → `upsertMonthlyBudget` → `prisma.monthlyBudget.upsert` — código totalmente cabeado, mas a persistência requer round-trip real |

---

### Artefatos Obrigatórios

| Artefato | Esperado | Status | Detalhes |
| -------- | -------- | ------ | -------- |
| `prisma/schema.prisma` | pairId, MonthlyBudget, isDefault | ✓ VERIFIED | `Transaction.pairId String?` linha 55; modelo `MonthlyBudget` linhas 61–71; `Category.isDefault Boolean @default(false)` linha 37; `@@unique([userId, month])` linha 70 |
| `prisma/migrations/20261124103918_core_crud/` | Migração aplicada | ✓ VERIFIED | `migration.sql` contém `CREATE TABLE "MonthlyBudget"`, `"pairId" TEXT`, `"isDefault" BOOLEAN NOT NULL DEFAULT false` |
| `src/components/ui/dialog.tsx` | shadcn Dialog | ✓ VERIFIED | Arquivo existe, não vazio |
| `src/components/ui/select.tsx` | shadcn Select | ✓ VERIFIED | Arquivo existe, não vazio |
| `src/components/ui/badge.tsx` | shadcn Badge | ✓ VERIFIED | Arquivo existe, não vazio |
| `src/components/ui/tabs.tsx` | shadcn Tabs | ✓ VERIFIED | Arquivo existe, não vazio |
| `package.json` recharts | `^3.11.1` | ✓ VERIFIED | linha 31: `"recharts": "^3.11.1"` |
| `src/app/(authed)/lancamentos/_lib/schema.ts` | Schemas Zod | ✓ VERIFIED | `transactionSchema`, `updateTransactionSchema`, `proLaboreSchema`, `categoryCreateSchema`, `categoryUpdateSchema` |
| `src/app/(authed)/lancamentos/_lib/service.ts` | CRUD + pró-labore + categorias | ✓ VERIFIED | 8 funções de serviço; pairId guard em update e delete; `prisma.$transaction` em createProLaboreService; `transaction.count` em deleteCategoryService |
| `src/app/(authed)/lancamentos/_lib/loader.ts` | getTransactions, getCategories | ✓ VERIFIED | Filtro real por userId, mês e conta; include category relation |
| `src/app/(authed)/lancamentos/_lib/actions.ts` | 8 Server Actions | ✓ VERIFIED | `'use server'` linha 1; `getUserId()` lê sessão via `supabase.auth.getUser()` — nunca do form; `revalidatePath` chamado em todos |
| `src/app/(authed)/lancamentos/page.tsx` | Server Component | ✓ VERIFIED | Sem diretiva `'use client'`; await searchParams (Next.js 15); Promise.all para transactions + categories |
| `src/app/(authed)/lancamentos/_components/TransactionSheet.tsx` | Formulário Sheet | ✓ VERIFIED | `'use client'`; guard pairId (modo somente leitura); modo pró-labore; criação inline de categoria |
| `src/app/(authed)/lancamentos/_components/DeleteDialog.tsx` | Dialog de exclusão | ✓ VERIFIED | `'use client'`; roteamento correto: `deleteProLaboreAction` quando `isPaired`, `deleteTransactionAction` caso contrário |
| `src/app/(authed)/lancamentos/_components/ManageCategoriesSheet.tsx` | Gerenciar categorias | ✓ VERIFIED | `'use client'`; guard `isDefault`; badge "Padrão"; edição inline; erro inline D-08 |
| `src/app/(authed)/visao-geral/_lib/service.ts` | 5 funções de agregação | ✓ VERIFIED | `getOrCreateMonthlyBudget` com fallback D-04 (`300_000`); `getWeeklySpending` com buckets Sem 1–4; userId em todos os `where` |
| `src/app/(authed)/visao-geral/_lib/loader.ts` | loadDashboardData | ✓ VERIFIED | `Promise.all` sobre 4 chamadas de serviço |
| `src/app/(authed)/visao-geral/_lib/actions.ts` | upsertMonthlyBudgetAction | ✓ VERIFIED | `'use server'`; userId da sessão; Zod `int().positive()`; `revalidatePath('/visao-geral')` |
| `src/app/(authed)/visao-geral/page.tsx` | Server Component | ✓ VERIFIED | Sem `'use client'`; `folgaCents` computado server-side |
| `src/app/(authed)/visao-geral/_components/InlineCeilingEditor.tsx` | Editor inline | ✓ VERIFIED | `'use client'`; onBlur/Enter → `upsertMonthlyBudgetAction` via `startTransition` |
| `src/app/(authed)/visao-geral/_components/WeeklyBarChart.tsx` | Recharts BarChart | ✓ VERIFIED | `'use client'`; importa `BarChart` de `recharts`; `formatBRL` de `@/lib/format`; Skeleton quando dados zerados |
| `src/app/(authed)/visao-geral/_components/AccountSelector.tsx` | Seletor de conta | ✓ VERIFIED | `'use client'`; Empresa `disabled` com `title="Disponível na próxima fase."` |
| `src/app/(authed)/visao-geral/_components/DashboardCards.tsx` | 4 cartões | ✓ VERIFIED | Sem `'use client'`; Planejado mostra `--`; Folga com lógica positivo/negativo |
| `src/app/(authed)/visao-geral/_components/CategorySpendingBars.tsx` | Barras por categoria | ✓ VERIFIED | Sem `'use client'`; barras proporcionais ao maior gasto |

---

### Verificação de Links Chave

| De | Para | Via | Status |
| -- | ---- | --- | ------ |
| `TransactionSheet.tsx` | `actions.ts` | `createTransactionAction` / `updateTransactionAction` via `startTransition` | ✓ WIRED |
| `TransactionSheet.tsx` | `actions.ts` | `createProLaboreAction` quando `isProLabore` | ✓ WIRED |
| `TransactionSheet.tsx` | `actions.ts` | `createCategoryAction` para criação inline | ✓ WIRED |
| `DeleteDialog.tsx` | `actions.ts` | `deleteProLaboreAction(pairId)` quando `isPaired`, `deleteTransactionAction(id)` senão | ✓ WIRED |
| `ManageCategoriesSheet.tsx` | `actions.ts` | `updateCategoryAction` / `deleteCategoryAction` | ✓ WIRED |
| `actions.ts` (lancamentos) | `service.ts` | todas as 8 funções de serviço | ✓ WIRED |
| `service.ts` (lancamentos) | Prisma | `prisma.transaction.{create,update,delete,findFirst}`; `prisma.$transaction` | ✓ WIRED |
| `InlineCeilingEditor.tsx` | `actions.ts` (visao-geral) | `upsertMonthlyBudgetAction` via onBlur/Enter | ✓ WIRED |
| `actions.ts` (visao-geral) | `service.ts` (visao-geral) | `upsertMonthlyBudget(userId, month, ceilingCents)` | ✓ WIRED |
| `service.ts` (visao-geral) | Prisma | `prisma.monthlyBudget.{upsert,findUnique,findFirst}`; `prisma.transaction.{aggregate,groupBy,findMany}` | ✓ WIRED |
| `page.tsx` (visao-geral) | `loader.ts` | `loadDashboardData(userId, currentMonth)` | ✓ WIRED |

---

### Rastreio de Fluxo de Dados (Nível 4)

| Artefato | Variável de dados | Fonte | Dados reais | Status |
| -------- | ----------------- | ----- | ----------- | ------ |
| `DashboardCards` | `budget.ceilingCents`, `totalSpentCents`, `folgaCents` | `loadDashboardData` → `getOrCreateMonthlyBudget`, `getTotalSpent` | Queries Prisma reais com userId | ✓ FLOWING |
| `CategorySpendingBars` | `categorySpending` | `loadDashboardData` → `getCategorySpending` | `prisma.transaction.groupBy` com filtro userId+CASA+SAIDA | ✓ FLOWING |
| `WeeklyBarChart` | `data` (4 buckets semanais) | `loadDashboardData` → `getWeeklySpending` | `prisma.transaction.findMany` com filtro real | ✓ FLOWING |
| `TransactionList` | `transactions` | `page.tsx` → `getTransactions` | `prisma.transaction.findMany` com userId+mês+conta | ✓ FLOWING |

---

### Verificações Comportamentais

| Comportamento | Verificação | Resultado | Status |
| ------------- | ---------- | --------- | ------ |
| `createProLaboreService` usa `prisma.$transaction` | `grep 'prisma\.\$transaction' service.ts` | Encontrado linha 104 | ✓ PASS |
| `deleteProLaboreService` usa `deleteMany` | `grep 'deleteMany' service.ts` | Encontrado linha 141 | ✓ PASS |
| `deleteCategoryService` conta lançamentos antes de excluir | `grep 'transaction.count' service.ts` | Encontrado linha 215 | ✓ PASS |
| `InlineCeilingEditor` → `upsertMonthlyBudgetAction` cabeados | Leitura do código | Importação e chamada confirmadas | ✓ PASS |
| `DeleteDialog` roteia para `deleteProLaboreAction` quando pairId presente | Leitura do código | `if (isPaired && transaction.pairId)` linha 37 | ✓ PASS |
| formatBRL/formatDate usados; sem formatação inline | `grep 'Intl.NumberFormat\|toFixed\|toLocaleDateString'` | Nenhum resultado nos arquivos da fase | ✓ PASS |

---

### Cobertura de Requisitos

| Requisito | Plano | Descrição | Status | Evidência |
| --------- | ----- | --------- | ------ | --------- |
| LANC-01 | 02-02 | Criar lançamento com todos os campos | ✓ SATISFIED | `createTransactionService` + `TransactionSheet` + `page.tsx` wired end-to-end |
| LANC-02 | 02-02 | Editar qualquer campo | ✓ SATISFIED | `updateTransactionService` com guard userId; `TransactionSheet` modo edição |
| LANC-03 | 02-02 | Excluir lançamento | ✓ SATISFIED | `deleteTransactionService` + `DeleteDialog` |
| LANC-04 | 02-02 | Listar filtrado por conta e mês | ✓ SATISFIED | `getTransactions` filtra por userId+mês+conta; `AccountFilterToggle` + `MonthSelector` sincronizam URL |
| LANC-05 | 02-03 | Pró-labore atômico (Empresa → Casa) | ✓ SATISFIED | `createProLaboreService` via `prisma.$transaction`; par excluído com `deleteMany({pairId,userId})` |
| LANC-06 | 02-03 | Criar/editar/excluir categorias; proteção das padrão | ✓ SATISFIED | `createCategoryService`, `updateCategoryService`, `deleteCategoryService` com guards `isDefault` e `transaction.count`; `ManageCategoriesSheet` |
| DASH-01 | 02-04 | 4 cartões: teto, planejado, folga, gasto | ✓ SATISFIED | `DashboardCards` com dados reais; Planejado `--` intencional (D-02) |
| DASH-02 | 02-04 | Barras por categoria e gráfico semanal | ✓ SATISFIED | `CategorySpendingBars` com `getCategorySpending`; `WeeklyBarChart` Recharts com `getWeeklySpending` |

---

### Anti-Padrões Encontrados

Nenhum anti-padrão bloqueante encontrado nos arquivos da fase.

| Verificação | Resultado |
| ----------- | --------- |
| Marcadores TBD/FIXME/XXX nos arquivos da fase | Nenhum encontrado |
| TODO/HACK/PLACEHOLDER não resolvidos | Nenhum encontrado |
| Formatação inline (`Intl.NumberFormat`, `toFixed`, `toLocaleDateString`) | Nenhum encontrado |
| Retornos vazios estáticos (`return []`, `return {}`) em rotas de API | Nenhum — todas as queries retornam dados reais do banco |
| userId obtido do form em vez da sessão | Não — `getUserId()` lê exclusivamente de `supabase.auth.getUser()` |

**Nota sobre o cartão "Planejado":** `DashboardCards` exibe `--` intencionalmente no cartão Planejado (D-02 — Fase 3 implementa `ItemPlano`). Não é um stub oculto — está documentado no código e no SUMMARY como deferimento planejado.

---

### Verificação Humana Necessária

#### 1. Persistência da Edição do Teto do Mês

**Teste:** Abrir `/visao-geral`. Clicar no valor monetário do cartão "Teto do mês". Digitar um novo valor (ex.: `5000`). Pressionar Enter ou clicar fora do campo. Navegar para `/lancamentos` e voltar para `/visao-geral`.

**Esperado:** O valor muda imediatamente para R$ 5.000,00. Após navegar e voltar, o novo valor ainda é exibido (confirmando que `upsertMonthlyBudgetAction` persistiu no banco e `getOrCreateMonthlyBudget` retorna o novo `ceilingCents`).

**Por que humano:** A persistência requer um round-trip real: `InlineCeilingEditor` → `startTransition` → `upsertMonthlyBudgetAction` → `prisma.monthlyBudget.upsert` → `revalidatePath` → Server Component re-render. A análise estática confirma que todo o código está cabeado, mas o invariante de que o valor sobrevive à navegação não pode ser verificado sem executar o app.

---

### Resumo dos Gaps

Nenhum gap bloqueante. A única pendência é a verificação humana da persistência da edição inline do teto — código totalmente implementado, comportamento não exercido por teste automatizado.

---

_Verificado em: 2026-11-24_
_Verificador: Claude (gsd-verifier)_
