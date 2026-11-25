---
phase: 03b-casa-acompanhamento
plan: 02
type: execute
wave: 1
depends_on: ["03b-01"]
autonomous: true
files_modified:
  - src/app/(authed)/planejamento/_lib/acompanhamento.ts
  - src/app/(authed)/planejamento/_lib/acompanhamento.test.ts
  - src/app/(authed)/planejamento/_lib/service.ts
  - src/app/(authed)/planejamento/_lib/loader.ts
  - src/app/(authed)/planejamento/_lib/actions.ts
  - src/app/(authed)/planejamento/_lib/schema.ts
  - src/app/(authed)/planejamento/_lib/service.test.ts
  - src/app/(authed)/planejamento/page.tsx
  - src/app/(authed)/planejamento/_components/MesBar.tsx
  - src/app/(authed)/planejamento/_components/CategoriaTetoList.tsx
  - src/app/(authed)/planejamento/_components/InlineCategoriaTetoEditor.tsx
  - src/app/(authed)/planejamento/_components/GastoSemanalAuto.tsx
  - src/app/(authed)/planejamento/_components/PlanTable.tsx
  - src/app/(authed)/planejamento/_components/WeekCard.tsx
  - src/app/(authed)/planejamento/_components/WeeklyCardsSection.tsx
  - src/app/(authed)/planejamento/_components/SegmentedBar.tsx
  - src/app/(authed)/planejamento/_components/ResumoPlano.tsx
  - src/app/(authed)/planejamento/_components/PlanItemSheet.tsx
  - src/app/(authed)/planejamento/_components/NewPlanItemButton.tsx
  - src/app/(authed)/planejamento/_components/DeletePlanItemDialog.tsx
  - src/app/(authed)/planejamento/_components/InlineGasteiEditor.tsx
  - src/app/(authed)/planejamento/_components/CopyPlanButton.tsx
  - src/app/(authed)/planejamento/_components/groupColors.ts
  - src/app/(authed)/visao-geral/_lib/loader.ts
requirements: [CASA-R-01, CASA-R-02, CASA-R-03, CASA-R-04]
must_haves:
  truths:
    - "O usuário vê a barra 'Dinheiro do mês' no topo de /planejamento com valor editável inline e o restante (dinheiro − despesas da Casa no mês)"
    - "O usuário vê, por categoria da Casa, o gasto do mês; categorias com teto definido mostram 'gastei X de Y' com barra de progresso; sem teto mostram só o gasto"
    - "O usuário pode definir/editar inline o teto mensal de uma categoria; o teto é referência e nunca bloqueia lançamento"
    - "O usuário vê o gasto semanal (1–7/8–14/15–21/22–fim) por categoria calculado automaticamente dos lançamentos, sem digitar nada"
    - "A tela de planejamento semanal manual (tabela de itens, cartões semanais, campo de gasto digitado) não existe mais"
  artifacts:
    - path: "src/app/(authed)/planejamento/_lib/acompanhamento.ts"
      provides: "Funções puras: restante do mês, gasto por categoria vs teto, agrupamento semanal por categoria"
      min_lines: 40
    - path: "src/app/(authed)/planejamento/_lib/acompanhamento.test.ts"
      provides: "Testes unitários Vitest das funções puras de acompanhamento"
      contains: "describe"
    - path: "src/app/(authed)/planejamento/page.tsx"
      provides: "Tela de acompanhamento (barra do mês + tetos por categoria + semanal automático)"
      contains: "Dinheiro do mês"
    - path: "src/app/(authed)/planejamento/_components/MesBar.tsx"
      provides: "Barra 'Dinheiro do mês' com editor inline e restante"
      contains: "Dinheiro do mês"
  key_links:
    - from: "src/app/(authed)/planejamento/page.tsx"
      to: "src/app/(authed)/planejamento/_lib/loader.ts"
      via: "a página chama loadAcompanhamentoData(userId, month)"
      pattern: "loadAcompanhamento"
    - from: "src/app/(authed)/planejamento/_lib/loader.ts"
      to: "src/app/(authed)/visao-geral/_lib/service.ts"
      via: "reusa getTotalSpent e getWeeklySpending (Casa SAIDA)"
      pattern: "getWeeklySpending|getTotalSpent"
    - from: "src/app/(authed)/planejamento/_lib/service.ts"
      to: "src/lib/weeks.ts"
      via: "agrupamento semanal por categoria usa weekDateRange/weekIndexForDay"
      pattern: "week(DateRange|IndexForDay)"
    - from: "src/app/(authed)/planejamento/_lib/actions.ts"
      to: "prisma.categoryBudget"
      via: "upsert/delete do teto por categoria escopado por userId da sessão"
      pattern: "categoryBudget"
---

## Phase Goal

**As a** pessoa que lança as despesas da Casa no dia a dia, **I want to** ver o dinheiro do mês diminuir, o gasto por categoria contra um teto de referência e o gasto semanal somado sozinho, **so that** eu acompanhe a Casa sem manter um plano manual.

<objective>
Núcleo do rework da Casa (fatia vertical). Substitui a tela `/planejamento` (planejamento semanal manual) por um **acompanhamento** guiado pelos lançamentos: barra "Dinheiro do mês" (D-02/CASA-R-01), teto mensal opcional por categoria com "gastei X de Y" (D-03/CASA-R-02), e gasto semanal automático por categoria (D-04/CASA-R-03). Remove todos os componentes e a lógica do plano manual (D-05/CASA-R-04). Depois deste plano, o usuário abre `/planejamento` e vê o modelo-alvo do design doc funcionando ponta a ponta.

Purpose: É a entrega central da fase. Segue o modelo vertical MVP — primeiro um teste das funções puras (RED), depois a fatia que faz passar, depois o teto editável inline.

Output: `acompanhamento.ts` (puro, testado), `service.ts`/`loader.ts`/`actions.ts`/`schema.ts` reescritos, `page.tsx` nova, componentes `MesBar`/`CategoriaTetoList`/`InlineCategoriaTetoEditor`/`GastoSemanalAuto`, e os componentes do plano manual removidos.
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
@src/lib/weeks.ts
@src/lib/format.ts
@src/app/(authed)/visao-geral/_lib/service.ts
@src/app/(authed)/visao-geral/_components/InlineCeilingEditor.tsx
@src/app/(authed)/planejamento/_lib/service.ts
@src/app/(authed)/planejamento/_lib/loader.ts
@src/app/(authed)/planejamento/_lib/actions.ts
@src/app/(authed)/planejamento/page.tsx
@src/app/(authed)/lancamentos/_lib/service.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Funções puras de acompanhamento + testes RED (D-02/D-03/D-04)</name>
  <files>src/app/(authed)/planejamento/_lib/acompanhamento.ts, src/app/(authed)/planejamento/_lib/acompanhamento.test.ts</files>
  <behavior>
    - computeRestanteMes(dinheiroMesCents, despesasMesCents) retorna dinheiroMesCents menos despesasMesCents. Pode ser negativo (gastou mais que o definido). Ex.: (850000, 530000) resulta 320000.
    - computeCategoriaStatus com entrada { gastoCents, limitCents }:
        * limitCents null retorna { temTeto: false, restanteCents: null, pct: null } (só mostra o gasto).
        * limitCents definido retorna { temTeto: true, restanteCents: limitCents menos gastoCents, pct: quando limitCents maior que zero usar min(100, round(gastoCents/limitCents*100)); quando limitCents zero usar 100 }. restanteCents pode ser negativo (passou do teto); NUNCA bloqueia — é só referência.
    - groupWeeklyByCategory(transactions, month): recebe lançamentos com { date: Date, amountCents, categoryId, categoryName } (Casa SAIDA) e devolve 4 semanas (índices 0..3 via weekIndexForDay do src/lib/weeks.ts) com o total por categoria dentro de cada semana: lista de { weekIndex, label 'Semana N', dayRange, categorias: lista de {categoryId, categoryName, totalCents} }. Zero digitação; derivado dos lançamentos. Reaproveitar weekDateRange para o dayRange e weekIndexForDay para o bucket (fonte única de faixas).
    - Casos de borda: lista vazia resulta em 4 semanas com categorias vazias; um teto de valor zero trata pct como 100 (evita divisão por zero).
  </behavior>
  <action>
    Criar `acompanhamento.ts` com as 3 funções puras descritas no bloco behavior (sem Prisma — maximamente testáveis). Importar `weekIndexForDay` e `weekDateRange` de `@/lib/weeks` (fonte única das faixas de semana — não reimplementar). Primeiro escrever `acompanhamento.test.ts` cobrindo os casos do bloco behavior (RED: rodar os testes e vê-los falhar porque as funções ainda não existem), depois implementar até ficar verde (GREEN). Exportar os tipos `CategoriaStatus` e `SemanaCategoria` usados pelo loader/componentes dos Tasks 2 e 3. Comentários curtos em pt-BR citando D-02/D-03/D-04.
  </action>
  <verify>
    <automated>npm test -- acompanhamento</automated>
  </verify>
  <done>`acompanhamento.test.ts` cobre restante do mês (inclui negativo), status de categoria (com e sem teto, teto zero, passou do teto) e agrupamento semanal por categoria (inclui lista vazia); `npm test -- acompanhamento` passa.</done>
</task>

<task type="auto">
  <name>Task 2: Reescrever service/loader/actions/schema do acompanhamento e remover a lógica do plano manual (D-02/D-03/D-04/D-05)</name>
  <files>src/app/(authed)/planejamento/_lib/service.ts, src/app/(authed)/planejamento/_lib/loader.ts, src/app/(authed)/planejamento/_lib/actions.ts, src/app/(authed)/planejamento/_lib/schema.ts, src/app/(authed)/planejamento/_lib/service.test.ts, src/app/(authed)/visao-geral/_lib/loader.ts</files>
  <action>
    Reescrever a camada `_lib` de `/planejamento` para o acompanhamento, removendo tudo que era do plano manual (D-05/CASA-R-04).

    1. `service.ts` — REMOVER as funções do plano manual: countWeeks, computePlanSummary, resolveGastei, computeWeekRemaining, fixedAccountsAsRows, SPEC_ROUTINE_ITEMS, getOrCreatePlan, getPlanItemsWithCategory, createPlanItemService, updatePlanItemService, deletePlanItemService, copyPlanFromPreviousMonth, getAutoGastei, getWeeklySpends, saveWeeklySpend, clearWeeklySpend, getPlanTotal (e os tipos PlanWeeks/PlanRow/FixedAccountInput/DerivedFixedRow). ADICIONAR funções Prisma novas, todas escopadas por userId e Casa (empresaId null):
       - getCasaCategorySpending(userId, month): gasto do mês por categoria da Casa (SAIDA). Reusar o padrão de getCategorySpending de visao-geral/service.ts mas limitado à Casa (empresaId null); devolve lista de {categoryId, name, totalCents}.
       - getCategoryBudgets(userId, month): Map de categoryId para limitCents dos tetos do mês (prisma.categoryBudget.findMany where userId e month). Ausência de chave significa sem teto.
       - getOrCopyCategoryBudgets(userId, month): se o mês não tem nenhum CategoryBudget mas existe mês anterior com tetos, copiar os tetos do mês anterior mais recente para o mês atual dentro de um $transaction (espelha o auto-copy do MonthlyBudget — D-03). Idempotente. Chamada pelo loader antes de ler os tetos.
       - getCasaWeeklyTransactions(userId, month): lançamentos Casa SAIDA do mês com date, amountCents, categoryId e o nome da categoria, para alimentar groupWeeklyByCategory (função pura do Task 1).
       - upsertCategoryBudgetService(userId, month, categoryId, limitCents): upsert pela unique composta (userId, month, categoryId). IDOR: userId sempre vem da sessão (recebido do action).
       - deleteCategoryBudgetService(userId, month, categoryId): deleteMany where userId, month, categoryId — remove o teto (volta a sem teto).
    2. `loader.ts` — reescrever `loadPlanData` como `loadAcompanhamentoData(userId, month)` que, em paralelo (Promise.all): getOrCreateMonthlyBudget (dinheiro do mês — reusa de visao-geral/service), getTotalSpent(userId, month, null) (despesas Casa do mês), getCasaCategorySpending, getCategoryBudgets (depois de getOrCopyCategoryBudgets), getCasaWeeklyTransactions. Montar: restanteCents via computeRestanteMes; por categoria o CategoriaStatus via computeCategoriaStatus; e as 4 semanas via groupWeeklyByCategory. Remover todo o código de WeekData/WeekItem/weekFlag/formatDayRange que montava os cartões manuais (o dayRange agora vem da função pura). Retornar dinheiroMesCents, restanteCents, categorias (lista de categoryId/name/gastoCents/status), semanas e month.
    3. `actions.ts` — REMOVER createPlanItemAction, updatePlanItemAction, deletePlanItemAction, copyPlanAction, saveGasteiAction, clearGasteiAction. ADICIONAR saveCategoriaTetoAction(data) e clearCategoriaTetoAction(month, categoryId): mesmo padrão fino já usado no arquivo (parse Zod, userId da sessão via supabase.auth.getUser nunca do form, chamar o service, revalidatePath de /planejamento e /visao-geral). month e categoryId são args server-trusted validados por Zod; userId sempre da sessão (T-03b-10).
    4. `schema.ts` — REMOVER planItemSchema/updatePlanItemSchema/weeklySpendSchema e tipos. ADICIONAR categoriaTetoSchema com month (regex de ano-mês), categoryId (string com mínimo 1) e limitCents (inteiro positivo — teto maior que zero; para remover usa-se clearCategoriaTetoAction). Exportar o tipo inferido.
    5. `service.test.ts` — este arquivo testava as funções puras agora removidas. REMOVER o arquivo — os testes das novas funções puras vivem em acompanhamento.test.ts (Task 1). Não deixar imports quebrados.
    6. `visao-geral/_lib/loader.ts` — REMOVER o import de getPlanTotal vindo de planejamento/_lib/service, a chamada getPlanTotal no Promise.all, as linhas que leem prisma.planItem/hasPlanItem e calculam planTotalCents, e o campo planTotalCents do retorno. O card Planejado/Folga do dashboard é retrabalhado no Plano 03 (aqui o loader só precisa parar de depender de getPlanTotal/planItem). Deixar o loader devolvendo budget, totalSpentCents, categorySpending e weeklySpending. NÃO alterar DashboardCards.tsx aqui — isso é do Plano 03.

    Em todas as queries novas, sempre filtrar por userId e forçar Casa (empresaId null). pt-BR, Int cents.
  </action>
  <verify>
    <automated>bash -c 'grep -rLq "getPlanTotal" src/app/*/visao-geral/_lib/loader.ts; ! grep -rq "getPlanTotal\|planItem\|weeklySpend\|PlanItem\|WeeklySpend" src/app/*/planejamento/_lib src/app/*/visao-geral/_lib && npx tsc --noEmit'</automated>
  </verify>
  <done>service/loader/actions/schema só contêm o modelo de acompanhamento; service.test.ts removido; visao-geral/_lib/loader.ts não importa getPlanTotal nem lê planItem; nenhum arquivo em planejamento/_lib ou visao-geral/_lib referencia os modelos removidos; `npx tsc --noEmit` passa.</done>
</task>

<task type="auto">
  <name>Task 3: Nova tela /planejamento (barra do mês + tetos por categoria + semanal automático) e remoção dos componentes do plano manual (D-02/D-03/D-04/D-05/D-06)</name>
  <files>src/app/(authed)/planejamento/page.tsx, src/app/(authed)/planejamento/_components/MesBar.tsx, src/app/(authed)/planejamento/_components/CategoriaTetoList.tsx, src/app/(authed)/planejamento/_components/InlineCategoriaTetoEditor.tsx, src/app/(authed)/planejamento/_components/GastoSemanalAuto.tsx, src/app/(authed)/planejamento/_components/PlanTable.tsx, src/app/(authed)/planejamento/_components/WeekCard.tsx, src/app/(authed)/planejamento/_components/WeeklyCardsSection.tsx, src/app/(authed)/planejamento/_components/SegmentedBar.tsx, src/app/(authed)/planejamento/_components/ResumoPlano.tsx, src/app/(authed)/planejamento/_components/PlanItemSheet.tsx, src/app/(authed)/planejamento/_components/NewPlanItemButton.tsx, src/app/(authed)/planejamento/_components/DeletePlanItemDialog.tsx, src/app/(authed)/planejamento/_components/InlineGasteiEditor.tsx, src/app/(authed)/planejamento/_components/CopyPlanButton.tsx, src/app/(authed)/planejamento/_components/groupColors.ts</files>
  <action>
    Construir a tela do design doc e apagar os componentes do plano manual (D-05).

    1. REMOVER (deletar os arquivos) os componentes do plano manual que não têm mais uso: PlanTable.tsx, WeekCard.tsx, WeeklyCardsSection.tsx, SegmentedBar.tsx, ResumoPlano.tsx, PlanItemSheet.tsx, NewPlanItemButton.tsx, DeletePlanItemDialog.tsx, InlineGasteiEditor.tsx, CopyPlanButton.tsx, groupColors.ts. Nenhum outro módulo os importa (confirmar com grep antes de apagar).
    2. `MesBar.tsx` (Server Component): barra "Dinheiro do mês" no topo (D-02/CASA-R-01). Mostra o valor do mês (dinheiroMesCents) editável inline e o restante (restanteCents). Reaproveitar o InlineCeilingEditor existente (src/app/(authed)/visao-geral/_components/InlineCeilingEditor.tsx) para editar o valor do mês — ele já faz upsert do MonthlyBudget via upsertMonthlyBudgetAction e revalida. A barra de progresso mostra a fração gasta (despesas / dinheiro do mês, limitada a 100%); exibir "restam R$ X" com formatBRL. Se restanteCents for negativo, exibir "Passou R$ X" em cor de alerta (seguir o padrão de cores do dashboard). Textos em pt-BR, valores via formatBRL.
    3. `InlineCategoriaTetoEditor.tsx` (Client Component 'use client'): editor inline do teto de UMA categoria, espelhando o padrão do InlineCeilingEditor (botão que vira input, parse de R$ para cents, useTransition). Ao confirmar um valor maior que zero, chama saveCategoriaTetoAction({ month, categoryId, limitCents }); um valor vazio/zero chama clearCategoriaTetoAction(month, categoryId) para remover o teto. Botões com no mínimo 44px de altura (PWA).
    4. `CategoriaTetoList.tsx` (Server Component): lista as categorias da Casa com o gasto do mês (D-03/CASA-R-02). Para cada categoria: se status.temTeto, mostrar "gastei X de Y" ("R$ gasto / R$ teto") com barra de progresso (pct) — passar de 100% destaca em cor de alerta mas NÃO bloqueia (só referência); se não tem teto, mostrar só o total gasto. Cada linha tem o InlineCategoriaTetoEditor para definir/editar/remover o teto. Ordenar por gasto desc.
    5. `GastoSemanalAuto.tsx` (Server Component): bloco "Gastos por semana" automático (D-04/CASA-R-03). Renderiza as 4 semanas (semanas do loader), cada uma com seu dayRange (ex.: "Semana 1 (1–7)") e a lista de categorias com o total gasto naquela semana. Deixar claro na UI que é automático (sem campo de digitação). Semana vazia mostra um estado vazio curto em pt-BR.
    6. `page.tsx`: reescrever o Server Component para chamar loadAcompanhamentoData(userId, currentMonth) e compor, de cima para baixo: header (manter o eyebrow "CASA · MÊS ANO", título "Acompanhamento do mês"), MesBar, CategoriaTetoList, GastoSemanalAuto. Remover todos os imports/usos de PlanTable/ResumoPlano/CopyPlanButton/WeeklyCardsSection/computePlanSummary/countWeeks/groupColors. userId sempre de supabase.auth.getUser (nunca de searchParams). Manter o fallback de mês atual.

    Seguir os padrões visuais da Fase 3 (cartões rounded-2xl, bg-card, border-border) e o design doc. pt-BR em toda a UI.
  </action>
  <verify>
    <automated>bash -c 'test ! -f src/app/*/planejamento/_components/PlanTable.tsx && grep -rq "Dinheiro do mês" src/app/*/planejamento/_components/MesBar.tsx && grep -rq "loadAcompanhamento" src/app/*/planejamento/page.tsx && npx tsc --noEmit'</automated>
  </verify>
  <done>Os componentes do plano manual (PlanTable, WeekCard, WeeklyCardsSection, SegmentedBar, ResumoPlano, PlanItemSheet, NewPlanItemButton, DeletePlanItemDialog, InlineGasteiEditor, CopyPlanButton, groupColors) foram apagados; existem MesBar, CategoriaTetoList, InlineCategoriaTetoEditor e GastoSemanalAuto; page.tsx chama loadAcompanhamentoData e compõe a barra do mês, os tetos por categoria e o semanal automático; `npx tsc --noEmit` passa.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| cliente → Server Action | Entrada não confiável (month, categoryId, limitCents) cruza aqui ao salvar/limpar um teto |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03b-10 | Spoofing | saveCategoriaTetoAction / clearCategoriaTetoAction | mitigate | userId sempre de supabase.auth.getUser(), nunca do form; month/categoryId validados por Zod |
| T-03b-11 | Tampering | queries de gasto/teto/semanal | mitigate | todas as queries filtram por userId e forçam Casa (empresaId null); upsert/delete do teto escopados pela unique (userId, month, categoryId) |
| T-03b-12 | Information Disclosure | leitura de teto/gasto de outro usuário (IDOR) | mitigate | where sempre inclui userId da sessão; CategoryBudget nunca lido/escrito sem userId |
| T-03b-13 | Tampering | limitCents inválido | mitigate | categoriaTetoSchema exige inteiro positivo (Int cents); valor vazio/zero cai no fluxo de remover teto |
</threat_model>

<verification>
- `npm test -- acompanhamento` passa (funções puras).
- `npx tsc --noEmit` passa sem erros em planejamento/_lib, visao-geral/_lib ou nos componentes.
- Nenhum arquivo em planejamento/_lib ou visao-geral/_lib referencia PlanItem/WeeklySpend/getPlanTotal.
- Humano (no Plano 03, verificação ponta a ponta): abrir /planejamento e ver a barra do mês, os tetos por categoria e o semanal automático.
</verification>

<success_criteria>
- Funções puras de acompanhamento criadas e testadas (restante do mês, status por categoria, agrupamento semanal).
- service/loader/actions/schema reescritos para o acompanhamento; lógica do plano manual removida.
- Tela /planejamento mostra barra "Dinheiro do mês" (editável, com restante), tetos por categoria ("gastei X de Y", nunca bloqueia) e gasto semanal automático por categoria.
- Componentes do plano manual apagados; nenhuma referência pendente.
</success_criteria>

<output>
Create `.planning/phases/03b-casa-acompanhamento/03b-02-SUMMARY.md` when done
</output>