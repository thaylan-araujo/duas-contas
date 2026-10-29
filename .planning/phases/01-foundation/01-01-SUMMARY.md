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
  tasks_completed: 2
  tasks_total: 2
  files_created: 15
  files_modified: 3
status: complete
---

# Phase 1 Plan 01: Scaffold e Infraestrutura — Summary

**One-liner:** Next.js 15 scaffold com Tailwind v4, Prisma 6, Supabase SSR e utilitários críticos de formatação — schema Prisma aplicado ao banco e 10 categorias seedadas.

---

## Status: COMPLETE

**Tasks 1 e 2 concluídas com sucesso.**

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

## Task 2: Schema + Push + Seed — CONCLUÍDA

**Commit:** 2a301af

### O que foi implementado

**Passos executados:**
1. `npx prisma validate` — schema válido confirmado
2. `npx prisma db push` — schema aplicado ao Supabase via DIRECT_URL (porta 5432) em 7.70s
3. `npx prisma generate` — @prisma/client v6.19.3 gerado automaticamente
4. `prisma/seed.ts` criado com upsert re-executável
5. `prisma.config.ts` atualizado com `seed: { run: "npx tsx prisma/seed.ts" }`
6. `npx prisma db seed` — executado com sucesso

**Tabelas criadas no Supabase:**
- `User` — 1 linha (UUID: 5555860b-e9f0-42c2-b4a0-cd846d0f9c45)
- `Category` — 10 linhas (5 CASA + 5 EMPRESA)
- `Transaction` — 0 linhas (vazia, pronta para uso)
- Enums: `ContaType` (CASA/EMPRESA), `TransactionType` (ENTRADA/SAIDA)

**Categorias seedadas:**

| Conta | Categorias |
|-------|-----------|
| CASA | Alimentação, Combustível, Lazer, Contas fixas, Outros |
| EMPRESA | Fornecedores, Anúncios, Taxas e impostos, Pró-labore, Outros |

### Acceptance Criteria Verificados

- [x] npx prisma validate retorna "The schema at 'prisma/schema.prisma' is valid"
- [x] prisma/schema.prisma contém "amountCents Int" (não Float ou Decimal)
- [x] prisma/schema.prisma contém "@db.Date" no campo date de Transaction
- [x] prisma/schema.prisma contém "directUrl" apontando para env("DIRECT_URL")
- [x] npx prisma db push completa em 7.70s (bem abaixo do limite de 30s)
- [x] npx prisma db seed completa com "Seed concluído: 1 usuário + 10 categorias"
- [x] package.json não contém "prisma": {...} deprecated — movido para prisma.config.ts

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

**5. [Rule 1 - Bug] seed.ts precisou carregar .env.local explicitamente**
- **Encontrado durante:** Task 2 — primeira execução do seed
- **Problema:** `npx tsx prisma/seed.ts` é subprocess separado; o `prisma.config.ts` carrega `.env.local` no CLI mas não herda ao subprocess. O PrismaClient não encontrava `DATABASE_URL`.
- **Correção:** Adicionado `import * as dotenv from 'dotenv'; dotenv.config({ path: '.env.local' })` no início de seed.ts.
- **Commit:** 2a301af

**6. [Rule 1 - Bug] DATABASE_URL com prefixo duplicado no .env.local**
- **Encontrado durante:** Task 2 — segunda execução do seed
- **Problema:** O `.env.local` tinha `DATABASE_URL=DATABASE_URL="postgresql://..."` — valor com o nome da chave repetido. Usuário copiou a connection string já formatada como `CHAVE="valor"`.
- **Correção:** Função `normalizeEnvUrl()` em seed.ts detecta e remove o prefixo e aspas externas.
- **Commit:** 2a301af

**7. [Rule 1 - Bug] Conexão ao pooler (porta 6543) falhou no ambiente local**
- **Encontrado durante:** Task 2 — terceira execução do seed
- **Problema:** Mesmo com DATABASE_URL correto, `Can't reach database server` na porta 6543. Porta bloqueada por firewall/roteador local.
- **Correção:** seed.ts força `DATABASE_URL = DIRECT_URL` para usar porta 5432 nas operações CLI. Em runtime (Next.js), o Prisma usa DATABASE_URL normalmente.
- **Commit:** 2a301af

**8. [Rule 2 - Missing Config] seed não estava configurado em prisma.config.ts**
- **Encontrado durante:** Task 2 — prisma.config.ts sobreescreve package.json#prisma
- **Problema:** Seed em package.json era ignorado; Prisma exibia deprecation warning.
- **Correção:** Adicionado `seed: { run: "npx tsx prisma/seed.ts" }` ao defineConfig. Removida a entrada duplicada do package.json.
- **Commit:** 2a301af

### Decisões de Design

**shadcn/ui com estilo "default" (não "base-nova"):**
O `npx shadcn@latest init` criou um `components.json` com estilo `base-nova` que usa `@base-ui/react`. Este pacote requer `date-fns@4`, conflitando com o `date-fns@3` fixado pelo CLAUDE.md. Usou-se `npx shadcn@4.22.0` com estilo `default` para manter compatibilidade.

**seed.ts usa DIRECT_URL (porta 5432):**
Seed é operação CLI, igual ao `db push`. Usar DIRECT_URL evita dependência do pooler local. Em produção/Vercel, o app usa DATABASE_URL (porta 6543) normalmente.

---

## Threat Flags

Nenhuma nova superfície de segurança introduzida nesta task. O seed.ts lê SEED_USER_ID do .env.local (não exposto) e a função normalizeEnvUrl não expõe dados.

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
- [x] prisma/schema.prisma contém @db.Date — VERIFIED
- [x] prisma/schema.prisma contém directUrl — VERIFIED
- [x] prisma/seed.ts existe — FOUND
- [x] prisma.config.ts contém seed.run — VERIFIED
- [x] Commit a9ad838 (Task 1) existe — VERIFIED
- [x] Commit 2a301af (Task 2) existe — VERIFIED
- [x] npx tsc --noEmit sem erros — VERIFIED (0 erros)
- [x] npx prisma validate retorna schema válido — VERIFIED
- [x] npx prisma db push concluiu em 7.70s — VERIFIED
- [x] npx prisma db seed com "Seed concluído: 1 usuário + 10 categorias" — VERIFIED

## Self-Check: PASSED
