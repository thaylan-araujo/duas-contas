---
phase: 03-planning
plan: 02
subsystem: planejamento
tags: [next15, server-actions, prisma, zod, react-hook-form, shadcn, vitest, planejamento, casa]

# Dependency graph
requires:
  - phase: 03-planning/03-01
    provides: "5 modelos Prisma (PlanItem etc.), src/lib/weeks.ts, harness Vitest, shadcn Checkbox/Switch/Progress/Table"
  - phase: 02-core-crud
    provides: "MonthlyBudget (teto) + getOrCreateMonthlyBudget, Category (grupo da Casa), InlineCeilingEditor, padrões de Sheet/Action/Service"
provides:
  - "Slice vertical /planejamento: tabela de itens + resumo + copiar plano"
  - "PlanItem CRUD com IDOR guard (where { id, userId })"
  - "getOrCreatePlan — pré-preenchimento do 1º mês (D-04) + copyPlanFromPreviousMonth ($transaction, PLAN-05)"
  - "Funções puras computePlanSummary + countWeeks (unit-tested)"
  - "SegmentedBar reutilizável (barra segmentada por grupo + Folga)"
affects: [03-03, planejamento, visao-geral]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Action com month como argumento server-trusted (fora do schema Zod) ao lado de userId da sessão"
    - "Funções de cálculo puras (computePlanSummary/countWeeks) testadas sem Prisma; módulo service importável no Vitest via alias @ → src"
    - "Barra multi-segmento construída a partir do idioma de barra única do CategorySpendingBars; cores categóricas determinísticas por nome de grupo"
    - "Grupo = Categoria da Casa (D-03), reutilizando o Select '+ Nova categoria…' do TransactionSheet filtrado por account CASA"

key-files:
  created:
    - src/app/(authed)/planejamento/_lib/schema.ts
    - src/app/(authed)/planejamento/_lib/service.ts
    - src/app/(authed)/planejamento/_lib/service.test.ts
    - src/app/(authed)/planejamento/_lib/loader.ts
    - src/app/(authed)/planejamento/_lib/actions.ts
    - src/app/(authed)/planejamento/_components/PlanTable.tsx
    - src/app/(authed)/planejamento/_components/PlanItemSheet.tsx
    - src/app/(authed)/planejamento/_components/NewPlanItemButton.tsx
    - src/app/(authed)/planejamento/_components/DeletePlanItemDialog.tsx
    - src/app/(authed)/planejamento/_components/ResumoPlano.tsx
    - src/app/(authed)/planejamento/_components/SegmentedBar.tsx
    - src/app/(authed)/planejamento/_components/CopyPlanButton.tsx
    - src/app/(authed)/planejamento/_components/groupColors.ts
  modified:
    - src/app/(authed)/planejamento/page.tsx
    - vitest.config.ts

key-decisions:
  - "vitest.config.ts recebeu alias @ → src/ para que o módulo service (que importa @/lib/prisma no topo) resolva no Vitest, mesmo testando apenas as funções puras"
  - "SPEC_ROUTINE_ITEMS (D-04) mapeia 'Compra do mês' e 'Mercado semanal' para a categoria Alimentação (categorias semeadas da Casa: Alimentação/Combustível/Lazer/Contas fixas/Outros)"
  - "CopyPlanButton usa atributo title nativo no wrapper (sem componente Tooltip no repo) para o estado desabilitado"
  - "loadPlanData chama getOrCreatePlan antes do Promise.all para que o pré-preenchimento do 1º mês apareça na mesma renderização"

requirements-completed: [PLAN-01, PLAN-02, PLAN-03, PLAN-05]

# Metrics
duration: 7min
completed: 2026-11-25
status: complete
---

# Phase 3 Plan 02: /planejamento vertical slice Summary

**Slice completo do /planejamento da Casa: tabela "Quanto vai para cada coisa" (CRUD de itens com grupo=categoria + 4 semanas), "Resumo do plano" (teto editável + Planejado + Folga + barra segmentada por grupo), pré-preenchimento do 1º mês (D-04) e botão "Copiar plano do mês anterior" — com a aritmética (total = valor × nº semanas; folga = teto − planejado) em funções puras cobertas por 11 testes Vitest.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-11-25T16:26:13Z
- **Completed:** 2026-11-25T16:33:05Z
- **Tasks:** 3 (todas type=auto; Task 1 tdd)
- **Files:** 15 (13 criados, 2 modificados)

## Accomplishments
- **Schema + service + cálculo puro (Task 1, TDD):** `planItemSchema` (refine ≥1 semana) + `updatePlanItemSchema`; `countWeeks` e `computePlanSummary` puras; `getOrCreatePlan` (pré-fill 1º mês, D-04), CRUD com guarda de posse (IDOR), `copyPlanFromPreviousMonth` ($transaction, PLAN-05). 11 testes verdes (total=valor×semanas, folga=teto−planejado, folga<0 → acima, 0-semanas / valor ≤0 / nome vazio / grupo vazio rejeitados).
- **Loader + Server Actions (Task 2):** `loadPlanData` em `Promise.all` (itens com grupo, teto da Fase 2, categorias da Casa, `hasPreviousPlan`); 4 actions finas (`createPlanItemAction`, `updatePlanItemAction`, `deletePlanItemAction`, `copyPlanAction`) lendo `userId` da sessão (nunca do form) e revalidando `/planejamento` **e** `/visao-geral`; `month` é argumento server-trusted, fora do schema.
- **UI (Task 3):** página Server Component (substitui o stub) com eyebrow "CASA · MÊS AAAA", grid 2 colunas (tabela 2/3 + resumo 1/3); `PlanTable` (shadcn Table no desktop, card-list no mobile) com ponto colorido por grupo, × N, total, % do teto, edição por clique e Pencil/Trash2 no hover; `PlanItemSheet` (Nome + Grupo Select com "+ Nova categoria…" + Valor por vez + 4 Checkboxes em `<fieldset>`); `DeletePlanItemDialog`; `ResumoPlano` (teto editável via `InlineCeilingEditor` + Planejado + Folga com "Passou do teto em R$ X" + barra + legenda); `SegmentedBar` (barra multi-segmento + segmento Folga, `role="img"`); `CopyPlanButton` (outline + ícone Copy, desabilitado com tooltip quando não há mês anterior).

## Task Commits
1. **Task 1: Plan schema + service + pure calc com testes (TDD)** — `b5ae95f` (feat)
2. **Task 2: Loader + Server Actions** — `da56e93` (feat)
3. **Task 3: Página + tabela + Sheet + delete + resumo + barra + copy** — `fe917f3` (feat)

## Files Created/Modified
- `_lib/schema.ts` — `planItemSchema` (base + refine ≥1 semana) e `updatePlanItemSchema` (extend + re-refine)
- `_lib/service.ts` — `countWeeks`, `computePlanSummary` (puras); `SPEC_ROUTINE_ITEMS`; `getOrCreatePlan`, `getPlanItemsWithCategory`, CRUD com guarda de posse, `copyPlanFromPreviousMonth`
- `_lib/service.test.ts` — 11 testes Vitest (PLAN-02/PLAN-03)
- `_lib/loader.ts` — `loadPlanData` (Promise.all + `hasPreviousPlan`)
- `_lib/actions.ts` — 4 Server Actions finas (userId da sessão, revalida 2 rotas)
- `_components/*` — `PlanTable`, `PlanItemSheet`, `NewPlanItemButton`, `DeletePlanItemDialog`, `ResumoPlano`, `SegmentedBar`, `CopyPlanButton`, `groupColors`
- `page.tsx` — Server Component completo (substitui o stub "em breve")
- `vitest.config.ts` — alias `@` → `src/`

## Decisions Made
- **Alias `@` no Vitest:** `service.ts` importa `@/lib/prisma` no topo; o `weeks.test.ts` da Fase 01 não precisava de alias (sem import `@/`), mas o `service.test.ts` sim. Adicionado `resolve.alias` em `vitest.config.ts` espelhando o `tsconfig` — mantém as funções puras testáveis sem mockar Prisma.
- **Mapa da rotina D-04:** categorias semeadas da Casa são Alimentação/Combustível/Lazer/Contas fixas/Outros; "Compra do mês" e "Mercado semanal" entram em **Alimentação**; Combustível/Lazer/Outros em suas próprias categorias. Resolvido por nome em tempo de criação.
- **Tooltip do CopyPlanButton:** o repo não tem componente Tooltip (shadcn); usei o atributo `title` nativo no wrapper `<span>` para o estado desabilitado.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Alias `@` ausente no Vitest**
- **Found during:** Task 1 (RED → primeira execução dos testes)
- **Issue:** `vitest run` falhou com `Cannot find package '@/lib/prisma'` — o `service.ts` importa `@/lib/prisma` no topo e o `vitest.config.ts` da Fase 01 não tinha resolução do alias `@` (só o `weeks.test.ts`, sem imports `@/`, havia rodado até aqui).
- **Fix:** Adicionado `resolve.alias['@'] = fileURLToPath(new URL('./src', import.meta.url))` ao `vitest.config.ts`, espelhando o `tsconfig`.
- **Files modified:** vitest.config.ts
- **Verification:** `npx vitest run` → 22 testes verdes (11 novos + 11 da Fase 01); `npm run build` verde.
- **Commit:** b5ae95f (commit da Task 1)

**Total deviations:** 1 auto-fixada (Rule 3 - blocking).
**Impact:** mudança de infraestrutura de teste apenas (config), sem alteração de escopo; os testes da Fase 01 continuam verdes.

## Authentication Gates
Nenhum — nenhuma credencial/serviço externo novo. As actions usam a sessão Supabase já configurada (Fase 1).

## Known Stubs
Nenhum stub bloqueante. A faixa "Gastos semanais" (4 cartões, PLAN-04) e a ligação dos cartões "Planejado"/"Folga" do dashboard ao total real **não** fazem parte deste plano por desenho (próxima fatia — Plano 03); a tabela e o resumo deste slice usam dados reais.

## Threat Flags
Nenhuma superfície de ameaça nova além do registro do plano. Mitigações aplicadas conforme o `<threat_model>`: T-03-02 (IDOR — `findFirst({ id, userId })` antes de update/delete), T-03-03 (mass assignment — `userId` da sessão, `month` server-trusted, schema sem `userId`), T-03-04 (validação Zod — rejeita 0 semanas / valor ≤0).

## Issues Encountered
Nenhum bloqueador. O aviso `prisma:warn In production, we recommend using prisma generate --no-engine` aparece durante os testes (carregamento do client Prisma) — inócuo nos testes de função pura; herdado da Fase 01.

## Next Phase Readiness
- Slice principal de planejamento pronto: itens + resumo + copiar plano funcionando com dados reais.
- Pronto para o Plano 03 (cartões semanais com "Gastei R$" automático/override — PLAN-04 — e ligação dos cartões do dashboard ao total planejado real).
- `computePlanSummary`/`countWeeks` e `SegmentedBar` ficam disponíveis para reuso.

## Self-Check: PASSED
- Arquivos criados verificados em disco: 13 criados + 2 modificados → todos FOUND.
- Commits verificados no git log: b5ae95f, da56e93, fe917f3 — todos FOUND.
- Verificação do plano: `npx vitest run service.test.ts` ✓ (11 testes); `npx tsc --noEmit` ✓; `npm run build` ✓; `actions.ts` lê `supabase.auth.getUser` ✓ e revalida `/visao-geral` (4×) ✓; first-month pre-fill presente (`getOrCreatePlan` + SPEC_ROUTINE_ITEMS) ✓.

---
*Phase: 03-planning*
*Completed: 2026-11-25*
