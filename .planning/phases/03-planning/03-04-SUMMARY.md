---
phase: 03-planning
plan: 04
subsystem: contas-fixas
tags: [next15, server-actions, prisma, zod, react-hook-form, shadcn, vitest, date-fns, contas-fixas, casa]

# Dependency graph
requires:
  - phase: 03-planning/03-01
    provides: "Modelos Prisma FixedAccount/AnnualExpense/Goal (userId-scoped), harness Vitest, shadcn Checkbox/Switch/Progress/Table"
  - phase: 02-core-crud
    provides: "Padrões de Sheet/Action/Service, formatBRL, parseBRLInput, createSupabaseServerClient"
provides:
  - "Slice vertical /contas-fixas: 3 cards (contas fixas / gastos do ano ÷12 / metas e reserva)"
  - "CRUD ownership-guarded (IDOR) para FixedAccount/AnnualExpense/Goal"
  - "getOrSeedGoals — semeia 2 metas por nome no 1º acesso (META-02)"
  - "Funções puras computeAnnualMonthly (÷12) + computeGoalMonthly ((meta−guardado)/meses, guard de prazo nulo/passado) — unit-tested"
  - "DeleteEntityDialog reutilizável parametrizado por tipo de entidade"
affects: [03-03, planejamento, contas-fixas]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Funções de display puras (computeAnnualMonthly/computeGoalMonthly) testadas sem Prisma; guard explícito para divisão por zero/negativa (Pitfall 3)"
    - "getOrSeedGoals idempotente (findMany → se vazio, cria seeds em $transaction) — mesmo idioma de getOrCreateMonthlyBudget"
    - "Sheet dual mobile(bottom)/desktop(right) + react-hook-form + zodResolver + useTransition + setError('root') — replicado de TransactionSheet para as 3 entidades"
    - "DeleteEntityDialog único parametrizado por EntityKind (tabela de copy + tabela de action) em vez de 3 dialogs"
    - "Teste de data: usar new Date(ano, mêsIdx, dia) (local) em vez de new Date('YYYY-MM-DD') (UTC) para casar com date-fns parse e evitar drift de timezone"

key-files:
  created:
    - src/app/(authed)/contas-fixas/_lib/schema.ts
    - src/app/(authed)/contas-fixas/_lib/service.ts
    - src/app/(authed)/contas-fixas/_lib/service.test.ts
    - src/app/(authed)/contas-fixas/_lib/loader.ts
    - src/app/(authed)/contas-fixas/_lib/actions.ts
    - src/app/(authed)/contas-fixas/_lib/money.ts
    - src/app/(authed)/contas-fixas/_components/FixedAccountSheet.tsx
    - src/app/(authed)/contas-fixas/_components/FixedAccountTable.tsx
    - src/app/(authed)/contas-fixas/_components/AnnualExpenseSheet.tsx
    - src/app/(authed)/contas-fixas/_components/AnnualExpenseTable.tsx
    - src/app/(authed)/contas-fixas/_components/GoalSheet.tsx
    - src/app/(authed)/contas-fixas/_components/GoalCard.tsx
    - src/app/(authed)/contas-fixas/_components/NewEntityButtons.tsx
    - src/app/(authed)/contas-fixas/_components/DeleteEntityDialog.tsx
  modified:
    - src/app/(authed)/contas-fixas/page.tsx

key-decisions:
  - "computeGoalMonthly usa date-fns differenceInCalendarMonths (não hand-roll) com now default = new Date(); guard retorna null para deadline nulo OU meses ≤ 0 (prazo no passado/mês atual) — sem divisão por zero/negativa"
  - "goalSchema construído como base (goalBase sem refine) + refine aplicado ao export e re-aplicado na variante update (.extend antes do refine, pois ZodEffects não permite .extend)"
  - "parseBRLInput extraído para _lib/money.ts e compartilhado pelos 3 Sheets (em vez de duplicar o parser em cada arquivo)"
  - "DeleteEntityDialog único parametrizado por EntityKind com mapas de copy/action, cobrindo as 3 cópias destrutivas do 03-UI-SPEC"
  - "Barra de progresso da meta usa o idioma de barra manual do CategorySpendingBars (div bg-casa) com role=progressbar/aria-valuenow — dentro do contrato do UI-SPEC (Progress OU barra manual)"
  - "AnnualExpense POR MÊS renderizado em text-casa font-mono, display-only (nunca persistido, nunca vira meta — D-05)"

requirements-completed: [FIXA-01, FIXA-02, META-01, META-02]

# Metrics
duration: 7 min
completed: 2026-11-25
status: complete
---

# Phase 3 Plan 04: /contas-fixas vertical slice Summary

**Slice completo do /contas-fixas da Casa: três cards empilhados — Contas fixas e assinaturas (CRUD + Switch débito automático), Gastos do ano divididos em 12 (÷12 display-only em acento Casa) e Metas e reserva (barra de progresso + guardar/mês com guard de prazo nulo/passado + card tracejado "+ Nova meta") — com as 2 metas seed por nome no 1º acesso e a aritmética crítica (computeAnnualMonthly, computeGoalMonthly) em funções puras cobertas por 19 testes Vitest.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-11-25T16:35:29Z
- **Completed:** 2026-11-25T16:42:57Z
- **Tasks:** 3 (todas type=auto; Task 1 tdd)
- **Files:** 15 (14 criados, 1 modificado — a page.tsx substituiu o stub)

## Accomplishments

- **Schema + service + cálculo puro (Task 1, TDD):** `fixedAccountSchema` (dueDay 1-31), `annualExpenseSchema` (dueMonth 1-12), `goalSchema` (savedCents ≤ targetCents) + variantes update; `computeAnnualMonthly` (`Math.round(yearly/12)` — FIXA-02, Pitfall 1) e `computeGoalMonthly` ((meta−guardado)/meses via `differenceInCalendarMonths`, guard → null para prazo nulo/passado — META-01, Pitfall 3); CRUD ownership-guarded (IDOR) para as 3 entidades + `getOrSeedGoals` (2 metas por nome em `$transaction` — META-02). 19 testes verdes.
- **Loader + Server Actions (Task 2):** `loadContasFixasData` em `Promise.all` (contas fixas + gastos anuais + metas semeadas); 9 actions finas lendo `userId` da sessão (nunca do form — T-03-07) e revalidando `/contas-fixas` **e** `/planejamento` (contas fixas alimentam o plano — PLAN-06).
- **UI (Task 3):** página Server Component (substitui o stub) com eyebrow "CASA" + 3 cards brancos empilhados; `FixedAccountTable` (desktop Table CONTA/VENCE DIA/VALOR/PAGAMENTO + Checkbox read-only "Débito automático"; mobile card-list) + `FixedAccountSheet` (Switch débito automático); `AnnualExpenseTable` (VALOR NO ANO + "÷ 12" → POR MÊS em `text-casa font-mono`, display-only) + `AnnualExpenseSheet` (Select jan–dez pt-BR); `GoalCard` (barra `role=progressbar`, guardado/meta, guardar/mês com placeholders `R$ [—]`/`[mês/ano]` para seed/null prazo, badge "Concluída" quando guardado ≥ alvo) + `GoalSheet` (Prazo `type="month"`); `NewEntityButtons` (3 CTAs + add-card tracejado "+ Nova meta"); `DeleteEntityDialog` reutilizável. Copy conforme 03-UI-SPEC.

## Task Commits

1. **Task 1: schema + service + pure calc com testes (TDD)** — `e518af4` (feat)
2. **Task 2: loader + Server Actions das 3 entidades** — `d33e85e` (feat)
3. **Task 3: página + 3 cards (tabelas, sheets, goal cards, delete)** — `1ea09b8` (feat)

## Files Created/Modified

- `_lib/schema.ts` — fixedAccount/annualExpense/goal schemas + variantes update (goalBase + refine re-aplicado)
- `_lib/service.ts` — computeAnnualMonthly, computeGoalMonthly (puras); CRUD ownership-guarded x3; getOrSeedGoals + SEED_GOAL_NAMES
- `_lib/service.test.ts` — 19 testes Vitest (FIXA-02/META-01/META-02)
- `_lib/loader.ts` — loadContasFixasData (Promise.all)
- `_lib/actions.ts` — 9 Server Actions finas (userId da sessão, revalida 2 rotas)
- `_lib/money.ts` — parseBRLInput compartilhado
- `_components/*` — FixedAccountSheet/Table, AnnualExpenseSheet/Table, GoalSheet, GoalCard, NewEntityButtons, DeleteEntityDialog
- `page.tsx` — Server Component completo (substitui o stub "em breve")

## Decisions Made

- **computeGoalMonthly com date-fns:** `differenceInCalendarMonths(parse(deadline,'yyyy-MM'), now)` em vez de subtração manual de ano×12+mês; retorna `null` para `deadline` nulo/undefined OU `meses ≤ 0` (prazo no passado/mês atual) — a UI mostra `R$ [—]` e `[mês/ano]`. Elimina divisão por zero/negativa (Pitfall 3, T-03-09).
- **goalSchema base + refine:** `goalBase` (object puro) permite que a variante update faça `.extend({ id })` antes de re-aplicar o `.refine`, já que um `ZodEffects` (pós-refine) não pode ser estendido.
- **Barra de meta manual:** usei o idioma de barra manual do CategorySpendingBars (`div` com `bg-casa`/`bg-positive`) com `role="progressbar"`/`aria-valuenow`, em vez do shadcn `Progress` — ambos permitidos pelo 03-UI-SPEC; a barra manual facilita o estado seed tracejado (0%) e a troca para `bg-positive` quando concluída.
- **POR MÊS display-only:** `computeAnnualMonthly` é renderizado em `text-casa font-mono` na tabela, nunca persistido e nunca vira meta (D-05).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Teste de computeGoalMonthly com drift de timezone**
- **Found during:** Task 1 (RED → primeira execução)
- **Issue:** Os testes construíam `now` com `new Date('2026-11-01')`, que é interpretado como **meia-noite UTC** e, em fuso negativo (BRT, UTC-3), vira 31/10/2026 local. Como `computeGoalMonthly` usa `date-fns parse('YYYY-MM')` (hora local), o `now` e o prazo ficavam em frames de fuso diferentes, contando 1 mês a mais (ex.: 13 em vez de 12, 7 em vez de 6). A **função estava correta**; o bug era nos dados de teste.
- **Fix:** Troquei os `now` dos testes para o construtor local `new Date(ano, mêsIdx, dia)` (ex.: `new Date(2026, 10, 1)`), que vive no mesmo frame de fuso que o `parse` do date-fns. Adicionei comentário explicando o motivo.
- **Files modified:** src/app/(authed)/contas-fixas/_lib/service.test.ts
- **Verification:** `npx vitest run` → 19/19 verdes.
- **Commit:** e518af4 (Task 1)

**2. [Rule 3 - Blocking] path readonly no refine do Zod (tsc)**
- **Found during:** Task 1 (tsc)
- **Issue:** `path: ['savedCents'] as const` produz `readonly ["savedCents"]`, incompatível com o tipo mutável `(string|number)[]` esperado pelo `.refine`. `tsc` falhava com TS2769.
- **Fix:** Removido o `as const` — `path: ['savedCents']` (array mutável).
- **Files modified:** src/app/(authed)/contas-fixas/_lib/schema.ts
- **Verification:** `npx tsc --noEmit` limpo.
- **Commit:** e518af4 (Task 1)

**3. [Rule 3 - Blocking] money.ts (parseBRLInput) adicionado ao plano**
- **Found during:** Task 3
- **Issue:** Os 3 Sheets precisam de `parseBRLInput`, que no lancamentos é uma função privada de TransactionSheet (não exportada). Duplicar o parser em 3 arquivos seria pior.
- **Fix:** Extraí `parseBRLInput` para `_lib/money.ts` compartilhado (arquivo novo não listado no `files_modified` do plano).
- **Files modified:** src/app/(authed)/contas-fixas/_lib/money.ts (novo)
- **Verification:** build + tsc verdes; os 3 Sheets importam a função.
- **Commit:** 1ea09b8 (Task 3)

**Total deviations:** 3 auto-fixadas (1 Rule 1 - bug de teste; 2 Rule 3 - blocking). **Impact:** nenhuma mudança de escopo; a correção aritmética de meses foi validada; o arquivo extra (money.ts) é organização de código.

## Authentication Gates

Nenhum — nenhuma credencial/serviço externo novo. As actions usam a sessão Supabase já configurada (Fase 1).

## Threat Flags

Nenhuma superfície de ameaça nova além do registro do plano. Mitigações aplicadas conforme o `<threat_model>`:
- **T-03-06 (IDOR):** `findFirst({ where: { id, userId } })` antes de todo update/delete nas 3 entidades; lança not-found.
- **T-03-07 (mass assignment):** `userId` da sessão (`supabase.auth.getUser()`); schemas sem `userId`.
- **T-03-08 (validação):** Zod bounds dueDay 1-31, dueMonth 1-12, valores positivos, savedCents ≤ targetCents na entrada das actions.
- **T-03-09 (divide-by-zero):** guard de prazo nulo/passado em `computeGoalMonthly` retorna null antes de qualquer divisão.
- **T-03-05 (XSS):** nomes renderizados via React (escape automático; sem dangerouslySetInnerHTML).

## Known Stubs

Nenhum stub bloqueante. As 2 metas seed (META-02) nascem com valores zerados por **design** (D-06) — a UI mostra barra 0% e placeholders `R$ [—]`/`[mês/ano]`, convidando o usuário a preencher; não é um stub de dados ausentes.

> **Nota sobre seeds de exemplo do 03-UI-SPEC:** o UI-SPEC menciona contas fixas de exemplo (Luz/Água/Internet) e gastos anuais de exemplo (IPVA/Licenciamento/Manutenção) com valores em branco. O PLAN (D-05/FIXA) **não** especifica semear essas entidades (apenas as 2 metas, D-06/META-02), e o `<behavior>`/`<action>` da Task 1 só define `getOrSeedGoals`. Segui o PLAN: contas fixas e gastos anuais começam vazios com empty state ("Nenhuma conta fixa cadastrada" / "Nenhum gasto anual cadastrado") conforme o Copywriting Contract. Os exemplos do PDF são sugestões de conteúdo do empty-state body, não seeds persistidos.

## Issues Encountered

Nenhum bloqueador. O aviso `prisma:warn In production, we recommend using prisma generate --no-engine` aparece durante os testes (carregamento do client Prisma) — inócuo nos testes de função pura; herdado das Fases 01/02.

## Next Phase Readiness

- Slice /contas-fixas pronto: contas fixas, gastos anuais e metas com CRUD completo + 2 metas seed.
- As contas fixas cadastradas estão prontas para serem derivadas automaticamente no plano (PLAN-06, Plano 03-03), e cada mutação já revalida `/planejamento`.
- `computeAnnualMonthly`/`computeGoalMonthly` e `getOrSeedGoals` ficam disponíveis para reuso.
- Nenhum bloqueador para o Plano 03-03.

## Self-Check: PASSED

- Arquivos criados verificados em disco: 14 criados + 1 modificado (page.tsx) → todos FOUND.
- Commits verificados no git log: e518af4, d33e85e, 1ea09b8 — todos FOUND.
- Verificação do plano: `npx vitest run contas-fixas/service.test.ts` ✓ (19 testes); suíte completa ✓ (41 testes, 0 regressões); `npx tsc --noEmit` ✓; `npm run build` ✓ (/contas-fixas 52.8 kB, dynamic); `actions.ts` lê `supabase.auth.getUser` ✓ e revalida `/planejamento` ✓.

---
*Phase: 03-planning*
*Completed: 2026-11-25*
