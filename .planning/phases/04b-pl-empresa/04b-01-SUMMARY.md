# Plan 04b-01 — SUMMARY (Fatia 2: P&L por empresa)

**Status:** complete (verificado pelo usuário — "aprovado")
**Date:** 2026-11-26

## Tarefas
1. **Funções puras de P&L + testes Vitest** (`39d8ca9`, `2aa1e2a`) — `computeBruto`/`computeImpostos`/`computeLiquido`/`computeLucro`/`groupByCategory` em `canais/_lib/pnl.ts`, sem Prisma.
2. **Service + loader + tela `/canais`** (`4740797`) — `getReceitasPorCategoria`/`getCustosPorCategoria`, `loadPnlData`, Server Component com guarda de posse (IDOR). Cards + listas por categoria.
3. **Placeholder da Casa + verificação** (`843eeee`) — contexto Casa/empresa inexistente mostra aviso, sem quebrar.

## Resultado (verificado pelo usuário na Elite Juris)
- **Faturamento bruto** = Σ receitas (ENTRADA) · **líquido** = bruto − imposto · **lucro** = receitas − custos.
- Confirmado: receitas R$ 1.700 (Recorrência 1.000 + Projetos 700), imposto R$ 400 → **Bruto R$ 1.700 · Líquido R$ 1.300 · Lucro R$ 1.300**. Listas de receitas/custos por categoria corretas.
- Sem migração, sem modelo novo (visão derivada dos lançamentos).

## Correções de contexto incluídas (deviations, além do plano)
Durante a verificação, o usuário encontrou um bug da Fatia 1 (contexto da empresa se perdia ao navegar). Corrigido:
- **`9574834`** — `Sidebar`/`BottomNav` propagam `?empresaId=` da empresa ativa em todos os links; o contexto não se perde mais ao navegar pelo menu.
- **`f23d1bc`** — menu **contexto-aware**: Casa ativa esconde Canais/Dívidas; empresa ativa esconde Planejamento/Contas fixas; Visão geral, Lançamentos, Calendário e Relatório sempre. (Atende ao pedido "se não existe na empresa, não faz sentido ter a tela".)

## Gates
- `npx tsc --noEmit` limpo · `npm test` 95/95 · `npm run build` OK.

## Artefatos
- `canais/_lib/{pnl,pnl.test,service,loader}.ts`, `canais/_components/{PnlCards,CategoryBreakdownList,CanaisPlaceholder}.tsx`, `canais/page.tsx`
- Correções: `_components/{Sidebar,BottomNav}.tsx`
