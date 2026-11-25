---
phase: 03b-casa-acompanhamento
plan: 01
type: execute
wave: 0
depends_on: []
files_modified:
  - prisma/schema.prisma
  - prisma/migrations/
  - prisma/seed.ts
autonomous: false
requirements: [CASA-R-02, CASA-R-04]
must_haves:
  truths:
    - "O banco é copiado (backup) antes de qualquer mudança destrutiva no schema"
    - "As tabelas PlanItem e WeeklySpend não existem mais no banco"
    - "Casa Transactions, Categories e MonthlyBudget continuam intactas após a migração"
    - "Existe um teto mensal opcional por categoria da Casa, guardado por (userId, mês, categoria)"
  artifacts:
    - path: "prisma/schema.prisma"
      provides: "Schema sem PlanItem/WeeklySpend; novo model CategoryBudget"
      contains: "model CategoryBudget"
    - path: "prisma/migrations/"
      provides: "Migração que dropa PlanItem+WeeklySpend e cria CategoryBudget"
      contains: "CategoryBudget"
  key_links:
    - from: "prisma/schema.prisma"
      to: "prisma/migrations/"
      via: "prisma migrate dev gera a migração a partir do schema editado"
      pattern: "CategoryBudget"
    - from: "CategoryBudget"
      to: "Category"
      via: "FK categoryId → Category.id (teto por categoria da Casa)"
      pattern: "categoryId.*Category"
---

<objective>
Wave 0 (fundação destrutiva) do rework da Casa, que é majoritariamente remoção + simplificação (D-01). Faz backup do banco, remove os modelos `PlanItem` e `WeeklySpend` (o modelo de planejamento semanal manual da Fase 3 que agora é descartado — D-05/CASA-R-04) e cria o modelo `CategoryBudget` que guarda o **teto mensal opcional por categoria** (D-03/CASA-R-02). Dados reais da Casa (Transactions, Categories, MonthlyBudget) são preservados — só os dados de plano (que são de teste) desaparecem junto com as tabelas.

Purpose: Preparar o schema para o modelo de acompanhamento. Esta é a única mudança IRREVERSÍVEL da fase (drop de tabelas), por isso roda isolada em Wave 0 com checkpoint de backup bloqueante antes da migração.

Output: `schema.prisma` sem PlanItem/WeeklySpend e com `CategoryBudget`; uma nova migração Prisma aplicada via DIRECT_URL; `seed.ts` revisado (continua sem referências aos modelos removidos).
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03b-casa-acompanhamento/03b-CONTEXT.md
@docs/superpowers/specs/2026-11-25-casa-acompanhamento-design.md
@.claude/CLAUDE.md
@prisma/schema.prisma
@prisma/seed.ts
@prisma/migrations/20261125191904_multi_empresa/migration.sql
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking-human">
  <name>Task 1: Checkpoint de backup antes da migração destrutiva (D-05)</name>
  <what-built>
    Nada foi alterado ainda. Esta é uma parada OBRIGATÓRIA antes de uma migração que
    REMOVE tabelas do banco (DROP TABLE "PlanItem" e DROP TABLE "WeeklySpend").
    A regra do projeto (.claude/CLAUDE.md) exige backup antes de qualquer mudança no
    banco que possa perder dados. Os dados de plano são de teste (lado Casa só tem o
    plano de teste), mas o backup protege Transactions/Categories/MonthlyBudget reais.
  </what-built>
  <how-to-verify>
    1. Faça um backup do banco Supabase AGORA (antes de autorizar):
       - Opção A (recomendada): Supabase Dashboard → Database → Backups → verifique o
         último backup automático, ou crie um on-demand se o plano permitir.
       - Opção B (dump manual via DIRECT_URL, porta 5432): rode um `pg_dump` da conexão
         DIRECT_URL para um arquivo .sql local. NÃO use a porta 6543 (pooler).
    2. Confirme que o backup existe e é recente.
    3. AVISO CRÍTICO ao executor: NUNCA aponte um comando de shadow-db do Prisma para o
       DATABASE_URL/DIRECT_URL reais — isso reseta o banco (já aconteceu antes). A
       migração desta fase usa apenas `prisma migrate dev` contra o DIRECT_URL do projeto.
    4. Responda "approved" só depois que o backup estiver confirmado.
  </how-to-verify>
  <resume-signal>Digite "approved" após confirmar o backup, ou descreva o que falta.</resume-signal>
</task>

<task type="auto">
  <name>Task 2: Editar schema — remover PlanItem/WeeklySpend, adicionar CategoryBudget</name>
  <files>prisma/schema.prisma</files>
  <action>
    Editar `prisma/schema.prisma` para o modelo de acompanhamento (D-05/CASA-R-04 remove; D-03/CASA-R-02 adiciona):

    1. Remover o `model PlanItem { ... }` inteiro (bloco atual com month/name/categoryId/valuePerCents/week1..4).
    2. Remover o `model WeeklySpend { ... }` inteiro (bloco atual com weekIndex/manualCents e o @@unique composto).
    3. No `model User`, remover as linhas de relação `planItems PlanItem[]` e `weeklySpends WeeklySpend[]`.
    4. No `model Category`, remover a linha de relação `planItems PlanItem[]`.
    5. Adicionar um novo modelo `CategoryBudget` que representa o teto mensal OPCIONAL por categoria da Casa (D-03): campos `id` (String @id @default(cuid())), `userId` (String) + relação `user User @relation(fields: [userId], references: [id])`, `month` (String, formato 'YYYY-MM'), `categoryId` (String) + relação `category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)`, `limitCents` (Int), `createdAt` (DateTime @default(now())), `updatedAt` (DateTime @updatedAt). Adicionar `@@unique([userId, month, categoryId])` — uma categoria tem no máximo um teto por mês. A ausência de linha significa "sem teto" (só mostra o gasto). Nunca bloqueia lançamento — é só referência.
    6. Adicionar as relações inversas: em `model User` a linha `categoryBudgets CategoryBudget[]`; em `model Category` a linha `categoryBudgets CategoryBudget[]`.

    Manter MonthlyBudget, Category, Transaction, FixedAccount, AnnualExpense, Goal, Empresa e os enums EXATAMENTE como estão. NÃO renomear `MonthlyBudget.ceilingCents` (será reutilizado como "dinheiro do mês" no Plano 02, sem rename — decisão reversível que evita migração de coluna de risco).
    Rodar `npx prisma format` para normalizar o schema após a edição.
  </action>
  <verify>
    <automated>grep -q "model CategoryBudget" prisma/schema.prisma && ! grep -q "model PlanItem" prisma/schema.prisma && ! grep -q "model WeeklySpend" prisma/schema.prisma && npx prisma validate</automated>
  </verify>
  <done>schema.prisma tem `model CategoryBudget` com @@unique([userId, month, categoryId]); não tem mais `model PlanItem` nem `model WeeklySpend`; `npx prisma validate` passa sem erros.</done>
</task>

<task type="auto">
  <name>Task 3: Gerar e aplicar a migração Prisma via DIRECT_URL + revisar seed</name>
  <files>prisma/migrations/, prisma/seed.ts</files>
  <action>
    Gerar a migração a partir do schema editado (D-05). Regras de conexão do projeto (.claude/CLAUDE.md): migrações SEMPRE pela conexão direta (DIRECT_URL, porta 5432), NUNCA pelo pooler (6543). O backup já foi confirmado no Task 1.

    1. Rodar `npx prisma migrate dev --name remove_planning_add_category_budget`. O Prisma CLI usa o DIRECT_URL automaticamente (datasource já tem `directUrl = env("DIRECT_URL")`). AVISO CRÍTICO: NUNCA passar `--shadow-database-url` apontando para o DATABASE_URL/DIRECT_URL real — isso resetaria o banco. Deixar o Prisma gerenciar o shadow db normalmente.
    2. Conferir que a migração gerada contém `DROP TABLE "PlanItem"`, `DROP TABLE "WeeklySpend"` e `CREATE TABLE "CategoryBudget"` com o índice único composto. Seguir o estilo das migrações hand-edit existentes (ver 20261125191904_multi_empresa) se precisar ajustar comentários, mas o DROP/CREATE padrão do Prisma basta aqui.
    3. Rodar `npx prisma generate` para atualizar o Prisma Client (o build já faz isso, mas rode agora para destravar os Planos 02/03).
    4. Abrir `prisma/seed.ts` e confirmar que ele NÃO referencia mais `planItem`/`weeklySpend` (hoje já não referencia — o seed cuida só de User, categorias da Casa e empresas). Se houver qualquer referência remanescente aos modelos removidos, retirá-la. Não adicionar seed de CategoryBudget — o teto nasce vazio e o usuário define (D-03).
    5. Preservação: a migração só dropa PlanItem/WeeklySpend. Confirmar que Transaction, Category, MonthlyBudget continuam no schema e não aparecem em nenhum DROP.
  </action>
  <verify>
    <automated>ls prisma/migrations | grep -q remove_planning_add_category_budget && grep -rq "CategoryBudget" prisma/migrations/*remove_planning_add_category_budget*/migration.sql && grep -rq 'DROP TABLE "PlanItem"' prisma/migrations/*remove_planning_add_category_budget*/migration.sql && grep -rq 'DROP TABLE "WeeklySpend"' prisma/migrations/*remove_planning_add_category_budget*/migration.sql</automated>
  </verify>
  <done>Existe uma pasta de migração `*_remove_planning_add_category_budget` cujo migration.sql dropa PlanItem e WeeklySpend e cria CategoryBudget; a migração foi aplicada no banco via DIRECT_URL; `prisma generate` rodou; nenhum DROP toca Transaction/Category/MonthlyBudget; seed.ts sem referências aos modelos removidos.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| CLI → banco de produção | `prisma migrate dev` executa DDL destrutivo (DROP TABLE) contra o banco real via DIRECT_URL |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03b-01 | Denial (perda de dados) | DROP TABLE PlanItem/WeeklySpend | mitigate | Checkpoint de backup bloqueante (Task 1) antes de qualquer DDL; migração só dropa as 2 tabelas, nenhum DROP toca Transaction/Category/MonthlyBudget |
| T-03b-02 | Tampering (reset acidental) | shadow-db do Prisma apontado ao banco real | mitigate | Instrução explícita em Task 1 e Task 3: nunca passar --shadow-database-url para DATABASE_URL/DIRECT_URL; usar apenas `prisma migrate dev` com o shadow db gerenciado pelo Prisma |
| T-03b-03 | Elevation (conexão errada) | migração pelo pooler 6543 trava/corrompe | mitigate | DIRECT_URL (5432) é obrigatório para migrações; datasource já configurado com directUrl |
</threat_model>

<verification>
- `npx prisma validate` passa.
- `npx prisma migrate status` mostra a nova migração aplicada e sem drift.
- `npm test` continua verde para os testes que não dependem dos modelos removidos (os testes de plano serão removidos no Plano 02).
- Inspeção manual: a migração contém exatamente os DROP das 2 tabelas e o CREATE de CategoryBudget.
</verification>

<success_criteria>
- Backup confirmado antes da migração (checkpoint aprovado).
- schema.prisma sem PlanItem/WeeklySpend, com CategoryBudget.
- Migração aplicada via DIRECT_URL; Transactions/Categories/MonthlyBudget preservadas.
- Prisma Client regenerado.
</success_criteria>

<output>
Create `.planning/phases/03b-casa-acompanhamento/03b-01-SUMMARY.md` when done
</output>
