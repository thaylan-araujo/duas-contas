---
phase: 04d-consolidado-projecao
plan: 04
subsystem: ui
tags: [projecao, consolidado, date-fns, vitest, recharts-free, pure-functions]

# Dependency graph
requires:
  - phase: 04d-03
    provides: tela /consolidado + loadConsolidadoData (linhas/totais por empresa)
  - phase: 04d-02
    provides: computeDasEstimado (DAS estimado por alíquota × faturamento)
  - phase: 04b
    provides: getTotalEntradas/getTotalSpent por empresa (série histórica)
  - phase: 03b
    provides: getFixedAccounts (contas fixas datadas da Casa)
provides:
  - "Funções puras de projeção (mediaUltimosMeses, projetarSobraMensal, projetarMeses, algumMesNegativo) + MesProjetado"
  - "loadProjecaoData: série histórica de 3 meses → projeção não cumulativa por empresa + família"
  - "ProjecaoTable + projeção renderizada em /consolidado com alerta de mês negativo"
affects: [impostos-dividas, projecao-caixa-cumulativa, consolidado]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Função pura + Vitest para a aritmética de correção-crítica (espelha das.ts/renda-familiar.ts)"
    - "date-fns addMonths/subMonths/format (ptBR) para avançar/recuar meses — nunca aritmética de mês na mão"
    - "Projeção não cumulativa (D-04): cada mês é a média independente, sem saldo de caixa"

key-files:
  created:
    - src/app/(authed)/consolidado/_lib/projecao.ts
    - src/app/(authed)/consolidado/_lib/projecao.test.ts
    - src/app/(authed)/consolidado/_components/ProjecaoTable.tsx
  modified:
    - src/app/(authed)/consolidado/_lib/loader.ts
    - src/app/(authed)/consolidado/page.tsx

key-decisions:
  - "Janela histórica = 3 meses (Discrição do Claude — D-04); numMeses da projeção clamped a 3..6"
  - "Despesa variável da família = max(0, saída total da Casa − contas fixas) por mês, depois média; despesa esperada = contas fixas + média variáveis"
  - "DAS esperado por empresa = computeDasEstimado(alíquota, receita MÉDIA projetada), reusando a fn de 04d-02"
  - "Rótulo de mês em pt-BR via date-fns format(\"MMM 'de' yyyy\") — virada de ano correta"

patterns-established:
  - "Projeção como funções puras testadas; loader monta a série, UI só renderiza flags (negativo/faltamCents)"
  - "projetarMeses não cumulativo: todos os meses compartilham a mesma sobra média (D-04)"

requirements-completed: [CONS-03, CONS-04]

# Metrics
duration: 4 min
completed: 2026-11-26
status: complete
---

# Phase 04d Plan 04: Projeção simples + alerta de saldo negativo Summary

**Projeção não cumulativa de 3–6 meses (por empresa e família) baseada na média dos últimos 3 meses, renderizada em /consolidado com destaque de mês negativo e "quanto falta", em funções puras testadas com Vitest.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-11-26T18:33:39Z
- **Completed:** 2026-11-26T18:37:16Z
- **Tasks:** 3
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments
- Funções puras de projeção (`mediaUltimosMeses`, `projetarSobraMensal`, `projetarMeses`, `algumMesNegativo`) + interface `MesProjetado`, cobertas por 15 testes Vitest (média/vazio, projeção não cumulativa de N meses, mês negativo com `faltamCents`, virada de ano nos rótulos).
- `loadProjecaoData` monta a série histórica dos últimos 3 meses por empresa e da família (contas fixas + média de variáveis), aplica a média e projeta — tudo ownership-guarded (`where userId`), buscas em `Promise.all`, sem quebrar o retorno de `loadConsolidadoData`.
- `ProjecaoTable` em /consolidado: colunas por mês, mês negativo destacado (`bg-warning/10`) com "faltam R$ ...", rótulo explícito de ESTIMATIVA baseada na média (D-04). Cálculo vem das funções puras; a UI só lê as flags.

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): failing tests de projeção** - `7c12dfb` (test)
2. **Task 1 (GREEN): implementação pura de projeção** - `b7bc6aa` (feat)
3. **Task 2: loadProjecaoData (série histórica + projeção)** - `d435979` (feat)
4. **Task 3: ProjecaoTable + wiring na página /consolidado** - `3645fec` (feat)

_Task 1 seguiu TDD (RED → GREEN); não houve refactor necessário._

## Files Created/Modified
- `src/app/(authed)/consolidado/_lib/projecao.ts` - Funções puras: média, sobra mensal, projeção N meses não cumulativa, detecção de mês negativo (date-fns, centavos Int).
- `src/app/(authed)/consolidado/_lib/projecao.test.ts` - 15 testes Vitest cobrindo os casos do bloco `<behavior>`.
- `src/app/(authed)/consolidado/_components/ProjecaoTable.tsx` - Tabela por mês com destaque de negativo + rótulo de estimativa.
- `src/app/(authed)/consolidado/_lib/loader.ts` - `loadProjecaoData` + `mesesAnteriores` (série histórica família/empresas); retorno de `loadConsolidadoData` intacto.
- `src/app/(authed)/consolidado/page.tsx` - Carrega a projeção em paralelo e renderiza família + por empresa.

## Decisions Made
- **Janela histórica = 3 meses** (Discrição do Claude dentro de D-04); `numMeses` da projeção clamped a 3..6.
- **Despesa variável da família** = `max(0, getTotalSpent(Casa) − contasFixas)` por mês, depois média; despesa esperada = contas fixas + média das variáveis — como pede o CONTEXT ("contas fixas + média das despesas variáveis").
- **DAS esperado por empresa** = `computeDasEstimado(alíquota, receita média projetada)`, reusando a função pura de 04d-02 sobre a receita média (não sobre um mês específico).
- **Projeção não cumulativa** (D-04): todos os meses projetados compartilham a mesma sobra média — não rastreamos saldo de caixa; a UI diz isso explicitamente.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Threat Surface
- T-04d-09 (Information Disclosure): mitigado — toda query de `loadProjecaoData` (`getTotalEntradas`/`getTotalSpent`/`getFixedAccounts`/`getEmpresas`) filtra por `userId`; nenhuma mistura entre empresas ou usuários.
- T-04d-10 (Tampering): mitigado — a aritmética vive em funções puras testadas (15 testes); a UI não recalcula.
- T-04d-11 (confiança indevida): aceito/mitigado por rótulo explícito de "estimativa baseada na média".

No new threat surface introduced beyond the plan's threat_model.

## Next Phase Readiness
- Fatia 4 (04d-04) completa: consolidado + projeção simples + alerta de saldo negativo entregues.
- Projeção completa de caixa (DAS real do Simples + dívidas, saldo cumulativo) permanece deferida (Deferred Ideas no CONTEXT).
- Fase 04d encerra a Fase 4 (multi-empresa) do ponto de vista de consolidado/projeção.

## Self-Check: PASSED

- All created files verified on disk (projecao.ts, projecao.test.ts, ProjecaoTable.tsx, SUMMARY.md).
- All task commits verified in git log (7c12dfb, b7bc6aa, d435979, 3645fec).
- `npx vitest run`: 143 tests passed (128 prévios + 15 novos). `npx tsc --noEmit`: limpo. `npm run build`: sucesso.

---
*Phase: 04d-consolidado-projecao*
*Completed: 2026-11-26*
