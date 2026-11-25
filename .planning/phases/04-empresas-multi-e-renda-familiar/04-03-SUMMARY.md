---
phase: 04-empresas-multi-e-renda-familiar
plan: 03
subsystem: empresas
tags: [prisma, server-actions, crud, zod, react-hook-form, seed, idempotente, a11y, multi-empresa]

# Dependency graph
requires:
  - phase: 04-02
    provides: "Empresa model + EmpresaTipo/CategoryKind enums; empresaId/kind nullable em Category/Transaction; funções puras categoriasPadrao/receitasPorTipo/canDeleteEmpresa; empresaSchema; tokens de cor de empresa; store generalizado"
provides:
  - "Rota /empresas com CRUD completo (criar/editar/excluir) usando Sheet/Dialog/add-card"
  - "Camada Prisma do service de empresa (create/update/delete + getOrSeedCategorias) ownership-guarded"
  - "Server Actions finas createEmpresaAction/updateEmpresaAction/deleteEmpresaAction (userId da sessão)"
  - "Proteção D-08 na exclusão de empresa (bloqueia com lançamentos + mensagem pluralizada)"
  - "Gestão de categorias por empresa em grupos Receitas/Custos com CRUD inline"
  - "ColorPicker acessível (radiogroup) + paleta de 6 cores em empresa-cores.ts"
  - "Seed idempotente das 3 empresas (Elite Juris/Achadinhos/Infoproduto) + categorias por tipo"
affects: [04-04, pro-labore-multi-origem, consolidado-empresas]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getOrSeedCategorias idempotente via upsert na chave composta name_empresaId_userId"
    - "Seed de empresas idempotente via upsert por @@unique([nome, userId])"
    - "categoriasSlot (render-prop/ReactNode) para injetar a seção de categorias no EmpresaCard — mantém commits atômicos entre tasks"
    - "ColorPicker role=radiogroup com swatch decorativo aria-hidden (cor nunca é o único sinal)"
    - "Classes Tailwind estáticas por cor (mapa TS) em vez de interpolação — compatível com o JIT do Tailwind v4"

key-files:
  created:
    - "src/app/(authed)/empresas/_lib/actions.ts"
    - "src/app/(authed)/empresas/_lib/loader.ts"
    - "src/app/(authed)/empresas/page.tsx"
    - "src/app/(authed)/empresas/_components/EmpresaSheet.tsx"
    - "src/app/(authed)/empresas/_components/EmpresaCard.tsx"
    - "src/app/(authed)/empresas/_components/NewEmpresaButton.tsx"
    - "src/app/(authed)/empresas/_components/DeleteEmpresaDialog.tsx"
    - "src/app/(authed)/empresas/_components/ColorPicker.tsx"
    - "src/app/(authed)/empresas/_components/EmpresaCategoriesSection.tsx"
    - "src/lib/empresa-cores.ts"
  modified:
    - "src/app/(authed)/empresas/_lib/service.ts"
    - "src/app/(authed)/empresas/_lib/schema.ts"
    - "src/app/(authed)/empresas/_lib/service.test.ts"
    - "src/app/(authed)/lancamentos/_lib/service.ts"
    - "prisma/seed.ts"

key-decisions:
  - "Elite Juris usa 'cinza-azulado' (chave da paleta/schema), não 'cinza' como escrito no plano — o schema e os testes validam 'cinza-azulado'; o token CSS é --color-empresa-cinza"
  - "Removido .default('laranja') de cor no empresaSchema — o default() tornava o tipo de ENTRADA opcional (cor?) enquanto a SAÍDA é obrigatória, quebrando a inferência do zodResolver no useForm; o default agora vem do defaultValues do form"
  - "updateEmpresaService NÃO re-semeia categorias ao mudar o tipo (preserva categorias/edições existentes)"
  - "createCategoryService valida empresaId pertence ao userId antes de escrever (IDOR T-04-06)"
  - "getOrSeedCategorias e o seed usam o MESMO padrão de upsert por chave composta — idempotência garantida por construção"

patterns-established:
  - "Service fino de CRUD de entidade com ownership check findFirst({ id, userId }) + proteção de exclusão por count"
  - "categoriasSlot ReactNode no card para compor seção pesada (categorias) a partir do Server Component"
  - "Seed de entidade + sub-entidades idempotente via upsert em chaves compostas estáveis"

requirements-completed: [EMPF-02, EMPF-03, EMPF-04]

# Metrics
duration: 11 min
completed: 2026-11-25
status: complete
---

# Phase 4 Plan 3: Fatia vertical do CRUD de empresa (/empresas) Summary

**CRUD completo de empresa em /empresas (criar/editar/excluir com proteção D-08), gestão de categorias por empresa em grupos Receitas/Custos com CRUD inline, e seed idempotente das 3 empresas (Elite Juris/Achadinhos/Infoproduto) — toda empresa nova nasce com as categorias padrão do seu tipo via getOrSeedCategorias por chave composta, reaproveitando integralmente os padrões Sheet/Dialog/add-card das Fases 2/3.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-11-25T19:35:57Z
- **Completed:** 2026-11-25T19:46:33Z
- **Tasks:** 3
- **Files:** 15 (10 criados, 5 modificados)

## Accomplishments
- Camada Prisma do service de empresa ownership-guarded: `createEmpresaService` (cria + semeia categorias), `updateEmpresaService`/`deleteEmpresaService` com `findFirst({ id, userId })` (IDOR T-04-06), `getOrSeedCategorias` idempotente por `upsert` na chave composta `name_empresaId_userId`.
- Proteção D-08 na exclusão: `deleteEmpresaService` conta lançamentos e lança `mensagemBloqueioExclusao(count)` (pluralização pt-BR correta) se > 0; senão apaga categorias + empresa em `prisma.$transaction`.
- Server Actions finas `createEmpresaAction`/`updateEmpresaAction`/`deleteEmpresaAction` (userId sempre da sessão — T-04-09); `deleteEmpresaAction` repassa a mensagem de bloqueio do service.
- UI completa de /empresas: grade de `EmpresaCard` + add-card tracejado + empty state; `EmpresaSheet` criar/editar (Nome/Tipo Select/ColorPicker); `ColorPicker` acessível (`role=radiogroup`, 6 swatches `role=radio` ≥44px, `ring`+`Check`, swatch decorativo `aria-hidden`); `DeleteEmpresaDialog` com Caso A (confirmação destrutiva) e Caso B (bloqueio, CTA "Entendi").
- `EmpresaCategoriesSection`: grupos "Receitas"/"Custos" por `kind`, CRUD inline (Enter/Escape, badge "Padrão", erro inline `role=alert`), "+ Nova categoria" por grupo passando `empresaId` + `kind`; accent na cor da empresa.
- Seed idempotente das 3 empresas por `@@unique([nome, userId])` + categorias por tipo; **verificado rodando o seed 2x**: 3 empresas (não 6), sem duplicar categorias, Casa intacta (5 categorias `empresaId null`).
- 7 novos testes puros GREEN (`mensagemBloqueioExclusao` + `buildSeedCategoriaEntries`); suíte completa 93/93.

## Task Commits

1. **Task 1: Camada Prisma do service + Server Actions + loader + ownership em categoria** — `b22428a` (feat)
2. **Task 2: UI do CRUD — página, Sheet, ColorPicker, add-card, exclusão** — `5957dc0` (feat)
3. **Task 3: Seção de categorias por empresa + seed das 3 empresas** — `e3b2f2f` (feat)

## Files Created/Modified
- `src/app/(authed)/empresas/_lib/service.ts` — camada Prisma (create/update/delete/getOrSeedCategorias) + `mensagemBloqueioExclusao`/`buildSeedCategoriaEntries` puras
- `src/app/(authed)/empresas/_lib/actions.ts` — Server Actions finas (userId da sessão, revalida /empresas,/lancamentos,/visao-geral)
- `src/app/(authed)/empresas/_lib/loader.ts` — getEmpresas/getCategoriasPorEmpresa/getLancamentoCountPorEmpresa + loadEmpresasData
- `src/app/(authed)/empresas/_lib/schema.ts` — removido `.default('laranja')` de `cor` (ver Deviations #2)
- `src/app/(authed)/empresas/_lib/service.test.ts` — +7 testes (mensagemBloqueioExclusao, buildSeedCategoriaEntries)
- `src/app/(authed)/empresas/page.tsx` — Server Component: grade + add-card + empty state + categoriasSlot
- `src/app/(authed)/empresas/_components/EmpresaSheet.tsx` — Sheet criar/editar (Nome/Tipo/ColorPicker)
- `src/app/(authed)/empresas/_components/EmpresaCard.tsx` — cartão + edição/exclusão + sheet de categorias via categoriasSlot
- `src/app/(authed)/empresas/_components/NewEmpresaButton.tsx` — CTA header + add-card tracejado
- `src/app/(authed)/empresas/_components/DeleteEmpresaDialog.tsx` — Caso A/B (UI-SPEC §4)
- `src/app/(authed)/empresas/_components/ColorPicker.tsx` — radiogroup acessível (sem analog)
- `src/app/(authed)/empresas/_components/EmpresaCategoriesSection.tsx` — grupos Receitas/Custos + CRUD inline
- `src/lib/empresa-cores.ts` — mapa de 6 cores (classes estáticas) + labels de tipo pt-BR
- `src/app/(authed)/lancamentos/_lib/service.ts` — createCategoryService valida empresaId pertence ao userId (IDOR)
- `prisma/seed.ts` — upsert idempotente das 3 empresas + categorias por tipo

## Decisions Made
- **Cor Elite Juris = `cinza-azulado`** (não `cinza` como no texto do plano). O `empresaSchema` e os testes RED validam a chave `cinza-azulado`; a UI-SPEC §Color regra 1 também diz "Elite Juris → Cinza-azulado". O token CSS correspondente é `--color-empresa-cinza`. Usar `cinza` falharia o zod.
- **`.default('laranja')` removido do schema** — ver Deviation #2 (quebrava a inferência do zodResolver).
- **Mudar o tipo da empresa não re-semeia categorias** — preserva o que o usuário já editou; `getOrSeedCategorias` só roda na criação.
- **Mesmo padrão de upsert no service e no seed** — a idempotência do seed e do getOrSeed vem da chave composta, não de lógica duplicada.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cor 'cinza' do plano trocada por 'cinza-azulado' (chave real da paleta)**
- **Found during:** Task 2 e Task 3
- **Issue:** O plano (Task 2/Task 3) especifica Elite Juris com cor `'cinza'`, mas o `empresaSchema` (criado no 04-02) e os testes RED só aceitam a chave `'cinza-azulado'` (o token CSS é `--color-empresa-cinza`). Usar `'cinza'` reprovaria o zod ao criar/seedar a empresa.
- **Fix:** Usei `'cinza-azulado'` como chave em `empresa-cores.ts`, no seed e em toda a UI, mantendo o label pt-BR "Cinza-azulado" (UI-SPEC §Copywriting). Alinha com a UI-SPEC §Color regra 1, que diz explicitamente "Elite Juris → Cinza-azulado".
- **Files modified:** `src/lib/empresa-cores.ts`, `prisma/seed.ts`
- **Verification:** seed rodou 2x sem erro; empresa Elite Juris gravada com `cor='cinza-azulado'`.
- **Commit:** `5957dc0` (map), `e3b2f2f` (seed)

**2. [Rule 3 - Blocking] `.default('laranja')` em empresaSchema quebrava o zodResolver**
- **Found during:** Task 2 (tsc)
- **Issue:** `cor: z.enum(...).default('laranja')` faz o tipo de ENTRADA do zod ter `cor?` (opcional) enquanto a SAÍDA é obrigatória. O `useForm<EmpresaFormData>({ resolver: zodResolver(empresaSchema) })` não consegue casar os genéricos input/output e `tsc` falhava com TS2322/TS2345.
- **Fix:** Removi o `.default('laranja')` do schema (nenhum teste depende dele; todos passam `cor` explícito). O default agora é fornecido pelo `defaultValues: { cor: 'laranja' }` do `useForm` — comportamento idêntico para o usuário.
- **Files modified:** `src/app/(authed)/empresas/_lib/schema.ts`
- **Verification:** `tsc --noEmit` limpo; os 32 testes de empresa (incl. os de `empresaSchema`) continuam verdes; `npm run build` OK.
- **Commit:** `5957dc0`

**3. [Rule 2 - Missing critical] createCategoryService sem ownership check de empresaId (IDOR)**
- **Found during:** Task 1
- **Issue:** O plano pede validar que `empresaId` pertence ao userId antes de criar categoria (T-04-06). O `createCategoryService` existente (04-02) gravava `empresaId` direto do input sem verificar propriedade — um cliente poderia criar categoria numa empresa de outro usuário.
- **Fix:** Adicionei `findFirst({ where: { id: empresaId, userId } })` antes do `create` quando `empresaId` não é null; lança "Empresa não encontrada." se não pertencer.
- **Files modified:** `src/app/(authed)/lancamentos/_lib/service.ts`
- **Verification:** `tsc` limpo; suíte 93/93; mitigação T-04-06 do threat_model aplicada.
- **Commit:** `b22428a`

---

**Total deviations:** 3 auto-fixed (1 bug de cor, 1 blocking de tipo, 1 missing-critical de segurança).
**Impact on plan:** Nenhum scope creep. As 3 correções alinham o código com os artefatos autoritativos (schema/testes do 04-02, UI-SPEC, threat_model). A fatia vertical saiu exatamente como planejada: /empresas cria/edita/exclui com proteção, categorias por empresa por tipo, seed idempotente das 3 empresas.

## Authentication Gates
None — nenhuma autenticação externa exigida. O seed usa DIRECT_URL já configurado; `supabase.auth.getUser()` já está em produção desde a Fase 1.

## Known Stubs
None — todos os fluxos desta fatia (CRUD de empresa, categorias por empresa, seed) estão ligados ao Prisma com dados reais. O seletor global de empresa (dropdown "Casa + empresas") e a seleção de contexto por empresa são do Plano 04-04 (fora de escopo desta fatia, documentado no 04-02 Known Stubs); a Casa continua funcionando via `empresaId:null`.

## Issues Encountered
None. O seed foi executado 2x contra o banco real via `npx prisma db seed` (DIRECT_URL) — operação puramente aditiva/idempotente (upsert, sem DELETE), SEM usar `migrate diff --shadow-database-url` (a causa do incidente do 04-02). COUNT-COMPARE pós-seed: 3 empresas, categorias por tipo sem duplicar, Casa intacta (5).

## Next Phase Readiness
- /empresas pronta: CRUD + categorias por empresa + seed das 3 empresas, tudo verde (tsc + build + 93/93 testes).
- Pronto para o Plano 04-04 (dropdown global "Casa + empresas" + seleção de contexto por empresa) — as empresas e suas categorias já existem no banco e são carregáveis via `getEmpresas`/`getCategoriasPorEmpresa`.

## Self-Check: PASSED

- Arquivos criados verificados em disco (actions.ts, loader.ts, page.tsx, EmpresaSheet, EmpresaCard, NewEmpresaButton, DeleteEmpresaDialog, ColorPicker, EmpresaCategoriesSection, empresa-cores.ts) — todos FOUND.
- Commits verificados: `b22428a` (Task 1), `5957dc0` (Task 2), `e3b2f2f` (Task 3) — todos FOUND.
- Verificações do plano: `npx vitest run` 93/93, `npx tsc --noEmit` limpo, `npm run build` OK (rota /empresas gerada), seed idempotente confirmado (2 passes → 3 empresas, sem duplicatas), threat_model T-04-06/T-04-08/T-04-09 mitigados.

---
*Phase: 04-empresas-multi-e-renda-familiar*
*Completed: 2026-11-25*
