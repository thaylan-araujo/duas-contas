---
phase: 03-planning
plan: 01
subsystem: database
tags: [prisma, supabase, vitest, shadcn, radix, date-fns, testing, migration]

# Dependency graph
requires:
  - phase: 02-core-crud
    provides: MonthlyBudget (teto), Transaction (Gastei automático), Category (grupo = categoria da Casa), getWeeklySpending (lógica de faixa semanal inline)
provides:
  - 5 novos modelos Prisma escopados por userId (PlanItem, WeeklySpend, FixedAccount, AnnualExpense, Goal)
  - src/lib/weeks.ts — fonte única da faixa semanal (weekIndexForDay + weekDateRange)
  - Harness de testes Vitest (vitest.config.ts + script npm test) e primeira suíte verde
  - 4 componentes shadcn/ui (Checkbox, Switch, Progress, Table) para os planos 02/03/04
affects: [03-02, 03-03, 03-04, planejamento, contas-fixas]

# Tech tracking
tech-stack:
  added:
    - vitest@3.2.7 (devDependency — framework de teste; node env, TS puro)
    - "@radix-ui/react-checkbox@1.4.1 (peer do shadcn Checkbox)"
    - "@radix-ui/react-switch@1.4.1 (peer do shadcn Switch)"
    - "@radix-ui/react-progress@1.2.1 (peer do shadcn Progress)"
  patterns:
    - "Faixa semanal como fonte única em src/lib/weeks.ts (extração, não duplicação) — dashboard e cartões semanais concordam"
    - "Funções de cálculo puras (sem Prisma) testáveis isoladamente com Vitest"
    - "Override manual persistido como linha dedicada (WeeklySpend) — ausência da linha = usa soma automática"
    - "Contas fixas serão derivadas em render (modelo FixedAccount não vira PlanItem) — scoping columns estabelecidas"

key-files:
  created:
    - prisma/migrations/20261125161833_add_planning_models/migration.sql
    - src/lib/weeks.ts
    - src/lib/weeks.test.ts
    - vitest.config.ts
    - src/components/ui/checkbox.tsx
    - src/components/ui/switch.tsx
    - src/components/ui/progress.tsx
    - src/components/ui/table.tsx
  modified:
    - prisma/schema.prisma
    - package.json
    - src/app/(authed)/visao-geral/_lib/service.ts

key-decisions:
  - "Instalado vitest@3 (não o latest 5.x) por conflito de peer @types/node: vitest@5 exige ^22||>=24, o projeto pina ^20 (runtime Node 20 na Vercel). vitest@3 aceita @types/node ^20 — mesmo pacote oficial, sem --force/--legacy-peer-deps."
  - "WeeklySpend como tabela dedicada (chave composta userId+month+weekIndex+categoryId) para o override do Gastei (03-RESEARCH A1), não campo no PlanItem."
  - "weekDateRange usa new Date(y, m, 0).getDate() para o último dia do mês — resolve fev/bissexto/30-31 dias nativamente, sem lógica manual."
  - "Adicionada relação inversa Category.planItems (não prevista explicitamente no plano) — a migration do PlanItem.category falha sem ela."

patterns-established:
  - "Fonte única de faixa semanal: src/lib/weeks.ts importado por getWeeklySpending (e futuros cartões semanais)"
  - "Suíte Vitest de propriedade/bordas para a aritmética de calendário (maior risco da fase)"

requirements-completed: [PLAN-04]

# Metrics
duration: 8min
completed: 2026-11-25
status: complete
---

# Phase 3 Plan 01: Fundação do planejamento (modelos, Vitest, weeks.ts) Summary

**5 modelos Prisma de planejamento migrados (userId-scoped), harness Vitest instalado, e a faixa semanal extraída para src/lib/weeks.ts com 11 testes de borda verdes (fev 28/29, 30/31 dias) — mais Checkbox/Switch/Progress/Table do shadcn.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-11-25T16:15:18Z
- **Completed:** 2026-11-25T16:23:06Z
- **Tasks:** 4 (1 checkpoint human-verify + 3 auto)
- **Files modified:** 11 (8 criados, 3 modificados)

## Accomplishments
- **5 modelos Prisma novos** (`PlanItem`, `WeeklySpend`, `FixedAccount`, `AnnualExpense`, `Goal`), todos escopados por `userId` com relações inversas em `User`; migration aplicada via `DIRECT_URL` (porta 5432), `prisma validate`/`generate`/`tsc` limpos.
- **Harness de teste Vitest** instalado do zero (não existia framework de teste): `vitest.config.ts` (env `node`), script `npm test`.
- **`src/lib/weeks.ts`** — faixa semanal extraída de `getWeeklySpending` para fonte única (`weekIndexForDay` + `weekDateRange`); `getWeeklySpending` refatorado para importá-la (sem ladder inline), sem mudança de comportamento.
- **11 testes de propriedade/borda verdes** cobrindo fevereiro 28 (2026) e 29 (2024 bissexto), meses de 30 (abril) e 31 (janeiro) dias, e os dias de borda 7/8/14/15/21/22/último — superfície de maior risco da fase (PLAN-04).
- **4 componentes shadcn/ui** (Checkbox, Switch, Progress, Table) adicionados para os planos seguintes; peers Radix oficiais instalados.

## Task Commits

Cada tarefa foi commitada atomicamente:

1. **Task 1: Gate de legitimidade do Vitest** — sem commit (checkpoint human-verify; aprovado pelo usuário)
2. **Task 2: 5 modelos Prisma + migration** — `875ea52` (feat)
3. **Task 3: Vitest + src/lib/weeks.ts + testes (TDD)** — `25c9026` (feat; RED → GREEN → refactor num único commit de task)
4. **Task 4: shadcn Checkbox/Switch/Progress/Table** — `cfcc3ae` (feat)

**Plan metadata:** (este SUMMARY, commit docs)

## Files Created/Modified
- `prisma/schema.prisma` - +5 modelos de planejamento, +5 relações inversas em `User`, +`Category.planItems`
- `prisma/migrations/20261125161833_add_planning_models/migration.sql` - migration das 5 tabelas (via DIRECT_URL 5432)
- `src/lib/weeks.ts` - `weekIndexForDay(day)` e `weekDateRange(month, weekIndex)` — faixa semanal única
- `src/lib/weeks.test.ts` - 11 testes de borda (fev 28/29, 30/31 dias, dias 7/8/14/15/21/22/último)
- `vitest.config.ts` - config Vitest (environment `node`, include `src/**/*.test.ts`)
- `src/app/(authed)/visao-geral/_lib/service.ts` - `getWeeklySpending` importa `weekIndexForDay` (ladder inline removido)
- `src/components/ui/{checkbox,switch,progress,table}.tsx` - componentes shadcn oficiais
- `package.json` - script `test`, peers Radix (checkbox/switch/progress), devDep vitest

## Packages Installed (versões exatas)
- `vitest@3.2.7` (devDependency)
- `@radix-ui/react-checkbox@1.4.1`
- `@radix-ui/react-switch@1.4.1`
- `@radix-ui/react-progress@1.2.1`
- (shadcn Table é HTML puro — nenhum peer Radix)

## Decisions Made
- **Versão do Vitest:** instalado `vitest@3.2.7` em vez do latest `5.1.2`. O `vitest@5` declara peer opcional `@types/node ^22 || >=24`, mas o projeto pina `@types/node ^20` (alvo de runtime Node 20 na Vercel, conforme CLAUDE.md), causando `ERESOLVE`. `vitest@3` aceita `@types/node ^20` como peer opcional e instala limpo, sem `--force`/`--legacy-peer-deps`. É o mesmo pacote oficial (`github.com/vitest-dev/vitest`), apenas major anterior — compatível com Next 15 / TS ESM e suficiente para os testes de função pura desta fase.
- **WeeklySpend como tabela dedicada** (chave composta `userId+month+weekIndex+categoryId`) para o override manual do "Gastei" (03-RESEARCH A1 / Pitfall 4), em vez de campo nullable no `PlanItem` — porque o "Gastei" é por semana × categoria, não por item.
- **Último dia do mês via `new Date(y, m, 0).getDate()`** — resolve fevereiro/bissexto/30-31 dias nativamente, sem hand-roll (03-RESEARCH §Don't Hand-Roll).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Relação inversa `Category.planItems` adicionada**
- **Found during:** Task 2 (modelos Prisma + migrate)
- **Issue:** `prisma validate` falhou com P1012 — `PlanItem.category` precisa de uma relação oposta em `Category`. O plano listava as inversas em `User`, mas não a de `Category`.
- **Fix:** Adicionado `planItems PlanItem[]` ao modelo `Category`.
- **Files modified:** prisma/schema.prisma
- **Verification:** `npx prisma validate` passou (schema válido 🚀); migration aplicada.
- **Committed in:** 875ea52 (commit da Task 2)

**2. [Rule 3 - Blocking] Vitest fixado no major 3 (conflito de peer @types/node)**
- **Found during:** Task 3 (instalação do Vitest)
- **Issue:** `npm i -D vitest` (latest = 5.1.2) abortou com `ERESOLVE` — peer opcional `@types/node ^22||>=24` incompatível com `@types/node ^20` pinado no projeto.
- **Fix:** `npm i -D vitest@3` (3.2.7), cujo peer opcional aceita `@types/node ^20`. Mesmo pacote oficial; sem `--force`/`--legacy-peer-deps` (que mascarariam a árvore). Não é substituição de pacote — é seleção de versão compatível.
- **Files modified:** package.json, package-lock.json
- **Verification:** instalação limpa sem ERESOLVE; `npx vitest run` executa (11 testes verdes); `npm run build` verde.
- **Committed in:** 25c9026 (commit da Task 3)

---

**Total deviations:** 2 auto-fixed (ambas Rule 3 - blocking).
**Impact on plan:** Ambas necessárias para completar as tarefas; nenhuma mudança de escopo. A fixação do Vitest no major 3 (vs. 5) é a única diferença de versão em relação ao plano — documentada e com build/testes verdes.

## Issues Encountered
- **npm audit:** 20 advisories reportados (`9 moderate, 9 high, 2 critical`), quase todos **pré-existentes** na árvore transitiva (next, postcss, zod, serwist, typescript-eslint, glob, minimatch) e **fora do escopo** deste plano. As 2 advisories do Vitest referem-se a `@vitest/mocker` (registro de mocks manuais / redirect de mock) — features de mocking em runtime de teste, **dev-only** (devDependency, nunca enviado à produção) e **não usadas** (os testes desta fase são asserções de função pura, sem mocks). Não rodei `npm audit fix --force` para não introduzir breaking changes em deps não relacionadas. Deferido para uma revisão de dependências dedicada.

## Known Stubs
Nenhum — este plano entrega schema + lib + componentes; não há UI com dados placeholder.

## User Setup Required
None - nenhuma configuração de serviço externo necessária (a migration usa as variáveis de ambiente já configuradas da Fase 1).

## Next Phase Readiness
- Fundação pronta: os planos 03-02/03/04 têm os 5 modelos, o harness Vitest e a faixa semanal única (`src/lib/weeks.ts`) para depender.
- Os componentes Checkbox/Switch/Progress/Table estão disponíveis em `src/components/ui/`.
- Nenhum bloqueador. Observação opcional: considerar uma revisão de dependências para as advisories pré-existentes de npm audit (fora do escopo desta fase).

## Self-Check: PASSED
- Arquivos criados verificados em disco: todos FOUND (migration.sql, weeks.ts, weeks.test.ts, vitest.config.ts, 4 componentes ui).
- Commits verificados no git log: 875ea52, 25c9026, cfcc3ae — todos FOUND.
- Verificação do plano: `prisma validate` ✓, migration existe ✓, `npx vitest run` ✓ (11 testes), `getWeeklySpending` importa `weekIndexForDay` ✓, 4 componentes shadcn existem ✓, `tsc --noEmit` ✓, `npm run build` ✓.

---
*Phase: 03-planning*
*Completed: 2026-11-25*
