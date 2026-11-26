# Phase 4 · Fatia 4 — Consolidado + Projeção — Context

**Gathered:** 2026-11-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Fecha a Fase 4 (multi-empresa): o **consolidado das empresas** e uma **projeção simples** de "quanto vai sobrar", com estimativa de DAS e alerta de saldo negativo.

Entrega:
1. **Tela "Consolidado"** (menu, seção Empresa): soma das empresas — faturamento bruto/líquido/lucro somados, DAS estimado total, total de pró-labore → renda familiar; tabela por empresa + totais.
2. **Estimativa de DAS** por empresa: alíquota (%) definida por empresa × faturamento do mês. Aparece no P&L da empresa e no consolidado.
3. **Projeção simples** (próximos 3–6 meses) de "quanto vai sobrar" — família e por empresa — usando contas fixas (Casa) + tendência/média dos últimos meses. É **estimativa** (deixar claro).
4. **Alerta de saldo negativo**: quando a sobra projetada de um mês ficar negativa — na **família E por empresa** — destacar o mês e quanto falta.

**Fora:** projeção completa de caixa com DAS real do Simples (anexos/faixas/Fator R) + dívidas (Pronampe, Simples parcelado) — fatia futura de impostos/dívidas. Calendário, relatório PDF, importação, PWA, assistente WhatsApp — fases futuras.
</domain>

<decisions>
## Implementation Decisions

- **D-01:** Escopo = Phase Boundary. Versão **simples/estimativa** da projeção (honesta sobre ser aproximação); a completa vem com DAS/dívidas.
- **D-02 (consolidado):** **Tela própria "Consolidado"** no menu (seção Empresa). Mostra a soma de todas as empresas do usuário no mês: faturamento bruto/líquido/lucro somados, DAS estimado total, pró-labore total (→ renda familiar). Tabela com uma linha por empresa + linha de total. Reaproveita as funções do P&L (Fatia 2).
- **D-03 (DAS):** campo **alíquota (%) por empresa** (aditivo: `Empresa.aliquotaDasPercent` nullable — migração só adiciona coluna). **DAS estimado do mês = alíquota × faturamento bruto** da empresa. Exibir no P&L da empresa (Fatia 2) e somado no consolidado. Se a empresa não tem alíquota definida, DAS estimado = 0 / "não definido".
- **D-04 (projeção):** **simples**, próximos 3–6 meses, por **mês** (não cumulativo nesta versão — não rastreamos saldo de caixa ainda). 
  - **Por empresa:** faturamento esperado − custos esperados − DAS estimado (esperados = média/tendência dos últimos meses de lançamentos da empresa).
  - **Família:** renda esperada (média dos pró-labores recebidos + outras entradas) − gastos esperados (contas fixas da Casa, que têm valor, + média das despesas variáveis da Casa).
  - Deixar claro na UI que é **estimativa baseada na média**.
- **D-05 (alerta):** quando a **sobra projetada de um mês** ficar negativa — tanto na **família** quanto em **qualquer empresa** — destacar o mês e **quanto falta**.

### Claude's Discretion
- Modelo exato da "tendência" (ex.: média dos últimos 3 meses de lançamentos; quantos meses).
- Onde a projeção vive (na tela Consolidado, numa seção; e a projeção da família pode aparecer na Visão Geral da Casa também — decidir no planejamento/UI).
- Forma de exibir os 3–6 meses (tabela/colunas por mês, como o spec §5 descreve o fluxo de caixa).
- Schema da alíquota (campo em Empresa).
</decisions>

<canonical_refs>
## Canonical References
- `docs/superpowers/specs/2026-11-25-multi-empresa-renda-familiar-design.md` — consolidado + projeção.
- `spec.md` §5 "Canais e caixa" (fluxo de caixa projetado, colunas por mês, alerta de saldo negativo — adaptar como estimativa simples) e §Cálculos (saldo final do mês).
- `docs/research/2026-11-26-benchmark-controle-financeiro.md` — projeção (saldo atual + obrigações datadas; previsão de DAS pela faixa do Simples). Nossa versão é simplificada (média + contas fixas).
- `.planning/phases/04b-pl-empresa/04b-CONTEXT.md` — P&L (reaproveitar faturamento/lucro para o consolidado).
- `.planning/phases/04c-pro-labore-renda-familiar/04c-CONTEXT.md` — renda familiar (pró-labore total).
- `.planning/phases/03b-casa-acompanhamento/03b-CONTEXT.md` — contas fixas (FixedAccount), acompanhamento Casa.
</canonical_refs>

<code_context>
## Existing Code Insights
- `canais/_lib/pnl.ts` — faturamento bruto/líquido/lucro por empresa (reaproveitar e somar no consolidado).
- `empresas/_lib/` — lista de empresas do usuário (para iterar no consolidado) + onde adicionar a alíquota.
- `visao-geral/_lib/` — renda familiar, dinheiro do mês, contas fixas (para a projeção da família).
- `contas-fixas` (FixedAccount) — obrigações futuras datadas da Casa (entram na projeção).
- `src/lib/weeks.ts`/`format.ts`, Recharts (gráficos). Vitest para funções puras de projeção.
- Migração aditiva (alíquota) — backup checkpoint (CLAUDE.md), DIRECT_URL, nunca shadow-db no banco real.
</code_context>

<deferred>
## Deferred Ideas
Projeção completa de caixa (DAS real do Simples + dívidas Pronampe/parcelamento), saldo de caixa cumulativo (saldo inicial), calendário, relatório PDF, importação, assistente WhatsApp.
</deferred>

---

*Phase: 4 · Fatia 4 — Consolidado + Projeção*
*Context gathered: 2026-11-26*
