# Phase 4 (Fatia 1): Fundação multi-empresa — Research

**Researched:** 2026-11-25
**Domain:** Prisma schema migration (enum → entity) on Supabase Postgres + Next.js 15 App Router (Server Actions, Zustand store, shadcn DropdownMenu)
**Confidence:** HIGH (codebase-grounded) / MEDIUM (external migration + NULL-uniqueness findings)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Escopo**
- **D-01:** Fatia de fundação conforme o Phase Boundary. Entregar a base utilizável (criar empresa, selecioná-la, lançar nela) **sem** os cálculos de P&L nem as telas de pró-labore/consolidado/projeção/dívidas.

**Tipos de empresa**
- **D-02:** Tipos **fixos pré-definidos**: **Afiliado**, **Jurídico/Serviços**, **Infoproduto**, **Genérico**. Cada empresa escolhe um no cadastro. Nesta fatia o tipo é um campo armazenado que também determina o conjunto de categorias padrão (D-04); os módulos específicos por tipo (ROAS/anúncios/recorrência) entram nas fatias de P&L — **não aqui**.

**Cadastro da empresa**
- **D-03:** Campos ao criar: **nome**, **tipo**, **cor**. CNPJ opcional/adiado (não aparece no form desta fatia). CRUD completo. Remover empresa segue o padrão de proteção das categorias (D-08 da Fase 2): bloquear/alertar se houver lançamentos vinculados.

**Categorias por empresa**
- **D-04:** Cada empresa tem **suas próprias** categorias de receita e custo (não compartilhadas), semeadas com um **conjunto padrão** ao criar — custos típicos: imposto, funcionário, ferramentas, anúncios, investimento; receitas conforme o tipo. Editáveis por empresa.

**Seed de empresas**
- **D-05:** Começa com **3 empresas pré-cadastradas**: **Elite Juris** (Jurídico/Serviços), **Achadinhos** (Afiliado), **Infoproduto** (Infoproduto) — cada uma com suas categorias padrão. Via seed re-executável / getOrSeed (mesmo padrão da Fase 3).

**Seletor / navegação**
- **D-06:** **Dropdown no topo**: "Casa | Elite Juris | Achadinhos | Infoproduto", cada item com sua cor. Substitui o toggle Casa/Empresa atual. O store Zustand `contaAtiva` deixa de ser o enum `CASA | EMPRESA` e passa a representar **Casa ou uma empresa específica** (ex.: `{ tipo: 'CASA' } | { tipo: 'EMPRESA', empresaId }`). Todas as telas filtram pelo contexto ativo. `mesSelecionado` é preservado ao trocar de contexto.

**Migração de dados**
- **D-07:** Lado Empresa **vazio** (confirmado) → **recomeço limpo**, com **backup antes** (regra do CLAUDE.md). Dados da Casa (Fases 2/3) **preservados**. `Transaction` e `Category` passam a referenciar a empresa (ex.: `empresaId` nullable, `null` = Casa) em vez do valor `EMPRESA` do enum. Forma exata do schema fica para pesquisa/planejamento.

### Claude's Discretion
- Forma exata do schema: modelo `Empresa` (nome, tipo, cor, userId); como `Transaction`/`Category` representam Casa vs empresa (`empresaId` nullable vs tabela de contas); o que acontece com o enum `ContaType`.
- Representação do contexto ativo no store (`contaAtiva` → Casa | empresaId) e como o `mesSelecionado` se combina.
- Proteção ao remover empresa (seguir D-08 da Fase 2).
- Layout do dropdown e das telas de CRUD de empresa (seguir os padrões de UI existentes; UI-SPEC já aprovado).

### Deferred Ideas (OUT OF SCOPE)
- **P&L por empresa** — faturamento bruto/líquido, lucro, módulos específicos por tipo (comissões/anúncios/ROAS para Afiliado; recorrência+projetos para Jurídico; vendas/plataforma para Infoproduto).
- **Pró-labore multi-origem → renda familiar** — transferência de cada empresa marcando origem + visão geral da família.
- **Consolidado das empresas** e **projeção** de caixa (3–6 meses) com alerta de saldo negativo.
- **Dívidas** (Pronampe, Simples parcelado) e **impostos/DAS** por empresa.
- Decisões de produto adiadas: regime tributário por empresa; dona de cada dívida; mecânica de "aplicar" o pró-labore; conteúdo exato da tela de renda familiar e consolidado.
- Cauda: **multiusuário** (logins separados) e **orçamento individual por pessoa**.
</user_constraints>

## Summary

Esta fatia é majoritariamente **migração de modelo de dados + refactor de contexto ativo**, com pouca superfície externa nova. O risco concentra-se num único ponto: **substituir o enum `ContaType` por uma entidade `Empresa` real preservando os dados da Casa**. Como o lado Empresa está vazio (D-07 confirmado), a migração é um **recomeço limpo do lado Empresa**: as linhas antigas com `account = 'EMPRESA'` em `Category` e `Transaction` podem ser descartadas e as linhas `CASA` permanecem (viram `empresaId = NULL`). Isso evita qualquer backfill complexo de mapeamento empresa↔lançamento.

A forma recomendada é: adicionar `model Empresa`, adicionar coluna **`empresaId` nullable** em `Category` e `Transaction` (`null` = Casa), e **remover o enum `ContaType`**. A migração deve ser gerada com `prisma migrate dev --create-only` e ter o SQL **hand-editado** porque (a) o cast enum→nada e o drop do enum type precisam de ordem correta e (b) o novo `@@unique` de categoria por empresa tem um comportamento perigoso de NULL no Postgres (ver Pitfall 1 — o achado mais importante desta pesquisa). O restante (dropdown, CRUD, seed, categorias por empresa, filtro de contexto) reaproveita integralmente padrões já construídos nas Fases 2/3: Sheet+Dialog, add-card, getOrSeed, Server Action `parse → service → revalidatePath`, store Zustand persistido.

**Primary recommendation:** Modelar `Empresa` + `empresaId String?` em `Category`/`Transaction` (null = Casa), remover `ContaType`, e migrar com `--create-only` + SQL hand-editado que (1) descarta linhas EMPRESA antigas, (2) resolve a unicidade de categoria da Casa com **NULLS NOT DISTINCT** (Postgres 15+ do Supabase) em vez de confiar no `@@unique` padrão do Prisma, e (3) faça backup (`pg_dump` / snapshot Supabase) antes. Tudo rodando via **DIRECT_URL (porta 5432)**.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Entidade `Empresa` + migração `ContaType`→`empresaId` | Database / Storage | API/Backend (Prisma schema) | É uma mudança de esquema; a integridade (FK, unique, backup) vive no Postgres |
| CRUD de empresa (criar/editar/excluir + proteção) | API/Backend (Server Actions + service) | Frontend Server (Server Component lista) | Mutação de dados → Server Action; a regra de bloqueio por lançamentos vive no service |
| Seed das 3 empresas + categorias por tipo | Database / Storage (seed script) + API/Backend (getOrSeed) | — | Seed CLI roda via DIRECT_URL; getOrSeed garante idempotência no runtime |
| Categorias de receita/custo por empresa | API/Backend (service + Server Action) | Frontend Server (lista) | Reaproveita o service de categorias da Fase 2, agora escopado por empresa |
| Seletor dropdown "Casa + empresas" | Browser / Client | — | Interação (abrir/selecionar) + leitura do store Zustand → Client Component `'use client'` |
| Contexto ativo (`contaAtiva` Casa\|empresaId) | Browser / Client (Zustand + localStorage) | Frontend Server (páginas leem o filtro) | Estado de UI persistido no navegador; as páginas Server leem o filtro via searchParams/props |
| Filtro de lançamentos/visão geral por empresa | Frontend Server (Server Component loader) | Database (query `where empresaId`) | O loader já filtra por `account`; passa a filtrar por `empresaId` |

## Standard Stack

Nenhum pacote novo de runtime. O único componente novo é o **DropdownMenu** do registry oficial shadcn (que puxa `@radix-ui/react-dropdown-menu`, já ecossistema das Fases 1–3).

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma / @prisma/client | ^6.19.3 (instalado) | ORM + runner de migração | Já em uso; migração de enum→relação é workflow documentado via `--create-only` [CITED: prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations] |
| Next.js | 15.x (instalado) | Server Actions + Server/Client Components | Já em uso; Server Actions para CRUD, Server Components para listas |
| Zustand | ^5.0.16 (instalado) | Store do contexto ativo (`contaAtiva`) | Já em uso com `persist` → localStorage; só muda a forma do estado [VERIFIED: package.json] |
| zod | ^3.25.76 (instalado) | Validação compartilhada form/Server Action | Já é o padrão dos schemas da Fase 2 [VERIFIED: package.json] |
| Supabase Postgres | gerenciado (PG 15+) | Banco | Já em uso; PG 15+ habilita `NULLS NOT DISTINCT` (necessário — ver Pitfall 1) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dropdown-menu | 2.2.x (via shadcn add) | Primitiva do dropdown "Casa + empresas" | Instalado quando rodar `npx shadcn@latest add dropdown-menu` [VERIFIED: npm view @radix-ui/react-dropdown-menu version → 2.2.1] |
| react-hook-form | ^7.91.0 (instalado) | Estado do form do Sheet de empresa | Reaproveita o padrão do TransactionSheet da Fase 2 |
| date-fns | ^3.6.0 (instalado) | (sem uso novo nesta fatia — sem campos de data próprios) | — |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `empresaId String?` (null = Casa) em Category/Transaction | Tabela genérica `Account` (Casa como linha real) + FK não-nullable | Tabela `Account` elimina o problema de NULL-uniqueness (Pitfall 1) e simplifica o `@@unique`, mas é mais invasiva: toca mais código, e a Casa tem semântica distinta (orçamento/semanas/metas) que o design quer manter separada. **Recomendado: `empresaId` nullable** por aderência à D-07 + menor superfície, resolvendo o NULL com SQL. |
| Remover o enum `ContaType` | Manter `ContaType` e adicionar `empresaId` em paralelo | Manter o enum cria dois eixos de verdade (account + empresaId) e drift garantido. **Recomendado: remover `ContaType`** — lado Empresa vazio permite drop limpo. |
| Seed idempotente via getOrSeed (service) | Seed só via `prisma/seed.ts` CLI | O CLI cobre o ambiente do Thaylan; o getOrSeed cobre "criar empresa nova em runtime já com categorias". **Recomendado: ambos** — CLI semeia as 3 empresas iniciais, getOrSeed semeia categorias a cada empresa criada. |

**Installation:**
```bash
# Único componente novo — registry oficial shadcn (sem gate de terceiros)
npx shadcn@latest add dropdown-menu
```

**Version verification:**
```bash
npm view @radix-ui/react-dropdown-menu version   # → 2.2.1 (verificado nesta sessão)
# Prisma/Next/Zustand/zod já instalados — ver package.json
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| @radix-ui/react-dropdown-menu | npm | maduro (Radix, anos) | milhões/semana | github.com/radix-ui/primitives | OK | Approved — instalado automaticamente pelo `shadcn add dropdown-menu`; já é o ecossistema Radix das Fases 1–3 |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

Nenhum pacote novo além do que o registry **oficial** shadcn puxa. O `shadcn add dropdown-menu` copia o componente para `src/components/ui/` (sem version-lock de terceiros). Gate de vetting não aplicável.

## Architecture Patterns

### System Architecture Diagram

```
                         ┌─────────────────────────────────────────┐
  Usuário troca contexto │  DropdownMenu "Casa + empresas"          │
  no topo (mobile/desktop│  (Client Component, 'use client')        │
         )               │  lê/escreve contaAtiva no Zustand+persist│
                         └───────────────┬─────────────────────────┘
                                         │ seta contaAtiva = {CASA} | {EMPRESA, empresaId}
                                         ▼
                         ┌─────────────────────────────────────────┐
                         │  Páginas authed (Server Components)      │
                         │  lancamentos / visao-geral               │
                         │  recebem o contexto (searchParams/props) │
                         └───────────────┬─────────────────────────┘
                                         │ loader(userId, month, empresaId|null)
                                         ▼
        ┌────────────────────────────────────────────────────────────────┐
        │  Prisma (DIRECT_URL migrations / pooler runtime)                 │
        │                                                                  │
        │  model Empresa ──1:N──> Category (empresaId null = Casa)         │
        │        │                   │                                     │
        │        └──1:N──> Transaction (empresaId null = Casa)             │
        └──────────────────────────────┬───────────────────────────────── ┘
                                        │
        criar empresa ─► Server Action ─► service.createEmpresa           │
                           parse(zod)      └─► getOrSeedCategorias(tipo) ──┘
                                        │
        excluir empresa ─► Server Action ─► service.deleteEmpresa
                           (conta Transaction por empresaId; bloqueia se > 0 — D-08)

        seed CLI (prisma/seed.ts) ─► upsert 3 empresas + categorias por tipo (DIRECT_URL)
```

### Recommended Project Structure
```
prisma/
├── schema.prisma               # + model Empresa; empresaId String? em Category/Transaction; remover ContaType
├── migrations/
│   └── <ts>_multi_empresa/     # gerada com --create-only, SQL hand-editado
└── seed.ts                     # + upsert das 3 empresas + categorias por tipo (idempotente)

src/
├── store/
│   └── conta.ts                # contaAtiva: {tipo:'CASA'} | {tipo:'EMPRESA', empresaId}; migrar persist
├── components/ui/
│   └── dropdown-menu.tsx       # novo (shadcn add)
├── lib/
│   └── empresa-cores.ts        # (opção) mapa das 6 cores da paleta fixa (UI-SPEC §Color)
└── app/(authed)/
    ├── empresas/               # NOVA rota CRUD (acessada via "Gerenciar empresas")
    │   ├── page.tsx            # Server Component: lista empresas + categorias por empresa
    │   ├── _components/        # EmpresaSheet, EmpresaCard, DeleteEmpresaDialog, ColorPicker
    │   └── _lib/
    │       ├── schema.ts       # empresaSchema (nome/tipo/cor) — zod
    │       ├── service.ts      # create/update/deleteEmpresa + getOrSeedCategorias (funções puras testáveis isoladas)
    │       ├── actions.ts      # Server Actions thin: parse → service → revalidatePath
    │       └── loader.ts       # getEmpresas(userId) para Server Components
    ├── _components/
    │   └── ContaSelector.tsx   # NOVO dropdown global (substitui AccountSelector/AccountFilterToggle)
    ├── lancamentos/            # loader/schema passam a usar empresaId em vez de account
    └── visao-geral/            # AccountSelector → ContaSelector
```

### Pattern 1: Migração data-preserving via `--create-only` + SQL hand-editado
**What:** Gerar a migração sem aplicar, editar o SQL à mão, depois aplicar.
**When to use:** Sempre que a mudança de esquema (a) precisa preservar dados, (b) precisa de ordem de operações específica (drop de enum type), ou (c) precisa de SQL que o Prisma não gera (NULLS NOT DISTINCT).
**Example:**
```bash
# 1) Editar schema.prisma (add Empresa, empresaId, remover ContaType)
# 2) Gerar SEM aplicar — sempre via DIRECT_URL (porta 5432)
npx prisma migrate dev --create-only --name multi_empresa
# 3) Editar prisma/migrations/<ts>_multi_empresa/migration.sql à mão (ver Code Examples)
# 4) BACKUP ANTES de aplicar (regra CLAUDE.md) — ver Pitfall 3
# 5) Aplicar
npx prisma migrate dev           # local
# produção: npx prisma migrate deploy
```
`// Source: prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations`

### Pattern 2: Contexto ativo discriminated-union no Zustand (migração do persist)
**What:** `contaAtiva` deixa de ser `'CASA' | 'EMPRESA'` e vira `{ tipo: 'CASA' } | { tipo: 'EMPRESA', empresaId: string }`.
**When to use:** Store já persistido em localStorage com a forma antiga — precisa de `version` + `migrate` no middleware `persist` para não quebrar sessões existentes.
**Example:**
```typescript
// src/store/conta.ts
type ContaAtiva = { tipo: 'CASA' } | { tipo: 'EMPRESA'; empresaId: string }

export const useContaStore = create<ContaStore>()(
  persist(
    (set) => ({
      contaAtiva: { tipo: 'CASA' },
      mesSelecionado: new Date().toISOString().slice(0, 7),
      setContaAtiva: (c) => set({ contaAtiva: c }),
      setMesSelecionado: (m) => set({ mesSelecionado: m }),
    }),
    {
      name: 'duas-contas-store',
      version: 1,                     // era 0 (implícito)
      migrate: (persisted: any, version) => {
        if (version === 0) {
          // 'CASA' | 'EMPRESA' antigo → nova forma; 'EMPRESA' cai para Casa
          const old = persisted?.contaAtiva
          persisted.contaAtiva =
            old === 'EMPRESA' ? { tipo: 'CASA' } : { tipo: 'CASA' }
        }
        return persisted
      },
    }
  )
)
```
`// Source: Zustand persist middleware (version/migrate) — padrão do store atual src/store/conta.ts`

### Pattern 3: getOrSeed de categorias por tipo (reaproveita getOrCreatePlan da Fase 3)
**What:** Ao criar uma empresa, semear o conjunto padrão de categorias do seu tipo, idempotente.
**When to use:** Criação de empresa (runtime) e seed CLI.
**Example:** ver Code Examples abaixo. Espelha `getOrCreatePlan` (planejamento/_lib/service.ts) e o `upsert` do `prisma/seed.ts`.

### Anti-Patterns to Avoid
- **Confiar no `@@unique([name, empresaId, userId])` do Prisma para unicidade da Casa:** como `empresaId` é NULL para Casa e o Postgres trata NULL como distinto, **duas categorias "Alimentação" da Casa passariam** (ver Pitfall 1). O `upsert` do seed de Casa quebra.
- **Rodar `prisma migrate` contra a porta 6543 (pooler):** trava indefinidamente (advisory lock no PgBouncer). Sempre DIRECT_URL/5432 (CLAUDE.md).
- **`onDelete: Cascade` de Empresa → Transaction:** contradiz a proteção D-08/D-03 (bloquear exclusão com lançamentos). Use `Restrict` e conte os lançamentos no service antes de excluir.
- **Deixar o enum `ContaType` "só por garantia":** cria dois eixos de verdade. Remover de vez.
- **`'use client'` na página `/empresas` inteira:** só o `ContaSelector`, o `EmpresaSheet` e o `ColorPicker` precisam; a lista é Server Component.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Menu acessível com teclado/foco/portal | Dropdown custom com `useState` + `onClick` fora | shadcn `DropdownMenu` (Radix) | Radix entrega role=menu, setas/Enter/Esc, `aria-haspopup`/`aria-expanded`, focus trap [CITED: ui.shadcn.com/docs/components/dropdown-menu] |
| Preservar dados numa mudança de coluna | `ALTER TABLE` improvisado no console | `migrate dev --create-only` + SQL versionado | Mantém o histórico de migração sem drift; reproduzível em produção [CITED: prisma.io customizing-migrations] |
| Unicidade de categoria da Casa (empresaId NULL) | Checar duplicata no código antes de inserir | `UNIQUE ... NULLS NOT DISTINCT` (PG15) ou índice parcial | O banco é a única fonte de verdade confiável sob concorrência; checagem no app tem race condition |
| Migrar o shape do store persistido | Limpar localStorage do usuário | `persist` `version` + `migrate` | Não perde `mesSelecionado` nem força re-login/re-setup |
| Proteção de exclusão (contar vínculos) | Reinventar | `prisma.transaction.count({ where: { empresaId } })` — padrão D-08 já no deleteCategoryService | Padrão testado da Fase 2 |

**Key insight:** O trabalho desta fatia é 90% reaproveitamento de padrões já construídos (Fase 2 CRUD/categorias, Fase 3 seed). O único problema genuinamente novo e sutil é a **semântica de NULL em unique index do Postgres** — tudo mais é aplicar padrões existentes a uma nova entidade.

## Runtime State Inventory

> Esta fatia é uma migração de modelo de dados (enum → entidade). Inventário obrigatório.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | (1) `Category` com `account='EMPRESA'` — 5 linhas de seed (`Fornecedores, Anúncios, Taxas e impostos, Pró-labore, Outros`), marcadas `isDefault=true`, **sem lançamentos** (lado Empresa vazio, D-07). (2) `Transaction` com `account='EMPRESA'` — **0 linhas** (confirmado). (3) `Category`/`Transaction` com `account='CASA'` — **preservar** (viram `empresaId=NULL`). | **Data migration:** no SQL hand-editado, (a) `DELETE FROM "Category" WHERE account='EMPRESA'` (descarta seed Empresa antigo), (b) adicionar `empresaId` NULL às linhas CASA restantes (default NULL já cobre), (c) dropar a coluna `account` e o type `ContaType`. **Code edit:** loader/schema/actions de lançamentos trocam `account` por `empresaId`. |
| **Live service config** | Nenhuma. Não há n8n/Datadog/serviços externos que armazenem "EMPRESA"/"CASA" — app self-contained no Supabase. | None — verificado: não há integrações externas no repo. |
| **OS-registered state** | Nenhuma. Sem cron/Task Scheduler que referencie o enum (o keep-alive cron da Fase 1 bate num health endpoint, não conhece `ContaType`). | None — verificado via ausência de referências a `ContaType` fora de prisma/src. |
| **Secrets/env vars** | `SEED_USER_ID` (usado pelo seed). `DATABASE_URL` (6543) / `DIRECT_URL` (5432). Nenhum referencia o enum. | None — chaves inalteradas; o seed passa a criar empresas além de categorias. |
| **Build artifacts** | `@prisma/client` gerado embute o enum `ContaType` e os tipos `account`. Após mudar o schema, o client **precisa ser regenerado** (`prisma generate`, já no `postinstall` e no `build`). O store persistido `duas-contas-store` no localStorage do navegador carrega a forma antiga de `contaAtiva`. | **Code edit:** `prisma generate` após a migração; `persist` `version`+`migrate` no store (Pattern 2). |

**Canonical question — após todos os arquivos atualizados, o que ainda guarda o enum antigo?** O `@prisma/client` gerado (resolvido por `prisma generate`) e o `localStorage` do navegador (resolvido pela migração do `persist`). Ambos cobertos acima.

## Common Pitfalls

### Pitfall 1: `@@unique` com `empresaId` nullable NÃO garante unicidade da Casa (o achado crítico)
**What goes wrong:** Trocar `@@unique([name, account, userId])` por `@@unique([name, empresaId, userId])` parece equivalente, mas para a Casa `empresaId=NULL`. O Postgres, por padrão, trata cada NULL como **distinto** num unique index. Resultado: duas categorias "Alimentação" da Casa passam a conviver, e o `upsert` idempotente do seed de Casa (que usa a chave composta) **deixa de funcionar** (nunca "encontra" a linha existente → cria duplicatas a cada seed).
**Why it happens:** Semântica SQL padrão de NULL em unique index (`NULLS DISTINCT`). O `@@unique` do Prisma gera exatamente esse índice padrão; o Prisma **não** expressa `NULLS NOT DISTINCT` no schema. [CITED: postgresql.org feature matrix — "unique-nulls-not-distinct"; prisma issue #3197]
**How to avoid:** No SQL hand-editado da migração, criar o índice da Casa+empresa como `CREATE UNIQUE INDEX "Category_name_empresaId_userId_key" ON "Category"("name","empresaId","userId") NULLS NOT DISTINCT;` (Supabase roda Postgres 15+). Alternativas: (a) tornar a Casa uma entidade real (empresaId nunca NULL), ou (b) dois índices parciais (`WHERE empresaId IS NULL` / `WHERE empresaId IS NOT NULL`). **Recomendado: `NULLS NOT DISTINCT`** — uma linha de SQL, mantém `empresaId` nullable (D-07).
**Warning signs:** Rodar o seed duas vezes cria categorias de Casa duplicadas; teste de idempotência do seed falha.

### Pitfall 2: `prisma migrate` travando no pooler
**What goes wrong:** Migração "pendura" sem erro.
**Why it happens:** PgBouncer em modo transaction (porta 6543) bloqueia advisory locks que o Prisma Migrate usa. [CITED: CLAUDE.md §What NOT to Use]
**How to avoid:** Toda migração e o seed usam **DIRECT_URL / porta 5432** (o `prisma/seed.ts` já força `DATABASE_URL = DIRECT_URL`). Garantir o mesmo no runbook de migração.
**Warning signs:** Comando sem saída por > 30s.

### Pitfall 3: Migração destrutiva sem backup
**What goes wrong:** `DROP` de coluna/enum e `DELETE` de linhas EMPRESA sem rede de segurança — viola a regra do CLAUDE.md ("nunca apague dados sem backup").
**Why it happens:** `migrate dev` roda o SQL direto.
**How to avoid:** **Antes** de aplicar: (a) snapshot do projeto Supabase (dashboard → Database → Backups) **e/ou** (b) `pg_dump` via DIRECT_URL para um arquivo local. Documentar o comando exato no plano e exigir confirmação humana (checkpoint) antes do `migrate`. A fatia deve ter uma task `checkpoint:human-verify` "backup feito" antes da task de migração.
**Warning signs:** —

### Pitfall 4: Client Prisma desatualizado após mudar o schema
**What goes wrong:** Tipos TS ainda mostram `account: ContaType`; código novo não compila ou usa campo inexistente.
**Why it happens:** `@prisma/client` é gerado; não acompanha o `.prisma` automaticamente em dev até `generate`.
**How to avoid:** `npx prisma generate` logo após editar o schema (antes de escrever código que usa `empresa`/`empresaId`). Já está em `postinstall`/`build`.
**Warning signs:** `Property 'empresa' does not exist on type PrismaClient`.

### Pitfall 5: Store persistido quebra ao mudar a forma de `contaAtiva`
**What goes wrong:** Usuário com `duas-contas-store` antigo (`contaAtiva: 'CASA'`) recebe `undefined.tipo` ao renderizar o dropdown.
**Why it happens:** `persist` reidrata a forma antiga do localStorage.
**How to avoid:** `version: 1` + `migrate` no middleware (Pattern 2).
**Warning signs:** `Cannot read properties of string` no primeiro render pós-deploy.

### Pitfall 6: Timezone drift em datas (herdado)
**What goes wrong:** Lançamento aparece no dia errado.
**Why it happens:** `new Date("YYYY-MM-DD")` interpreta UTC.
**How to avoid:** Já resolvido — services usam `parseISO` (date-fns) e `@db.Date`. Manter o padrão ao escrever lançamentos por empresa.

## Code Examples

### Migração hand-editada (esqueleto do migration.sql)
```sql
-- Source: padrão prisma customizing-migrations + postgresql NULLS NOT DISTINCT
-- prisma/migrations/<ts>_multi_empresa/migration.sql

-- 1) Nova entidade Empresa
CREATE TYPE "EmpresaTipo" AS ENUM ('AFILIADO','JURIDICO_SERVICOS','INFOPRODUTO','GENERICO');
CREATE TABLE "Empresa" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "tipo" "EmpresaTipo" NOT NULL,
  "cor" TEXT NOT NULL,                       -- chave da paleta fixa (ex.: 'laranja')
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2) Lado Empresa é vazio (D-07): descartar o seed antigo de categorias EMPRESA
DELETE FROM "Category" WHERE "account" = 'EMPRESA';
-- (Transaction EMPRESA já é 0 linhas — nada a apagar)

-- 3) Adicionar empresaId nullable (NULL = Casa) e FK Restrict
ALTER TABLE "Category"    ADD COLUMN "empresaId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "empresaId" TEXT;
ALTER TABLE "Category"    ADD CONSTRAINT "Category_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4) Novo unique da categoria — NULLS NOT DISTINCT para a Casa (Pitfall 1!)
DROP INDEX "Category_name_account_userId_key";
CREATE UNIQUE INDEX "Category_name_empresaId_userId_key"
  ON "Category"("name","empresaId","userId") NULLS NOT DISTINCT;

-- 5) Remover o eixo antigo
ALTER TABLE "Category"    DROP COLUMN "account";
ALTER TABLE "Transaction" DROP COLUMN "account";
DROP TYPE "ContaType";
```

### Schema Prisma proposto (trechos)
```prisma
// Source: schema atual + D-02/D-03/D-07
enum EmpresaTipo { AFILIADO JURIDICO_SERVICOS INFOPRODUTO GENERICO }

model Empresa {
  id           String        @id @default(cuid())
  user         User          @relation(fields: [userId], references: [id])
  userId       String
  nome         String
  tipo         EmpresaTipo
  cor          String        // chave da paleta fixa (UI-SPEC)
  categories   Category[]
  transactions Transaction[]
  createdAt    DateTime      @default(now())

  @@unique([nome, userId])   // nome de empresa único por usuário
}

model Category {
  id           String        @id @default(cuid())
  name         String
  empresa      Empresa?      @relation(fields: [empresaId], references: [id])
  empresaId    String?       // null = Casa
  user         User          @relation(fields: [userId], references: [id])
  userId       String
  transactions Transaction[]
  planItems    PlanItem[]
  isDefault    Boolean       @default(false)
  createdAt    DateTime      @default(now())
  // NOTA: o @@unique abaixo NÃO cobre a Casa (empresaId null) sozinho —
  // o índice real é criado com NULLS NOT DISTINCT no SQL hand-editado (Pitfall 1).
  @@unique([name, empresaId, userId])
}
// Transaction: trocar `account ContaType` por `empresa Empresa? @relation(...)` + `empresaId String?`
```

### getOrSeed de categorias por tipo (service — função pura + persistência)
```typescript
// Source: espelha getOrCreatePlan (planejamento/_lib/service.ts) e upsert do seed
export const CUSTOS_PADRAO = ['Imposto','Funcionário','Ferramentas','Anúncios','Investimento'] as const

export function receitasPorTipo(tipo: EmpresaTipo): string[] {
  switch (tipo) {
    case 'AFILIADO':          return ['Comissões']
    case 'JURIDICO_SERVICOS': return ['Recorrência', 'Projetos']
    case 'INFOPRODUTO':       return ['Vendas']
    default:                  return ['Receita']          // GENERICO
  }
}

// categorias padrão (nome + se é receita/custo) — PURA, testável sem Prisma
export function categoriasPadrao(tipo: EmpresaTipo) {
  return [
    ...receitasPorTipo(tipo).map((name) => ({ name, kind: 'RECEITA' as const })),
    ...CUSTOS_PADRAO.map((name) => ({ name, kind: 'CUSTO' as const })),
  ]
}

// persistência idempotente ao criar empresa
export async function getOrSeedCategorias(userId: string, empresaId: string, tipo: EmpresaTipo) {
  for (const c of categoriasPadrao(tipo)) {
    await prisma.category.upsert({
      where: { name_empresaId_userId: { name: c.name, empresaId, userId } },
      update: {},
      create: { name: c.name, empresaId, userId, isDefault: true },
    })
  }
}
```

### Proteção de exclusão (reaproveita D-08)
```typescript
// Source: deleteCategoryService (lancamentos/_lib/service.ts) — mesmo padrão
export async function deleteEmpresaService(id: string, userId: string) {
  const empresa = await prisma.empresa.findFirst({ where: { id, userId } })
  if (!empresa) throw new Error('Empresa não encontrada.')
  const count = await prisma.transaction.count({ where: { empresaId: id, userId } })
  if (count > 0) {
    const w = count === 1 ? 'lançamento' : 'lançamentos'
    throw new Error(`A empresa tem ${count} ${w} vinculado(s).`) // UI-SPEC Caso B
  }
  // sem lançamentos: apaga categorias da empresa + a empresa, atomicamente
  return prisma.$transaction(async (tx) => {
    await tx.category.deleteMany({ where: { empresaId: id, userId } })
    await tx.empresa.delete({ where: { id } })
  })
}
```

### Categoria: distinguir receita vs custo (kind)
```prisma
// A UI-SPEC §3 separa "Receitas" e "Custos". Category hoje não tem esse eixo.
// Recomendado: adicionar enum CategoryKind { RECEITA CUSTO } a Category,
// nullable/default para não quebrar as categorias da Casa (que não usam o eixo).
enum CategoryKind { RECEITA CUSTO }
// Category: + kind CategoryKind?   (null para Casa; setado para categorias de empresa)
```
> **Open Question (ver abaixo):** confirmar se `kind` é obrigatório para empresa nesta fatia ou se "Receitas/Custos" na UI deriva do `type` do lançamento. A UI-SPEC lista grupos "Receitas"/"Custos" na gestão de categorias → sugere um campo persistido `kind`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `account ContaType` (CASA/EMPRESA) em Category/Transaction | `empresaId String?` + entidade `Empresa` (null = Casa) | Esta fatia | Permite N empresas; Casa continua conceito próprio |
| Toggle Casa/Empresa (botões) | `DropdownMenu` "Casa + empresas" global | Esta fatia | Troca contexto em todas as telas |
| `contaAtiva: 'CASA'|'EMPRESA'` | `contaAtiva: {tipo:'CASA'} | {tipo:'EMPRESA',empresaId}` | Esta fatia | Store persistido precisa de `version`+`migrate` |
| Unique index padrão (NULLS DISTINCT) | `NULLS NOT DISTINCT` para a Casa | PG15 (Supabase atual) | Única forma de o `@@unique` da categoria funcionar com empresaId nullable |

**Deprecated/outdated:**
- `AccountSelector.tsx` (visao-geral) e `AccountFilterToggle.tsx` (lancamentos): substituídos pelo `ContaSelector` (dropdown). Remover após migrar os consumidores.
- Enum `ContaType`: removido.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Supabase roda Postgres 15+ (necessário para `NULLS NOT DISTINCT`) | Pitfall 1, Code Examples | Se < 15, usar índices parciais ou Casa-como-entidade. **Confirmar versão no dashboard Supabase antes de planejar o SQL.** |
| A2 | `Transaction` com `account='EMPRESA'` tem 0 linhas (D-07 confirmado pelo Thaylan) | Runtime State Inventory | Se houver linhas, o `DELETE`/drop perde dados reais — o backup (Pitfall 3) é a rede. Verificar `SELECT count(*) WHERE account='EMPRESA'` antes. |
| A3 | Categoria precisa de um campo `kind` (RECEITA/CUSTO) persistido para a UI "Receitas/Custos" | Code Examples (CategoryKind), Open Questions | Se derivar do `type` do lançamento, o schema não muda; mas a UI-SPEC lista os dois grupos na gestão de categorias (sem lançamento), sugerindo campo persistido. **Decisão de planejamento.** |
| A4 | As 6 cores da paleta são armazenadas como chave string (ex.: 'laranja'), não hex | Schema (`cor String`) | Se guardar hex, perde o mapeamento semântico; UI-SPEC prefere tokens. Baixo risco (ambos funcionam). |
| A5 | `/empresas` é a rota do CRUD (UI-SPEC "rota sugerida") | Project Structure | Rota é sugestão; planner pode escolher outra. Baixo risco. |

## Open Questions

1. **Categoria precisa de campo `kind` (RECEITA/CUSTO)?**
   - What we know: UI-SPEC §3 mostra dois grupos "Receitas" e "Custos" na gestão de categorias da empresa, independentemente de haver lançamentos.
   - What's unclear: Se isso exige um campo persistido `kind` em `Category`, ou se a separação é só visual/derivada.
   - Recommendation: Adicionar `kind CategoryKind?` (nullable para não afetar a Casa). É a leitura literal da UI-SPEC e destrava o P&L das próximas fatias sem re-migração.

2. **Versão exata do Postgres no Supabase (A1).**
   - What we know: Supabase atual provisiona PG 15+; `NULLS NOT DISTINCT` existe desde PG15.
   - What's unclear: Confirmação do projeto específico.
   - Recommendation: Rodar `SELECT version();` via DIRECT_URL no início do planejamento; se < 15, fallback para índices parciais.

3. **A categoria "Pró-labore" (hoje seed da Empresa) pertence a quem agora?**
   - What we know: Fase 2 criou a categoria "Pró-labore" no lado EMPRESA e o `createProLaboreService` usa `account:'EMPRESA'`.
   - What's unclear: Pró-labore multi-origem é fatia seguinte (deferred). Mas o `createProLaboreService` atual referencia `account:'EMPRESA'` — vai quebrar ao remover o enum.
   - Recommendation: Nesta fatia, **neutralizar/parar** o fluxo de pró-labore (ou apontá-lo para uma empresa padrão) já que a mecânica multi-origem é deferida. O planner deve decidir: desabilitar a opção "Pró-labore" no TransactionSheet nesta fatia, ou fazer um stop-gap. **Não deixar código que referencie `account:'EMPRESA'` após a migração.**

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | tudo | ✓ (projeto ativo) | 20.x (Vercel) | — |
| npm | shadcn add, prisma | ✓ | — | — |
| Prisma CLI | migração + seed | ✓ | 6.19.3 | — |
| Supabase Postgres (DIRECT_URL 5432) | migração destrutiva + seed | ✓ (projeto ativo) | **PG 15+ a confirmar (A1)** | Se < 15: índices parciais em vez de NULLS NOT DISTINCT |
| Vitest | testes de funções puras | ✓ | 3.2.7 | — |

**Missing dependencies with no fallback:** nenhuma identificada.
**Missing dependencies with fallback:** confirmação da versão do Postgres (A1) — fallback de índices parciais se < 15.

## Validation Architecture

`workflow.nyquist_validation = true` → seção incluída.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.7 (environment `node`, alias `@`→`src`) |
| Config file | `vitest.config.ts` (existe; `include: ['src/**/*.test.ts']`) |
| Quick run command | `npx vitest run src/app/(authed)/empresas/_lib/service.test.ts` |
| Full suite command | `npm test` (→ `vitest run`) |

> Padrão existente: testes cobrem **funções puras** de service/schema (ver `planejamento/_lib/service.test.ts`), **sem Prisma**. Esta fatia deve isolar a lógica testável em funções puras (`categoriasPadrao`, `receitasPorTipo`, validação de exclusão, migração do store) e deixar o acesso ao banco em funções finas não-testadas por unit.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-02/D-04 | `categoriasPadrao(tipo)` retorna custos comuns + receitas corretas por tipo (Afiliado→Comissões; Jurídico→Recorrência+Projetos; Infoproduto→Vendas; Genérico→Receita) | unit | `npx vitest run src/app/(authed)/empresas/_lib/service.test.ts -t categoriasPadrao` | ❌ Wave 0 |
| D-03 | `empresaSchema` valida nome obrigatório (≤60), tipo obrigatório, cor obrigatória (uma das 6) | unit | `... -t empresaSchema` | ❌ Wave 0 |
| D-03/D-08 | `deleteEmpresaService` lança erro com contagem quando há lançamentos; permite quando 0 (lógica de decisão isolada numa função pura `canDeleteEmpresa(count)`) | unit | `... -t canDeleteEmpresa` | ❌ Wave 0 |
| D-05 | Seed idempotente: `categoriasPadrao` estável + `upsert` por chave composta não duplica (testar a função que monta as chaves) | unit | `... -t seed-idempotente` | ❌ Wave 0 |
| D-06 | Migração do store: `migrate(v0 'EMPRESA')` → `{tipo:'CASA'}`; `migrate(v0 'CASA')` → `{tipo:'CASA'}`; forma nova intacta | unit | `npx vitest run src/store/conta.test.ts` | ❌ Wave 0 |
| D-06 | Helper `empresaIdDoContexto(contaAtiva)` → `null` para Casa, `empresaId` para empresa (usado pelo loader) | unit | `... -t empresaIdDoContexto` | ❌ Wave 0 |
| D-07 (integridade) | **Manual/checkpoint:** após migração, `SELECT count(*)` de Category/Transaction CASA = contagem pré-migração; 0 linhas órfãs com `account` | manual-only | runbook de verificação pós-migração (contagens antes/depois) | N/A (manual) |
| D-01 (filtro) | Lançamentos/visão geral filtram por `empresaId` do contexto ativo (Casa=null) | manual-only (UAT) | verificação visual — Server Component + DB | N/A |

> **Nota de testabilidade:** a correção do `@@unique`/NULLS NOT DISTINCT (Pitfall 1) e a integridade da migração (D-07) **não** são unit-testáveis sem um Postgres real; são verificadas por **runbook manual de contagens antes/depois** + um checkpoint humano. O unit test cobre as decisões puras (categorias por tipo, validação, migração do store, resolução de contexto→empresaId).

### Sampling Rate
- **Per task commit:** `npx vitest run <arquivo de service tocado>`
- **Per wave merge:** `npm test` (suite completa)
- **Phase gate:** suite verde + runbook de migração executado (contagens batem, backup confirmado) antes de `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `src/app/(authed)/empresas/_lib/service.test.ts` — cobre `categoriasPadrao`, `receitasPorTipo`, `canDeleteEmpresa`, idempotência do seed.
- [ ] `src/app/(authed)/empresas/_lib/schema.test.ts` (ou no mesmo service.test) — `empresaSchema`.
- [ ] `src/store/conta.test.ts` — migração do `persist` (v0→v1) + `empresaIdDoContexto`.
- [ ] Runbook manual pós-migração (contagens CASA antes/depois) — documento, não código.
- Framework install: não necessário (Vitest já instalado).

## Security Domain

`security_enforcement = true`, ASVS nível 1.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | não (herdado) | Supabase Auth já cobre; nenhuma mudança nesta fatia |
| V3 Session Management | não | `@supabase/ssr` já cobre |
| V4 Access Control | **sim** | Todo service/loader filtra por `userId` obtido da sessão (`getUserId()` via `supabase.auth.getUser()`), **nunca** do input — padrão T-02-04. Novas queries de `Empresa`/`Category`/`Transaction` por empresa DEVEM incluir `where: { userId }` e checar ownership de `empresaId` (empresa pertence ao usuário) antes de lançar nela. |
| V5 Input Validation | **sim** | `empresaSchema` (zod): nome ≤60, tipo ∈ enum fixo, cor ∈ paleta fixa. Rejeitar `empresaId` que não pertença ao usuário na criação de lançamento/categoria. |
| V6 Cryptography | não | Sem cripto nova |

### Known Threat Patterns for Next.js 15 + Prisma + Supabase
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR — lançar/editar categoria numa empresa de outro usuário via `empresaId` forjado | Elevation of Privilege | Server Action valida que `empresaId` pertence ao `userId` da sessão (`findFirst({ where: { id: empresaId, userId } })`) antes de escrever |
| SQL injection | Tampering | Prisma parametriza; o SQL hand-editado da migração é estático (sem input) |
| Mass assignment via Server Action | Tampering | `zod.safeParse` + `userId` sempre da sessão (padrão existente) |
| Exclusão em cascata não autorizada | Tampering/DoS | `onDelete: Restrict` + contagem explícita de lançamentos (D-08) antes de apagar |

## Sources

### Primary (HIGH confidence — codebase-grounded)
- `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/20261124103918_core_crud/migration.sql` — modelo atual, seed idempotente, padrão de migração.
- `src/store/conta.ts` — forma atual de `contaAtiva` + `persist`.
- `src/app/(authed)/lancamentos/_lib/{service,actions,schema,loader}.ts` — padrões de service/action/zod/loader + proteção D-08 + pró-labore.
- `src/app/(authed)/planejamento/_lib/service.ts` + `service.test.ts` — padrão getOrCreate idempotente + padrão de teste de funções puras (Vitest).
- `04-CONTEXT.md`, `04-UI-SPEC.md`, `docs/superpowers/specs/2026-11-25-multi-empresa-renda-familiar-design.md`, `spec.md §Evolução`, `.claude/CLAUDE.md` — decisões e stack.
- `vitest.config.ts`, `.planning/config.json` — infra de teste e toggles.

### Secondary (MEDIUM confidence — official docs, cross-checked)
- [Prisma — Customizing migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations) — `--create-only`, expand/contract, data-preserving edits.
- [PostgreSQL — UNIQUE NULLS NOT DISTINCT feature](https://www.postgresql.org/about/featurematrix/detail/unique-nulls-not-distinct) — semântica de NULL em unique index (PG15+).
- [shadcn/ui — Dropdown Menu](https://ui.shadcn.com/docs/components/dropdown-menu) — instalação, `'use client'`, base Radix/acessibilidade.
- `npm view @radix-ui/react-dropdown-menu version` → 2.2.1 (verificado nesta sessão).

### Tertiary (LOW confidence — community, flagged)
- [Prisma issue #3197 — Compound unique with nullable field](https://github.com/prisma/prisma/issues/3197) — confirma que o `@@unique` do Prisma não expressa NULLS NOT DISTINCT (comportamento comunidade-verificado).
- [Medium — Enum to String migration avoiding data loss](https://medium.com/@zubairasim7/enum-to-string-migration-avoiding-data-loss-in-production-31ab8fb0b166) — reforça o cast explícito em Postgres.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — tudo já instalado; só DropdownMenu novo (registry oficial, versão verificada).
- Architecture (schema/migração/store/CRUD): HIGH para os padrões reaproveitados (codebase); MEDIUM para o SQL exato da migração (official docs, sem Postgres de teste nesta sessão).
- Pitfalls: HIGH para os herdados (pooler/timezone/generate); MEDIUM-HIGH para o NULLS NOT DISTINCT (confirmado em doc oficial Postgres + issue Prisma, mas depende de A1/versão PG).

**Research date:** 2026-11-25
**Valid until:** 2026-12-25 (stack estável; reconfirmar versão do Postgres do Supabase se o projeto for recriado)
