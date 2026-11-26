---
phase: 04d-consolidado-projecao
plan: 02
subsystem: canais-pnl / empresas-crud
tags: [das, aliquota, pnl, empresa, consolidado, vitest]
requires:
  - 04d-01   # Empresa.aliquotaDasPercent (Decimal?) no schema + prisma client
  - 04b      # P&L da empresa (loadPnlData, brutoCents)
provides:
  - computeDasEstimado   # função pura reutilizável pelo consolidado (04d-03)
  - PnlData.dasEstimadoCents
  - PnlData.aliquotaDefinida
  - empresaSchema.aliquotaDasPercent
affects:
  - 04d-03   # consolidado soma o DAS estimado de cada empresa
tech-stack:
  added: []
  patterns:
    - "Função pura em centavos + Vitest (espelha canais/_lib/pnl.ts)"
    - "Campo opcional nullable no zod sem z.preprocess/.default() (preserva input=output do zodResolver)"
    - "Decimal? do Prisma convertido para number|null na página antes de passar à função pura"
key-files:
  created:
    - src/app/(authed)/canais/_lib/das.ts
    - src/app/(authed)/canais/_lib/das.test.ts
  modified:
    - src/app/(authed)/canais/_lib/loader.ts
    - src/app/(authed)/canais/page.tsx
    - src/app/(authed)/canais/_components/PnlCards.tsx
    - src/app/(authed)/empresas/_lib/schema.ts
    - src/app/(authed)/empresas/_lib/service.ts
    - src/app/(authed)/empresas/_components/EmpresaSheet.tsx
    - src/app/(authed)/empresas/page.tsx
key-decisions:
  - "DAS estimado estendido dentro de loadPnlData (PnlData.dasEstimadoCents + aliquotaDefinida) em vez de computado solto na página — assim o consolidado (04d-03) reusa a mesma função sem duplicar lógica (opção recomendada do plano)."
  - "aliquotaDasPercent no zod é .nullable().optional() sem z.preprocess/.default() — a normalização de string vazia do input HTML → null fica no form via setValueAs, mantendo input=output do zodResolver (nota já existente no schema sobre .default())."
  - "computeDasEstimado(null, bruto) === 0; a distinção 'sem alíquota' vs '0%' é só da UI (PnlCards mostra 'não definido' quando aliquotaDefinida===false)."
requirements-completed:
  - CONS-02
duration: 4 min
completed: 2026-11-26
status: complete
---

# Phase 4 Plan 02: Fatia 4 — DAS estimado por empresa Summary

Fatia vertical do DAS estimado por empresa (CONS-02 / D-03): função pura `computeDasEstimado(aliquota, brutoCents)` testada com Vitest, alíquota (%) editável no cadastro/edição da empresa, e um 4º card "DAS estimado" no P&L de `/canais` que mostra "não definido" quando a empresa ainda não tem alíquota — nunca R$ 0,00 silencioso.

## Timing
- **Início:** 2026-11-26T18:21:12Z
- **Fim:** 2026-11-26T18:25:57Z
- **Duração:** 4 min
- **Tarefas:** 3/3
- **Arquivos:** 2 criados, 7 modificados

## What Was Built

### Task 1 — `computeDasEstimado` + testes Vitest (TDD)
- `canais/_lib/das.ts`: função pura `computeDasEstimado(aliquotaPercent: number | null, brutoCents: number): number`. Fórmula D-03: `Math.round((aliquotaPercent / 100) * brutoCents)`; `null` → 0. TypeScript puro, sem Prisma, centavos Int.
- `canais/_lib/das.test.ts`: 6 casos — 6% de 1_000_000 = 60_000, alíquota fracionária (15,5%), null → 0, bruto zero → 0, arredondamento (6% de 333 = 20), nunca negativo. RED (import falhou) → GREEN (6/6 passam).
- Commits: `ceef3b1` (test RED), `84cabc0` (feat GREEN).

### Task 2 — Alíquota (%) editável por empresa
- `empresas/_lib/schema.ts`: `empresaSchema` ganha `aliquotaDasPercent` — `z.number().min(0).max(100).nullable().optional()`, mensagem pt-BR "Alíquota deve estar entre 0 e 100."
- `empresas/_lib/service.ts`: `createEmpresaService`/`updateEmpresaService` gravam o campo Decimal? (ownership check `findFirst {id, userId}` preservado — T-04d-03). No update, `undefined` mantém o valor atual; `null` limpa.
- `empresas/_components/EmpresaSheet.tsx`: input numérico "Alíquota do DAS (%)" (step 0.01, 0–100, ≥44px, pt-BR), pré-carregado no modo edição, `setValueAs` converte string vazia → null.
- `empresas/page.tsx`: passa `aliquotaDasPercent` (Decimal→number|null) ao `EmpresaCard` para prefill do form.
- Commit: `7485ffb`.

### Task 3 — Card "DAS estimado" no P&L (/canais)
- `canais/_lib/loader.ts`: `loadPnlData` recebe `aliquotaDasPercent` e devolve `dasEstimadoCents` + `aliquotaDefinida` em `PnlData` (reusa o `brutoCents` já calculado — nenhuma query nova).
- `canais/page.tsx`: `select` inclui `aliquotaDasPercent`; converte Decimal→number|null e passa à `loadPnlData`; repassa `dasEstimadoCents`/`aliquotaDefinida` ao `PnlCards`.
- `canais/_components/PnlCards.tsx`: grid `sm:grid-cols-2 lg:grid-cols-4`; 4º card "DAS estimado" — `formatBRL(dasEstimadoCents)` quando `aliquotaDefinida`, senão "não definido" em `text-text-secondary` (D-03).
- Commit: `8d4f5dd`.

## Verification Results
- `npx vitest run src/app/(authed)/canais/_lib/das.test.ts` → 6/6 passam.
- `npx vitest run` (suíte completa) → 121/121 passam.
- `npx tsc --noEmit` → limpo.
- `npm run build` → verde (16/16 páginas; `/canais` e `/empresas` compilam).
- `grep computeDasEstimado` → encontra uso em page.tsx (comentário) e loader.ts.
- `grep "DAS estimado"` → encontra em PnlCards.tsx.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `aliquotaDasPercent` era obrigatório e quebrou testes legados do schema**
- **Found during:** Task 2 (verificação pós-commit, suíte completa)
- **Issue:** O campo foi adicionado como `z.number().nullable()` (sem `.optional()`), tornando a CHAVE obrigatória. As fixtures existentes `service.test.ts` (`{ nome, tipo, cor }`) passaram a falhar (2 testes: "aceita um objeto válido" e "aceita cada uma das 6 cores").
- **Fix:** Tornar o campo `.nullable().optional()` — o plano exige "campo opcional". Chave omissa ou null → "sem alíquota".
- **Files modified:** `empresas/_lib/schema.ts`
- **Verification:** suíte completa voltou a 121/121.
- **Commit:** `9c25270`

### Divergências de escopo (não-bug, documentadas)

**2. [Nota] `empresas/_lib/actions.ts` não foi modificado**
- O plano lista `actions.ts` em `<files>`. O novo campo já flui automaticamente: `createEmpresaAction` usa `...parsed.data` e `updateEmpresaAction` usa `{ id, ...rest }`, ambos derivados de `empresaSchema`/`updateEmpresaSchema`. Nenhuma alteração era necessária para o campo passar pelo `safeParse` e chegar aos services. Arquivo deixado intacto.

**3. [Nota] `aliquotaDasPercent` sem `z.preprocess`**
- O plano sugeriu `z.preprocess` para converter string vazia → null. Isso tornava o tipo de ENTRADA do zod `unknown`, quebrando a inferência do `zodResolver` no `useForm` (erro TS2322/TS2345), exatamente o problema que a nota existente no schema sobre `.default()` descreve. Solução equivalente: validar direto `number().nullable().optional()` e fazer a normalização de string vazia → null no form via `setValueAs`. Resultado funcional idêntico (string vazia do input vira "sem alíquota"), com input=output no resolver.

**Total deviations:** 1 bug auto-corrigido + 2 notas de escopo. **Impact:** nenhum — CRUD de empresa, P&L, pró-labore e Casa intactos; separação entre empresas preservada (P&L continua escopado ao `empresaId` do contexto com ownership check).

## Threat Mitigations (do plano)
- **T-04d-03 (Tampering):** `updateEmpresaService` mantém `findFirst {id, userId}` antes de gravar; Zod valida 0–100. OK.
- **T-04d-04 (Information Disclosure):** `canais/page.tsx` mantém `findFirst {id, userId}`; empresa de outro usuário → placeholder, nunca P&L/DAS. OK.
- **T-04d-05 (Tampering aritmética):** `computeDasEstimado` testada com Vitest (arredondamento, null, zero); Math.round evita fração de centavo. OK.

## Self-Check: PASSED
- Arquivos criados existem em disco: `das.ts`, `das.test.ts` — FOUND.
- Commits existem: `ceef3b1`, `84cabc0`, `7485ffb`, `8d4f5dd`, `9c25270` — todos FOUND.
- Verificações do plano re-executadas: vitest (das + suíte) PASS, tsc limpo, build verde.
