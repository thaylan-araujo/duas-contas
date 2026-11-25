---
phase: 4
slug: empresas-multi-e-renda-familiar
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-11-25
---

# Phase 4 (Fatia 1 — Fundação) — Validation Strategy

> Contrato de validação da fatia de fundação multi-empresa. A superfície crítica é a **integridade da migração** (dados da Casa preservados) e a **proteção de exclusão**. Vitest já está instalado (Fase 3).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (já instalado na Fase 3) |
| **Config file** | `vitest.config.ts` (existente, com alias `@`) |
| **Quick run command** | `npx vitest run src/lib src/app/\(authed\)/empresas` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~6 segundos |

---

## Sampling Rate

- **After every task commit:** `npx vitest run` nas funções puras tocadas
- **After every plan wave:** `npx vitest run` (suíte completa) + `npx tsc --noEmit`
- **Before `/gsd-verify-work`:** suíte completa verde + `npm run build`
- **Max feedback latency:** 10 segundos

---

## Per-Task Verification Map

Funções de lógica devem ser **puras** (sem Prisma) onde possível. A migração de dados é verificada por asserção sobre o banco após aplicar.

| Área | Requirement | O que validar | Test Type | Automated Command | File | Status |
|------|-------------|---------------|-----------|-------------------|------|--------|
| Migração — dados da Casa | D-07 | Após migrar, nº de Transactions/Categories da Casa inalterado; viram `empresaId = NULL` | integração (assert no banco) | `npx prisma migrate status && script de contagem` | ❌ W0 | ⬜ pending |
| Unicidade de categoria da Casa | D-04/D-07 | Índice `NULLS NOT DISTINCT` impede 2 categorias Casa com mesmo nome; seed idempotente volta a casar | unit/integração | `npx vitest run` | ❌ W0 | ⬜ pending |
| CRUD de empresa | EMP (novo) | criar/editar/remover empresa; `where: { id, userId }` (IDOR) | unit (service puro + schema) | `npx vitest run` | ❌ W0 | ⬜ pending |
| Proteção ao excluir empresa | EMP / D-08 | bloquear exclusão se houver lançamentos vinculados (mensagem com contagem) | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| Seed das 3 empresas | D-05 | getOrSeed idempotente cria Elite Juris/Achadinhos/Infoproduto com tipo + categorias padrão; rodar 2× não duplica | unit/integração | `npx vitest run` | ❌ W0 | ⬜ pending |
| Contexto ativo (store) | D-06 | `contaAtiva` representa Casa | empresaId; migração do `persist` não quebra localStorage antigo | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] **Confirmar versão do Postgres ≥ 15** no Supabase (`SELECT version();`) antes de depender de `NULLS NOT DISTINCT`.
- [ ] **Backup do banco** (snapshot Supabase / pg_dump) **antes** da migração — checkpoint humano obrigatório (CLAUDE.md).
- [ ] Stubs de teste para CRUD/seed/proteção de empresa e para a migração do store.
- [ ] Instalar `DropdownMenu` (shadcn oficial; peer `@radix-ui/react-dropdown-menu`).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dropdown "Casa + empresas" troca o contexto em todas as telas | D-06 | Interação de navegação ponta a ponta | Selecionar cada empresa → ver lançamentos/visão geral mudarem de contexto |
| Dados da Casa intactos após migração | D-07 | Confirmação visual pós-deploy | Abrir /lancamentos e /visao-geral da Casa e conferir os lançamentos de teste |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 cobre backup + confirmação de versão PG + install DropdownMenu
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
