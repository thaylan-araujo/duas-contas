# Plan 03b-03 — SUMMARY (Dashboard + verificação)

**Status:** complete (verificado pelo usuário — "deu certo")
**Date:** 2026-11-25

## Tarefas
1. **Loader do dashboard** (`03345db`) — fornece `restanteCents`.
2. **DashboardCards + page** (`e852008`) — cartões "Dinheiro do mês" / "Restante do mês" / "Gasto até hoje"; removidos "Planejado"/"Folga"; mantido o gráfico de gastos reais por semana.
3. **Mudança de comportamento** (`7dc28bc`) — a pedido do usuário: **"Dinheiro do mês" = soma automática das ENTRADAS da Casa no mês** (não editável), em vez do valor fixo de `MonthlyBudget.ceilingCents`.

## Comportamento final (verificado)
- **Dinheiro do mês** = soma das `Transaction` type ENTRADA da Casa no mês (nova função `getTotalEntradas`), não editável. (Confirmado: entrada "Salário" R$ 5.000 → Dinheiro do mês R$ 5.000.)
- **Restante do mês** = entradas − despesas (SAIDA). (Confirmado: R$ 4.900.) Negativo mostra "Passou R$ X" em amarelo.
- **Gasto até hoje** = soma das despesas do mês.
- **Gastos por semana** = gasto real agrupado por semana (1–7/8–14/15–21/22–fim), automático.
- No contexto de **empresa**, os cartões degradam sem quebrar.

## Gates
- `npx tsc --noEmit` limpo · `npm test` 80/80 · `npm run build` OK.

## Dívida técnica (não bloqueante)
`MonthlyBudget.ceilingCents`, `InlineCeilingEditor`, `upsertMonthlyBudgetAction` e `getOrCreateMonthlyBudget` ficaram **órfãos** (não renderizados) após a troca para soma de entradas. Mantidos no código (sem migração). Podem ser removidos numa limpeza futura.

## Artefatos
- Reescrita: `visao-geral/_lib/{service,loader}.ts`, `_components/DashboardCards.tsx`, `page.tsx`
- `planejamento/_lib/loader.ts`, `_components/MesBar.tsx`, `page.tsx`
- Nova função: `getTotalEntradas`
