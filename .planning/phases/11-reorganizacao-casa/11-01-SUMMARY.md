---
phase: 11-reorganizacao-casa
plan: 01
subsystem: navegacao-casa
tags: [nav, routing, metas, casa]
requires:
  - loadContasFixasData (contas-fixas/_lib/loader.ts)
  - GoalCard, NewGoalAddCard (contas-fixas/_components)
provides:
  - rota /metas (bloco de metas/reservas)
  - menu da Casa = Visão Geral · Lançamentos · Metas
affects:
  - src/app/(authed)/_components/Sidebar.tsx
  - src/app/(authed)/_components/BottomNav.tsx
tech-stack:
  added: []
  patterns:
    - Server Component skeleton (supabase server client → user.id → loader)
    - NavItem array edit (sem tocar showInContext/hrefWith)
key-files:
  created:
    - src/app/(authed)/metas/page.tsx
  modified:
    - src/app/(authed)/_components/Sidebar.tsx
    - src/app/(authed)/_components/BottomNav.tsx
decisions:
  - Removidos imports CalendarDays/Receipt (Sidebar e BottomNav) por ficarem sem uso após as remoções
  - /metas reusa loadContasFixasData usando apenas goals — zero _lib novo
metrics:
  duration: ~3min
  completed: 2026-11-28
  tasks: 2
  files: 3
status: complete
---

# Phase 11 Plan 01: Navegação da Casa + rota /metas Summary

Adiciona "Metas" como item próprio do menu da Casa com a rota real `/metas` (bloco de metas/reservas reaproveitando `loadContasFixasData` + `GoalCard` + `NewGoalAddCard`), e enxuga o menu da Casa para **Visão Geral · Lançamentos · Metas**, removendo "Planejamento" e "Contas fixas e metas" de Sidebar e BottomNav.

## O que foi entregue

### Task 1 — Rota /metas (commit 149a254)
- Novo Server Component `src/app/(authed)/metas/page.tsx`.
- Segue o skeleton de `contas-fixas/page.tsx`: `createSupabaseServerClient()` → `supabase.auth.getUser()` → `user!.id` → `loadContasFixasData(userId)`, usando SOMENTE o campo `goals`.
- Importa `GoalCard` de `../contas-fixas/_components/GoalCard` e `NewGoalAddCard` de `../contas-fixas/_components/NewEntityButtons`.
- Renderiza o mesmo grid "Metas e reserva" (header + descrição "Caixinhas separadas do dinheiro do dia a dia" + grid de `GoalCard` + `NewGoalAddCard` ao final). Cabeçalho eyebrow "CASA" + título "Metas".
- Formatação de valor/data herdada de `GoalCard` (que usa `src/lib/format.ts`). Zero `_lib` novo; nenhum arquivo em `contas-fixas/_lib/` tocado.

### Task 2 — Menu da Casa (commit 3bf1f17)
- **Sidebar.tsx:** removidos os dois itens Casa (`/planejamento` com `CalendarDays`, `/contas-fixas` com `Receipt`); adicionado `{ label: 'Metas', href: '/metas', icon: Target, group: 'Casa', context: 'casa' }`. Imports `CalendarDays`/`Receipt` removidos (sem mais uso); `Target` adicionado.
- **BottomNav.tsx:** em `primaryItems`, Planejamento substituído por Metas (`/metas`, `Target`, context 'casa'); em `sheetItems`, "Contas fixas e metas" removido. Imports `CalendarDays`/`Receipt` removidos; `Target` adicionado.
- Lógica `showInContext`/`hrefWith`/render e os itens de contexto empresa (Canais/Consolidado/Dívidas) permanecem inalterados.

## Verificação

- `npm run build`: passa; rota `/metas` compila (aparece na listagem de rotas, 36 kB).
- `npm run lint`: 0 errors, 2 warnings — ambos PRÉ-EXISTENTES em `lancamentos/_components/TransactionSheet.tsx` (`cn` e `clearErrors` não usados), não relacionados a esta fatia.
- `npx vitest run`: 241 testes passando (23 arquivos) — igual ao baseline; nenhuma regressão.
- Checagens estruturais: `/metas` presente em Sidebar e BottomNav; nenhuma ocorrência de `/planejamento` ou `/contas-fixas` nos menus; itens empresa intactos.

## Confirmação de escopo (sem DB/service)

Nenhum arquivo `_lib/*`, `service.ts`, `actions.ts`, `schema.ts` ou migração foi tocado. `/metas` apenas consome `loadContasFixasData` existente. A rota `/contas-fixas` NÃO foi apagada (o redirect é da Fatia 02).

## Deviations from Plan

None - plano executado exatamente como escrito. A remoção dos imports `CalendarDays`/`Receipt` estava prevista no `<action>` da Task 2 (verificação de uso antes de remover, feita e confirmada).

## Self-Check: PASSED

- FOUND: src/app/(authed)/metas/page.tsx
- FOUND: commit 149a254 (feat 11-01 rota /metas)
- FOUND: commit 3bf1f17 (feat 11-01 menu da Casa)
