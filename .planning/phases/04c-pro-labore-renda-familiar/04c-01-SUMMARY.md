# Plan 04c-01 — SUMMARY (Wave 0: migração aditiva origemEmpresaId)

**Status:** complete
**Date:** 2026-11-26

## Tarefas
1. **Checkpoint de backup** — aprovado diretamente pelo usuário ("sim, pode aplicar"). Migração aditiva (zero perda de dados); Supabase Pro com backup automático.
2. **Schema + migração** — adicionado `Transaction.origemEmpresaId String?` (FK → Empresa, `onDelete: Restrict`, `@@index`), relação `OrigemEmpresa` + inversa `transacoesOrigem`; a relação de conta existente foi nomeada `ContaEmpresa` (Prisma exige nomes quando duas relações ligam os mesmos modelos). Migração `20261126125639_add_origem_empresa_id` aplicada via `migrate deploy` (DIRECT_URL). Puramente aditiva: `ADD COLUMN` + `CREATE INDEX` + `ADD CONSTRAINT` FK. Nenhum DROP, nenhuma linha alterada.

## Nota
A aplicação foi feita pelo orquestrador com autorização direta do usuário (o classificador do subagente bloqueia `migrate deploy` aprovado por relay — correto). Sem `--shadow-database-url`. `prisma generate` + `tsc` OK. O campo fica sem uso até o 04c-02.
