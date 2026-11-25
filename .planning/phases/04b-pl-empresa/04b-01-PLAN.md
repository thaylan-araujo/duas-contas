---
phase: 04b-pl-empresa
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/(authed)/canais/_lib/pnl.ts
  - src/app/(authed)/canais/_lib/pnl.test.ts
  - src/app/(authed)/canais/_lib/service.ts
  - src/app/(authed)/canais/_lib/loader.ts
  - src/app/(authed)/canais/page.tsx
  - src/app/(authed)/canais/_components/PnlCards.tsx
  - src/app/(authed)/canais/_components/CategoryBreakdownList.tsx
  - src/app/(authed)/canais/_components/CanaisPlaceholder.tsx
autonomous: false
requirements: [PNL-01, PNL-02, PNL-03, PNL-04, PNL-05]
user_setup: []

must_haves:
  truths:
    - "Com uma empresa ativa, /canais mostra Faturamento bruto, Faturamento líquido e Lucro do mês selecionado (PNL-01)"
    - "Bruto = soma das receitas (ENTRADA) da empresa no mês (PNL-02)"
    - "Líquido = bruto menos os impostos (custos da categoria Imposto da empresa) (PNL-03)"
    - "Lucro = soma das receitas menos a soma de todos os custos (SAIDA) do mês (PNL-04)"
    - "A tela lista receitas por categoria e custos por categoria, derivadas dos lançamentos (PNL-05)"
    - "No contexto Casa, /canais mostra um estado placeholder e não quebra"
    - "Os valores respeitam o contexto ativo (empresaId) e o mês selecionado"
  artifacts:
    - path: "src/app/(authed)/canais/_lib/pnl.ts"
      provides: "Funções puras computeBruto/computeLiquido/computeLucro + groupByCategory (sem Prisma)"
      min_lines: 40
      exports: ["computeBruto", "computeLiquido", "computeLucro", "groupByCategory", "computeImpostos"]
    - path: "src/app/(authed)/canais/_lib/pnl.test.ts"
      provides: "Testes Vitest das funções puras de P&L"
      min_lines: 40
    - path: "src/app/(authed)/canais/_lib/service.ts"
      provides: "Queries Prisma empresaId-aware: entradas/custos por categoria no mês"
      exports: ["getReceitasPorCategoria", "getCustosPorCategoria"]
    - path: "src/app/(authed)/canais/_lib/loader.ts"
      provides: "Orquestra fetches do P&L em paralelo e aplica funções puras"
      exports: ["loadPnlData"]
    - path: "src/app/(authed)/canais/page.tsx"
      provides: "Server Component /canais — P&L da empresa ativa (substitui o stub em breve)"
    - path: "src/app/(authed)/canais/_components/PnlCards.tsx"
      provides: "Cards bruto/líquido/lucro (padrão DashboardCards)"
    - path: "src/app/(authed)/canais/_components/CategoryBreakdownList.tsx"
      provides: "Lista receitas/custos por categoria (padrão CategorySpendingBars)"
  key_links:
    - from: "src/app/(authed)/canais/page.tsx"
      to: "src/app/(authed)/canais/_lib/loader.ts"
      via: "chama loadPnlData(userId, month, empresaId) no Server Component"
      pattern: "loadPnlData"
    - from: "src/app/(authed)/canais/_lib/loader.ts"
      to: "src/app/(authed)/canais/_lib/pnl.ts"
      via: "aplica computeBruto/computeLiquido/computeLucro aos totais"
      pattern: "compute(Bruto|Liquido|Lucro)"
    - from: "src/app/(authed)/canais/_lib/service.ts"
      to: "prisma/schema.prisma"
      via: "agrega Transaction por empresaId + type + mês"
      pattern: "prisma\\.transaction\\.(aggregate|groupBy)"
    - from: "src/app/(authed)/canais/page.tsx"
      to: "src/lib/supabase/server.ts"
      via: "auth.getUser() + guarda de posse da empresa (IDOR)"
      pattern: "auth\\.getUser"
---

## Phase Goal

**As a** dono de uma empresa no Duas Contas, **I want to** ver em `/canais` o P&L automático da empresa ativa no mês (faturamento bruto, líquido, lucro e as receitas/custos por categoria), **so that** eu enxergue quanto a empresa fatura e quanto sobra sem digitar nada além dos lançamentos que já registro.

## Acceptance Criteria
- [ ] PNL-01: `/canais` deixa de ser o stub "em breve" e mostra o P&L da empresa ativa (contexto `empresaId`) no mês selecionado.
- [ ] PNL-02: Faturamento bruto = soma das receitas (`Transaction` ENTRADA da empresa no mês).
- [ ] PNL-03: Faturamento líquido = bruto − impostos (custos da categoria "Imposto" da empresa).
- [ ] PNL-04: Lucro = soma das receitas − soma de todos os custos (SAIDA do mês).
- [ ] PNL-05: Listas de receitas por categoria e custos por categoria, derivadas dos lançamentos.
- [ ] No contexto Casa (`empresaId` null), `/canais` mostra um placeholder (é uma tela de empresa) e não quebra.
- [ ] `tsc --noEmit`, `vitest run` e `next build` continuam verdes. Nenhuma migração Prisma executada.

<objective>
Transformar a tela `/canais` ("Canais e caixa", seção EMPRESA) no **P&L da empresa ativa** — uma VISÃO derivada dos lançamentos que já existem por empresa desde a Fatia 1 (D-01). No contexto de uma empresa, a tela mostra, para o mês selecionado: faturamento bruto, faturamento líquido, lucro, e as listas de receitas por categoria e custos por categoria.

Purpose: É a entrega da Fatia 2 do bloco multi-empresa. Reaproveita o modelo de acompanhamento da Casa (cálculos puros + service/loader + cards + listas) para dar ao usuário, sem nenhuma digitação nova, a leitura de "quanto a empresa fatura e quanto sobra". Genérico e igual para as 3 empresas nesta fatia (D-03) — sem módulos por tipo (ROAS/recorrência/vendas), que ficam para rodadas seguintes.

Output:
- `_lib/pnl.ts` — funções puras testadas (D-05): `computeBruto`, `computeImpostos`, `computeLiquido`, `computeLucro`, `groupByCategory`.
- `_lib/service.ts` + `_lib/loader.ts` — queries empresaId-aware (espelham `visao-geral/_lib`) e a orquestração.
- `page.tsx` + `_components/PnlCards.tsx` + `_components/CategoryBreakdownList.tsx` — a tela.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/04b-pl-empresa/04b-CONTEXT.md

# Design autoritativo do bloco multi-empresa (P&L genérico): receitas − custos categorizados = lucro
@docs/superpowers/specs/2026-11-25-multi-empresa-renda-familiar-design.md

# Padrão a espelhar — funções puras testadas (acompanhamento da Casa)
@src/app/(authed)/planejamento/_lib/acompanhamento.ts
@src/app/(authed)/planejamento/_lib/acompanhamento.test.ts

# Padrão a espelhar — service empresaId-aware (ENTRADA/SAIDA, groupBy por categoria) e loader paralelo
@src/app/(authed)/visao-geral/_lib/service.ts
@src/app/(authed)/visao-geral/_lib/loader.ts

# Padrão a espelhar — Server Component que lê searchParams.empresaId + auth.getUser()
@src/app/(authed)/visao-geral/page.tsx

# Padrão a espelhar — cards e listas por categoria (UI)
@src/app/(authed)/visao-geral/_components/DashboardCards.tsx
@src/app/(authed)/visao-geral/_components/CategorySpendingBars.tsx

# Stub atual a substituir
@src/app/(authed)/canais/page.tsx

# Contexto ativo (empresaId via searchParams) e posse da empresa
@src/store/conta.ts
@src/app/(authed)/empresas/_lib/loader.ts

# Utilitários
@src/lib/format.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Funções puras de P&L + testes Vitest (RED → GREEN)</name>
  <files>src/app/(authed)/canais/_lib/pnl.ts, src/app/(authed)/canais/_lib/pnl.test.ts</files>
  <read_first>
    - src/app/(authed)/planejamento/_lib/acompanhamento.ts — padrão de funções puras (sem Prisma), tipos e docstrings pt-BR.
    - src/app/(authed)/planejamento/_lib/acompanhamento.test.ts — padrão de teste Vitest (describe/it/expect, valores em centavos).
    - vitest.config.ts — `include: ['src/**/*.test.ts']`, ambiente node, alias `@`.
  </read_first>
  <behavior>
    - computeBruto(receitasCents): soma já agregada das receitas. Ex.: computeBruto(1_000_000) === 1_000_000. É identidade sobre o total de ENTRADA (mantida como função nomeada para o P&L ter uma fonte única e legível por mês) — PNL-02.
    - computeImpostos(custosPorCategoria): soma apenas o total das categorias cujo nome, normalizado (trim + lowercase + sem acento), é "imposto" (D-02, discrição: identificar por nome). Ex.: [{name:'Imposto',totalCents:30_000},{name:'Anúncios',totalCents:50_000}] → 30_000. Sem categoria de imposto → 0.
    - computeLiquido(brutoCents, impostosCents): bruto − impostos. Ex.: computeLiquido(1_000_000, 30_000) === 970_000 (PNL-03). Pode ser negativo.
    - computeLucro(receitasCents, custosCents): receitas − TODOS os custos (SAIDA). Ex.: computeLucro(1_000_000, 400_000) === 600_000 (PNL-04). Pode ser negativo.
    - groupByCategory(itens): recebe linhas {categoryId, name, totalCents} e devolve ordenado desc por totalCents; lista vazia → []. Usado tanto para receitas quanto para custos (PNL-05).
    - Casos de borda cobertos nos testes: mês sem lançamentos (todos 0), empresa sem categoria "Imposto", custos maiores que receitas (lucro negativo), nome "imposto" com acento/caixa diferente ("Imposto ", "IMPOSTO").
  </behavior>
  <action>
    Criar `src/app/(authed)/canais/_lib/pnl.ts` com as funções puras acima, em TypeScript puro, SEM importar Prisma nem nada de servidor — espelhar exatamente o estilo de `acompanhamento.ts` (docstrings pt-BR, valores em centavos Int, tipos exportados). Exportar `computeBruto`, `computeImpostos`, `computeLiquido`, `computeLucro`, `groupByCategory` e os tipos de entrada/saída necessários (ex.: `interface CategoriaTotal { categoryId: string; name: string; totalCents: number }`). Para `computeImpostos`, normalizar o nome com trim + toLowerCase + remoção de acentos (via `normalize('NFD').replace(/\p{Diacritic}/gu, '')`) e comparar com a palavra imposto — citar D-02 e a decisão "identificar por nome" na docstring. NÃO persistir nada, NÃO criar modelo novo (D-01). Em seguida criar `pnl.test.ts` no mesmo diretório com os casos descritos em <behavior>, seguindo o estilo de `acompanhamento.test.ts`. Rodar os testes: primeiro RED (arquivo de teste antes da implementação completa, se seguir o ciclo), depois GREEN com `vitest run`. Commits: `test(04b-01): add failing P&L pure fn tests` → `feat(04b-01): implement P&L pure fns`.
  </action>
  <verify>
    <automated>npx vitest run src/app/\(authed\)/canais/_lib/pnl.test.ts</automated>
  </verify>
  <done>Todos os testes de `pnl.test.ts` passam. As 5 funções exportadas existem e são puras (nenhum import de `@/lib/prisma` em `pnl.ts`). `npx tsc --noEmit` limpo.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Service + loader empresaId-aware e tela /canais (fatia ponta a ponta)</name>
  <files>src/app/(authed)/canais/_lib/service.ts, src/app/(authed)/canais/_lib/loader.ts, src/app/(authed)/canais/page.tsx, src/app/(authed)/canais/_components/PnlCards.tsx, src/app/(authed)/canais/_components/CategoryBreakdownList.tsx</files>
  <read_first>
    - src/app/(authed)/visao-geral/_lib/service.ts — `getTotalEntradas`/`getTotalSpent`/`getCategorySpending` (todos empresaId-aware, janela de mês com monthRegex). Reaproveitar por import; criar só o que falta.
    - src/app/(authed)/visao-geral/_lib/loader.ts — `loadDashboardData` com `Promise.all`.
    - src/app/(authed)/visao-geral/page.tsx — leitura de `searchParams.empresaId`, `auth.getUser()`, `userId = user!.id`, `empresaIdContexto = empresaId ?? null`.
    - src/app/(authed)/visao-geral/_components/DashboardCards.tsx e CategorySpendingBars.tsx — classes/estilo dos cards e listas (rounded-2xl, bg-card, font-mono, formatBRL).
    - src/app/(authed)/empresas/_lib/loader.ts — `getEmpresas(userId)` para olhar a empresa ativa (nome + posse).
  </read_first>
  <behavior>
    - getReceitasPorCategoria(userId, month, empresaId): groupBy de `Transaction` ENTRADA por categoryId no mês, resolve nomes, devolve [{categoryId, name, totalCents}] desc — espelha `getCategorySpending` trocando `type: 'SAIDA'` por `'ENTRADA'` (PNL-05 receitas).
    - getCustosPorCategoria(userId, month, empresaId): idem com `type: 'SAIDA'` (PNL-05 custos). Pode reusar `getCategorySpending` de visao-geral por import se a assinatura bater; caso contrário, criar gêmeo local.
    - loadPnlData(userId, month, empresaId): Promise.all de getTotalEntradas, getTotalSpent, getReceitasPorCategoria, getCustosPorCategoria; depois aplica as funções puras — bruto = computeBruto(entradas); custos = total SAIDA; impostos = computeImpostos(custosPorCategoria); liquido = computeLiquido(bruto, impostos); lucro = computeLucro(entradas, custos). Devolve { brutoCents, liquidoCents, lucroCents, impostosCents, receitasPorCategoria, custosPorCategoria }.
    - page.tsx: no contexto empresa (empresaId presente E pertencente ao usuário), renderiza PnlCards + duas CategoryBreakdownList (receitas e custos). No contexto Casa (empresaId null) OU empresaId que não pertence ao usuário, renderiza o placeholder (ver Task 3) — nunca quebra.
  </behavior>
  <action>
    Criar `canais/_lib/service.ts`: implementar `getReceitasPorCategoria` e `getCustosPorCategoria` espelhando `getCategorySpending` de `visao-geral/_lib/service.ts` (mesma janela de mês com monthRegex, mesmo groupBy por categoryId + resolução de nomes via `prisma.category.findMany`). Reaproveitar `getTotalEntradas`/`getTotalSpent`/`getCategorySpending` por import de `@/app/(authed)/visao-geral/_lib/service` quando servir — NÃO reescrever o que já existe (D-01: VISÃO derivada, nenhum modelo novo, nenhuma migração). Criar `canais/_lib/loader.ts` com `loadPnlData` usando `Promise.all` (padrão `loadDashboardData`) e aplicando as funções puras de `./pnl`. Reescrever `canais/page.tsx` como Server Component espelhando `visao-geral/page.tsx`: `searchParams: Promise<{ month?: string; empresaId?: string }>`, `createSupabaseServerClient()`, `auth.getUser()`, `userId = user!.id`, `currentMonth = month ?? new Date().toISOString().slice(0,7)`, `empresaIdContexto = empresaId ?? null`. Guarda de posse (IDOR, PNL-01/segurança): se `empresaIdContexto` não for null, confirmar que existe uma empresa com esse id E `userId` (via `getEmpresas(userId)` ou `prisma.empresa.findFirst({ where:{ id, userId } })`); se não pertencer, tratar como contexto sem empresa (placeholder), nunca lançar dados de outro usuário. Buscar o nome da empresa ativa para o cabeçalho. Criar `_components/PnlCards.tsx` (client ou server; sem interatividade → pode ser server) com 3 cards — Faturamento bruto, Faturamento líquido, Lucro — no estilo de `DashboardCards` (rounded-2xl, bg-card, `font-mono`, `formatBRL`); lucro negativo em `text-warning`/positivo em `text-positive` como DashboardCards faz com restante. Criar `_components/CategoryBreakdownList.tsx` recebendo `{ titulo: string; itens: CategoriaTotal[]; tom?: 'receita'|'custo' }`, no estilo de `CategorySpendingBars` (barra proporcional ao maior, `formatBRL`, estado vazio "Nenhum lançamento este mês."). A página usa a lista duas vezes: "Receitas por categoria" e "Custos por categoria". pt-BR em todos os textos. Rodar `tsc --noEmit`, `vitest run`, `next build`.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npx vitest run && npm run build</automated>
  </verify>
  <done>Com `empresaId` de uma empresa do usuário no searchParam, `/canais` renderiza 3 cards (bruto/líquido/lucro) e as duas listas por categoria, todos coerentes com os lançamentos do mês. Build, tsc e testes verdes. Nenhuma migração Prisma executada.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Estado placeholder da Casa + verificação ponta a ponta</name>
  <files>src/app/(authed)/canais/page.tsx, src/app/(authed)/canais/_components/CanaisPlaceholder.tsx</files>
  <action>
    Garantir o ramo Casa/empresa-inválida da página (fechando a fatia iniciada na Task 2): no contexto Casa (`empresaId` null) OU quando o `empresaId` do searchParam não pertencer ao usuário (falha na guarda de posse), `/canais` renderiza um placeholder — NÃO cards com R$ 0 como se fosse P&L. Extrair o placeholder para `_components/CanaisPlaceholder.tsx` (componente simples, server): texto pt-BR explicando que "Canais e caixa" é uma tela de empresa e convidando a selecionar uma empresa no seletor de conta (ou criar a primeira em Gerenciar empresas), reusando as classes do stub original (`min-h-[60vh]`, centralizado, `text-text-primary`/`text-text-secondary`). A `page.tsx` importa e renderiza `CanaisPlaceholder` nesse ramo. Rodar `tsc --noEmit`, `vitest run` e `next build` antes de abrir o checkpoint para o humano.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npx vitest run && npm run build</automated>
  </verify>
  <done>Ramo Casa/empresa-inválida renderiza `CanaisPlaceholder` (sem cards de P&L, sem crash). Build/tsc/testes verdes. Pronto para verificação humana.</done>
  <what-built>
    `/canais` agora é o P&L da empresa ativa: cards de Faturamento bruto, Faturamento líquido e Lucro, mais as listas de Receitas por categoria e Custos por categoria, para o mês selecionado — tudo derivado dos lançamentos (nenhuma digitação nova, nenhum modelo novo). No contexto Casa (ou empresa inexistente), a tela mostra um placeholder (`CanaisPlaceholder`) indicando que é uma tela de empresa e convidando a selecionar/criar uma empresa — sem quebrar. O executor já garantiu que `tsc`/`vitest`/`build` estão verdes.
  </what-built>
  <how-to-verify>
    1. Rodar o app: `npm run dev` e abrir http://localhost:3000.
    2. No seletor de conta (topo), escolher **Casa**: ir em "Canais e caixa" (menu Empresa). Esperado: um placeholder dizendo que é uma tela de empresa e para selecionar/criar uma empresa — NÃO deve quebrar nem mostrar R$ 0 como se fosse P&L.
    3. Trocar o seletor para uma **empresa** (ex.: Elite Juris). Esperado: a URL ganha `?empresaId=...` e a tela mostra 3 cards: Faturamento bruto, Faturamento líquido, Lucro, e abaixo "Receitas por categoria" e "Custos por categoria".
    4. Se a empresa não tem lançamentos no mês: bruto/líquido/lucro em R$ 0,00 e as listas com "Nenhum lançamento este mês." (sem erro).
    5. Lançar nessa empresa (em Lançamentos) uma ENTRADA (ex.: R$ 10.000,00) e duas SAIDA — uma na categoria **Imposto** (ex.: R$ 1.000,00) e uma em outra categoria de custo (ex.: Anúncios R$ 4.000,00). Voltar a /canais no mesmo mês. Esperado: Bruto R$ 10.000,00; Líquido R$ 9.000,00 (bruto − imposto); Lucro R$ 5.000,00 (10.000 − 5.000 de custos totais). Receitas por categoria lista a entrada; Custos por categoria lista Imposto e Anúncios.
    6. Trocar o mês selecionado para um mês sem lançamentos e confirmar que os números zeram e as listas ficam vazias (respeita o mês).
    7. Confirmar que as telas da Casa (Visão Geral, Planejamento) seguem idênticas — nada foi tocado nelas.
  </how-to-verify>
  <resume-signal>Digite "approved" se os cálculos e o placeholder da Casa conferem, ou descreva o que ficou errado.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| navegador → Server Component `/canais` | `searchParams.empresaId` chega do cliente (URL) — não confiável; pode apontar para empresa de outro usuário |
| Server Component → Prisma/Supabase | toda query precisa escopo `userId` (sessão autenticada via `auth.getUser()`) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04b-01 | Information Disclosure / Elevation | `page.tsx` lê `searchParams.empresaId` | mitigate | Guarda de posse (IDOR): confirmar `prisma.empresa.findFirst({ where:{ id: empresaId, userId } })` (ou `getEmpresas(userId)`) antes de carregar P&L; empresaId não-pertencente → placeholder, nunca dados de outro usuário (ASVS V4.1) |
| T-04b-02 | Information Disclosure | `service.ts` queries de Transaction/Category | mitigate | Todo `aggregate`/`groupBy`/`findMany` filtra por `userId` E `empresaId` (espelha visao-geral/_lib; nenhuma query sem userId) |
| T-04b-03 | Spoofing | sessão | mitigate | `auth.getUser()` obrigatório no topo da página (padrão do grupo `(authed)` + middleware); `userId = user!.id` só após autenticação |
| T-04b-04 | Tampering | `searchParams.month` | accept | `month` só delimita janela de datas via monthRegex nas queries existentes; valor inválido cai no regex guard de service.ts (throw controlado) ou no default do mês atual — sem exposição de dados |
| T-04b-SC | Tampering | npm/pip/cargo installs | accept | Nenhuma instalação de pacote nesta fatia — VISÃO derivada sobre libs já presentes (Prisma, shadcn, Recharts não usado aqui). Sem superfície de supply-chain nova |
</threat_model>

<verification>
- `npx vitest run` — todos os testes verdes, incluindo `canais/_lib/pnl.test.ts`.
- `npx tsc --noEmit` — sem erros de tipo.
- `npm run build` — build de produção verde.
- Nenhuma migração Prisma executada (D-01): `git diff --stat prisma/` vazio; nenhum arquivo em `prisma/migrations/` novo.
- `pnl.ts` não importa Prisma (funções puras, D-05).
- Guarda de posse presente em `page.tsx` (empresaId escopado por userId).
</verification>

<success_criteria>
- `/canais` mostra o P&L (bruto/líquido/lucro + receitas e custos por categoria) da empresa ativa no mês selecionado (PNL-01..05).
- Bruto, líquido, lucro e impostos calculados pelas funções puras testadas (D-02/D-04/D-05).
- Impostos identificados pela categoria de custo cujo nome é "Imposto" (D-02; decisão por nome registrada na docstring).
- Contexto Casa / empresa inválida → placeholder, sem quebra.
- Genérico para as 3 empresas; sem módulos por tipo (D-03).
- Checkpoint humano aprovado.
</success_criteria>

<output>
Create `.planning/phases/04b-pl-empresa/04b-01-SUMMARY.md` when done.
Document in "Artifacts this phase produces":
- Nova tela `/canais` (P&L da empresa) + `_lib` (pnl.ts puro+testado, service.ts, loader.ts) + `_components` (PnlCards, CategoryBreakdownList).
- Funções puras novas: computeBruto, computeImpostos, computeLiquido, computeLucro, groupByCategory.
- Queries novas de service: getReceitasPorCategoria, getCustosPorCategoria (empresaId-aware). Nenhuma migração.
</output>
