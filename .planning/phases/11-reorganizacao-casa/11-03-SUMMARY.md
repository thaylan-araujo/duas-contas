---
phase: 11-reorganizacao-casa
plan: 03
subsystem: ui-read-only
tags: [visao-geral, read-only, contas-fixas, tetos, deep-link, casa]
status: complete
requires:
  - 11-02 (os destinos de edição existem: /lancamentos?aba=contas-fixas e ?aba=tetos)
provides:
  - "Prop readOnly em ContasFixasBloco (esconde gerar o mês / marcar pago / MarcarPagoDialog)"
  - "Prop readOnly em CategoriaTetoList (omite InlineCategoriaTetoEditor)"
  - "Visão Geral da Casa só-leitura: sem nenhum controle que muta dado, com dois atalhos para a aba de edição"
affects:
  - "Nenhum: cálculo posso-gastar e serviços da Fase 10 permanecem inalterados"
tech-stack:
  added: []
  patterns:
    - "Prop readOnly presentacional (default false) reusando o mesmo componente em leitura (VG) e edição (abas de Lançamentos)"
    - "Atalhos de navegação (next/link) preservando month/empresaId via URLSearchParams anexado a ?aba="
key-files:
  created: []
  modified:
    - src/app/(authed)/visao-geral/_components/ContasFixasBloco.tsx
    - src/app/(authed)/planejamento/_components/CategoriaTetoList.tsx
    - src/app/(authed)/visao-geral/page.tsx
decisions:
  - "readOnly com default=false — modo interativo das abas de Lançamentos preservado sem regressão da Fatia 2 (T-11-09)."
  - "Além dos botões/dialog, gatear em !readOnly o alerta de erro de geração e a dica textual que menciona 'Gerar contas do mês' no estado vazio — na VG não há botão para seguir essa dica."
  - "Links de edição usam text-casa + min-h-[44px] (regra PWA ≥44px) e self-start; são navegação (permitido), não mutação."
metrics:
  tasks: 2
  files-created: 0
  files-modified: 3
  completed: 2026-11-28
---

# Phase 11 Plan 03: Visão Geral só-leitura — Summary

A Visão Geral da Casa virou um painel de **leitura**: `ContasFixasBloco` e `CategoriaTetoList` ganharam uma prop presentacional `readOnly` (default `false`) que, quando ligada, remove todo controle que muta dado — "Gerar contas do mês", "Marcar pago" + `MarcarPagoDialog` no primeiro, e o `InlineCategoriaTetoEditor` no segundo — mantendo intactas as listas, status pills, totais, "gastei X de Y" e barras de progresso. A página `/visao-geral` passa `readOnly` aos dois blocos e oferece **dois atalhos de navegação obrigatórios** para a aba de edição em Lançamentos. As abas de Lançamentos continuam usando os mesmos componentes em modo interativo (default `false`), sem regressão da Fatia 2.

## O que foi feito

### Task 1 — Prop readOnly em ContasFixasBloco e CategoriaTetoList (commit 6b9c6a6)
- **ContasFixasBloco.tsx**: adicionada `readOnly?: boolean` (default `false`). Com `readOnly=true`:
  - não renderiza o botão "Gerar contas do mês" (`!readOnly && temFixasCadastradas`);
  - não renderiza o botão "Marcar pago" por linha (`!readOnly && l.status === 'EM_ABERTO'`);
  - não monta o `MarcarPagoDialog` (`!readOnly && marcando`);
  - também gateado em `!readOnly`: o alerta de erro de geração e o trecho da dica do estado vazio que recomenda "Gerar contas do mês" (sem botão para seguir na VG).
  - Mantidos sempre: header com total/"em aberto", lista de linhas, `StatusPill`, bloco "a definir"/estimativa, formatação via `format.ts`. Os handlers (`useTransition`/`handleGerar`) seguem declarados mas nunca são acionados em leitura — nenhum elemento interativo que dispare Server Action aparece.
- **CategoriaTetoList.tsx**: adicionada `readOnly?: boolean` (default `false`). Com `readOnly=true` o `InlineCategoriaTetoEditor` (único controle de edição) não é renderizado; mantidos nome, "gastei X de Y", barra de progresso e destaque de "estourou".

### Task 2 — Visão Geral em modo leitura + atalhos para editar (commit 302bf08)
- **visao-geral/page.tsx**:
  - `ContasFixasBloco` e `CategoriaTetoList` agora recebem `readOnly`.
  - Dois `Link` (next/link) obrigatórios: **"Editar/gerir contas fixas"** → `/lancamentos?aba=contas-fixas` (perto do bloco de contas fixas) e **"Editar tetos"** → `/lancamentos?aba=tetos` (perto do bloco de tetos). O de tetos é mandatório porque `/planejamento` agora redireciona para `/visao-geral` (Fatia 2) — sem esse link quem editava tetos pelo antigo /planejamento ficaria órfão.
  - Os hrefs preservam o contexto: `month` e `empresaId` (quando presentes) são anexados via `URLSearchParams` ao `?aba=…`.
  - `HeroPossoGastar`, `GastoSemanalAuto`, `DashboardCards`, `RendaFamiliarPorOrigem`, `CategorySpendingBars`, `WeeklyBarChart` permanecem como estão (já eram leitura). `InlineCeilingEditor` não é importado nem reintroduzido. Nenhum loader/serviço/cálculo tocado.

## Deviations from Plan

None — plano executado exatamente como escrito. Nenhum arquivo `_lib/`, `service.ts`, `schema.ts`, `actions.ts` ou `loader.ts` foi modificado; nenhuma migração; cálculo "posso gastar" intacto. As gateagens extras (alerta de erro de geração e a dica textual no estado vazio) são parte natural do mesmo requisito "nenhum controle/menção de ação em modo leitura", dentro do escopo presentacional da prop — não constituem desvio das regras 1-4.

## Verificação

- `npm run build`: **clean** (rota `/visao-geral` server-rendered, 119 kB / 300 kB First Load).
- `npm run lint`: **0 erros**; 2 warnings **pré-existentes** em `TransactionSheet.tsx` (`cn` e `clearErrors` não usados) — arquivo não tocado nesta fatia (já documentados na 11-02).
- `npx vitest run`: **241 passed (23 arquivos)** — mesma contagem da linha de base, nada quebrado.
- Escopo: `git diff --name-only HEAD~2 HEAD` toca **apenas** os 3 arquivos planejados; nenhum `_lib/service/schema/actions/migration`.

### Checklist estrutural (grep-checkable)
- `readOnly` presente em ContasFixasBloco.tsx. ✓
- `readOnly` presente em CategoriaTetoList.tsx. ✓
- `readOnly` presente em visao-geral/page.tsx (passado aos 2 blocos). ✓
- Link para `aba=contas-fixas` presente na Visão Geral. ✓
- Link para `aba=tetos` presente na Visão Geral. ✓
- `InlineCeilingEditor` ausente de visao-geral/page.tsx (`grep -c` = 0). ✓

## Prohibition check (anti-objetivo T-11-08)

/visao-geral **não** renderiza nenhum controle que muta dado em modo Casa:
- sem botão "Gerar contas do mês";
- sem botão "Marcar pago" nem `MarcarPagoDialog`;
- sem `InlineCategoriaTetoEditor` (editor de teto);
- sem `InlineCeilingEditor` (não importado).
Permanecem os resumos de leitura (contas fixas com StatusPill, tetos "gastei X de Y" + barra), hero posso-gastar, renda familiar e gráficos. Os dois atalhos são `Link` de navegação (permitidos), não mutações.

## UAT (manual — a confirmar pelo usuário)

Exige rodar o app (`npm run dev`) no contexto Casa (sem `?empresaId`):

1. **Sem botões de ação:** abrir `/visao-geral` → o bloco Contas fixas mostra a lista com status mas **nenhum** botão "Gerar contas do mês" nem "Marcar pago"; o bloco Por categoria mostra "gastei X de Y" + barra mas **nenhum** editor de teto.
2. **Atalhos de edição funcionam:** clicar em "Editar/gerir contas fixas" leva a `/lancamentos?aba=contas-fixas`; clicar em "Editar tetos" leva a `/lancamentos?aba=tetos`. Ambos preservam o mês selecionado na URL.
3. **posso-gastar inalterado:** o número do hero é idêntico ao de antes desta fatia (nenhum cálculo mudou).
4. **Abas de Lançamentos não regrediram (Fatia 2):** em `/lancamentos?aba=contas-fixas` os botões "Gerar o mês"/"Marcar pago" continuam presentes; em `?aba=tetos` o editor inline de teto continua presente (readOnly=false por default).

## Self-Check: PASSED

- src/app/(authed)/visao-geral/_components/ContasFixasBloco.tsx — FOUND
- src/app/(authed)/planejamento/_components/CategoriaTetoList.tsx — FOUND
- src/app/(authed)/visao-geral/page.tsx — FOUND
- commit 6b9c6a6 — FOUND
- commit 302bf08 — FOUND
