---
phase: 03-planning
plan: 03
subsystem: planejamento
tags: [planejamento, weekly-cards, gastei, fixed-accounts, dashboard]
requires: ["03-01", "03-02", "03-04"]
provides:
  - "getAutoGastei / getWeeklySpends / saveWeeklySpend / clearWeeklySpend (WeeklySpend override)"
  - "resolveGastei / computeWeekRemaining / fixedAccountsAsRows (pure, tested)"
  - "getPlanTotal (dashboard reads it)"
  - "WeekCard / WeeklyCardsSection / InlineGasteiEditor"
  - "Casa dashboard Planejado + Folga wired to the real plan total"
affects:
  - "src/app/(authed)/planejamento/*"
  - "src/app/(authed)/visao-geral/*"
tech-stack:
  added: []
  patterns:
    - "Override persistido nullable-by-row (WeeklySpend) com precedência do zero explícito (resolveGastei)"
    - "Derivação em tempo de render (fixedAccountsAsRows) — fonte única, não persiste"
    - "Editor inline por categoria (click-to-edit → Server Action via useTransition)"
    - "Faixa de semana compartilhada (weekDateRange) entre cartões e dashboard"
key-files:
  created:
    - "src/app/(authed)/planejamento/_components/WeekCard.tsx"
    - "src/app/(authed)/planejamento/_components/WeeklyCardsSection.tsx"
    - "src/app/(authed)/planejamento/_components/InlineGasteiEditor.tsx"
  modified:
    - "src/app/(authed)/planejamento/_lib/service.ts"
    - "src/app/(authed)/planejamento/_lib/service.test.ts"
    - "src/app/(authed)/planejamento/_lib/schema.ts"
    - "src/app/(authed)/planejamento/_lib/loader.ts"
    - "src/app/(authed)/planejamento/_lib/actions.ts"
    - "src/app/(authed)/planejamento/page.tsx"
    - "src/app/(authed)/planejamento/_components/PlanTable.tsx"
    - "src/app/(authed)/visao-geral/_lib/loader.ts"
    - "src/app/(authed)/visao-geral/_components/DashboardCards.tsx"
    - "src/app/(authed)/visao-geral/page.tsx"
key-decisions:
  - "resolveGastei trata manualCents === null/undefined como 'sem override'; 0 explícito é override (Pitfall 4)"
  - "getFixedAccounts reutilizado de contas-fixas/_lib/service.ts (não duplicado em planejamento) — fonte única"
  - "Editor Gastei renderizado uma vez por categoria dentro do cartão (consistente com a chave do WeeklySpend)"
  - "Totais por semana agregam o Gastei uma vez por categoria (evita dupla contagem quando há vários itens da mesma categoria)"
  - "Tooltip via atributo nativo title (sem adicionar componente Tooltip/Radix)"
  - "Dashboard planTotalCents é null só quando não há PlanItem E não há FixedAccount (mês novo mantém '--')"
requirements-completed: [PLAN-04, PLAN-06]
duration: 7 min
completed: 2026-11-25
---

# Phase 3 Plan 3: Cartões semanais, Gastei auto+override e wiring do dashboard — Summary

Fecha o slice `/planejamento`: 4 cartões semanais ("Gastos semanais") com "Gastei R$" automático (soma de Transactions CASA SAIDA na faixa da semana via `weekDateRange`) + override persistido em `WeeklySpend` com "Recalcular", derivação das contas fixas como linhas somente-leitura no grupo "Contas fixas" (em render, não persistido — D-05), e os cards "Planejado"/"Folga" do dashboard da Casa agora mostrando o total planejado real em vez de "--".

## What Was Built

- **Task 1 — serviços + cálculos puros + schema (TDD):** `resolveGastei` (precedência do override, inclusive zero explícito), `computeWeekRemaining`, `fixedAccountsAsRows` (linhas derivadas somente-leitura). Prisma: `getAutoGastei` (agregado CASA SAIDA por faixa de semana), `getWeeklySpends` (mapa de overrides), `saveWeeklySpend`/`clearWeeklySpend` (upsert/deleteMany escopados por userId), `getPlanTotal` (persistidos + fixas derivadas). `weeklySpendSchema` (month/weekIndex 0–3/categoryId/manualCents não-negativo). 13 novos testes (total 25 no arquivo).
- **Task 2 — UI semanal + wiring:** `loadPlanData` monta os dados das 4 semanas (auto Gastei por categoria + override + sobra por item/semana) e deriva as linhas das contas fixas. `saveGasteiAction`/`clearGasteiAction`. `InlineGasteiEditor` (blur/Enter salva override, "Recalcular" limpa), `WeekCard` (realce da semana atual, strip Planejado/Ainda-pode-gastar, editor por categoria), `WeeklyCardsSection`. `PlanTable` renderiza as linhas das contas fixas somente-leitura com ícone `Lock` 14px + tooltip.
- **Task 3 — dashboard:** `loadDashboardData` adiciona `getPlanTotal`; `DashboardCards` mostra Planejado (formatBRL) e Folga = teto − planejado (cores positivo/warning), mantendo "--" quando não há plano.

## How To Test

1. `npm test` → 55 testes verdes (incl. `resolveGastei`, `fixedAccountsAsRows`, `weeklySpendSchema`).
2. `npm run build` + `npx tsc --noEmit` → limpos.
3. `/planejamento`: veja os 4 cartões semanais (1–7 / 8–14 / 15–21 / 22–fim) com faixa de dias, strip "Planejado"/"Ainda pode gastar", campo "Gastei R$" por categoria (valor automático), digite um valor → persiste e aparece "Recalcular"; clique "Recalcular" → volta ao automático. A tabela do plano mostra as contas fixas cadastradas como linhas com cadeado.
4. `/visao-geral`: os cards "Planejado" e "Folga" mostram valores reais (não "--") quando há plano/contas fixas.

## Deviations from Plan

### [Rule 3 — Blocking/reuse] Reaproveitamento de `getFixedAccounts`

- **Found during:** Task 1
- **Issue:** O plano pedia adicionar `getFixedAccounts(userId)` em `planejamento/_lib/service.ts`, mas uma função idêntica já existe em `contas-fixas/_lib/service.ts` (Plano 03-04).
- **Fix:** Importei e reutilizei `getFixedAccounts` de `../../contas-fixas/_lib/service` em `getPlanTotal` e no loader — evita duplicar a consulta Prisma e mantém fonte única.
- **Files modified:** `planejamento/_lib/service.ts`, `planejamento/_lib/loader.ts`
- **Verification:** `npx tsc --noEmit` limpo; `getPlanTotal` compila e usa as contas fixas.
- **Commit:** d185e76 / cf8c10d

### [Rule 1 — Correctness] Agregação do Gastei por semana sem dupla contagem

- **Found during:** Task 2
- **Issue:** Como o override/`getAutoGastei` é por categoria e um cartão pode ter vários itens da mesma categoria, somar `gasteiCents` por item inflaria o total da semana.
- **Fix:** O total "Gastei" da semana agrega cada categoria distinta uma única vez (`gasteiByCategory`), coerente com a chave do `WeeklySpend` e com o editor por categoria (D-02).
- **Files modified:** `planejamento/_lib/loader.ts`
- **Verification:** build + tsc verdes; sobra por semana = planejado − gastei agregado corretamente.
- **Commit:** cf8c10d

### [Rule 3 — UI dependency] Tooltip via `title` nativo

- **Found during:** Task 2
- **Issue:** Não há componente Tooltip (Radix) no projeto; a UI-SPEC pede tooltips no ícone Lock e no Pencil do Gastei.
- **Fix:** Usei o atributo HTML `title` com os textos exatos da UI-SPEC — satisfaz a copy sem adicionar dependência.
- **Files modified:** `planejamento/_components/PlanTable.tsx`, `planejamento/_components/InlineGasteiEditor.tsx`
- **Commit:** cf8c10d

**Total deviations:** 3 auto-fixed (1 reuse/blocking, 1 correctness, 1 UI dependency). **Impact:** nenhum em escopo/funcionalidade — todas preservam o comportamento especificado e reduzem duplicação.

## TDD Gate Compliance

Task 1 era `tdd="true"`. RED foi executado e confirmado (14 testes falhando: `TypeError … safeParse`/exports ausentes) antes da implementação; GREEN levou os 25 testes do arquivo a verde. RED e GREEN foram agrupados em um único commit `feat(03-03)` (d185e76) em vez de commits `test`+`feat` separados — o ciclo RED→GREEN foi observado e registrado aqui, mas o histórico git não contém um commit `test(...)` isolado. Comportamento verificado, sem regressões (55/55 testes verdes).

## Authentication Gates

Nenhum.

## Known Stubs

Nenhum — todos os valores (Gastei automático, override, total planejado, folga) são calculados a partir de dados reais; os fallbacks "--" são intencionais (mês sem plano, per 03-UI-SPEC).

## Verification Results

- `npx vitest run "src/app/(authed)/planejamento/_lib/service.test.ts"` → 25/25 verdes
- `npm test` → 55/55 verdes (3 arquivos)
- `npx tsc --noEmit` → limpo
- `npm run build` → sucesso (/planejamento 50.5 kB, /visao-geral 116 kB)
- `getAutoGastei` usa `weekDateRange` de `@/lib/weeks` (confirmado no código)
- grep `planTotalCents` em `DashboardCards.tsx` → presente

## Next

Fase 3 (planejamento) com todos os planos (03-01..03-04) concluídos. Pronto para verificação da fase.

## Self-Check: PASSED

- Created files verified on disk: WeekCard.tsx, WeeklyCardsSection.tsx, InlineGasteiEditor.tsx, 03-03-SUMMARY.md
- Commits verified: d185e76, cf8c10d, 8676d39
