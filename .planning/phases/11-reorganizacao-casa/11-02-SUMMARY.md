---
phase: 11-reorganizacao-casa
plan: 02
subsystem: ui-routing
tags: [lancamentos, tabs, redirect, casa, deep-link]
status: complete
requires:
  - 11-01 (menu da Casa aponta para /metas; redirects podem retirar rotas antigas)
provides:
  - Hub Lançamentos com 3 abas (Lançamentos · Contas fixas · Tetos & categorias)
  - "Gerar o mês" / "Marcar pago" / CRUD FixedAccount / definir teto dentro de Lançamentos
  - Redirects das rotas antigas (/contas-fixas → aba; /planejamento → /visao-geral)
affects:
  - Visão Geral (Fatia 3 pode perder botões de edição com segurança)
tech-stack:
  added: []
  patterns:
    - "Deep-link de aba via ?aba= espelhando o molde MonthSelector (searchParams.toString)"
    - "router.refresh() em focus/visibilitychange para re-render pós-mutação sem F5"
    - "Redirect in-page (Option B) preservando o layout (authed)"
key-files:
  created:
    - src/app/(authed)/lancamentos/_components/LancamentosTabs.tsx
    - src/app/(authed)/lancamentos/_components/ContasFixasTabContent.tsx
    - src/app/(authed)/lancamentos/_components/TetosTabContent.tsx
  modified:
    - src/app/(authed)/lancamentos/page.tsx
    - src/app/(authed)/contas-fixas/page.tsx
    - src/app/(authed)/planejamento/page.tsx
decisions:
  - "Refresh pós-mutação via router.refresh() no retorno de foco/visibilidade (caminho preferido, presentacional) — NÃO foi preciso o desvio aditivo de revalidatePath('/lancamentos'); nenhum actions.ts tocado."
  - "Abas Contas fixas/Tetos gated por empresaIdContexto===null (conceitos da Casa); no contexto empresa só aparece a aba Lançamentos."
metrics:
  tasks: 2
  files-created: 3
  files-modified: 3
  completed: 2026-11-28
---

# Phase 11 Plan 02: Lançamentos vira o hub de edição em abas — Summary

Lançamentos agora é o hub de edição da Casa em 3 abas — **Lançamentos** (lista + CRUD atual, default), **Contas fixas** (ContasFixasBloco interativo + CRUD de FixedAccount + gastos do ano) e **Tetos & categorias** (CategoriaTetoList interativo + gerenciar categorias) — reaproveitando os componentes/loaders existentes sem reescrever nenhum. As rotas antigas `/contas-fixas` e `/planejamento` redirecionam in-page para os novos destinos.

## O que foi feito

### Task 1 — Wrapper de abas (?aba=) + recompor Lançamentos (commit 17bdd8e)
- **LancamentosTabs.tsx** (`'use client'`): wrapper controlado sobre o shadcn `Tabs`. Recebe `aba` + os três conteúdos de aba como `ReactNode` (carregados no servidor).
  - Troca de aba preserva `month`/`empresaId`: `new URLSearchParams(searchParams.toString())` + `params.set('aba', value)` + `router.push('/lancamentos?' + params.toString())` — molde do MonthSelector. NÃO há concatenação crua de string.
  - Cada `TabsTrigger` tem `className="min-h-[44px]"` (regra PWA).
  - **Refresh pós-mutação (ENFORCED):** `router.refresh()` disparado em `focus` + `visibilitychange` (quando `document.visibilityState === 'visible'`). Como os Sheets/dialogs movidos não expõem callback de sucesso e seus `revalidatePath` só atingem /visao-geral, /planejamento, /contas-fixas, o retorno de foco à janela (fluxo típico ao fechar um Sheet/dialog) re-sincroniza o conteúdo servidor da aba sem F5. `router.refresh` está presente em `lancamentos/_components/`.
  - Abas Casa condicionais (`hasCasaTabs`): quando `contasFixas`/`tetos` são `null` (contexto empresa), só a aba Lançamentos aparece.
- **ContasFixasTabContent.tsx** (Server Component): `Promise.all([loadDashboardData(userId, currentMonth, null), loadContasFixasData(userId)])`. Renderiza `ContasFixasBloco` **sem** `readOnly` (interativo: gerar o mês / marcar pago, incl. valor variável via MarcarPagoDialog) + seções 3.1 (FixedAccountTable + NewFixedAccountButton) e 3.2 (AnnualExpenseTable + NewAnnualExpenseButton). Sem bloco de metas.
- **TetosTabContent.tsx** (Server Component): `loadAcompanhamentoData` + `getCategories`. Renderiza `CategoriaTetoList` interativo (mantém InlineCategoriaTetoEditor) + `ManageCategoriesButton`.
- **page.tsx** recomposto: lê `aba` de searchParams (default `'lancamentos'`); mantém `getTransactions`/`getCategories`; o corpo atual (ManageCategoriesButton + NewTransactionButton + MonthSelector + TransactionList) vira o conteúdo da aba Lançamentos verbatim; monta `<LancamentosTabs>` passando `null` para as abas Casa quando `empresaIdContexto !== null`.

### Task 2 — Redirects das rotas antigas (commit 0e31d4a)
- **contas-fixas/page.tsx**: `redirect('/lancamentos?aba=contas-fixas')` (in-page, Option B).
- **planejamento/page.tsx**: `redirect('/visao-geral')` (in-page, Option B).
- Pastas `contas-fixas/_components`, `contas-fixas/_lib`, `planejamento/_components`, `planejamento/_lib` preservadas (importadas cross-folder pelas abas, Visão Geral e /metas). Sem bloco `redirects()` no next.config.

## Deviations from Plan

None — plano executado exatamente como escrito. O caminho preferido de refresh (presentacional, `router.refresh()`) foi suficiente; **o desvio aditivo opcional de `revalidatePath('/lancamentos')` NÃO foi necessário**. Nenhum arquivo `_lib/`, `service.ts`, `schema.ts`, `actions.ts` ou `loader.ts` foi modificado; nenhuma migração criada; nenhuma mudança de cálculo ("posso gastar" intacto).

## Verificação

- `npm run build`: clean (rota `/lancamentos` 24.5 kB; `/contas-fixas` e `/planejamento` agora redirects).
- `npm run lint`: 0 erros; 2 warnings **pré-existentes** em `TransactionSheet.tsx` (`cn` e `clearErrors` não usados) — arquivo não tocado nesta fatia.
- `npx vitest run`: **241 passed (23 arquivos)** — mesma contagem da linha de base, nada quebrado.
- Confirmação de escopo: `git diff` dos commits não tocou nenhum `*_lib*`/`*service*`/`*schema*`/`*actions*`.

### Checklist estrutural (grep-checkable)
- 3 arquivos de aba + LancamentosTabs.tsx existem. ✓
- `useSearchParams` + `searchParams.toString()` presentes no wrapper (preserva month/empresaId). ✓
- `min-h-[44px]` em cada TabsTrigger. ✓
- `router.refresh` presente em `lancamentos/_components/`. ✓
- ContasFixasBloco renderizado **sem** `readOnly`. ✓
- CategoriaTetoList renderizado com InlineCategoriaTetoEditor. ✓
- Redirects presentes; pastas `_components`/`_lib` antigas preservadas. ✓

## UAT (manual — a confirmar pelo usuário)

Estes passos exigem rodar o app (`npm run dev`) e interagir — marque como pendentes de confirmação visual:

1. **3 abas no contexto Casa:** abrir `/lancamentos` → abas Lançamentos (default) · Contas fixas · Tetos & categorias. No contexto empresa (`?empresaId=…`) só a aba Lançamentos aparece.
2. **Contexto preservado:** navegar meses / trocar de conta, depois trocar de aba — `month` e `empresaId` sobrevivem (a URL mantém os params; `?aba=` apenas é adicionado). Voltar pelo navegador restaura a aba anterior.
3. **Gerar o mês + marcar pago (aba Contas fixas) sem F5:** "Gerar contas do mês" e "Marcar pago" atualizam a lista ao voltar o foco à janela (router.refresh), sem recarregar a página inteira.
4. **Valor variável ("a definir") sem F5:** marcar pago uma conta de valor variável informando o valor real via MarcarPagoDialog — status/valor refletem sem F5.
5. **Definir teto (aba Tetos) sem F5:** definir um teto por categoria atualiza o "gastei X de Y" sem F5.
6. **Redirects:** abrir `/contas-fixas` leva a `/lancamentos?aba=contas-fixas`; abrir `/planejamento` leva a `/visao-geral`. Sem 404 / tela vazia.

> Observação sobre o mecanismo de refresh: o `router.refresh()` dispara no retorno de **foco/visibilidade** da janela (o fluxo natural ao fechar um Sheet/dialog modal e voltar à página). Se em algum caso o foco não mudar (ex.: dialog inline que não tira o foco da janela), a lista atualiza na próxima vez que a janela recuperar foco. Caso o UAT revele um fluxo que não dispara o refresh, a alternativa aditiva documentada no plano (`revalidatePath('/lancamentos')` nos actions relevantes) continua disponível como fallback.

## Self-Check: PASSED

- src/app/(authed)/lancamentos/_components/LancamentosTabs.tsx — FOUND
- src/app/(authed)/lancamentos/_components/ContasFixasTabContent.tsx — FOUND
- src/app/(authed)/lancamentos/_components/TetosTabContent.tsx — FOUND
- commit 17bdd8e — FOUND
- commit 0e31d4a — FOUND
