---
phase: 04c-pro-labore-renda-familiar
plan: 01
type: execute
wave: 0
depends_on: []
files_modified:
  - prisma/schema.prisma
  - prisma/migrations
autonomous: false
requirements:
  - PL-01
  - PL-05
  - PL-06
user_setup: []

must_haves:
  truths:
    - "O banco é copiado (backup) antes da migração aditiva do schema"
    - "A coluna origemEmpresaId existe na tabela Transaction (nullable, FK para Empresa)"
    - "Nenhum dado existente (Casa) é perdido — a migração é puramente aditiva"
  artifacts:
    - path: "prisma/schema.prisma"
      provides: "Campo Transaction.origemEmpresaId (empresa de origem do pró-labore)"
      contains: "origemEmpresaId"
    - path: "prisma/migrations"
      provides: "Migração Prisma aditiva aplicada via DIRECT_URL"
  key_links:
    - from: "prisma/schema.prisma"
      to: "prisma/migrations"
      via: "prisma migrate dev gera a migração a partir do schema editado"
      pattern: "origemEmpresaId"
---

## Phase Goal

**As a** dono das minhas empresas, **I want to** aplicar o pró-labore de cada empresa para a Casa e ver quanto da renda familiar veio de cada origem, **so that** eu enxergue quanto a família recebeu e de onde — mantendo a regra de que dinheiro só passa da empresa para a Casa como pró-labore.

<objective>
Wave 0 da Fatia 3 (pró-labore → renda familiar): preparar o schema para rastrear a **empresa de origem** do pró-labore. Adiciona um campo aditivo `Transaction.origemEmpresaId` (nullable, FK para Empresa) que marca de qual empresa o pró-labore saiu — tanto na SAÍDA da empresa quanto na ENTRADA da Casa. É esse campo que permite o bloco "Renda familiar por origem" (04c-03) agrupar as entradas da Casa por empresa de origem com um `groupBy` simples e robusto, sem join frágil pelo pairId.

Decisão de schema (Discrição do Claude em D-04): escolhido `origemEmpresaId` aditivo em vez de resolver a origem via join pelo `pairId`. O join funcionaria só para entradas que têm par; o campo dedicado agrupa qualquer entrada (pró-labore marcado vs. "outras entradas" como salário) com uma query direta. É a opção mais simples e robusta pedida em D-04.

Esta é a única mudança de schema da fase; roda isolada em Wave 0 com checkpoint de backup bloqueante antes da migração, conforme a regra do projeto (.claude/CLAUDE.md: nunca mudar o banco sem backup). A migração é **aditiva** (uma coluna nullable + FK + índice) — NÃO remove nem altera dados existentes.

Purpose: Dar à Transaction um eixo de origem explícito, desbloqueando o fluxo de pró-labore multi-empresa (04c-02) e o agrupamento da renda familiar (04c-03).
Output: `schema.prisma` com `Transaction.origemEmpresaId`; uma nova migração Prisma aditiva aplicada via DIRECT_URL; nenhuma alteração de seed necessária.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/04c-pro-labore-renda-familiar/04c-CONTEXT.md

# Precedentes de migração (pitfalls do shadow-db e do pooler) e o schema atual
@prisma/schema.prisma
@.planning/phases/04-empresas-multi-e-renda-familiar/04-02-SUMMARY.md
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking-human">
  <name>Task 1: Checkpoint de backup antes da migração aditiva (regra .claude/CLAUDE.md)</name>
  <what-built>
    Nada ainda — este é o portão de backup obrigatório antes de qualquer mudança no banco.
    A migração desta fase é ADITIVA (adiciona a coluna nullable `Transaction.origemEmpresaId`
    + FK + índice). Não remove tabelas nem colunas, não altera linhas existentes. Mesmo sendo
    de baixo risco, a regra do projeto exige backup confirmado antes de tocar o banco, e já houve
    um incidente anterior de perda de dados de teste por shadow-db apontado ao banco real.
  </what-built>
  <how-to-verify>
    1. Faça um backup do banco Supabase AGORA (antes de autorizar):
       - Opção A (recomendada, Supabase Pro): confirme no painel do Supabase que há um backup
         automático recente (diário), ou crie um backup on-demand.
       - Opção B (dump manual via DIRECT_URL, porta 5432): rode um `pg_dump` da conexão
         DIRECT_URL para um arquivo .sql local. NUNCA use a porta 6543 (pooler).
    2. Confirme que o backup existe e é recente.
    3. AVISO CRÍTICO ao executor (repetir do incidente 04-02 #3): NUNCA aponte `--shadow-database-url`
       do Prisma para o DATABASE_URL/DIRECT_URL reais — isso RESETA o banco (já aconteceu).
       A migração desta fase usa apenas `prisma migrate dev` contra o DIRECT_URL (porta 5432),
       sem shadow-db externo.
    4. Responda "approved" só depois que o backup estiver confirmado.
  </how-to-verify>
  <resume-signal>Digite "approved" após confirmar o backup, ou descreva o que falta.</resume-signal>
</task>

<task type="auto">
  <name>Task 2: Adicionar Transaction.origemEmpresaId ao schema e aplicar migração aditiva via DIRECT_URL (PL-01/PL-05/PL-06)</name>
  <files>prisma/schema.prisma, prisma/migrations</files>
  <action>
    Editar o modelo `Transaction` em `prisma/schema.prisma` para adicionar o campo de origem do
    pró-labore (Discrição do Claude em D-04 — a opção de campo dedicado, não join por pairId):
    - Adicionar uma relação nomeada e opcional para Empresa, porque Transaction já tem a relação
      `empresa`/`empresaId` (a conta à qual o lançamento pertence). Use um nome de relação distinto
      para evitar ambiguidade do Prisma: campo `origemEmpresa Empresa?` com
      `@relation("OrigemEmpresa", fields: [origemEmpresaId], references: [id], onDelete: Restrict)`
      e campo escalar `origemEmpresaId String?` com comentário explicando que é a empresa DE ONDE o
      pró-labore saiu (null para lançamentos comuns que não são pró-labore; "outras entradas" na Casa).
    - No modelo `Empresa`, adicionar o lado inverso da nova relação: `transacoesOrigem Transaction[] @relation("OrigemEmpresa")`
      (a relação `transactions Transaction[]` existente permanece como está — é a relação de conta).
    - onDelete: Restrict espelha a relação `empresa` existente: uma empresa com pró-labores de origem
      vinculados não pode ser excluída silenciosamente (consistente com D-08 e com o bloqueio de
      exclusão de empresa em empresas/_lib/service.ts).
    Gerar e aplicar a migração a partir do schema editado. Regras de conexão do projeto
    (.claude/CLAUDE.md): migrações SEMPRE pela conexão direta (DIRECT_URL, porta 5432), NUNCA pelo
    pooler (6543). Preferir `npx prisma migrate dev --name add_origem_empresa_id` (ele usa a DIRECT_URL
    configurada no datasource). Se o ambiente não tiver TTY interativo (pitfall do 04-02), usar a rota
    não-interativa: `npx prisma migrate dev --name add_origem_empresa_id --create-only` para gerar o SQL,
    conferir que o SQL é só `ALTER TABLE "Transaction" ADD COLUMN "origemEmpresaId"` + `ADD CONSTRAINT ... FOREIGN KEY`
    + eventual `CREATE INDEX`, e então `npx prisma migrate deploy`. NÃO usar `--shadow-database-url`
    apontado ao banco real (incidente 04-02 #3). Rodar `npx prisma generate` ao final para atualizar o client.
    NÃO alterar o seed — nenhuma categoria ou linha nova é semeada aqui; o campo nasce NULL para todas
    as linhas existentes, que é exatamente o estado correto (nenhum lançamento antigo é pró-labore marcado).
  </action>
  <verify>
    <automated>grep -q "origemEmpresaId" prisma/schema.prisma && npx prisma validate && npx tsc --noEmit</automated>
  </verify>
  <done>`prisma/schema.prisma` tem `Transaction.origemEmpresaId` (nullable) e o lado inverso em Empresa; `prisma validate` passa; a migração aditiva está no diretório prisma/migrations e foi aplicada via DIRECT_URL; `npx prisma generate` roda sem erro; `npx tsc --noEmit` limpo (o client regenerado reconhece o novo campo).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| operador → banco (migração) | Comandos de migração Prisma tocam o banco de produção/dev; um shadow-db mal apontado reseta dados |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04c-01 | Denial of Service (perda de dados) | prisma migrate (shadow-db) | mitigate | Checkpoint de backup bloqueante (Task 1) + proibição explícita de apontar `--shadow-database-url` ao banco real (incidente 04-02 #3); migração só via DIRECT_URL |
| T-04c-02 | Tampering | migração aditiva | accept | Migração é puramente aditiva (coluna nullable + FK); não há caminho de perda de dados existentes. Backup cobre o risco residual |
| T-04c-03 | Elevation of Privilege | FK origemEmpresaId | mitigate | onDelete: Restrict impede exclusão silenciosa de empresa com pró-labores vinculados; a posse (userId) é validada nas Server Actions do 04c-02, não no banco |
</threat_model>

<verification>
- `grep origemEmpresaId prisma/schema.prisma` encontra o campo e o lado inverso.
- `npx prisma validate` passa.
- `npx prisma migrate status` fica limpo (sem migrações pendentes).
- `npx tsc --noEmit` limpo após `prisma generate`.
- Backup confirmado pelo humano no checkpoint (Task 1) antes de qualquer comando de migração.
</verification>

<success_criteria>
- Checkpoint de backup aprovado antes da migração.
- `Transaction.origemEmpresaId` existe no schema e no banco (nullable, FK Restrict para Empresa, relação nomeada "OrigemEmpresa").
- Migração aditiva aplicada via DIRECT_URL; nenhum dado da Casa perdido; seed inalterado.
- Prisma Client regenerado reconhece o campo (tsc limpo).
</success_criteria>

<output>
Create `.planning/phases/04c-pro-labore-renda-familiar/04c-01-SUMMARY.md` when done
</output>
