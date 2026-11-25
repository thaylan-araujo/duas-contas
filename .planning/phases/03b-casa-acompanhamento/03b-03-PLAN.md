---
phase: 03b-casa-acompanhamento
plan: 03
type: execute
wave: 2
depends_on: ["03b-02"]
autonomous: false
files_modified:
  - src/app/(authed)/visao-geral/_lib/service.ts
  - src/app/(authed)/visao-geral/_lib/loader.ts
  - src/app/(authed)/visao-geral/_components/DashboardCards.tsx
  - src/app/(authed)/visao-geral/page.tsx
requirements: [CASA-R-01, CASA-R-05]
must_haves:
  truths:
    - "O dashboard da Casa mostra o card 'Dinheiro do mês' (valor do mês editável inline) no lugar de 'Teto do mês'"
    - "O dashboard mostra 'Restante do mês' (dinheiro do mês − despesas da Casa no mês) no lugar dos cards 'Planejado' e 'Folga'"
    - "O dashboard mantém 'Gasto até hoje' e o gráfico 'Gastos por semana' (gasto real)"
    - "O dashboard não depende mais de PlanItem/getPlanTotal"
  artifacts:
    - path: "src/app/(authed)/visao-geral/_components/DashboardCards.tsx"
      provides: "Cards do dashboard: Dinheiro do mês, Restante do mês, Gasto até hoje"
      contains: "Restante do mês"
    - path: "src/app/(authed)/visao-geral/_lib/loader.ts"
      provides: "Loader do dashboard sem getPlanTotal; fornece restanteCents"
      contains: "restante"
  key_links:
    - from: "src/app/(authed)/visao-geral/_components/DashboardCards.tsx"
      to: "src/app/(authed)/visao-geral/_components/InlineCeilingEditor.tsx"
      via: "card 'Dinheiro do mês' reaproveita o editor inline do MonthlyBudget"
      pattern: "InlineCeilingEditor"
    - from: "src/app/(authed)/visao-geral/_lib/loader.ts"
      to: "src/app/(authed)/visao-geral/_lib/service.ts"
      via: "loader usa getTotalSpent para calcular restante (dinheiro − despesas)"
      pattern: "getTotalSpent"
---

<objective>
Retrabalha o dashboard da Casa (D-06/CASA-R-05) para o modelo de acompanhamento: o card "Teto do mês" vira "Dinheiro do mês" (mesmo MonthlyBudget.ceilingCents, editável inline — D-02/CASA-R-01); os cards "Planejado" e "Folga" (que dependiam do plano manual) viram um único card "Restante do mês" (dinheiro do mês − despesas da Casa no mês). Mantém "Gasto até hoje" e o gráfico "Gastos por semana" (gasto real). Este plano roda depois do Plano 02 porque compartilha `visao-geral/_lib/loader.ts` e depende da remoção de getPlanTotal feita lá.

Purpose: Fecha o rework alinhando o dashboard com a tela de acompanhamento — nenhum card fala mais em "planejado/folga" do plano manual que foi removido.

Output: DashboardCards reescrito (3 cards), loader do dashboard fornecendo restanteCents, page.tsx sem props de plano.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03b-casa-acompanhamento/03b-CONTEXT.md
@docs/superpowers/specs/2026-11-25-casa-acompanhamento-design.md
@.claude/CLAUDE.md
@src/lib/format.ts
@src/app/(authed)/visao-geral/_lib/service.ts
@src/app/(authed)/visao-geral/_lib/loader.ts
@src/app/(authed)/visao-geral/_components/DashboardCards.tsx
@src/app/(authed)/visao-geral/_components/InlineCeilingEditor.tsx
@src/app/(authed)/visao-geral/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Loader do dashboard fornece restante do mês (D-06/CASA-R-01)</name>
  <files>src/app/(authed)/visao-geral/_lib/loader.ts</files>
  <action>
    Ajustar `loadDashboardData` para o modelo de acompanhamento (o Plano 02 já removeu getPlanTotal/planItem daqui). Calcular o restante do mês da Casa reusando o que já é carregado: restanteCents = budget.ceilingCents − totalSpentCents (dinheiro do mês − despesas da Casa no mês). Reaproveitar a função pura computeRestanteMes de planejamento/_lib/acompanhamento.ts (fonte única do cálculo — não duplicar a subtração). Retornar budget, totalSpentCents, restanteCents, categorySpending e weeklySpending. O restante só se aplica ao contexto Casa (empresaId null); para contexto de empresa, manter o comportamento existente dos demais cards (este rework é só da Casa — não tocar a lógica de empresa além do necessário para compilar).
  </action>
  <verify>
    <automated>bash -c 'grep -rq "restante" src/app/*/visao-geral/_lib/loader.ts && ! grep -rq "getPlanTotal\|planTotalCents" src/app/*/visao-geral/_lib/loader.ts && echo OK'</automated>
  </verify>
  <done>loadDashboardData devolve restanteCents (= dinheiro do mês − despesas) reusando computeRestanteMes; não há mais getPlanTotal nem planTotalCents no loader.</done>
</task>

<task type="auto">
  <name>Task 2: Reescrever DashboardCards (Dinheiro do mês / Restante do mês / Gasto até hoje) e a page (D-06/CASA-R-05)</name>
  <files>src/app/(authed)/visao-geral/_components/DashboardCards.tsx, src/app/(authed)/visao-geral/page.tsx, src/app/(authed)/visao-geral/_lib/service.ts</files>
  <action>
    Reescrever os cards do dashboard conforme o design doc (D-06/CASA-R-05):

    1. `DashboardCards.tsx`: trocar a props interface para { budget, totalSpentCents, restanteCents, month } (remover planTotalCents). Renderizar os cards:
       - Card "Dinheiro do mês": label "Dinheiro do mês" (antes "Teto do mês"); continuar usando o InlineCeilingEditor existente (edita MonthlyBudget.ceilingCents via upsertMonthlyBudgetAction — D-02/CASA-R-01). Nenhuma mudança no editor.
       - Card "Restante do mês": label "Restante do mês" (substitui os antigos cards "Planejado" e "Folga"). Mostrar formatBRL(restanteCents); se restanteCents for negativo, mostrar "Passou R$ X" (formatBRL do valor absoluto) em text-warning; positivo em text-positive, seguindo o padrão de cores já usado no card Folga atual.
       - Card "Gasto até hoje": manter (hoje chamado "Gasto hoje") exibindo formatBRL(totalSpentCents). Rotular "Gasto até hoje" para casar com o design doc.
       O grid passa de 4 para 3 cards — ajustar as classes (ex.: grid-cols-1 sm:grid-cols-3) mantendo o visual (rounded-2xl, bg-card, border-border). pt-BR, formatBRL.
    2. `page.tsx`: ajustar a desestruturação do loader para { budget, totalSpentCents, restanteCents, categorySpending, weeklySpending } e passar restanteCents (não planTotalCents) para DashboardCards. Manter CategorySpendingBars e WeeklyBarChart (gráfico "Gastos por semana" — gasto real, sem mudança). userId sempre de supabase.auth.getUser.
    3. `service.ts`: nenhuma mudança de assinatura é esperada aqui — getTotalSpent/getWeeklySpending/getCategorySpending permanecem. Só tocar se o tsc acusar algo relacionado à remoção de getPlanTotal; não alterar a lógica de empresa.
  </action>
  <verify>
    <automated>bash -c 'grep -rq "Restante do mês" src/app/*/visao-geral/_components/DashboardCards.tsx && grep -rq "Dinheiro do mês" src/app/*/visao-geral/_components/DashboardCards.tsx && ! grep -rq "planTotalCents\|Planejado\|Folga" src/app/*/visao-geral/_components/DashboardCards.tsx && npx tsc --noEmit'</automated>
  </verify>
  <done>DashboardCards mostra "Dinheiro do mês", "Restante do mês" e "Gasto até hoje"; não há mais "Planejado"/"Folga"/planTotalCents; page.tsx passa restanteCents; CategorySpendingBars e WeeklyBarChart mantidos; `npx tsc --noEmit` passa.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Verificação ponta a ponta do rework da Casa (CASA-R-01..05)</name>
  <what-built>
    O rework da Casa está completo: /planejamento vira acompanhamento (barra do mês, tetos por categoria, semanal automático) e o dashboard da Casa mostra Dinheiro do mês / Restante do mês / Gasto até hoje + gráfico semanal.
  </what-built>
  <how-to-verify>
    1. Rodar `npm run dev` e abrir /planejamento (contexto Casa):
       - Topo: barra "Dinheiro do mês" com o valor do mês; clicar e editar o valor salva e a barra/restante atualizam.
       - Lista por categoria: categorias com teto mostram "gastei X de Y" com barra; sem teto mostram só o gasto. Definir um teto inline em uma categoria e confirmar que aparece "gastei X de Y"; remover o teto e confirmar que volta a mostrar só o gasto. Lançar uma despesa acima do teto e confirmar que NÃO bloqueia (só mostra em alerta).
       - Bloco "Gastos por semana": mostra as 4 semanas (1–7/8–14/15–21/22–fim) com o gasto por categoria, sem nenhum campo para digitar.
    2. Abrir /visao-geral (contexto Casa):
       - Cards: "Dinheiro do mês" (editável), "Restante do mês" (= dinheiro − despesas), "Gasto até hoje". Não deve existir "Planejado" nem "Folga".
       - Gráfico "Gastos por semana" continua mostrando o gasto real.
    3. Confirmar que não há tela/tabela de plano manual nem campo de "Gastei R$" digitado em nenhum lugar da Casa.
    4. Rodar `npm test` (verde) e `npm run build` (sem erros).
  </how-to-verify>
  <resume-signal>Digite "approved" se tudo funciona, ou descreva o que está errado.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| cliente → Server Action | O card "Dinheiro do mês" edita o MonthlyBudget via upsertMonthlyBudgetAction (entrada não confiável) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03b-20 | Spoofing | upsertMonthlyBudgetAction (card Dinheiro do mês) | mitigate | Ação reutilizada já lê userId da sessão, nunca do form; ceilingUpdateSchema valida ceilingCents positivo (sem mudança) |
| T-03b-21 | Information Disclosure | restante/gasto de outro usuário | mitigate | getTotalSpent/getOrCreateMonthlyBudget sempre filtram por userId; restante derivado só desses valores |
| T-03b-22 | Tampering | contexto Casa vs empresa | accept | rework é só da Casa (empresaId null); lógica de empresa inalterada, baixo risco |
</threat_model>

<verification>
- `npx tsc --noEmit` passa.
- `npm test` passa (as funções puras do Plano 02 cobrem o cálculo do restante reusado aqui).
- `npm run build` sem erros.
- Humano aprova a verificação ponta a ponta (Task 3).
</verification>

<success_criteria>
- Dashboard da Casa com "Dinheiro do mês", "Restante do mês" e "Gasto até hoje"; gráfico semanal mantido.
- Nenhum card "Planejado"/"Folga"; nenhuma dependência de getPlanTotal/PlanItem.
- Rework da Casa verificado ponta a ponta e aprovado.
</success_criteria>

<output>
Create `.planning/phases/03b-casa-acompanhamento/03b-03-SUMMARY.md` when done
</output>
