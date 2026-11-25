---
phase: 03b-casa-acompanhamento
plan: 02
subsystem: Casa — acompanhamento
status: complete
tags: [casa, acompanhamento, planejamento, category-budget, tdd]
requires:
  - "03b-01 (migração: PlanItem/WeeklySpend removidos, CategoryBudget criado)"
provides:
  - "acompanhamento.ts (funções puras: restante do mês, status por categoria, semanal por categoria)"
  - "loadAcompanhamentoData (loader do acompanhamento)"
  - "saveCategoriaTetoAction / clearCategoriaTetoAction (Server Actions do teto)"
  - "tela /planejamento no modelo-alvo (MesBar + CategoriaTetoList + GastoSemanalAuto)"
affects:
  - "visao-geral/_lib/loader.ts (parou de depender do total do plano manual)"
  - "visao-geral/page.tsx (planTotalCents fixado em null até o Plano 03b-03)"
tech-stack:
  added: []
  patterns:
    - "Funções de cálculo puras (sem Prisma) + Vitest, no padrão RED→GREEN"
    - "Auto-copy de CategoryBudget do mês anterior dentro de $transaction (espelha MonthlyBudget)"
    - "Editor inline reusando o padrão do InlineCeilingEditor (botão→input, parse R$→cents, useTransition)"
    - "userId sempre da sessão (supabase.auth.getUser), month/categoryId server-trusted via Zod"
key-files:
  created:
    - "src/app/(authed)/planejamento/_lib/acompanhamento.ts"
    - "src/app/(authed)/planejamento/_lib/acompanhamento.test.ts"
    - "src/app/(authed)/planejamento/_components/MesBar.tsx"
    - "src/app/(authed)/planejamento/_components/CategoriaTetoList.tsx"
    - "src/app/(authed)/planejamento/_components/InlineCategoriaTetoEditor.tsx"
    - "src/app/(authed)/planejamento/_components/GastoSemanalAuto.tsx"
  modified:
    - "src/app/(authed)/planejamento/_lib/service.ts"
    - "src/app/(authed)/planejamento/_lib/loader.ts"
    - "src/app/(authed)/planejamento/_lib/actions.ts"
    - "src/app/(authed)/planejamento/_lib/schema.ts"
    - "src/app/(authed)/planejamento/page.tsx"
    - "src/app/(authed)/visao-geral/_lib/loader.ts"
    - "src/app/(authed)/visao-geral/page.tsx"
  removed:
    - "src/app/(authed)/planejamento/_lib/service.test.ts"
    - "src/app/(authed)/planejamento/_components/PlanTable.tsx"
    - "src/app/(authed)/planejamento/_components/WeekCard.tsx"
    - "src/app/(authed)/planejamento/_components/WeeklyCardsSection.tsx"
    - "src/app/(authed)/planejamento/_components/SegmentedBar.tsx"
    - "src/app/(authed)/planejamento/_components/ResumoPlano.tsx"
    - "src/app/(authed)/planejamento/_components/PlanItemSheet.tsx"
    - "src/app/(authed)/planejamento/_components/NewPlanItemButton.tsx"
    - "src/app/(authed)/planejamento/_components/DeletePlanItemDialog.tsx"
    - "src/app/(authed)/planejamento/_components/InlineGasteiEditor.tsx"
    - "src/app/(authed)/planejamento/_components/CopyPlanButton.tsx"
    - "src/app/(authed)/planejamento/_components/groupColors.ts"
key-decisions:
  - "CategoryBudget por (userId, month, categoryId) com auto-copy do mês anterior — espelha o MonthlyBudget (D-03)"
  - "dayRange exposto como { startDay, endDay } (derivado de weekDateRange) — a UI formata o rótulo"
  - "Teto vazio/zero no editor = remover o teto (clearCategoriaTetoAction); save só aceita Int positivo"
  - "visao-geral/page.tsx passa planTotalCents={null} até o card Planejado/Folga ser retrabalhado no Plano 03b-03"
requirements-completed: [CASA-R-01, CASA-R-02, CASA-R-03, CASA-R-04]
duration: 8 min
completed: 2026-11-25
---

# Phase 3.5 Plan 02: Casa — Acompanhamento (core) Summary

Substituiu o planejamento semanal manual da Casa por um acompanhamento guiado pelos lançamentos: barra "Dinheiro do mês" editável com restante, tetos mensais por categoria como referência ("gastei X de Y", nunca bloqueia) e gasto semanal por categoria somado automaticamente dos `Transaction` — removendo toda a camada e os componentes do plano manual.

## O que foi construído

- **Task 1 (TDD):** `acompanhamento.ts` com 3 funções puras (sem Prisma) — `computeRestanteMes` (D-02), `computeCategoriaStatus` (D-03, pct limitado a 100, teto zero → 100, nunca bloqueia) e `groupWeeklyByCategory` (D-04, 4 semanas por categoria via `@/lib/weeks` como fonte única). 12 testes Vitest (RED → GREEN).
- **Task 2:** reescreveu `_lib` de `/planejamento` para o acompanhamento — novas funções Prisma (`getCasaCategorySpending`, `getCategoryBudgets`, `getOrCopyCategoryBudgets`, `getCasaWeeklyTransactions`, `upsert/deleteCategoryBudgetService`), `loadAcompanhamentoData`, `saveCategoriaTetoAction`/`clearCategoriaTetoAction`, `categoriaTetoSchema`. Removeu toda a lógica do plano manual (countWeeks, computePlanSummary, getOrCreatePlan, getPlanTotal, WeeklySpend, etc.) e o `service.test.ts`. Ajustou `visao-geral/_lib/loader.ts` para não depender mais do total do plano.
- **Task 3:** nova tela `/planejamento` (Server Component) compondo `MesBar` + `CategoriaTetoList` (+ `InlineCategoriaTetoEditor` Client) + `GastoSemanalAuto`, e apagou os 11 componentes do plano manual.

Todas as queries filtram por `userId` e forçam a Casa (`empresaId null`). pt-BR, Int cents, `formatBRL`. Botões do editor com `min-h-[44px]` (PWA).

## Verification

- `npm test` — 80 testes passam (12 novos em `acompanhamento.test.ts`).
- `npx tsc --noEmit` — sem erros.
- `npm run build` — build de produção verde; rota `/planejamento` gerada (1.21 kB).
- Nenhum arquivo em `planejamento/_lib` ou `visao-geral/_lib` referencia os modelos removidos (`PlanItem`/`WeeklySpend`) nem `getPlanTotal`.
- Verificação humana ponta a ponta fica para o Plano 03b-03 (abrir `/planejamento`).

## Threat model

Mitigações aplicadas conforme o registro STRIDE do plano:
- **T-03b-10/T-03b-12 (Spoofing/IDOR):** `userId` sempre de `supabase.auth.getUser()` nas actions; `month`/`categoryId` server-trusted validados por Zod; nunca do form.
- **T-03b-11 (Tampering):** todas as queries filtram por `userId` e forçam Casa (`empresaId null`); upsert/delete do teto escopados pela unique `(userId, month, categoryId)`.
- **T-03b-13 (Tampering):** `categoriaTetoSchema` exige inteiro positivo; vazio/zero cai no fluxo de remover teto.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] visao-geral/page.tsx destruturava planTotalCents removido do loader**
- **Found during:** Task 2
- **Issue:** O plano manda remover `planTotalCents` do `visao-geral/_lib/loader.ts` mas não tocar `DashboardCards.tsx` (é do Plano 03b-03). Porém `visao-geral/page.tsx` destruturava `planTotalCents` do loader (agora inexistente) e o passava a `DashboardCards` (prop `number | null`) — `tsc` quebraria.
- **Fix:** Em `visao-geral/page.tsx`, parei de destruturar `planTotalCents` e passei `planTotalCents={null}` ao `DashboardCards` (mantém o fallback "--" até o card ser retrabalhado no 03b-03). `DashboardCards.tsx` não foi alterado.
- **Files modified:** `src/app/(authed)/visao-geral/page.tsx`
- **Verification:** `npx tsc --noEmit` passa; `npm run build` verde.
- **Commit:** abd9065

**2. [Rule 1 - Bug] Regex de verificação do Task 2 colide com getWeeklySpending**
- **Found during:** Task 2
- **Issue:** O `<verify>` do Task 2 usa `grep "...weeklySpend..."` não-ancorado. `weeklySpend` é substring de `getWeeklySpending`/`weeklySpending` — função/variável que as regras críticas mandam MANTER. A regra literal daria falso-positivo em `visao-geral/_lib`.
- **Fix:** Validei a intenção real (nenhuma referência aos modelos removidos `PlanItem`/`WeeklySpend` nem a `getPlanTotal`) com um grep ancorado (`prisma\.weeklySpend`, `\bWeeklySpend\b`, etc.) — resultado limpo. Também reescrevi um comentário meu em `visao-geral/_lib/loader.ts` que continha as palavras `getPlanTotal/PlanItem` para não confundir buscas futuras.
- **Files modified:** `src/app/(authed)/visao-geral/_lib/loader.ts` (comentário)
- **Verification:** grep ancorado por modelos removidos retorna vazio; `getWeeklySpending` segue presente em `visao-geral/_lib/service.ts`.
- **Commit:** abd9065

**Total deviations:** 2 auto-fixed (1 blocker, 1 verification-regex). **Impact:** baixo — nenhuma mudança de escopo; `DashboardCards.tsx` permanece intacto para o Plano 03b-03, e a intenção de verificação do plano é satisfeita.

## Known Stubs

- `visao-geral/page.tsx` passa `planTotalCents={null}` — stub intencional e documentado. O card "Planejado/Folga" do dashboard é retrabalhado no **Plano 03b-03** (D-06). Até lá o card mostra o fallback "--", comportamento visual aceitável.

## Self-Check: PASSED

- Arquivos criados existem em disco (acompanhamento.ts/.test.ts, MesBar, CategoriaTetoList, InlineCategoriaTetoEditor, GastoSemanalAuto) — verificado.
- Componentes do plano manual apagados — verificado (diretório `_components` só tem os 4 novos).
- Commits existem: e66fe5d (test RED), a13aa8c (feat GREEN), abd9065 (Task 2), 5e28133 (Task 3).
- `npm test` (80 passam), `npx tsc --noEmit` (limpo), `npm run build` (verde).

## Next

Pronto para o Plano 03b-03 (dashboard da Casa: "Dinheiro do mês / Restante", retrabalhar os cartões Planejado/Folga — D-06) e a verificação humana ponta a ponta de `/planejamento`.
