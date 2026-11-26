---
phase: 04d-consolidado-projecao
plan: 01
type: execute
wave: 0
depends_on: []
files_modified:
  - prisma/schema.prisma
  - prisma/migrations
autonomous: false
requirements:
  - CONS-02
user_setup: []

must_haves:
  truths:
    - "O banco é copiado (backup) antes da migração aditiva do schema"
    - "A coluna aliquotaDasPercent existe na tabela Empresa (nullable)"
    - "Nenhum dado existente (Casa ou empresas) é perdido — a migração é puramente aditiva"
  artifacts:
    - path: "prisma/schema.prisma"
      provides: "Campo Empresa.aliquotaDasPercent (alíquota do DAS por empresa, nullable)"
      contains: "aliquotaDasPercent"
    - path: "prisma/migrations"
      provides: "Migração Prisma aditiva aplicada via DIRECT_URL"
  key_links:
    - from: "prisma/schema.prisma"
      to: "prisma/migrations"
      via: "prisma migrate dev gera a migração a partir do schema editado"
      pattern: "aliquotaDasPercent"
---

## Phase Goal

**As a** dono das minhas empresas, **I want to** ver o consolidado das empresas (faturamento, lucro, DAS e pró-labore somados) e uma projeção de quanto vai sobrar nos próximos meses, com alerta de mês negativo, **so that** eu enxergue quanto as empresas geram juntas e se a família vai fechar o mês no positivo — sem misturar o dinheiro de nenhuma empresa.

<objective>
Wave 0 da Fatia 4 (consolidado + projeção): preparar o schema para a **estimativa de DAS por empresa** (CONS-02 / D-03). Adiciona um campo aditivo `Empresa.aliquotaDasPercent` (nullable) que guarda a alíquota do Simples por empresa. É esse campo que permite calcular `DAS estimado do mês = alíquota × faturamento bruto` no P&L (/canais, Fatia 2) e somado no consolidado (04d-03). Empresa sem alíquota definida → DAS estimado = 0 / "não definido" (D-03).

Decisão de schema (Discrição do Claude em D-03): escolhido `aliquotaDasPercent` como `Decimal` nullable no modelo `Empresa` — a alíquota é um percentual (ex.: 6, 15,5) que não cabe bem em Int e não envolve aritmética monetária (o resultado do DAS em centavos é sempre `Math.round` do produto). A convenção de dinheiro em centavos Int permanece intocada: apenas a alíquota é Decimal; valores monetários continuam Int. Nullable sem default porque "ainda não definido" é um estado legítimo e distinto de "0%".

Esta é a única mudança de schema da fase; roda isolada em Wave 0 com checkpoint de backup bloqueante antes da migração, conforme a regra do projeto (.claude/CLAUDE.md: nunca mudar o banco sem backup). A migração é **aditiva** (uma coluna nullable) — NÃO remove nem altera dados existentes. Espelha o precedente aditivo 04c-01 (origemEmpresaId).

Purpose: Dar à Empresa um campo de alíquota explícito, desbloqueando a estimativa de DAS no P&L (04d-02) e o total de DAS no consolidado (04d-03).
Output: `schema.prisma` com `Empresa.aliquotaDasPercent`; uma nova migração Prisma aditiva aplicada via DIRECT_URL; nenhuma alteração de seed necessária.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/04d-consolidado-projecao/04d-CONTEXT.md

# Precedente de migração aditiva idêntica (origemEmpresaId): mesmo padrão de checkpoint + DIRECT_URL + proibição de shadow-db
@.planning/phases/04c-pro-labore-renda-familiar/04c-01-SUMMARY.md
@prisma/schema.prisma
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking-human">
  <name>Task 1: Checkpoint de backup antes da migração aditiva (regra .claude/CLAUDE.md)</name>
  <what-built>
    Nada ainda — este é o portão de backup obrigatório antes de qualquer mudança no banco.
    A migração desta fase é ADITIVA (adiciona a coluna nullable `Empresa.aliquotaDasPercent`).
    Não remove tabelas nem colunas, não altera linhas existentes. Mesmo sendo de baixo risco, a
    regra do projeto exige backup confirmado antes de tocar o banco, e já houve um incidente
    anterior de perda de dados por shadow-db apontado ao banco real (incidente 04-02 #3).
  </what-built>
  <how-to-verify>
    1. Faça um backup do banco Supabase AGORA (antes de autorizar):
       - Opção A (recomendada): confirme no painel do Supabase um backup automático recente (diário),
         ou crie um backup on-demand.
       - Opção B (dump manual via DIRECT_URL, porta 5432): rode um `pg_dump` da conexão DIRECT_URL
         para um arquivo .sql local. NUNCA use a porta 6543 (pooler).
    2. Confirme que o backup existe e é recente.
    3. AVISO CRÍTICO ao executor (repetir do incidente 04-02 #3): NUNCA aponte a flag de banco-sombra
       do Prisma para o DATABASE_URL/DIRECT_URL reais — isso RESETA o banco (já aconteceu). A migração
       desta fase usa apenas `prisma migrate dev` contra o DIRECT_URL (porta 5432), sem banco-sombra externo.
    4. Responda "approved" só depois que o backup estiver confirmado.
  </how-to-verify>
  <resume-signal>Digite "approved" após confirmar o backup, ou descreva o que falta.</resume-signal>
</task>

<task type="auto">
  <name>Task 2: Adicionar Empresa.aliquotaDasPercent ao schema e aplicar migração aditiva via DIRECT_URL (CONS-02 / D-03)</name>
  <files>prisma/schema.prisma, prisma/migrations</files>
  <action>
    Editar o modelo `Empresa` em `prisma/schema.prisma` para adicionar o campo da alíquota do DAS
    (Discrição do Claude em D-03 — campo Decimal nullable, não Int, porque é percentual, não dinheiro):
    - Adicionar o campo escalar `aliquotaDasPercent Decimal?` com `@db.Decimal(5, 2)` (ex.: 6,00 até
      999,99 — folga suficiente para qualquer faixa do Simples) e um comentário explicando que é a
      alíquota percentual do DAS da empresa (null = ainda não definida, distinto de 0%). NÃO mudar
      nenhum outro campo de Empresa nem a convenção de centavos Int dos valores monetários — só a
      alíquota é Decimal.
    - NÃO adicionar relação nova; é um campo escalar puro.
    Gerar e aplicar a migração a partir do schema editado. Regras de conexão do projeto
    (.claude/CLAUDE.md): migrações SEMPRE pela conexão direta (DIRECT_URL, porta 5432), NUNCA pelo
    pooler (6543). Preferir `npx prisma migrate dev --name add_aliquota_das_percent` (usa a DIRECT_URL
    do datasource). Se o ambiente não tiver TTY interativo (pitfall do 04-02), usar a rota não-interativa:
    `npx prisma migrate dev --name add_aliquota_das_percent --create-only` para gerar o SQL, conferir que
    o SQL é só `ALTER TABLE "Empresa" ADD COLUMN "aliquotaDasPercent"` (sem DROP, sem alteração de linha),
    e então `npx prisma migrate deploy`. NUNCA usar a flag de banco-sombra apontada ao banco real
    (incidente 04-02 #3). Rodar `npx prisma generate` ao final para atualizar o client. NÃO alterar o
    seed — o campo nasce NULL para todas as empresas existentes (estado "não definido" correto de D-03).
  </action>
  <verify>
    <automated>grep -q "aliquotaDasPercent" prisma/schema.prisma && npx prisma validate && npx tsc --noEmit</automated>
  </verify>
  <done>`prisma/schema.prisma` tem `Empresa.aliquotaDasPercent` (Decimal nullable, sem default); `prisma validate` passa; a migração aditiva está em prisma/migrations e foi aplicada via DIRECT_URL (SQL apenas ADD COLUMN, nenhum DROP); `npx prisma generate` roda sem erro; `npx tsc --noEmit` limpo (o client regenerado reconhece o novo campo).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| operador → banco (migração) | Comandos de migração Prisma tocam o banco real; um banco-sombra mal apontado reseta dados |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04d-01 | Denial of Service (perda de dados) | prisma migrate (banco-sombra) | mitigate | Checkpoint de backup bloqueante (Task 1) + proibição explícita de apontar a flag de banco-sombra ao banco real (incidente 04-02 #3); migração só via DIRECT_URL |
| T-04d-02 | Tampering | migração aditiva | accept | Migração é puramente aditiva (coluna nullable); não há caminho de perda de dados existentes. Backup cobre o risco residual |
| T-04d-SC | Tampering | npm installs | accept | Nenhum pacote novo é instalado nesta fase (Decimal/Vitest/Recharts já presentes); nada a verificar |
</threat_model>

<verification>
- `grep aliquotaDasPercent prisma/schema.prisma` encontra o campo.
- `npx prisma validate` passa.
- `npx prisma migrate status` fica limpo (sem migrações pendentes).
- `npx tsc --noEmit` limpo após `prisma generate`.
- Backup confirmado pelo humano no checkpoint (Task 1) antes de qualquer comando de migração.
</verification>

<success_criteria>
- Checkpoint de backup aprovado antes da migração.
- `Empresa.aliquotaDasPercent` existe no schema e no banco (Decimal nullable, sem default).
- Migração aditiva aplicada via DIRECT_URL; nenhum dado perdido; seed inalterado.
- Prisma Client regenerado reconhece o campo (tsc limpo).
</success_criteria>

<output>
Create `.planning/phases/04d-consolidado-projecao/04d-01-SUMMARY.md` when done
</output>
