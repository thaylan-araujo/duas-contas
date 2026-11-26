---
phase: 04d-consolidado-projecao
plan: 03
subsystem: ui
tags: [next, server-component, prisma, vitest, tailwind, consolidado, pnl, das, pro-labore]

# Dependency graph
requires:
  - phase: 04d-02
    provides: "loadPnlData devolve faturamento/lucro + dasEstimadoCents por empresa; computeDasEstimado (fn pura)"
  - phase: 04d-01
    provides: "Empresa.aliquotaDasPercent (migração aditiva)"
  - phase: 04c
    provides: "Transaction.origemEmpresaId — rastreio da origem do pró-labore (par SAÍDA empresa / ENTRADA Casa)"
provides:
  - "Tela /consolidado (seção Empresa): visão somada de todas as empresas do usuário no mês"
  - "Funções puras somarConsolidado/ordenarLinhas (totais == soma das linhas, testadas)"
  - "loadConsolidadoData(userId, month): itera empresas, reusa loadPnlData + computeDasEstimado + pró-labore"
  - "Item de menu 'Consolidado' context 'empresa' no Sidebar e BottomNav"
affects: [04d-04-projecao]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fatia vertical de tela como VISÃO derivada: nenhum modelo/migração novo, só agregação dos números já calculados por empresa"
    - "Função pura de agregação (reduce) como fonte única dos totais, espelhando renda-familiar.ts/pnl.ts"

key-files:
  created:
    - "src/app/(authed)/consolidado/_lib/consolidado.ts"
    - "src/app/(authed)/consolidado/_lib/consolidado.test.ts"
    - "src/app/(authed)/consolidado/_lib/loader.ts"
    - "src/app/(authed)/consolidado/page.tsx"
    - "src/app/(authed)/consolidado/_components/ConsolidadoCards.tsx"
    - "src/app/(authed)/consolidado/_components/ConsolidadoTable.tsx"
  modified:
    - "src/app/(authed)/_components/Sidebar.tsx"
    - "src/app/(authed)/_components/BottomNav.tsx"

key-decisions:
  - "Pró-labore por empresa = SAÍDAS do mês com empresaId = origemEmpresaId = empresa.id (modelo gravado pelo par de 04c)"
  - "Linhas ordenadas DESC por lucro; totais vêm de somarConsolidado (invariante total == soma das linhas)"
  - "DAS 'não definido' na tabela quando aliquotaDefinida false (nunca R$ 0,00 silencioso) — mesma regra do PnlCards"
  - "Página não usa empresaId: consolidado soma TODAS as empresas do usuário (D-02); userId sempre de auth.getUser()"

patterns-established:
  - "Pattern: tela consolidada reusa loadPnlData por empresa em paralelo (Promise.all) + funções puras de soma"

requirements-completed: [CONS-01]

# Metrics
duration: 4 min
completed: 2026-11-26
status: complete
---

# Phase 04d Plan 03: Consolidado (Fatia 4) Summary

**Tela /consolidado somando todas as empresas do usuário no mês — tabela por empresa (faturamento bruto/líquido/lucro, DAS estimado, pró-labore) + linha de TOTAL e cards de topo, com agregação pura testada (total == soma das linhas) e item de menu context 'empresa'.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-11-26T18:27:28Z
- **Completed:** 2026-11-26T18:31:42Z
- **Tasks:** 3
- **Files modified:** 8 (6 criados, 2 modificados)

## Accomplishments
- Funções puras `somarConsolidado` (reduce — fonte única dos totais) e `ordenarLinhas` (DESC por lucro, não muta), com 7 testes Vitest cobrindo lista vazia, soma de 2 empresas, DAS não definido, imutabilidade e ordenação.
- `loadConsolidadoData` itera todas as empresas do usuário, reaproveita `loadPnlData` (bruto/líquido/lucro) + `computeDasEstimado` e soma o pró-labore do mês (SAÍDAS marcadas por `origemEmpresaId`) — nenhuma query/modelo novo além dos existentes.
- Tela `/consolidado`: cards de totais somados + tabela por empresa com linha TOTAL em destaque; DAS "não definido" quando a empresa não tem alíquota; estado vazio em pt-BR quando não há empresas.
- Item "Consolidado" (ícone Layers) na seção Empresa do Sidebar e no Sheet do BottomNav, visível só no contexto de empresa, com realce laranja ativo (isEmpresaRoute inclui /consolidado em ambos).

## Task Commits

Cada tarefa foi commitada atomicamente:

1. **Task 1 (RED): testes de agregação** - `00ab122` (test)
2. **Task 1 (GREEN): funções puras consolidado** - `a823671` (feat)
3. **Task 2: loader + página /consolidado + componentes** - `6b34588` (feat)
4. **Task 3: item de menu Consolidado (Sidebar + BottomNav)** - `e92f8d0` (feat)

_Task 1 seguiu TDD (test → feat); não precisou de refactor._

## Files Created/Modified
- `src/app/(authed)/consolidado/_lib/consolidado.ts` - Interfaces LinhaConsolidado/TotaisConsolidado + funções puras ordenarLinhas/somarConsolidado.
- `src/app/(authed)/consolidado/_lib/consolidado.test.ts` - 7 testes Vitest (invariante total == soma das linhas, lista vazia, imutabilidade).
- `src/app/(authed)/consolidado/_lib/loader.ts` - loadConsolidadoData: itera empresas, reusa loadPnlData/computeDasEstimado, soma pró-labore (SAÍDAS origemEmpresaId no mês); toda query filtra por userId.
- `src/app/(authed)/consolidado/page.tsx` - Server Component /consolidado, userId de auth.getUser(), sem empresaId, estado vazio.
- `src/app/(authed)/consolidado/_components/ConsolidadoCards.tsx` - Cards de totais (bruto/líquido/lucro/DAS/pró-labore), estilo PnlCards.
- `src/app/(authed)/consolidado/_components/ConsolidadoTable.tsx` - Tabela por empresa + linha TOTAL, DAS "não definido", cor da empresa via corDescriptor.
- `src/app/(authed)/_components/Sidebar.tsx` - NavItem Consolidado (grupo Empresa) + isEmpresaRoute inclui /consolidado.
- `src/app/(authed)/_components/BottomNav.tsx` - Item Consolidado no sheetItems + isEmpresaRoute inclui /consolidado.

## Decisions Made
- Pró-labore por empresa é somado das SAÍDAS do mês com `empresaId = origemEmpresaId = empresa.id` (exatamente como o par de 04c grava a perna de saída) — é o mesmo valor que, somado, vira renda familiar na Casa.
- A tabela ordena as linhas DESC por lucro; os totais (cards e linha TOTAL) vêm sempre de `somarConsolidado`, garantindo a invariante "total == soma das linhas" num único ponto.
- DAS mostra "não definido" (não R$ 0,00) quando a empresa não tem alíquota, consistente com PnlCards (D-03).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - nenhuma configuração de serviço externo foi necessária.

## Threat Model Compliance
- T-04d-06 (Information Disclosure): toda query do loader filtra por userId (getEmpresas, loadPnlData, agregação de pró-labore) — só empresas do próprio usuário, nenhuma mistura.
- T-04d-07 (Tampering): `somarConsolidado` é função pura testada (total == soma das linhas, lista vazia) — cards e linha TOTAL não divergem.
- T-04d-08 (Spoofing): userId SEMPRE de `supabase.auth.getUser()`, nunca de searchParams (mesmo padrão de canais/page.tsx).

## Verification
- `npx vitest run` (suíte completa): 128/128 testes passam (121 anteriores + 7 novos).
- `npx tsc --noEmit`: limpo.
- `npm run build`: sucesso; rota ƒ /consolidado compilada.
- Checks de contrato: page.tsx usa loadConsolidadoData; loader usa somarConsolidado/ordenarLinhas; /consolidado presente em Sidebar e BottomNav.

## Next Phase Readiness
- Página /consolidado pronta para a Fatia 4d-04 (projeção dos próximos meses + alerta de negativo), que renderiza nesta mesma página.
- Sem blockers.

## Self-Check: PASSED

- Arquivos criados verificados em disco (6/6 presentes).
- Commits verificados no git log (00ab122, a823671, 6b34588, e92f8d0).

---
*Phase: 04d-consolidado-projecao*
*Completed: 2026-11-26*
