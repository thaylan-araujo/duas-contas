# Phase 4 · Fatia 2 — P&L por empresa — Context

**Gathered:** 2026-11-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Fatia 2 do bloco multi-empresa: o **P&L (lucro e perda) por empresa** — a tela "Canais e caixa" (`/canais`), hoje stub "em breve".

Entrega: no contexto de uma empresa ativa, uma **visão automática** do mês (reaproveitando os lançamentos da empresa) que mostra:
- **Faturamento bruto** = soma das receitas (ENTRADA) da empresa no mês.
- **Faturamento líquido** = bruto − impostos (os custos da categoria "Imposto").
- **Lucro** = receitas − **todos** os custos (SAIDA) do mês.
- **Receitas por categoria** e **custos por categoria** (listas), derivadas dos lançamentos.

Genérico e igual para as 3 empresas nesta fatia.

**Fora desta fatia (próximas rodadas):** módulos específicos por tipo (ROAS do afiliado = comissões ÷ anúncios; recorrência vs projetos do jurídico; vendas×preço do infoproduto), pró-labore → renda familiar, consolidado + projeção, dívidas/DAS.
</domain>

<decisions>
## Implementation Decisions

- **D-01:** O P&L **reaproveita os lançamentos da empresa** (já funcionam por empresa desde a Fatia 1): receita = `Transaction` type ENTRADA, custo = type SAIDA, ambos filtrados por `empresaId` + mês. **Nenhuma tela nova de digitação** e **nenhum modelo novo** — é uma VISÃO derivada (igual ao modelo de acompanhamento da Casa).
- **D-02:** **Cálculo:** `bruto = Σ receitas`; `líquido = bruto − impostos`; `lucro = Σ receitas − Σ custos`. Os "impostos" são os custos da(s) categoria(s) de imposto da empresa (a categoria padrão "Imposto" semeada por tipo). Identificar por nome "Imposto" ou uma flag — decidir no planejamento (preferir simples).
- **D-03:** **Genérico pras 3 empresas** nesta fatia. Sem campos/módulos específicos por tipo (ROAS, recorrência/projetos, vendas/plataforma) — ficam para rodadas seguintes.
- **D-04:** **Onde:** a tela `/canais` ("Canais e caixa", seção EMPRESA do menu) vira o P&L da empresa ativa. Pode também exibir cards de bruto/lucro na Visão Geral da empresa — decidir no UI/planejamento. Respeita o contexto ativo (empresaId) e o mês selecionado.
- **D-05:** **Cálculos puros e testados** (bruto/líquido/lucro, agrupamento por categoria) em `src/lib` ou `_lib`, sem Prisma, com Vitest.

### Claude's Discretion
- Como identificar a categoria "Imposto" para o líquido (nome vs flag).
- Layout exato da tela `/canais` (cards de bruto/líquido/lucro + listas de receitas e custos por categoria) — seguir os padrões da Casa (acompanhamento) e o design doc.
- Se o P&L aparece só em `/canais` ou também em cards na Visão Geral da empresa.
</decisions>

<canonical_refs>
## Canonical References

- `docs/superpowers/specs/2026-11-25-multi-empresa-renda-familiar-design.md` — design autoritativo do bloco multi-empresa (o P&L genérico está lá).
- `spec.md` §5 "Canais e caixa" (reinterpretado: P&L por empresa; comissões/anúncios/ROAS do afiliado é módulo de uma rodada futura) e §"Evolução: Multi-Empresa".
- `.planning/phases/04-empresas-multi-e-renda-familiar/04-CONTEXT.md` — Fatia 1 (empresas, categorias por empresa, lançamentos por empresa, ContaSelector).
- `src/app/(authed)/visao-geral/_lib/{service,loader}.ts` — `getTotalSpent`/`getTotalEntradas`/`getCategorySpending` já aceitam `empresaId` (reaproveitar/espelhar).
- `.claude/CLAUDE.md` — pt-BR, Int cents, Server Actions fina.
</canonical_refs>

<code_context>
## Existing Code Insights

- Lançamentos já funcionam por empresa (Fatia 1): `Transaction` tem `empresaId`, `type` (ENTRADA/SAIDA), `categoryId`, `category.kind` (RECEITA/CUSTO).
- `visao-geral/_lib/service.ts`: `getTotalSpent` (SAIDA), `getTotalEntradas` (ENTRADA), `getCategorySpending` — todos com `empresaId`. Reaproveitar/estender para custos por categoria da empresa.
- Categorias por empresa já semeadas por tipo (Fatia 1), incluindo "Imposto" como custo.
- Tela `/canais` é um stub "em breve" a implementar.
- Padrões de UI: cards + listas por categoria (reaproveitar do dashboard/acompanhamento da Casa). formatBRL.
- Vitest instalado.
</code_context>

<deferred>
## Deferred Ideas
- Módulos por tipo: ROAS do afiliado (comissões ÷ anúncios), recorrência+projetos (jurídico), vendas×preço + plataforma (infoproduto).
- Pró-labore multi-origem → renda familiar; consolidado das empresas; projeção de caixa; dívidas/DAS por empresa.
</deferred>

---

*Phase: 4 · Fatia 2 — P&L por empresa*
*Context gathered: 2026-11-25*
