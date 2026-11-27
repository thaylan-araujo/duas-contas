---
phase: 10-pago-a-pagar
plan: 01
subsystem: casa-pago-a-pagar
tags: [casa, visao-geral, planejamento, pago-a-pagar, R-1, R-2]
requires:
  - "Transaction.status/dueDate/estimatedCents/fixedAccountId (migração 20261127165023, aplicada pelo orquestrador — Task 1)"
  - "FixedAccount.isVariableAmount"
provides:
  - "computeComprometido / computePossoGastar (funções puras — R-2)"
  - "getEmAbertoCasa (leitor SAIDA EM_ABERTO da Casa)"
  - "filtro status=PAGO nos leitores de gasto real/semanal/tetos da Casa (R-1)"
  - "HeroPossoGastar (card 'posso gastar ainda' na Visão Geral Casa)"
affects:
  - "src/app/(authed)/visao-geral"
  - "src/app/(authed)/planejamento"
tech-stack:
  added: []
  patterns: ["funções puras co-locadas + Vitest", "vi.mock('@/lib/prisma') para asserir where", "tokens Tailwind v4 (casa/positive/warning/destructive)"]
key-files:
  created:
    - "src/app/(authed)/planejamento/_lib/comprometido.ts"
    - "src/app/(authed)/planejamento/_lib/comprometido.test.ts"
    - "src/app/(authed)/planejamento/_lib/service.test.ts"
    - "src/app/(authed)/visao-geral/_lib/service.test.ts"
    - "src/app/(authed)/visao-geral/_components/HeroPossoGastar.tsx"
  modified:
    - "src/app/(authed)/visao-geral/_lib/service.ts"
    - "src/app/(authed)/visao-geral/_lib/loader.ts"
    - "src/app/(authed)/planejamento/_lib/service.ts"
    - "src/app/(authed)/visao-geral/page.tsx"
decisions:
  - "Chips do hero (builder discretion): Contas fixas = parcela em aberto comprometida (comprometido − já pago); Já pago = Variável gasto = gasto real PAGO (nesta fatia ainda não há fixas EM_ABERTO geradas)"
  - "EM_ABERTO é Casa-SAIDA-only: no contexto empresa o loader não chama getEmAbertoCasa e possoGastar fica 0 (R-1)"
  - "Em-aberto token = --color-warning/âmbar; pago = --color-positive/verde; casa = azul; alerta ≥100% = red-200/300 (sobre o fundo azul do hero)"
metrics:
  duration: "~10min"
  completed: "2026-11-27"
  tasks_completed: 2
  files_created: 5
  files_modified: 4
status: complete
---

# Phase 10 Plan 01: Casa "Pago e A Pagar" — Fatia 1 Summary

Filtro `status='PAGO'` nos leitores de caixa real da Casa (R-1) + funções puras do "comprometido"/"posso gastar ainda" (R-2, testadas) + hero "posso gastar ainda" na Visão Geral da Casa descontando as fixas em aberto.

> **Task 1 (migração aditiva) foi aplicada pelo orquestrador** (commit `700603e`): `Transaction.status/dueDate/estimatedCents/fixedAccountId` + `FixedAccount.isVariableAmount` + índice único parcial `(fixedAccountId, dueDate)`. Esta sessão executou **apenas as Tasks 2 e 3** — nenhum toque no schema, migração ou banco.

## O que foi feito

### Task 2 — Funções puras (TDD RED→GREEN, Vitest)
- `computeComprometido(pagosCents, emAberto[])`: `Σ pagos + Σ(em aberto: "a definir" usa estimativa, senão valor certo)`. "A definir" sem estimativa soma 0 (R-5 sem histórico).
- `computePossoGastar(entradasCents, comprometidoCents)`: `entradas − comprometido` (pode negativar).
- Teste R-2 (anti-contagem-dupla): a MESMA linha em aberto→pago dá o MESMO comprometido antes/depois. 9 testes, todos passam. Funções 100% puras (nenhum import de Prisma — verificado).

### Task 3 — Filtro R-1 + leitor em aberto + hero
- `status: 'PAGO'` adicionado ao `where` de `getTotalSpent`, `getCategorySpending`, `getWeeklySpending` (visao-geral) e dos gêmeos Casa `getCasaCategorySpending`, `getCasaWeeklyTransactions` (planejamento).
- `getTotalEntradas` e `getRendaPorOrigem` **não** filtrados (entradas intactas; empresas default PAGO).
- Novo `getEmAbertoCasa(userId, month)`: lê SAIDA EM_ABERTO da Casa, mapeia para `EmAbertoLinha` (`isVariableAmount` da fixa vinculada, null→false).
- `loader.ts`: no contexto Casa inclui `getEmAbertoCasa`, computa `comprometido`/`possoGastar` pelas funções puras; no contexto empresa não lê em aberto (possoGastar=0).
- `HeroPossoGastar`: card casa (gradiente derivado do token `--color-casa`), valor grande via `formatBRL`, barra de % comprometido (limitada a 100), estado ≥100% em alerta com valor negativo, 3 chips, alvos ≥44px.
- `page.tsx`: renderiza o hero antes dos `DashboardCards` só quando `isCasa`; ramo empresa inalterado.
- Testes R-1 MANDATÓRIOS (`vi.mock('@/lib/prisma')`): asserem `status:'PAGO'` nos 5 leitores de SAIDA, ausência de `status` nas entradas, e o shape de `getEmAbertoCasa`. 9 testes, todos passam.

## Verification
- `npx vitest run` → **219 passed (21 files)** (baseline 201 + 18 novos desta fatia).
- `npm run build` → **limpo** (rota `/visao-geral` compila). Único warning: deprecação de `package.json#prisma` — **pré-existente**, não relacionado a esta fatia.
- DB/schema/migrations: **não tocados** (git diff `700603e..HEAD` só mostra arquivos em `src/`).

## Deviations from Plan
Nenhuma. As Tasks 2 e 3 foram executadas exatamente como escritas. Task 1 estava pré-aplicada pelo orquestrador (conforme instruído).

## Known Stubs
Nenhum. O hero renderiza com dados reais do loader. Enquanto não houver linhas EM_ABERTO (geração de fixas é Fatia 02), `possoGastar == restante` atual — comportamento esperado (regressão zero nesta fatia).

## Threat Flags
Nenhuma superfície nova fora do `<threat_model>` do plano. T-10-04 (contagem dupla na projeção) permanece `accept`/deferido — `consolidado/loader.ts` não foi tocado.

## Self-Check: PASSED
