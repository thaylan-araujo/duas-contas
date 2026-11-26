# Phase 4 · Fatia 3 — Pró-labore → Renda Familiar — Context

**Gathered:** 2026-11-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Reativar o **pró-labore** no mundo multi-empresa: uma transferência de **cada empresa → Casa**, e mostrar a **renda familiar por origem** na Visão Geral da Casa.

Entrega:
1. **Aplicar pró-labore** (manual, mês a mês): escolher a empresa de origem, o valor e a data → cria atomicamente o par (saída na empresa + entrada na Casa), ligados por `pairId`.
2. O pró-labore cai como **entrada na Casa** → soma automaticamente no "Dinheiro do mês" (modelo de acompanhamento da Fatia 3.5).
3. **Bloco "Renda familiar por origem"** na Visão Geral da Casa: quanto veio de cada empresa + outras entradas.

**Fora:** consolidado das empresas + projeção de caixa (Fatia 4); dívidas/DAS; assistente de WhatsApp (fase futura).
</domain>

<decisions>
## Implementation Decisions

- **D-01:** Escopo = Phase Boundary acima. Reaproveita o par atômico de pró-labore da Fase 2 (`Transaction.pairId`, `prisma.$transaction`), hoje **desabilitado** desde a Fatia 1.
- **D-02 (mecânica):** **Manual, mês a mês.** Um fluxo "Aplicar pró-labore" onde o usuário escolhe a **empresa de origem**, o **valor** e a **data**; o sistema cria o par. (Reabilita/adapta o caminho de pró-labore do `TransactionSheet` desabilitado na Fatia 1, OU um fluxo dedicado — discrição.)
- **D-03 (na empresa):** o pró-labore é uma **SAÍDA na empresa** na categoria **"Pró-labore"** (criada por empresa se não existir). **Conta como custo → reduz o lucro** da empresa (decisão do usuário; consistente com o P&L da Fatia 2, onde lucro = receitas − todos os custos). Ligada por `pairId` à entrada na Casa; a **origem (empresa)** é rastreável.
- **D-04 (na Casa / renda familiar):** o par cria uma **ENTRADA na Casa** (empresaId null), categoria "Pró-labore"/"Renda". Como o "Dinheiro do mês" da Casa = soma das entradas (Fatia 3.5), o pró-labore entra lá automaticamente. A **Visão Geral da Casa** ganha um bloco **"Renda familiar por origem"**: soma das entradas agrupadas por empresa de origem + "outras entradas" (ex.: salário).
- **D-05 (spec):** o pró-labore **conta como custo** no lado da empresa — `spec.md` §Cálculos já atualizado (antes dizia "não conta como gasto").

### Claude's Discretion
- Schema: como rastrear a **origem** da entrada na Casa — via `pairId` (join com a saída da empresa, cujo `empresaId` é a origem) ou um campo `origemEmpresaId` na Transaction. Preferir o mais simples/robusto.
- Onde fica o botão "Aplicar pró-labore" (na tela da empresa? na Casa? no seletor?). Sugestão: na visão da empresa (ex.: `/canais`) ou um botão global.
- Layout do bloco "Renda familiar por origem".
- Garantir a categoria "Pró-labore" por empresa (getOrCreate) e na Casa.
</decisions>

<canonical_refs>
## Canonical References
- `docs/superpowers/specs/2026-11-25-multi-empresa-renda-familiar-design.md` — design autoritativo (pró-labore → renda familiar).
- `spec.md` §"Evolução: Multi-Empresa" + §Cálculos (pró-labore atualizado).
- `.planning/phases/02-core-crud/02-CONTEXT.md` — D-05/D-06: par de pró-labore com `pairId`, edição bloqueada, exclusão atômica do par.
- `.planning/phases/04-empresas-multi-e-renda-familiar/04-CONTEXT.md` — Fatia 1: `createProLaboreService` foi **neutralizado/desabilitado** (reabilitar aqui), empresaId axis.
- `.planning/phases/03b-casa-acompanhamento/03b-CONTEXT.md` — "Dinheiro do mês" da Casa = soma das ENTRADAS (o pró-labore soma aqui).
- `.planning/phases/04b-pl-empresa/04b-CONTEXT.md` — P&L: lucro = receitas − todos os custos (o pró-labore reduz o lucro como custo).
</canonical_refs>

<code_context>
## Existing Code Insights
- `Transaction.pairId` (Fase 2) — par atômico; `createProLaboreService`/`deleteProLaboreService` existem mas **desabilitados** na Fatia 1 (reabilitar/adaptar para múltiplas empresas: a saída agora tem `empresaId` = a empresa escolhida, a entrada `empresaId` null = Casa).
- `TransactionSheet` tem o `PRO_LABORE_SENTINEL` **desabilitado** (handleTipoChange no-op) — reabilitar com seleção de empresa de origem.
- `visao-geral/_lib/{service,loader}.ts` — `getTotalEntradas` (Dinheiro do mês), `getCategorySpending` — adicionar agrupamento de entradas por empresa de origem (renda familiar).
- `canais/_lib/pnl.ts` — lucro = receitas − custos (o pró-labore já entra como custo "Pró-labore").
- Categorias por empresa (Fatia 1) — garantir "Pró-labore" por empresa.
- pt-BR, Int cents, Vitest. Funções de cálculo puras testadas.
</code_context>

<deferred>
## Deferred Ideas
Consolidado das empresas + projeção de caixa + alerta de saldo negativo (Fatia 4). Dívidas/DAS. Assistente de WhatsApp (fase futura, documentada).
</deferred>

---

*Phase: 4 · Fatia 3 — Pró-labore → Renda Familiar*
*Context gathered: 2026-11-26*
