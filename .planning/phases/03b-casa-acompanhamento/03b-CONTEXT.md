# Phase 3.5: Casa — Acompanhamento (rework) — Context

**Gathered:** 2026-11-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Retrabalhar a Casa: **substituir o planejamento semanal manual** (Fase 3) por um **acompanhamento** guiado pelos lançamentos.

Entrega:
1. **Barra "Dinheiro do mês"**: valor definido manualmente pelo usuário a cada mês; a barra = dinheiro do mês − soma das despesas da Casa no mês → mostra quanto resta.
2. **Teto mensal por categoria variável** (referência, não trava): mostra "gastei X de Y" por categoria que tenha teto definido.
3. **Gasto semanal automático**: somado dos `Transaction` reais da Casa por semana (1–7/8–14/15–21/22–fim) e por categoria, reutilizando `src/lib/weeks.ts`. Sem digitação.

**Remove:** modelos `PlanItem` e `WeeklySpend`; a tabela de itens de plano, a marcação de semanas, o "Gastei R$ por semana" digitado e os 4 cartões semanais de planejado-vs-gastei. Retrabalha os cartões "Planejado/Folga" do dashboard.

**Fora do escopo:** empresas (Fase 4), metas e contas fixas (continuam como estão — Fase 3), lançamento diário (já existe).
</domain>

<decisions>
## Implementation Decisions

- **D-01:** Escopo = Phase Boundary acima. É majoritariamente **remoção + simplificação** da tela `/planejamento`.
- **D-02:** **`MonthlyBudget.ceilingCents` é reaproveitado como "dinheiro do mês"** (valor disponível que o usuário define no mês, editável inline como já é hoje). A barra de topo = `dinheiro do mês − soma das despesas (SAIDA) da Casa no mês`. Mantém o auto-copy do mês anterior (D-04 da Fase 2).
- **D-03:** **Teto por categoria** = limite mensal **opcional** por categoria da Casa. Uma categoria com teto definido aparece com a barra "gastei X de Y"; sem teto, aparece só o total gasto. É **referência**, nunca bloqueia lançamento. Guardar como limite por (userId, mês, categoria) com cópia do mês anterior, OU um limite padrão por categoria — decidir no planejamento (preferir o que for mais simples e editável).
- **D-04:** **Gasto semanal automático**: derivado dos `Transaction` da Casa (SAIDA) por faixa de semana (`src/lib/weeks.ts`) e por categoria. Nada persistido, nada digitado. Reaproveitar `getWeeklySpending`.
- **D-05:** **Remover** `PlanItem` e `WeeklySpend` do schema (migração Prisma via DIRECT_URL/5432, **backup antes** — são dados de teste, lado Casa só tem o plano de teste). Remover os componentes da tela de planejamento semanal (PlanTable, WeekCard, WeeklyCardsSection, InlineGasteiEditor, SegmentedBar, etc.) e o serviço/loader/actions do plano de itens.
- **D-06:** **Dashboard da Casa:** "Teto do mês" → "Dinheiro do mês"; "Planejado" e "Folga" → "Restante do mês" (dinheiro − despesas); manter "Gasto até hoje" e o gráfico "Gastos por semana" (gasto real). Layout exato no planejamento/UI.

### Claude's Discretion
- Forma exata do limite por categoria (tabela por mês vs. limite fixo por categoria).
- Layout da tela nova de `/planejamento` (barra do mês no topo, lista de categorias com teto/gasto, bloco semanal automático) e dos cartões do dashboard — seguir o design doc e os padrões da Fase 3.
- Quais categorias nascem com teto (pode começar sem teto e o usuário define; ou seed de tetos em Alimentação/Gasolina/Refeição livre).
</decisions>

<canonical_refs>
## Canonical References

- `docs/superpowers/specs/2026-11-25-casa-acompanhamento-design.md` — **design autoritativo** (leitura obrigatória).
- `spec.md` §3 (bloco "Atualizado 25/11/2026 — Acompanhamento por categoria") — precede a descrição manual antiga.
- `.planning/phases/03-planning/03-CONTEXT.md` e `03-RESEARCH.md` — o que a Fase 3 construiu (PlanItem/WeeklySpend/weeks.ts) que agora é retrabalhado.
- `src/lib/weeks.ts` — faixas de semana (reaproveitar).
- `.claude/CLAUDE.md` — pt-BR, Int cents, migrations via DIRECT_URL, **backup antes de mexer no banco**.
</canonical_refs>

<code_context>
## Existing Code Insights

- `prisma/schema.prisma`: `MonthlyBudget` (reaproveitar `ceilingCents`), `PlanItem` (remover), `WeeklySpend` (remover), `Category`, `Transaction`.
- `src/app/(authed)/planejamento/**` — tela e `_lib` a retrabalhar (remover itens de plano + cartões semanais).
- `src/app/(authed)/visao-geral/_lib/{service,loader}.ts` e `getWeeklySpending` + `src/lib/weeks.ts` — reaproveitar para o gasto semanal automático.
- `InlineCeilingEditor` (edição inline do valor no dashboard) — reaproveitar para "dinheiro do mês" e tetos por categoria.
- Vitest instalado; funções de cálculo puras devem ter testes.
</code_context>

<deferred>
## Deferred Ideas
Nenhuma nesta rodada — o escopo é o rework da Casa. Empresas (P&L, pró-labore→renda familiar, consolidado) seguem nas fatias da Fase 4; multiusuário/orçamento por pessoa na cauda.
</deferred>

---

*Phase: 3.5 — Casa Acompanhamento (rework)*
*Context gathered: 2026-11-25*
