---
phase: 04c-pro-labore-renda-familiar
plan: 03
type: execute
wave: 2
depends_on:
  - 04c-01
  - 04c-02
files_modified:
  - src/app/(authed)/visao-geral/_lib/renda-familiar.ts
  - src/app/(authed)/visao-geral/_lib/renda-familiar.test.ts
  - src/app/(authed)/visao-geral/_lib/service.ts
  - src/app/(authed)/visao-geral/_lib/loader.ts
  - src/app/(authed)/visao-geral/_components/RendaFamiliarPorOrigem.tsx
  - src/app/(authed)/visao-geral/page.tsx
autonomous: false
requirements:
  - PL-05
user_setup: []

must_haves:
  truths:
    - "Na Visão Geral da Casa, o usuário vê um bloco 'Renda familiar por origem'"
    - "O bloco mostra quanto entrou de cada empresa (via origemEmpresaId) e um grupo 'Outras entradas'"
    - "O bloco só aparece no contexto Casa (não no contexto de empresa)"
    - "A soma das linhas do bloco é igual ao Dinheiro do mês da Casa"
  artifacts:
    - path: "src/app/(authed)/visao-geral/_lib/renda-familiar.ts"
      provides: "Função pura de agrupamento das entradas por empresa de origem (+ outras entradas)"
      min_lines: 15
    - path: "src/app/(authed)/visao-geral/_lib/renda-familiar.test.ts"
      provides: "Testes Vitest da função pura de agrupamento"
    - path: "src/app/(authed)/visao-geral/_components/RendaFamiliarPorOrigem.tsx"
      provides: "Bloco visual 'Renda familiar por origem' na Visão Geral"
  key_links:
    - from: "src/app/(authed)/visao-geral/page.tsx"
      to: "src/app/(authed)/visao-geral/_components/RendaFamiliarPorOrigem.tsx"
      via: "page renderiza o bloco com os dados do loader quando contexto = Casa"
      pattern: "RendaFamiliarPorOrigem"
    - from: "src/app/(authed)/visao-geral/_lib/service.ts"
      to: "prisma/schema.prisma"
      via: "groupBy das ENTRADAS da Casa por origemEmpresaId"
      pattern: "origemEmpresaId"
---

## Phase Goal

**As a** dono das minhas empresas, **I want to** ver quanto da renda familiar veio de cada empresa de origem na Visão Geral da Casa, **so that** eu enxergue de onde chegou o dinheiro da família neste mês.

<objective>
Fatia vertical final da Fatia 3: o bloco "Renda familiar por origem" na Visão Geral da Casa (PL-05). Ao fim deste plano, no contexto Casa, o usuário vê um bloco que agrupa as ENTRADAS da Casa do mês por **empresa de origem** (via `origemEmpresaId`, criado em 04c-01 e preenchido pelo pró-labore em 04c-02) mais um grupo "Outras entradas" (entradas sem origem — ex.: salário). A soma das linhas do bloco é exatamente o "Dinheiro do mês" da Casa (getTotalEntradas da Fatia 3.5), fechando a renda familiar.

Padrão espelhado da Fatia 2 (P&L): função pura testada (agrupamento) + query de service empresaId/origem-aware + loader (Promise.all) + componente de apresentação, exatamente como canais/_lib/pnl.ts + service + loader + PnlCards. É uma VISÃO derivada dos lançamentos: nenhum modelo novo (o campo já existe desde 04c-01). O bloco aparece SÓ no contexto Casa — no contexto de empresa a Visão Geral mostra o acompanhamento de empresa (isEmpresa), não a renda familiar.

Layout do bloco (Discrição do Claude em D-04): lista de linhas "nome da empresa (swatch de cor) — valor", ordenada desc por valor, com "Outras entradas" por último, dentro do cartão branco padrão (rounded-2xl border bg-card) — mesma linguagem visual de CategoryBreakdownList/CategorySpendingBars. Estado vazio (nenhuma entrada no mês): mensagem curta "Nenhuma entrada na Casa neste mês."

Purpose: Fechar o ciclo do pró-labore → renda familiar: ver quanto chegou e de onde.
Output: função pura de agrupamento + testes; query de service por origemEmpresaId; loader estendido; componente RendaFamiliarPorOrigem; page.tsx da Visão Geral renderizando o bloco no contexto Casa.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/04c-pro-labore-renda-familiar/04c-CONTEXT.md

# Padrão a espelhar: VISÃO derivada (pura + service + loader + componente)
@src/app/(authed)/visao-geral/_lib/service.ts
@src/app/(authed)/visao-geral/_lib/loader.ts
@src/app/(authed)/visao-geral/page.tsx
@src/app/(authed)/canais/_lib/pnl.ts
@src/app/(authed)/canais/_lib/pnl.test.ts
@src/app/(authed)/canais/_components/CategoryBreakdownList.tsx
# Nome/cor da empresa para as linhas do bloco
@src/lib/empresa-cores.ts
---
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Função pura de agrupamento da renda familiar por origem + testes RED (PL-05)</name>
  <files>src/app/(authed)/visao-geral/_lib/renda-familiar.ts, src/app/(authed)/visao-geral/_lib/renda-familiar.test.ts</files>
  <behavior>
    Escrever primeiro os testes (RED) da função pura `agruparRendaPorOrigem`, depois implementá-la.
    Assinatura (TypeScript puro, SEM Prisma — espelha canais/_lib/pnl.ts): recebe a lista já agregada
    de entradas por origem `[{ origemEmpresaId: string | null, totalCents: number }]` e um mapa
    `Map<string, { nome: string; cor: string }>` de empresas; devolve
    `[{ origemEmpresaId: string | null, nome: string, cor: string | null, totalCents: number }]`
    ordenado desc por totalCents, com a linha de `origemEmpresaId === null` rotulada "Outras entradas"
    (cor null) SEMPRE por último (independente do valor).
    Casos:
    - Entradas de 2 empresas + 1 sem origem → 3 linhas, empresas ordenadas desc por valor, "Outras entradas" por último.
    - origemEmpresaId que não está no mapa de empresas (empresa excluída) → usar um rótulo de fallback
      (ex.: "Empresa removida") e cor null; não quebrar.
    - Lista vazia → [].
    - Só "outras entradas" (nenhum pró-labore) → 1 linha "Outras entradas".
    Opcional: uma função `somaRenda(linhas)` que soma os totalCents (para o teste de invariante
    "soma == Dinheiro do mês"); pode ser trivial mas nomeada para fonte única.
  </behavior>
  <action>
    Criar `renda-familiar.test.ts` com os casos acima (RED — a função ainda não existe), depois criar
    `renda-familiar.ts` com `agruparRendaPorOrigem` (e `somaRenda` se usada nos testes). Puro, sem
    Prisma, valores em centavos (Int), ordenação sem mutar a entrada (usar [...itens].sort como em
    groupByCategory). Rótulo "Outras entradas" para origem null; fallback "Empresa removida" para id
    ausente no mapa. Commitar RED e depois GREEN separadamente se seguir o ciclo; o gate abaixo exige verde no fim.
  </action>
  <verify>
    <automated>npx vitest run src/app/\(authed\)/visao-geral/_lib/renda-familiar.test.ts</automated>
  </verify>
  <done>agruparRendaPorOrigem agrupa por origem, ordena desc com "Outras entradas" por último, trata empresa removida e lista vazia; todos os testes de renda-familiar.test.ts passam.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Query de service por origemEmpresaId + loader estendido (PL-05)</name>
  <files>src/app/(authed)/visao-geral/_lib/service.ts, src/app/(authed)/visao-geral/_lib/loader.ts</files>
  <behavior>
    Adicionar uma query que agrega as ENTRADAS da Casa do mês por origemEmpresaId e um loader que a
    combina com a função pura da Task 1. A soma das linhas resultantes deve igualar getTotalEntradas (Casa).
  </behavior>
  <action>
    service.ts (visao-geral) — adicionar `getRendaPorOrigem(userId, month)`: `prisma.transaction.groupBy`
    com `by: ['origemEmpresaId']`, `where: { userId, empresaId: null (Casa), type: 'ENTRADA', date no mês }`,
    `_sum: { amountCents }`. Reusar o mesmo monthRegex e a janela start/end das outras funções do arquivo
    (NÃO duplicar o cálculo da janela de forma divergente — copiar o padrão já usado em getTotalEntradas).
    Devolve `[{ origemEmpresaId: string | null, totalCents: number }]`. Sempre filtra por userId
    (nunca query sem escopo — T-04c-08). É Casa-only: empresaId é SEMPRE null aqui (a renda familiar é
    da Casa).
    loader.ts (visao-geral) — adicionar `loadRendaFamiliar(userId, month)`: busca em paralelo
    getRendaPorOrigem + a lista de empresas do usuário (getEmpresas de empresas/_lib/loader), monta o
    Map<id,{nome,cor}> e chama agruparRendaPorOrigem. Devolve as linhas prontas para o componente.
    NÃO alterar loadDashboardData (que é chamado para Casa e empresa); loadRendaFamiliar é separado e só
    será chamado no ramo Casa da página. Opcional: unit-testar a invariante soma==entradas se viável com
    mock de Prisma (senão, a verificação humana cobre).
  </action>
  <verify>
    <automated>npx vitest run && npx tsc --noEmit</automated>
  </verify>
  <done>getRendaPorOrigem agrega ENTRADAS da Casa por origemEmpresaId (sempre filtrando userId, empresaId null); loadRendaFamiliar junta com as empresas e devolve as linhas agrupadas; testes verdes; tsc limpo.</done>
</task>

<task type="auto">
  <name>Task 3: Componente RendaFamiliarPorOrigem + render no contexto Casa da Visão Geral (PL-05)</name>
  <files>src/app/(authed)/visao-geral/_components/RendaFamiliarPorOrigem.tsx, src/app/(authed)/visao-geral/page.tsx</files>
  <action>
    Criar `RendaFamiliarPorOrigem.tsx` (componente de apresentação, pode ser Server Component — sem estado
    cliente): recebe `linhas: [{ origemEmpresaId, nome, cor, totalCents }]`. Renderiza no cartão padrão
    (rounded-2xl border border-border bg-card p-6) com título "Renda familiar por origem" e uma lista de
    linhas: swatch de cor (via corDescriptor de @/lib/empresa-cores quando cor != null; neutro/cinza para
    "Outras entradas") + nome + valor formatado com formatBRL (R$ 1.234,56). Ordenação já vem pronta do
    loader. Estado vazio (linhas.length === 0): "Nenhuma entrada na Casa neste mês." Espelhar a linguagem
    visual de CategoryBreakdownList/CategorySpendingBars (mesmas classes, fonte mono nos valores). pt-BR em
    todos os textos. Botões/linhas não precisam de 44px (é leitura), mas manter espaçamento confortável.
    page.tsx (visao-geral) — no ramo CASA (empresaIdContexto === null), chamar loadRendaFamiliar(userId,
    currentMonth) (em paralelo com loadDashboardData via Promise.all ou após) e renderizar
    <RendaFamiliarPorOrigem linhas={...} /> ABAIXO dos DashboardCards e ACIMA (ou abaixo) de
    CategorySpendingBars. NO ramo empresa (empresaIdContexto != null) NÃO renderizar o bloco (a renda
    familiar é um conceito da Casa — consistente com isEmpresa nos DashboardCards). Não introduzir fenced
    code no action; descrever.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run build</automated>
  </verify>
  <done>No contexto Casa, a Visão Geral renderiza o bloco "Renda familiar por origem" com uma linha por empresa de origem + "Outras entradas", valores em R$; no contexto de empresa o bloco não aparece; estado vazio tratado; tsc + build limpos.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4: Verificação humana — renda familiar por origem fecha com o Dinheiro do mês</name>
  <what-built>
    O bloco "Renda familiar por origem" na Visão Geral da Casa, somando as entradas por empresa de origem
    (do pró-labore) mais "Outras entradas", fechando com o Dinheiro do mês.
  </what-built>
  <how-to-verify>
    1. Garanta que existe ao menos um pró-labore aplicado (do 04c-02). Se quiser ver 2 origens, aplique
       um pró-labore de uma segunda empresa e, opcionalmente, lance uma ENTRADA comum na Casa (ex.: "Salário")
       para popular "Outras entradas".
    2. `npm run dev`, login, seletor em "Casa", abra Visão Geral no mês dos lançamentos.
    3. Confira o bloco "Renda familiar por origem": uma linha por empresa de origem (com a cor da empresa)
       mostrando o valor do pró-labore daquela empresa, e uma linha "Outras entradas" com as entradas sem origem.
    4. Some mentalmente as linhas do bloco e compare com o card "Dinheiro do mês" — devem ser IGUAIS.
    5. Troque o seletor para uma empresa: o bloco "Renda familiar por origem" NÃO deve aparecer (lá é P&L/acompanhamento de empresa).
    6. (Opcional) Em um mês sem entradas na Casa, o bloco mostra "Nenhuma entrada na Casa neste mês."
  </how-to-verify>
  <resume-signal>Digite "approved" se as linhas por origem baterem com o Dinheiro do mês e o bloco só aparecer na Casa, ou descreva o que ficou errado.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| cliente → Server Component (searchParams) | month/empresaId vêm da URL; usados em query de agregação |
| Server Component → banco | Agregação das entradas da Casa; precisa ser escopada por userId |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04c-08 | Information Disclosure (IDOR) | getRendaPorOrigem / loadRendaFamiliar | mitigate | Toda query filtra por userId (lido da sessão na page); empresaId forçado a null (Casa). Nenhum dado de outro usuário é agregado |
| T-04c-09 | Tampering | month (searchParams) | mitigate | monthRegex valida o formato do mês antes de montar a janela de datas (padrão já existente no service) |
| T-04c-10 | Information Disclosure | nome/cor de empresa removida | accept | Empresa excluída (origem órfã) cai no fallback "Empresa removida" — não vaza dados de outro usuário (a origem só existe em linhas do próprio usuário) |
| T-04c-SC | Tampering | npm/pip/cargo installs | accept | Nenhum pacote novo nesta fatia |
</threat_model>

<verification>
- `npx vitest run` passa (função pura de agrupamento + todos os existentes).
- `npx tsc --noEmit` limpo; `npm run build` sem erros.
- Verificação humana (Task 4): soma do bloco == Dinheiro do mês; bloco só na Casa; estado vazio tratado.
</verification>

<success_criteria>
- Na Visão Geral da Casa, o bloco "Renda familiar por origem" lista as entradas agrupadas por empresa de origem + "Outras entradas", ordenado desc, cores por empresa.
- A soma das linhas iguala o "Dinheiro do mês" da Casa.
- O bloco aparece apenas no contexto Casa.
- Função de agrupamento pura e testada (Vitest); query escopada por userId; sem modelo novo (visão derivada).
</success_criteria>

<output>
Create `.planning/phases/04c-pro-labore-renda-familiar/04c-03-SUMMARY.md` when done
</output>
