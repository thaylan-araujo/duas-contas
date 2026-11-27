---
phase: 10-pago-a-pagar
plan: 02
subsystem: casa-pago-a-pagar
tags: [casa, visao-geral, contas-fixas, pago-a-pagar, C2, C3, C6, R-3, R-5]
requires:
  - "Transaction.status/dueDate/estimatedCents/fixedAccountId + índice único (fixedAccountId, dueDate) (fatia 01 — migração 20261127165023)"
  - "FixedAccount.isVariableAmount"
  - "computeComprometido/computePossoGastar + getEmAbertoCasa + HeroPossoGastar (fatia 01)"
provides:
  - "gerarContasDoMesService (geração mensal idempotente, atômica via P2002)"
  - "markTransacaoPagaService (flip da mesma linha para PAGO + valor real nas a definir)"
  - "getEstimativaMesAnterior (R-5)"
  - "getContasFixasTransacoesMes (leitor das fixas do mês)"
  - "funções puras montarLinhasContasFixas + computeChipsContasFixas (WARNING 4)"
  - "componentes StatusPill, ContasFixasBloco, MarcarPagoDialog"
  - "toggle isVariableAmount em /contas-fixas"
affects:
  - "src/app/(authed)/visao-geral"
  - "src/app/(authed)/contas-fixas"
tech-stack:
  added: []
  patterns:
    - "funções puras co-locadas + Vitest (fixasFaltandoGerar/valorLinhaGerada/computeChipsContasFixas)"
    - "idempotência em 2 camadas: read-guard + captura P2002 do índice único (double-tap atômico)"
    - "getOrCreate de categoria Casa (findFirst+create, NULLS NOT DISTINCT)"
    - "reuso de componentes de /planejamento (CategoriaTetoList/GastoSemanalAuto) no fluxo da Casa"
key-files:
  created:
    - "src/app/(authed)/visao-geral/_lib/geracao-mensal.ts"
    - "src/app/(authed)/visao-geral/_lib/geracao-mensal.test.ts"
    - "src/app/(authed)/visao-geral/_lib/contas-fixas-bloco.ts"
    - "src/app/(authed)/visao-geral/_lib/contas-fixas-bloco.test.ts"
    - "src/app/(authed)/visao-geral/_components/StatusPill.tsx"
    - "src/app/(authed)/visao-geral/_components/ContasFixasBloco.tsx"
    - "src/app/(authed)/visao-geral/_components/MarcarPagoDialog.tsx"
  modified:
    - "src/app/(authed)/contas-fixas/_lib/schema.ts"
    - "src/app/(authed)/contas-fixas/_components/FixedAccountSheet.tsx"
    - "src/app/(authed)/contas-fixas/_lib/service.test.ts"
    - "src/app/(authed)/visao-geral/_lib/actions.ts"
    - "src/app/(authed)/visao-geral/_lib/service.ts"
    - "src/app/(authed)/visao-geral/_lib/loader.ts"
    - "src/app/(authed)/visao-geral/page.tsx"
decisions:
  - "'a definir' gravado como amountCents=0 + estimatedCents=estimativa (alinhado com computeComprometido da fatia 01, que usa estimatedCents por isVariableAmount)"
  - "Geração linha-a-linha com try/catch por linha (não um único $transaction) para que uma colisão P2002 numa fixa faça skip sem abortar as demais"
  - "Matemática dos chips movida para função pura computeChipsContasFixas (WARNING 4) em vez de aproximação no loader; Variável = max(0, totalPago − fixasPagas)"
  - "C6 resolvido por REUSO: importados CategoriaTetoList/GastoSemanalAuto + loadAcompanhamentoData de /planejamento na página da Casa, sem reimplementar o cálculo (os três blocos convivem no fluxo da Casa)"
  - "Categoria Casa 'Contas fixas' garantida via getOrCreate (findFirst+create, empresaId null, kind null)"
metrics:
  duration: "~25min"
  completed: "2026-11-27"
  tasks_completed: 3
  files_created: 7
  files_modified: 7
status: complete
---

# Phase 10 Plan 02: Casa "Pago e A Pagar" — Fatia 2 Summary

Contas fixas entram sozinhas como lançamentos EM_ABERTO via ação explícita idempotente (valor certo ou estimativa do mês anterior nas "a definir"), com "marcar pago" na mesma linha (valor real nas a definir), bloco visual na Visão Geral da Casa e os três blocos do mockup convivendo (hero + contas-fixas + "variável da semana com teto" reusado da Fase 3.5).

## O que foi feito

### Task 1 — Toggle `isVariableAmount` em /contas-fixas (commit `fd93fb3`)
- `fixedAccountSchema` ganha `isVariableAmount: z.boolean()` (espelha `autoDebit`); `updateFixedAccountSchema` herda via `.extend`.
- `FixedAccountSheet`: campo na interface `ExistingFixedAccount`, `defaultValues`, os dois `reset()`; Switch "Valor variável (a definir)" (id `fa-isVariable`, wrapper ≥44px); nota PT-BR no campo Valor quando ligado ("Luz/água: o valor é definido ao marcar pago.").
- Service/actions de contas-fixas **inalterados** — o campo flui pelo `...data` do `create`/`update`.
- Fixture `service.test.ts` atualizada com o campo (agora obrigatório no schema).

### Task 2 — Geração mensal idempotente + marcar pago (TDD RED `0b75459` → GREEN `e492d07`)
- **Funções puras (testadas):** `fixasFaltandoGerar` (quais fixas faltam gerar — idempotência de leitura), `valorLinhaGerada` (valor certo vs "a definir"), `dataVencimentoNoMes` (clamp ao último dia).
- `getEstimativaMesAnterior` (R-5): PAGO do mês anterior → `amountCents`; mês anterior ainda em aberto → `estimatedCents`; sem histórico → 0.
- `gerarContasDoMesService`: idempotência em **2 camadas** — read-guard (`fixasFaltandoGerar`) no caminho feliz + captura de **P2002** do índice único `(fixedAccountId, dueDate)` sob double-tap/retry (skip da linha). Cria linhas `SAIDA`/`EM_ABERTO`/Casa, categoria "Contas fixas" (getOrCreate), `date = dueDate`.
- `markTransacaoPagaService`: ownership `findFirst({id,userId})` (IDOR), flip da **mesma linha** para PAGO (R-2), grava `amountCents = valorCents` nas "a definir"/quando veio valor; valida `valorCents` Int ≥ 0; "a definir" exige o valor.
- `actions.ts`: `gerarContasDoMesAction(month)` e `marcarPagoAction(id, valorCents?)` — userId SEMPRE da sessão, `revalidatePath('/visao-geral')` + `/planejamento`, erros PT-BR.

### Task 3 — Bloco visual + C6 + chips WARNING 4 (commit `38b0ff7`)
- `StatusPill` (apresentacional): pago → verde (`text-positive` + `casa-light`), em aberto → âmbar (`text-warning` + `empresa-ambar-light`), contraste AA, PT-BR.
- `MarcarPagoDialog`: Dialog shadcn; valor certo confirma; "a definir" mostra Input (`parseBRLInput`, pré-preenchido com a estimativa) e envia `valorCents`; `useTransition`; botões ≥44px.
- `ContasFixasBloco`: cabeçalho + resumo "R$ total · N em aberto", "Gerar contas do mês", linhas (vencimento `formatDate` / valor `formatBRL` ou "a definir" + estimativa / `StatusPill` / "marcar pago"); estados vazios (sem contas → convite a /contas-fixas; sem em aberto → "tudo pago ✓").
- **Funções puras (testadas):** `montarLinhasContasFixas` (em aberto primeiro por vencimento, depois pagas, depois não geradas), `computeChipsContasFixas` (**WARNING 4**: `Variável = max(0, totalSpentPago − fixasPagas)`, nunca negativo; reconcilia com o comprometido).
- `service.getContasFixasTransacoesMes`: lê as fixas do mês (PAGO + EM_ABERTO), escopado por userId.
- `loader.ts`: ramo Casa carrega fixas + transações em paralelo, computa chips corretos e as linhas do bloco; ramo empresa inalterado.
- `page.tsx`: renderiza `ContasFixasBloco` após o hero + **C6** — `CategoriaTetoList`/`GastoSemanalAuto` da Fase 3.5 REUSADOS inalterados (via `loadAcompanhamentoData`) no fluxo da Casa. Os três blocos do mockup convivem. Ramo empresa não tocado.

## Verification
- `npx vitest run` → **231 passed (23 files)** (baseline 219 + 7 geracao-mensal + 5 contas-fixas-bloco; a fixture de contas-fixas foi ajustada para o novo campo obrigatório).
- `npm run build` → **limpo** (Compiled successfully). Único warning: `clearErrors`/`Controller`/`cn`/`control` em `lancamentos/_components/TransactionSheet.tsx` — **pré-existente**, fora do escopo desta fatia.
- DB/schema/migrations: **não tocados** (`git diff HEAD~4..HEAD` não inclui `prisma/`); testes usam `vi.mock('@/lib/prisma')`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixture `contas-fixas/_lib/service.test.ts` quebrou com o novo campo obrigatório**
- **Found during:** Task 1
- **Issue:** Adicionar `isVariableAmount` (não-opcional) ao `fixedAccountSchema` fez o objeto `valid` do teste falhar no `safeParse`.
- **Fix:** Adicionado `isVariableAmount: false` à fixture `valid`.
- **Files modified:** `src/app/(authed)/contas-fixas/_lib/service.test.ts`
- **Commit:** `fd93fb3`

### Decisões de implementação (dentro da discrição do builder)
- **Matemática dos chips** extraída para `computeChipsContasFixas` (função pura testada) em vez de deixar a aproximação anterior no loader — cumpre WARNING 4 de forma verificável.
- **C6** resolvido por reuso direto dos componentes de `/planejamento` na página da Casa (opção permitida pelo plano: "escolha do builder, sem reimplementar o cálculo").
- **Geração linha-a-linha** (try/catch por linha) em vez de um único `$transaction` — necessário para isolar a captura de P2002 por fixa (uma colisão não aborta as demais). Documentado no código.

> Nota sobre o `<verify>` da Task 3: o grep do plano esperava `StatusPill|ContasFixasBloco|MarcarPagoDialog` em `page.tsx`, mas `StatusPill` e `MarcarPagoDialog` são corretamente aninhados dentro de `ContasFixasBloco` (page → ContasFixasBloco → StatusPill + MarcarPagoDialog). A arquitetura está correta; só `ContasFixasBloco` aparece na page. Build e testes confirmam a integração.

## Known Stubs
Nenhum. As linhas do bloco e os chips vêm de dados reais do loader. Fixas ainda não geradas aparecem como "Não gerada" (status null) até o usuário clicar "Gerar contas do mês" — comportamento esperado (R-3: geração é ação explícita, nunca em render).

## Threat Flags
Nenhuma superfície nova fora do `<threat_model>` do plano. T-10-06 (double-tap) mitigado pelo índice único + captura P2002; T-10-07 (contagem dupla) pela flip da mesma linha; T-10-08 (IDOR) por `findFirst({id,userId})` + queries escopadas; T-10-09 (valor) por `parseBRLInput` no cliente + validação Int ≥ 0 no service. Nenhuma dependência nova (T-10-SC).

## Self-Check: PASSED
