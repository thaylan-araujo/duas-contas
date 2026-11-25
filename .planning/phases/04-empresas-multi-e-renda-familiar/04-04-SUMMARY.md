---
phase: 04-empresas-multi-e-renda-familiar
plan: 04
subsystem: shell-navegacao + lancamentos + visao-geral
tags: [multi-empresa, contexto-ativo, dropdown, store, server-component]
requires:
  - "04-02: store generalizado (contaAtiva união discriminada) + eixo empresaId"
  - "04-03: CRUD de empresa + 3 empresas semeadas + categorias por empresa"
provides:
  - "ContaSelector: dropdown global Casa + empresas que troca o contexto ativo em todas as telas authed (D-06)"
  - "Lançamentos e visão geral filtrando pelo empresaId do contexto ativo (Casa = null | empresa = id) — EMPF-06"
  - "TransactionSheet grava o empresaId do contexto; categoria inline nasce com kind RECEITA/CUSTO para empresa"
affects:
  - "src/app/(authed)/layout.tsx (barra superior global com o seletor)"
  - "fluxo de criação/edição de lançamento (empresaId do contexto)"
  - "agregações do dashboard (parametrizadas por empresaId)"
tech-stack:
  added: []
  patterns:
    - "shadcn DropdownMenu como seletor de contexto global"
    - "cliente (store + searchParam) → Server Component: contexto propagado via ?empresaId= na URL (router.push)"
    - "Server Components leem empresaId do searchParam e filtram as queries (Casa = null)"
    - "fallback de contexto para Casa quando a empresa ativa foi excluída (useEffect no ContaSelector)"
key-files:
  created:
    - "src/app/(authed)/_components/ContaSelector.tsx"
  modified:
    - "src/app/(authed)/layout.tsx"
    - "src/app/(authed)/lancamentos/page.tsx"
    - "src/app/(authed)/lancamentos/_components/TransactionSheet.tsx"
    - "src/app/(authed)/lancamentos/_components/NewTransactionButton.tsx"
    - "src/app/(authed)/lancamentos/_components/TransactionList.tsx"
    - "src/app/(authed)/lancamentos/_components/TransactionRow.tsx"
    - "src/app/(authed)/visao-geral/page.tsx"
    - "src/app/(authed)/visao-geral/_lib/loader.ts"
    - "src/app/(authed)/visao-geral/_lib/service.ts"
    - "src/app/globals.css (fix 214250e — tokens shadcn)"
  deleted:
    - "src/app/(authed)/lancamentos/_components/AccountFilterToggle.tsx"
    - "src/app/(authed)/visao-geral/_components/AccountSelector.tsx"
key-decisions:
  - "Contexto ativo propaga do cliente (store Zustand) para os Server Components via searchParam ?empresaId= — ContaSelector faz setContaAtiva + router.push na mesma ação"
  - "Casa = empresaId null; empresa = empresaId string. O seletor sem param na URL representa a Casa"
  - "Categoria criada inline numa empresa nasce com kind derivado do tipo do lançamento (ENTRADA→RECEITA / SAIDA→CUSTO); Casa continua kind null"
  - "mesSelecionado é preservado ao trocar de contexto (não reseta) — a troca só mexe no empresaId da URL"
  - "Pró-labore permanece DESABILITADO nesta fatia (opção 'em breve' no Select de tipo) — a mecânica Empresa→Casa é de uma fatia futura"
  - "Painéis shadcn (Sheet/Dialog/DropdownMenu/Select) usavam tokens shadcn nunca definidos (--color-background/popover/foreground/accent/destructive); mapeados para a paleta do projeto no globals.css (fix 214250e do orquestrador)"
requirements-completed: [EMPF-05, EMPF-06]
duration: 89 min
completed: 2026-11-25
---

# Phase 4 Plano 04: Ligar o contexto ativo (ContaSelector global + telas por empresa) Summary

Fatia vertical final da fundação multi-empresa: o dropdown global "Casa + empresas" troca o contexto ativo e os lançamentos e a visão geral passam a operar por empresa (ou pela Casa), fechando a capacidade central do bloco (D-06, EMPF-05/EMPF-06). O toggle antigo foi removido.

## O que foi construído

**Task 1 — ContaSelector (dropdown global) montado no shell** (commit `c60d68d`)
- Novo `src/app/(authed)/_components/ContaSelector.tsx` ('use client') usando o `DropdownMenu` do shadcn. Trigger `Button`-estilo com swatch da cor do contexto + nome + `ChevronDown` que rotaciona 180° ao abrir, `min-h-[44px]`, `aria-label="Conta ativa: <nome>. Trocar de conta."`.
- Conteúdo: item **Casa** (swatch `bg-casa`; ativo → `bg-casa-light text-casa` + `Check`) + separador + um item por empresa em ordem de criação (swatch na cor da empresa via `empresa-cores.ts` + nome + descritor de tipo em `text-xs`; ativo → par fundo-claro/acento + `Check` + `aria-current`) + separador + ação **"Gerenciar empresas"** (ícone `Settings`) que navega para `/empresas`.
- Recebe a **lista de empresas como prop** (o store só guarda o contexto ativo). Ao selecionar: `setContaAtiva(...)` no store **e** `router.push` sincronizando `?empresaId=<id>` (ou removendo para Casa). `mesSelecionado` preservado.
- Estado sem empresas: só Casa + "Gerenciar empresas" + texto "Nenhuma empresa ainda. Crie a primeira em Gerenciar empresas."
- **Fallback (T-04-12):** `useEffect` volta para Casa se o contexto ativo aponta para uma empresa que não existe mais (excluída).
- Montado no `layout.tsx` (Server Component): carrega `getEmpresas(userId)` e renderiza o ContaSelector numa **barra superior global** (visível em todas as telas authed, desktop e mobile).

**Task 2 — Lançamentos e visão geral pelo contexto ativo** (commit `d2d644b`)
- `lancamentos/page.tsx` e `visao-geral/page.tsx` leem `empresaId` do searchParam (ausente = Casa = `null`) e passam para os loaders.
- `getTransactions(userId, month, empresaIdContexto)` e `loadDashboardData(userId, month, empresaIdContexto)` filtram pelo contexto.
- `visao-geral/_lib/service.ts`: `getTotalSpent`/`getCategorySpending`/`getWeeklySpending` parametrizados por `empresaId: string | null` (antes fixo em `null`), então a visão geral mostra o contexto selecionado (EMPF-06).
- `TransactionSheet` recebe `empresaIdContexto` e grava o `empresaId` do contexto ao criar; filtra `filteredCategories` por esse contexto; a criação inline de categoria numa empresa passa `kind` derivado do tipo (ENTRADA→RECEITA / SAIDA→CUSTO). `empresaIdContexto` propagado via `NewTransactionButton`/`TransactionList`/`TransactionRow` (na edição, o contexto de categorias é o `empresaId` da própria transação).
- `AccountFilterToggle.tsx` e `AccountSelector.tsx` **removidos** (substituídos pelo ContaSelector global); sem imports órfãos.

**Fix do orquestrador — tokens shadcn** (commit `214250e`)
- Os painéis shadcn (Sheet/Dialog/DropdownMenu/Select) usavam tokens shadcn padrão (`--color-background`, `--color-popover`, `--color-foreground`, `--color-accent`, `--color-destructive` etc.) que **nunca foram definidos** no `globals.css` (o projeto usa nomes próprios: `--color-bg`, `--color-card`). Sem eles o painel ficava transparente sobre a cortina preta ("tudo preto"). Os aliases foram adicionados e mapeados para a paleta do projeto. Usuário confirmou: painéis agora renderizam brancos/legíveis.

## Verificação

- `npx tsc --noEmit`: limpo.
- `npm run build`: compila; todas as rotas authed são dinâmicas (ƒ).
- `npx vitest run`: **93/93 testes verdes** (suíte completa — phase gate).
- AccountFilterToggle e AccountSelector removidos (verificado com `test ! -f`).
- **Checkpoint humano APROVADO** (Task 3, confirmado pelo usuário no app rodando):
  - Dados da Casa intactos após a migração — a tela de Planejamento mostra todos os plan items/teto/folga da Casa preservados (D-07).
  - Dropdown "Casa + empresas" funciona com cores e troca de contexto.
  - As 3 empresas, categorias por empresa, edição e seletor de cor funcionam.
  - Correção de cor dos painéis aplicada e confirmada (fix `214250e`).

## Deviations from Plan

**[Rule 1 - Bug] Tokens shadcn ausentes deixavam os painéis "tudo preto"** (corrigido pelo orquestrador no commit `214250e`)
- **Encontrado durante:** verificação do checkpoint humano (Task 3).
- **Problema:** Sheet/Dialog/DropdownMenu/Select referenciavam tokens shadcn padrão (`--color-background/popover/foreground/accent/destructive`...) nunca definidos no `globals.css`; o painel ficava transparente sobre a cortina escura.
- **Correção:** adicionados os aliases de token mapeados para a paleta do projeto (`--color-bg`, `--color-card`, etc.) em `src/app/globals.css`.
- **Arquivos modificados:** `src/app/globals.css`.
- **Verificação:** usuário confirmou painéis brancos/legíveis no app rodando.
- **Commit:** `214250e` (feito pelo orquestrador).

**Total de desvios:** 1 bug corrigido. **Impacto:** cosmético/bloqueante de usabilidade — sem mudança de lógica de negócio; não afeta a separação Casa/Empresa nem os dados.

## Known Stubs

**Pró-labore desabilitado (intencional nesta fatia).** No `TransactionSheet`, a opção "Pró-labore (em breve)" do Select de tipo permanece `disabled` e `handleTipoChange` ignora o sentinel. A mecânica multi-origem (Empresa → Casa como renda familiar) está **fora do escopo da Fatia 1** (04-CONTEXT §Phase Boundary) e será implementada em uma fatia futura. Não impede o objetivo deste plano (operar por empresa).

## Issues Encountered

None além do bug de tokens acima (corrigido e verificado).

## Next Phase Readiness

Fatia 1 (fundação multi-empresa) entregue de ponta a ponta: criar empresa, selecioná-la pelo dropdown e lançar nela, com Casa e empresas isoladas. Fora de escopo e prontos para as próximas fatias: P&L por empresa, pró-labore→renda familiar, consolidado, projeção, dívidas, impostos/DAS.

## Self-Check: PASSED

- `src/app/(authed)/_components/ContaSelector.tsx` existe no disco.
- `04-04-SUMMARY.md` existe no disco.
- Commits de tarefa `c60d68d` e `d2d644b` existem no histórico.
- `AccountFilterToggle.tsx` e `AccountSelector.tsx` removidos (verificado).
- `npx tsc --noEmit` limpo · `npm run build` OK · `npx vitest run` 93/93.
