---
phase: 04d-consolidado-projecao
plan: 03
type: execute
wave: 2
depends_on:
  - 04d-02
files_modified:
  - src/app/(authed)/consolidado/_lib/consolidado.ts
  - src/app/(authed)/consolidado/_lib/consolidado.test.ts
  - src/app/(authed)/consolidado/_lib/loader.ts
  - src/app/(authed)/consolidado/page.tsx
  - src/app/(authed)/consolidado/_components/ConsolidadoTable.tsx
  - src/app/(authed)/consolidado/_components/ConsolidadoCards.tsx
  - src/app/(authed)/_components/Sidebar.tsx
  - src/app/(authed)/_components/BottomNav.tsx
autonomous: true
requirements:
  - CONS-01
user_setup: []

must_haves:
  truths:
    - "No contexto Empresa existe um item de menu 'Consolidado' que abre /consolidado"
    - "A tela Consolidado mostra uma linha por empresa (faturamento bruto/líquido/lucro, DAS estimado, pró-labore) + uma linha de TOTAL somando todas"
    - "Os totais do consolidado batem com a soma das linhas por empresa (invariante testada)"
    - "O total de pró-labore do consolidado é o que vira renda familiar (soma dos pró-labores aplicados no mês)"
  artifacts:
    - path: "src/app/(authed)/consolidado/_lib/consolidado.ts"
      provides: "Funções puras: linha de empresa + agregação de totais do consolidado"
      min_lines: 20
    - path: "src/app/(authed)/consolidado/_lib/consolidado.test.ts"
      provides: "Testes Vitest da agregação do consolidado (totais == soma das linhas, lista vazia)"
      contains: "somarConsolidado"
    - path: "src/app/(authed)/consolidado/page.tsx"
      provides: "Server Component /consolidado (seção Empresa)"
      contains: "loadConsolidadoData"
    - path: "src/app/(authed)/consolidado/_components/ConsolidadoTable.tsx"
      provides: "Tabela por empresa + linha de total"
      min_lines: 20
  key_links:
    - from: "src/app/(authed)/consolidado/page.tsx"
      to: "src/app/(authed)/consolidado/_lib/loader.ts"
      via: "page chama loadConsolidadoData(userId, month)"
      pattern: "loadConsolidadoData"
    - from: "src/app/(authed)/consolidado/_lib/loader.ts"
      to: "src/app/(authed)/canais/_lib/loader.ts"
      via: "reusa loadPnlData por empresa (faturamento/lucro) e computeDasEstimado"
      pattern: "loadPnlData|computeDasEstimado"
    - from: "src/app/(authed)/_components/Sidebar.tsx"
      to: "src/app/(authed)/consolidado/page.tsx"
      via: "item de nav 'Consolidado' href /consolidado context empresa"
      pattern: "/consolidado"
---

<objective>
Fatia 4 — fatia vertical da **tela Consolidado** (CONS-01 / D-02). Entrega, de ponta a ponta, a visão
somada de todas as empresas do usuário no mês:

1. Item de menu "Consolidado" na seção Empresa (context 'empresa') no Sidebar e no BottomNav.
2. Tela `/consolidado`: tabela com uma linha por empresa (faturamento bruto/líquido/lucro, DAS estimado,
   pró-labore) + uma linha de TOTAL; cards de topo com os totais somados (faturamento bruto/líquido/lucro,
   DAS estimado total, pró-labore total → renda familiar).
3. Funções puras de agregação + Vitest (os totais são correção-crítica: a soma das linhas tem que bater).

Decisão (D-02): a tela reaproveita as funções do P&L da Fatia 2 (`loadPnlData` por empresa) e a estimativa
de DAS (`computeDasEstimado`, 04d-02) — nenhum modelo novo, é VISÃO derivada. O pró-labore total por empresa
vem das SAÍDAS de pró-labore marcadas por `origemEmpresaId` no mês (04c), que é exatamente o que vira renda
familiar na Casa. A projeção dos próximos meses e o alerta de negativo são a próxima fatia (04d-04), que
renderiza nesta mesma página.

Purpose: Mostrar quanto as empresas geram juntas no mês, mantendo cada empresa isolada (nenhuma mistura),
e preparar a página que a projeção (04d-04) vai estender.
Output: `/consolidado` (page + _lib + _components) + item de menu context 'empresa'.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/04d-consolidado-projecao/04d-CONTEXT.md

# P&L por empresa a reusar (faturamento/lucro) + a estimativa de DAS (04d-02)
@src/app/(authed)/canais/_lib/loader.ts
@src/app/(authed)/canais/_lib/service.ts
@src/app/(authed)/canais/_lib/das.ts
# Padrão de página Server Component (empresaId/month/auth) e de componentes (cards/listas)
@src/app/(authed)/canais/page.tsx
@src/app/(authed)/canais/_components/PnlCards.tsx
# Lista de empresas do usuário (iterar no consolidado) e pró-labore por origem (total que vira renda)
@src/app/(authed)/empresas/_lib/loader.ts
@src/app/(authed)/visao-geral/_lib/service.ts
# Padrão de função pura + Vitest a espelhar
@src/app/(authed)/visao-geral/_lib/renda-familiar.ts
@src/app/(authed)/visao-geral/_lib/renda-familiar.test.ts
# Onde adicionar o item de menu (context 'empresa', grupo Empresa)
@src/app/(authed)/_components/Sidebar.tsx
@src/app/(authed)/_components/BottomNav.tsx
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Funções puras de agregação do consolidado + testes Vitest (CONS-01 / D-02)</name>
  <files>src/app/(authed)/consolidado/_lib/consolidado.ts, src/app/(authed)/consolidado/_lib/consolidado.test.ts</files>
  <behavior>
    - somarConsolidado([]) devolve totais todos zero (lista vazia, nenhuma empresa)
    - somarConsolidado de 2 empresas soma cada campo (brutoCents, liquidoCents, lucroCents, dasEstimadoCents, proLaboreCents) — o total de cada campo == soma das linhas
    - As linhas de entrada são preservadas na saída (não mutadas); ordenação das linhas por lucro desc (maior primeiro), igual ao espírito de groupByCategory
    - Uma empresa com DAS "não definido" (dasEstimadoCents 0, flag aliquotaDefinida false) soma 0 ao total de DAS e não quebra
  </behavior>
  <action>
    Criar `consolidado/_lib/consolidado.ts` espelhando `visao-geral/_lib/renda-familiar.ts` (TypeScript puro,
    SEM Prisma/servidor; centavos Int; comentários referenciando CONS-01/D-02). Exportar:
    - Interface `LinhaConsolidado` { empresaId: string; nome: string; cor: string; brutoCents: number;
      liquidoCents: number; lucroCents: number; dasEstimadoCents: number; aliquotaDefinida: boolean;
      proLaboreCents: number }.
    - Interface `TotaisConsolidado` com os mesmos campos numéricos somados (sem empresaId/nome/cor).
    - `ordenarLinhas(linhas: LinhaConsolidado[]): LinhaConsolidado[]` — devolve cópia ordenada DESC por
      lucroCents (não muta, usa [...linhas].sort).
    - `somarConsolidado(linhas: LinhaConsolidado[]): TotaisConsolidado` — reduz somando cada campo numérico;
      lista vazia → todos zero. É a FONTE ÚNICA dos totais da tela (a invariante "total == soma das linhas"
      é exatamente este reduce).
    Criar `consolidado/_lib/consolidado.test.ts` espelhando `renda-familiar.test.ts`, cobrindo os casos do
    bloco <behavior>. Rodar e ver passar.
  </action>
  <verify>
    <automated>npx vitest run src/app/\(authed\)/consolidado/_lib/consolidado.test.ts</automated>
  </verify>
  <done>`consolidado.ts` exporta `ordenarLinhas` e `somarConsolidado` + as interfaces; os testes cobrem lista vazia, soma de 2 empresas (total == soma), imutabilidade e ordenação; `npx vitest run` do arquivo passa 100%.</done>
</task>

<task type="auto">
  <name>Task 2: Loader + página /consolidado reusando o P&L por empresa, DAS e pró-labore (CONS-01 / D-02)</name>
  <files>src/app/(authed)/consolidado/_lib/loader.ts, src/app/(authed)/consolidado/page.tsx, src/app/(authed)/consolidado/_components/ConsolidadoTable.tsx, src/app/(authed)/consolidado/_components/ConsolidadoCards.tsx</files>
  <action>
    Montar a tela Consolidado como VISÃO derivada (nenhuma query/modelo novo além de reusar os existentes):
    - `consolidado/_lib/loader.ts` (módulo simples, sem 'use server'): `loadConsolidadoData(userId, month)`.
      Buscar as empresas do usuário via `getEmpresas(userId)` (empresas/_lib/loader). Para cada empresa, em
      paralelo (Promise.all / map), chamar `loadPnlData(userId, month, empresa.id)` (canais/_lib/loader) para
      bruto/líquido/lucro, computar `dasEstimadoCents` via `computeDasEstimado(empresa.aliquotaDasPercent, bruto)`
      (converter o Decimal do Prisma para number com segurança) e buscar o pró-labore do mês da empresa. Para o
      pró-labore por empresa, somar as SAÍDAS do mês cuja `origemEmpresaId === empresa.id` (reusar o padrão de
      agregação por mês já presente em visao-geral/_lib/service.ts — groupBy/aggregate com where userId +
      empresaId + type SAIDA + origemEmpresaId = empresa.id, janela do mês; ou expor uma pequena função nova no
      loader). Montar as `LinhaConsolidado[]`, aplicar `ordenarLinhas` e `somarConsolidado` (das funções puras),
      e devolver { linhas, totais }. Toda query filtra por userId (ASVS V4; nenhuma query sem escopo).
    - `consolidado/page.tsx`: Server Component espelhando canais/page.tsx — lê searchParams.month, autentica via
      `supabase.auth.getUser()`, usa `userId = user!.id`, `currentMonth = month ?? hoje`. Chama
      `loadConsolidadoData(userId, currentMonth)`. Título "Consolidado". Renderiza `ConsolidadoCards` (totais) e
      `ConsolidadoTable` (linhas + total). NÃO precisa de empresaId: o consolidado é a soma de TODAS as empresas
      do usuário (D-02), não de uma só. Se o usuário não tem empresas, mostrar um estado vazio curto em pt-BR.
    - `consolidado/_components/ConsolidadoCards.tsx`: cards de topo com os totais (faturamento bruto, líquido,
      lucro, DAS estimado total, pró-labore total → renda familiar), estilo PnlCards (rounded-2xl/bg-card/
      font-mono/formatBRL). Lucro usa text-positive/≥0, text-warning/negativo (mesmo tom do PnlCards).
    - `consolidado/_components/ConsolidadoTable.tsx`: tabela (shadcn Table já instalada) com uma linha por
      empresa (nome + os 5 valores) e uma linha de TOTAL em destaque. DAS "não definido" quando aliquotaDefinida
      false (não R$ 0,00). Valores via formatBRL, pt-BR, responsivo (scroll horizontal no mobile se preciso).
  </action>
  <verify>
    <automated>npx tsc --noEmit && grep -q "loadConsolidadoData" "src/app/(authed)/consolidado/page.tsx" && grep -q "somarConsolidado\|ordenarLinhas" "src/app/(authed)/consolidado/_lib/loader.ts"</automated>
  </verify>
  <done>`/consolidado` renderiza cards de totais + tabela por empresa com linha de total, reusando loadPnlData e computeDasEstimado; o pró-labore por empresa vem das SAÍDAS marcadas por origemEmpresaId no mês; `npx tsc --noEmit` limpo.</done>
</task>

<task type="auto">
  <name>Task 3: Item de menu "Consolidado" na seção Empresa (CONS-01 / D-02)</name>
  <files>src/app/(authed)/_components/Sidebar.tsx, src/app/(authed)/_components/BottomNav.tsx</files>
  <action>
    Adicionar a navegação para /consolidado, visível APENAS no contexto de uma empresa (D-02: seção Empresa),
    reusando o mecanismo de contexto já existente (showInContext com context 'empresa'):
    - `Sidebar.tsx`: adicionar um NavItem ao array navItems com { label: 'Consolidado', href: '/consolidado',
      icon: <um ícone lucide adequado, ex. Layers ou PieChart — importar de lucide-react>, group: 'Empresa',
      context: 'empresa' }. Ele herda automaticamente o filtro showInContext (só aparece quando há empresa ativa)
      e a propagação de empresaId via hrefWith. Como o consolidado soma todas as empresas, o empresaId no href é
      inócuo (a página ignora), mas manter o padrão evita perder o contexto do seletor ao navegar.
    - `BottomNav.tsx`: adicionar o mesmo item ao array `sheetItems` (não ao primaryItems, para não estourar a
      barra) com { label: 'Consolidado', href: '/consolidado', icon: <mesmo ícone>, isEmpresa: true,
      context: 'empresa' }. Herda showInContext e o realce laranja de rota de empresa (isEmpresaRoute).
    - Atualizar `isEmpresaRoute` em AMBOS os arquivos para incluir `pathname.startsWith('/consolidado')`, de modo
      que o item ativo use o realce laranja de Empresa (bg-empresa-light/text-empresa), consistente com /canais e
      /dividas.
    Nenhuma lógica de contexto nova; só mais um item nas listas existentes. pt-BR.
  </action>
  <verify>
    <automated>npx tsc --noEmit && grep -q "/consolidado" "src/app/(authed)/_components/Sidebar.tsx" "src/app/(authed)/_components/BottomNav.tsx" && grep -c "consolidado" "src/app/(authed)/_components/Sidebar.tsx"</automated>
  </verify>
  <done>"Consolidado" aparece na seção Empresa do Sidebar e no Sheet do BottomNav apenas no contexto de empresa; o realce ativo é laranja (isEmpresaRoute inclui /consolidado); `npx tsc --noEmit` limpo.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| navegador → página /consolidado | Requisição autenticada; os dados de todas as empresas do usuário são somados |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04d-06 | Information Disclosure | loadConsolidadoData | mitigate | Toda query filtra por userId (getEmpresas, loadPnlData, agregação de pró-labore); o consolidado só inclui empresas do próprio usuário — nenhuma mistura entre usuários nem entre empresas de outro dono |
| T-04d-07 | Tampering | somarConsolidado (totais) | mitigate | Função pura testada (total == soma das linhas, lista vazia); evita divergência entre tabela e cards |
| T-04d-08 | Spoofing | consolidado/page.tsx | mitigate | userId SEMPRE de supabase.auth.getUser() (nunca de searchParams), mesmo padrão de canais/page.tsx |
</threat_model>

<verification>
- `npx vitest run` do `consolidado.test.ts` passa 100% (total == soma das linhas).
- `npx tsc --noEmit` limpo.
- Com empresas com lançamentos no mês, /consolidado mostra uma linha por empresa + total somado; os cards de total batem com a linha TOTAL da tabela.
- "Consolidado" aparece no menu só no contexto de empresa; some no contexto Casa.
- Empresa sem alíquota → DAS "não definido" na tabela.
</verification>

<success_criteria>
- Tela /consolidado com tabela por empresa + totais (faturamento bruto/líquido/lucro, DAS estimado, pró-labore) (CONS-01 / D-02).
- Totais == soma das linhas (invariante testada).
- Item de menu "Consolidado" context 'empresa' no Sidebar e BottomNav.
- Nenhuma mistura entre empresas; tsc limpo.
</success_criteria>

<output>
Create `.planning/phases/04d-consolidado-projecao/04d-03-SUMMARY.md` when done
</output>
