---
phase: 04-empresas-multi-e-renda-familiar
plan: 01
subsystem: fundacao-multi-empresa
tags: [migration-safety, tdd-red, shadcn, dropdown-menu, zustand, prisma]
requires: []
provides:
  - "DropdownMenu (shadcn) para o seletor Casa + empresas"
  - "Rede de testes RED das funções puras da fatia (service + schema + store)"
  - "MIGRATION-RUNBOOK.md com backup aprovado + PG 17.11 + contagens pré-migração"
affects:
  - "Plano 04-02 (migração destrutiva) — pré-requisitos de segurança liberados"
  - "Planos 04-02/04-03 — tornam os testes RED verdes (GREEN)"
tech-stack:
  added:
    - "@radix-ui/react-dropdown-menu ^2.2.1 (via npx shadcn add dropdown-menu — registry oficial)"
  patterns:
    - "Testes de funções puras com Vitest (sem Prisma), imitando contas-fixas/_lib/service.test.ts"
    - "RED-first TDD: testes importam módulos ainda inexistentes e falham de propósito"
    - "Checagem pré-migração read-only via prisma.$queryRaw sobre DIRECT_URL (porta 5432)"
key-files:
  created:
    - "src/components/ui/dropdown-menu.tsx"
    - "src/app/(authed)/empresas/_lib/service.test.ts"
    - "src/store/conta.test.ts"
    - ".planning/phases/04-empresas-multi-e-renda-familiar/MIGRATION-RUNBOOK.md"
  modified:
    - "package.json"
    - "package-lock.json"
key-decisions:
  - "Checkpoint humano de backup aprovado sem snapshot manual: lado Empresa vazio, Casa só com dados de teste, Supabase Pro com backups diários automáticos como rede"
  - "Tipos de empresa como strings literais nos testes ('AFILIADO'|'JURIDICO_SERVICOS'|'INFOPRODUTO'|'GENERICO') para não acoplar ao @prisma/client (EmpresaTipo só entra no Plano 02)"
  - "Paleta de cor da empresa validada contra 6 chaves fixas (laranja, verde, roxo, rosa, ambar, cinza-azulado) — Casa (azul) fora da paleta"
requirements-completed: [EMPF-01, EMPF-02, EMPF-03, EMPF-04, EMPF-05, EMPF-06]
duration: "7 min"
completed: 2026-11-25
status: complete
---

# Phase 4 Plan 1: Fundação multi-empresa (Wave 0 — segurança da migração + rede de testes RED) Summary

Wave 0 da fatia de fundação multi-empresa: tornou a migração destrutiva do Plano 04-02 segura (backup aprovado + Postgres 17.11 confirmado ≥15 + contagens pré-migração registradas provando que o lado Empresa está vazio), instalou o único componente novo (DropdownMenu do registry oficial shadcn) e escreveu a rede de testes RED das funções puras da fatia — que falham de propósito porque o código de produção ainda não existe (RED-first TDD).

## Duração e escopo

- **Início:** 2026-11-25T19:05:31Z
- **Fim:** 2026-11-25T19:13:26Z
- **Duração:** ~7 min
- **Tarefas:** 3/3 completas
- **Arquivos criados/modificados:** 6 (4 criados, 2 modificados)

## Tarefas executadas

### Task 1 — Backup do banco + confirmação da versão do Postgres (BLOQUEANTE) — commit `bc5ff7d`
Checkpoint humano **bloqueante** aprovado. A parte read-only foi executada via `prisma.$queryRaw` sobre **DIRECT_URL (porta 5432)** — apenas `SELECT version()` e `count(*)`, nenhuma alteração destrutiva:

- **Versão do Postgres:** `PostgreSQL 17.11` → **≥ 15 confirmado** (A1). `NULLS NOT DISTINCT` disponível; sem necessidade de fallback de índices parciais.
- **Contagens pré-migração** (registradas em `MIGRATION-RUNBOOK.md`):

  | Alvo | Antes | Esperado depois do Plano 04-02 |
  | ---- | ----: | ------------------------------ |
  | `Transaction` account=EMPRESA | **0** | coluna removida; nada a perder (confirma D-07/A2) |
  | `Transaction` account=CASA | 0 | 0 com `empresaId IS NULL` |
  | `Category` account=CASA | **5** | 5 com `empresaId IS NULL` (Casa preservada) |
  | `Category` account=EMPRESA | 5 | 0 (seed antigo descartado) |

- **Aprovação:** sinal de resume **"backup feito, pode migrar"**. O humano autorizou prosseguir sem snapshot manual adicional — lado Empresa vazio, Casa só com dados de teste, Supabase Pro com backups diários automáticos como rede de segurança. A migração destrutiva **não** foi executada aqui (é o Plano 04-02).

### Task 2 — Instalar DropdownMenu (shadcn) + scaffold do runbook — commit `26603b3`
- `npx shadcn@latest add dropdown-menu` → criou `src/components/ui/dropdown-menu.tsx` (estilo "default" já em `components.json`; sem reinicializar shadcn) e adicionou `@radix-ui/react-dropdown-menu ^2.2.1` (mesmo ecossistema Radix das Fases 1–3; APPROVED na Package Legitimacy Audit).
- Criado `MIGRATION-RUNBOOK.md` (106 linhas) com comando de backup, `SELECT version();` e contagens pré-migração — rede de verificação pós-migração do Plano 04-02 (D-07).
- **Verificação:** `test -f ... && grep -q "DropdownMenu" ... && node -e "require('@radix-ui/react-dropdown-menu')"` → **OK**.

### Task 3 — Testes RED das funções puras (TDD RED) — commit `7e47797`
Dois arquivos de teste criados imitando `contas-fixas/_lib/service.test.ts` (Vitest, funções puras, sem Prisma):

- `src/app/(authed)/empresas/_lib/service.test.ts` (155 linhas): `receitasPorTipo` (AFILIADO→Comissões; JURIDICO_SERVICOS→Recorrência+Projetos; INFOPRODUTO→Vendas; GENERICO→Receita), `categoriasPadrao` (5 custos comuns kind CUSTO + receitas kind RECEITA), `CUSTOS_PADRAO`, `canDeleteEmpresa` (0→true, >0→false — D-08), `empresaSchema` (nome obrigatório/≤60, tipo no enum, cor na paleta das 6), idempotência do seed (chaves compostas estáveis, sem duplicatas).
- `src/store/conta.test.ts` (54 linhas): `empresaIdDoContexto` (Casa→null, Empresa→empresaId) e `migrateContaStore` (v0 'EMPRESA'→{tipo:'CASA'}; v0 'CASA'→{tipo:'CASA'}; preserva mesSelecionado; v1 intacto).
- **Verificação RED:** `npx vitest run` nos dois arquivos **FALHA** — `conta.test.ts` falha com "is not a function" (6 testes) e `service.test.ts` falha ao resolver `./service`/`./schema` ("Cannot find module"). A falha é o critério de sucesso deste plano.

## Pre-migration counts (comparar após 04-02)

Estes valores devem ser reconferidos após a migração do Plano 04-02:
- `Category WHERE empresaId IS NULL` **deve ser 5** (Casa preservada) — era `Category account=CASA = 5`.
- `Transaction WHERE empresaId IS NULL` **deve ser 0** — era `Transaction account=CASA = 0`.
- Coluna `account` e type `ContaType` **não devem mais existir**.

## Status dos testes

- **Suíte da fatia (RED):** 2 arquivos falhando de propósito (RED esperado). `conta.test.ts`: 6/6 falham ("is not a function"); `service.test.ts`: suíte não coleta ("Cannot find module './service'"). Ambos ficam GREEN quando os Planos 04-02/04-03 criarem `service.ts`, `schema.ts` e os novos exports de `@/store/conta`.
- Nenhuma mudança em `schema.prisma`, migração ou dados neste plano (restrição respeitada).

## Deviations from Plan

None - plano executado exatamente como escrito.

O checkpoint bloqueante da Task 1 foi liberado por aprovação humana explícita (sinal de resume "backup feito, pode migrar"), que também autorizou dispensar o snapshot manual dado o contexto (sem dados reais + Supabase Pro daily backups). Isso é o fluxo normal do checkpoint, não um desvio do plano.

## Authentication Gates

Nenhum. As queries read-only usaram a DIRECT_URL já presente em `.env.local`.

## Known Stubs

Nenhum stub. Os arquivos de teste RED referenciam módulos de produção ainda inexistentes **por design** (TDD RED) — serão satisfeitos pelos Planos 04-02/04-03, conforme o `objective` deste plano.

## TDD Gate Compliance

- Task 3 é a fase **RED** do ciclo. Commit `test(04-01): ...` presente (`7e47797`).
- Os commits **GREEN** (`feat(...)`) que tornam estes testes verdes pertencem aos Planos 04-02/04-03 — fora do escopo de 04-01 (plano de fundação/Wave 0).

## Próximo passo

Pronto para o Plano **04-02** (migração destrutiva `ContaType`→`Empresa`): o checkpoint de backup está aprovado, PG 17.11 confirmado, e o `MIGRATION-RUNBOOK.md` tem as contagens de referência. 04-02/04-03 implementam `service.ts`/`schema.ts` e os novos exports do store, tornando os testes RED verdes (GREEN).

## Self-Check: PASSED

- Arquivos criados verificados em disco: `dropdown-menu.tsx`, `service.test.ts`, `conta.test.ts`, `MIGRATION-RUNBOOK.md`, `04-01-SUMMARY.md` — todos FOUND.
- Commits verificados em disco: `26603b3` (Task 2), `7e47797` (Task 3), `bc5ff7d` (Task 1 checkpoint) — todos FOUND.
