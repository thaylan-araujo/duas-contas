# Plan 04d-01 — SUMMARY (migração aditiva aliquotaDasPercent)
**Status:** complete · **Date:** 2026-11-26
- Checkpoint de backup aprovado diretamente pelo usuário ("pode"). Migração aditiva (zero perda de dados).
- `Empresa.aliquotaDasPercent Decimal? @db.Decimal(5,2)` adicionado (alíquota do DAS por empresa). Migração `20261126181910_add_aliquota_das` (`ALTER TABLE ADD COLUMN`) aplicada via `migrate deploy` (DIRECT_URL) pelo orquestrador. `prisma generate` + `tsc` OK. Sem `--shadow-database-url`.
- Commits: a598a46 (schema+migração).
