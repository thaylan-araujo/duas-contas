---
phase: 01-foundation
plan: "01"
subsystem: scaffold
tags: [next.js, prisma, supabase, tailwind, scaffold, infrastructure]
dependency_graph:
  requires: []
  provides:
    - next-js-scaffold
    - prisma-schema
    - supabase-clients
    - design-tokens
    - format-utilities
    - zustand-store
  affects: []
tech_stack:
  added:
    - next@15.5.25
    - typescript@5
    - tailwindcss@4
    - prisma@6.19.3
    - "@prisma/client@6.19.3"
    - "@supabase/supabase-js@2"
    - "@supabase/ssr@0.12.7"
    - zustand@5
    - zod@3
    - react-hook-form@7
    - date-fns@3
    - "@serwist/next@9.5.13"
    - shadcn/ui (button, input, label, card, separator, sheet, skeleton)
  patterns:
    - Tailwind v4 CSS-first @theme (no tailwind.config.js)
    - Prisma singleton via globalThis (prevents hot-reload pool exhaustion)
    - Supabase SSR with cookie-based sessions
    - Zustand store with persist middleware
key_files:
  created:
    - path: src/lib/format.ts
      description: "formatBRL() e formatDate() — utilitários únicos de formatação"
    - path: src/lib/prisma.ts
      description: "Singleton PrismaClient via globalThis"
    - path: src/lib/supabase/server.ts
      description: "createSupabaseServerClient() para Server Components"
    - path: src/lib/supabase/client.ts
      description: "createSupabaseBrowserClient() para Client Components"
    - path: src/store/conta.ts
      description: "Zustand store com persist (contaAtiva, mesSelecionado)"
    - path: src/app/globals.css
      description: "Tailwind v4 @theme com design tokens do spec.md"
    - path: src/app/layout.tsx
      description: "Root layout com Manrope + IBM Plex Mono, lang=pt-BR"
    - path: src/lib/utils.ts
      description: "cn() utilitário para shadcn/ui"
    - path: prisma/schema.prisma
      description: "Schema Phase 1: User, Category, Transaction com enums"
    - path: .env.local.example
      description: "Template de variáveis de ambiente com instruções"
    - path: prisma.config.ts
      description: "Prisma config para carregar .env.local no CLI"
  modified:
    - path: .gitignore
      description: "Adicionada exceção !.env.local.example"
decisions:
  - "Shadcn v4.22.0 (não latest) — latest usa @base-ui/react que conflita com date-fns@3"
  - "prisma.config.ts modificado para carregar .env.local via dotenv"
  - "Adicionado directUrl ao prisma.config.ts para prisma db push usar porta 5432"
metrics:
  duration_minutes: 30
  completed_date: "2026-10-29"
  tasks_completed: 1
  tasks_total: 2
  files_created: 14
  files_modified: 2
status: blocked
---

# Phase 1 Plan 01: Scaffold e Infraestrutura — Summary

**One-liner:** Next.js 15 scaffold com Tailwind v4, Prisma 6, Supabase SSR e utilitários críticos de formatação — Task 1 completa, Task 2 bloqueada por segurança de dados.

---

## Status: BLOCKED — Intervenção Humana Necessária

**A Task 2 foi interrompida por uma questão crítica de segurança de dados.**

### O que foi detectado

Ao executar `npx prisma db push`, o Prisma conectou ao banco Supabase via DIRECT_URL e encontrou **tabelas existentes com dados de produção reais**, incluindo:

- `categoria`, `cliente`, `lancamento`, `lead`, `usuario`
- Tabelas de CRM: `gestor`, `funil`, `tarefa`, `onboarding_briefing_resposta`
- Tabelas de marketing: `meta_ads_snapshot`, `google_ads_snapshot`

Isto indica que o `DIRECT_URL` em `.env.local` aponta para um **banco de dados diferente** — possivelmente um projeto Supabase de outro sistema (CRM/gestão de clientes), não o banco novo criado para "Duas Contas".

Executar `db push` destruiria essas tabelas (37+ tabelas com centenas de registros).

### Ação Necessária

1. **Verifique o arquivo `.env.local`** — confirme qual projeto Supabase está referenciado no `DIRECT_URL`
2. **Se o DIRECT_URL está errado:** corrija para apontar para o projeto Supabase novo criado para "Duas Contas" (database URL com `db.[project-ref].supabase.co:5432`)
3. **Após corrigir:** execute novamente a Task 2 com `npx prisma db push` e depois `npx prisma db seed`

### Como retomar

Após corrigir as variáveis de ambiente, execute:
```bash
npx prisma db push
npx prisma generate
npx prisma db seed
```

---

## Task 1: Scaffold + Infraestrutura Completa — CONCLUÍDA

**Commit:** a9ad838

### O que foi implementado

**Stack instalado com versões pinadas:**
- next@15.5.25 (não v16)
- prisma@6 e @prisma/client@6
- zod@3 (não v4)
- date-fns@3 (não v4)
- zustand@5, react-hook-form@7
- @supabase/ssr@0.12.7, @supabase/supabase-js@2
- @serwist/next@9.5.13 (para PWA na Phase 8)
- shadcn/ui via npx shadcn@4.22.0 (v4.22.0 — não latest que conflita com date-fns@3)

**Arquivos criados conforme padrões do RESEARCH.md:**

| Arquivo | Padrão Seguido |
|---------|---------------|
| `src/lib/format.ts` | Pattern 5 — verbatim |
| `src/lib/prisma.ts` | Pattern 4 — verbatim |
| `src/lib/supabase/server.ts` | Pattern 1 — verbatim |
| `src/lib/supabase/client.ts` | Pattern 2 — verbatim |
| `src/store/conta.ts` | Padrão PATTERNS.md — verbatim |
| `src/app/globals.css` | Pattern 7 — Tailwind v4 @theme |
| `src/app/layout.tsx` | Pattern 8 — Manrope + IBM Plex Mono |
| `prisma/schema.prisma` | Pattern 6 — User, Category, Transaction |

**Verificação TypeScript:** `npx tsc --noEmit` — zero erros

### Acceptance Criteria Verificados

- [x] npx tsc --noEmit retorna 0 erros
- [x] package.json contém "next": "15.5.25" (não v16)
- [x] package.json contém "prisma": "^6.19.3" nas devDependencies
- [x] package.json contém "zod": "^3.25.76" (não v4)
- [x] package.json contém "date-fns": "^3.6.0" (não v4)
- [x] src/app/globals.css começa com "@import "tailwindcss""
- [x] src/app/layout.tsx contém lang="pt-BR" no elemento html
- [x] src/lib/format.ts exporta formatBRL e formatDate
- [x] src/lib/prisma.ts contém "globalThis" e "PrismaClient"
- [x] src/lib/supabase/server.ts contém "createServerClient" e "getAll"
- [x] src/lib/supabase/client.ts contém "'use client'" e "createBrowserClient"
- [x] src/store/conta.ts contém "contaAtiva" e "mesSelecionado" e "persist"
- [x] .env.local está no .gitignore (via ".env*")
- [x] .env.local.example existe com as 5 variáveis comentadas

---

## Task 2: Schema + Push + Seed — NÃO EXECUTADA (bloqueada)

### O que foi feito antes do bloqueio
- prisma/schema.prisma escrito com modelos corretos (User, Category, Transaction)
- `npx prisma validate` — schema válido
- `prisma.config.ts` atualizado com directUrl

### O que precisa ser feito após correção das credenciais
1. Verificar e corrigir .env.local (DIRECT_URL deve apontar para o banco novo)
2. `npx prisma db push` — aplica schema ao banco
3. `npx prisma generate` — regenera cliente
4. `npx prisma db seed` — cria User espelho + 10 categorias

---

## Deviações do Plano

### Auto-fixadas (Regra 1/2)

**1. [Rule 2 - Missing Config] Adicionado !.env.local.example ao .gitignore**
- **Encontrado durante:** Task 1 — ao tentar commitar o arquivo de exemplo
- **Problema:** `.gitignore` tinha `.env*` que ignorava também `.env.local.example`
- **Fix:** Adicionada exceção `!.env.local.example` ao .gitignore

**2. [Rule 3 - Blocking Issue] shadcn@latest → shadcn@4.22.0**
- **Encontrado durante:** Task 1 — `npx shadcn@latest init` conflitou com date-fns@3
- **Problema:** shadcn@latest instala @base-ui/react que requer date-fns@4; CLAUDE.md fixa date-fns@3
- **Fix:** Usado `npx shadcn@4.22.0` que usa Radix UI primitivos sem conflito

**3. [Rule 2 - Missing Config] prisma.config.ts atualizado com directUrl**
- **Encontrado durante:** Task 2 — prisma db push tentou usar pooler (6543) em vez da conexão direta
- **Problema:** prisma.config.ts gerado pelo `npx prisma init` não incluía directUrl
- **Fix:** Adicionado `directUrl: env("DIRECT_URL")` ao datasource na config

**4. [Rule 2 - Missing Config] prisma.config.ts modificado para ler .env.local**
- **Encontrado durante:** Task 2 — `npx prisma validate` falhava pois `.env.local` não era carregado
- **Problema:** Prisma 6 gera `prisma.config.ts` com `import "dotenv/config"` que só lê `.env`, não `.env.local`
- **Fix:** Substituído por `dotenv.config({ path: ".env.local" })`

### Decisões de Design

**shadcn/ui com estilo "default" (não "base-nova"):**
O `npx shadcn@latest init` criou um `components.json` com estilo `base-nova` que usa `@base-ui/react`. Este pacote requer `date-fns@4`, conflitando com o `date-fns@3` fixado pelo CLAUDE.md. Usou-se `npx shadcn@4.22.0` com estilo `default` para manter compatibilidade.

### Bloqueio de Segurança (Regra 4 — Requer Decisão Humana)

**[Blocker] DIRECT_URL aponta para banco com dados de produção**
- **Encontrado durante:** Task 2 — Step 3 (npx prisma db push)
- **Problema:** O banco referenciado pelo DIRECT_URL tem 37+ tabelas com dados reais (CRM, clientes, lançamentos, etc.)
- **Impacto:** `db push` destruiria essas tabelas — perda irreversível de dados
- **Ação:** STOP — requer verificação e correção manual pelo usuário
- **Resolução esperada:** Usuário verifica .env.local e corrige DIRECT_URL para o banco novo do "Duas Contas"

---

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: data_loss | .env.local | DIRECT_URL aponta para banco de produção com dados existentes — db push cancelado |

---

## Self-Check

**Verificações realizadas:**

- [x] src/lib/format.ts existe — FOUND
- [x] src/lib/prisma.ts existe — FOUND
- [x] src/lib/supabase/server.ts existe — FOUND
- [x] src/lib/supabase/client.ts existe — FOUND
- [x] src/store/conta.ts existe — FOUND
- [x] src/app/globals.css começa com @import "tailwindcss" — VERIFIED
- [x] src/app/layout.tsx tem lang="pt-BR" — VERIFIED
- [x] .env.local.example existe — FOUND
- [x] prisma/schema.prisma contém amountCents Int — VERIFIED
- [x] Commit a9ad838 existe — VERIFIED
- [x] npx tsc --noEmit sem erros — VERIFIED (0 erros)
- [x] npx prisma validate retorna schema válido — VERIFIED

## Self-Check: PASSED (Task 1), BLOCKED (Task 2)
