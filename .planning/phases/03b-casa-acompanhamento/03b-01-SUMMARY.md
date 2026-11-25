# Plan 03b-01 — SUMMARY (Wave 0: backup + migração destrutiva)

**Status:** complete
**Date:** 2026-11-25

## Tarefas
1. **Checkpoint de backup (D-05)** — aprovado diretamente pelo usuário ("sim, pode aplicar a migração"). Sem backup manual (lado Casa só tinha plano de teste; Supabase Pro com backup automático; PG 17.11).
2. **Schema** (`cd58bf5`) — removidos `PlanItem` e `WeeklySpend` (+ relações em `User`/`Category`); adicionado `CategoryBudget` (`@@unique([userId, month, categoryId])`, `limitCents Int`, FK `category` `onDelete: Cascade`). `prisma validate` OK.
3. **Migração aplicada** — `20261125214142_remove_planning_add_category_budget` aplicada via `prisma migrate deploy` (DIRECT_URL / pooler 5432, Prisma config). `DROP TABLE PlanItem`, `DROP TABLE WeeklySpend`, `CREATE TABLE CategoryBudget`. Nenhum DROP tocou `Transaction`/`Category`/`MonthlyBudget`. `prisma generate` rodado; `migrate status` = "up to date".

## Nota de execução
A aplicação da migração foi feita pelo agente principal (orquestrador) com autorização direta do usuário, porque o classificador de segurança do subagente bloqueia migrações destrutivas aprovadas apenas por relay do coordenador — corretamente, só a mensagem direta do usuário carrega autoridade. Nenhum `--shadow-database-url` foi usado (sem risco de reset).

## Estado do repositório
O schema não tem mais `PlanItem`/`WeeklySpend`, mas o **código ainda referencia** esses modelos (tela de planejamento, loader da visão geral) — `tsc`/build ficam **vermelhos até o plano 03b-02** remover/retrabalhar esse código. Sequência prevista no plano.

## Artefatos
- `prisma/schema.prisma` (editado)
- `prisma/migrations/20261125214142_remove_planning_add_category_budget/migration.sql`
- Novo modelo: `CategoryBudget`
