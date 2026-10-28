# Architecture Research

**Domain:** Personal finance web app — dual-account (Casa / Empresa)
**Researched:** 2026-10-28
**Confidence:** MEDIUM (cross-referenced multiple web sources; no breaking findings from official docs)

## Standard Architecture

### System Overview

```
┌───────────────────────────────────────────────────────────────┐
│                     Browser / PWA Shell                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Dashboard │  │Lançamento│  │Planejam. │  │Relatório │ ...  │
│  │(RSC)     │  │Rápido    │  │/Semanas  │  │Mensal    │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
├───────┴──────────────┴────────────┴──────────────┴────────────┤
│                  Next.js App Router (server)                   │
│   Server Components (fetch)   Server Actions (mutate)         │
│   Route Handlers (webhooks / CSV import endpoint)             │
├───────────────────────────────────────────────────────────────┤
│                     Data / Service Layer                       │
│  ┌──────────────────┐   ┌──────────────────────────────────┐  │
│  │  Prisma Client   │   │   Supabase Auth (@supabase/ssr)  │  │
│  │  (singleton)     │   │   JWT / RLS middleware            │  │
│  └────────┬─────────┘   └──────────────────────────────────┘  │
├───────────┴───────────────────────────────────────────────────┤
│           Supabase (hosted Postgres + Auth + Storage)         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Conta   │  │Lançamento│  │PlanoDoMês│  │  Dívida  │ ...  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
└───────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Route page.tsx | Entry point for each screen; fetches data server-side | React Server Component, passes props to client features |
| _components/ | Screen-specific UI (collocated, not shared) | Client Components with 'use client' where interactivity is needed |
| _lib/*.actions.ts | Thin server actions — validate, call service, revalidate | 'use server' functions, Zod parse, call service |
| _lib/*.service.ts | Business logic — account rules, transfer validation | Pure TypeScript, testable without HTTP context |
| _lib/*.schema.ts | Zod schemas for input validation | Shared between actions and client-side form validation |
| _lib/*.loader.ts | Server-side data fetching functions | Prisma queries, called from page.tsx |
| lib/prisma.ts | Global PrismaClient singleton | globalThis pattern, prevents connection exhaustion |
| lib/supabase/ | Supabase client factories (browser / server / middleware) | @supabase/ssr helpers |
| components/ | Globally reused UI (Button, Card, Badge, CurrencyInput) | Dumb presentational components |

---

## Recommended Project Structure

```
duas-contas/
├── app/
│   ├── manifest.ts                  # PWA manifest (Next.js native)
│   ├── sw.ts                        # Serwist service worker
│   ├── layout.tsx                   # Root layout — Manrope + IBM Plex Mono fonts, PWA meta
│   ├── globals.css                  # Tailwind base, design tokens (#F3F5F7, #1D4ED8, #B45309)
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx             # Login screen (Supabase email+password)
│   └── (app)/                       # Protected — all authenticated screens
│       ├── layout.tsx               # App shell: sidebar/bottom nav, account switcher
│       ├── page.tsx                 # Redirect to /dashboard
│       ├── dashboard/
│       │   ├── page.tsx
│       │   ├── _components/
│       │   │   ├── saldo-card.tsx
│       │   │   ├── grafico-semanas.tsx
│       │   │   └── alertas-vencimento.tsx
│       │   └── _lib/
│       │       ├── dashboard.loader.ts
│       │       └── dashboard.schema.ts
│       ├── lancamento/
│       │   ├── page.tsx             # Lançamento Rápido
│       │   ├── _components/
│       │   │   ├── lancamento-form.tsx
│       │   │   └── lista-lancamentos.tsx
│       │   └── _lib/
│       │       ├── lancamento.actions.ts
│       │       ├── lancamento.service.ts
│       │       ├── lancamento.schema.ts
│       │       └── lancamento.loader.ts
│       ├── planejamento/
│       │   ├── page.tsx             # Planejamento / Semanas
│       │   ├── _components/
│       │   └── _lib/
│       ├── contas-fixas/
│       │   ├── page.tsx             # Contas Fixas e Metas
│       │   ├── _components/
│       │   └── _lib/
│       ├── canais/
│       │   ├── page.tsx             # Canais / Fluxo de Caixa
│       │   ├── _components/
│       │   └── _lib/
│       ├── dividas/
│       │   ├── page.tsx             # Dívidas
│       │   ├── _components/
│       │   └── _lib/
│       ├── calendario/
│       │   ├── page.tsx             # Calendário de Vencimentos
│       │   ├── _components/
│       │   └── _lib/
│       ├── relatorio/
│       │   ├── page.tsx             # Relatório Mensal
│       │   ├── _components/
│       │   └── _lib/
│       └── importar/
│           ├── page.tsx             # Importar Extrato
│           ├── _components/
│           └── _lib/
├── app/api/
│   └── import/
│       └── route.ts                 # CSV/OFX upload endpoint (multipart form)
├── components/                      # Globally reused UI primitives
│   ├── ui/                          # shadcn/ui base components
│   ├── currency-input.tsx           # R$ formatted input (1.234,56)
│   ├── date-input.tsx               # dd/mm/aaaa input
│   ├── conta-badge.tsx              # Casa (blue) / Empresa (orange) badge
│   └── loading-skeleton.tsx
├── lib/
│   ├── prisma.ts                    # Global PrismaClient singleton
│   ├── supabase/
│   │   ├── client.ts                # Browser Supabase client
│   │   ├── server.ts                # Server Supabase client (cookies)
│   │   └── middleware.ts            # Session refresh helper
│   ├── formatters.ts                # formatBRL(), formatDate(), parseBRL()
│   ├── constants.ts                 # Account IDs, category seeds, DAS day=20
│   └── utils.ts                     # cn() and other shared helpers
├── prisma/
│   ├── schema.prisma                # Data model (see schema section below)
│   ├── prisma.config.ts             # Points CLI at DIRECT_URL
│   └── migrations/                  # Generated by prisma migrate dev
├── middleware.ts                    # Supabase session refresh on every request
├── next.config.ts                   # withSerwist() wrapper, image domains
├── tailwind.config.ts               # Design tokens, Manrope + IBM Plex Mono
└── public/
    ├── icons/                       # PWA icons (192×192, 512×512, maskable)
    └── screenshots/                 # PWA install screenshots (optional)
```

### Structure Rationale

- **(auth)/ vs (app)/:** Route groups separate unauthenticated from authenticated screens without affecting URL paths. The (app)/layout.tsx handles the session guard so individual page.tsx files do not need auth checks.
- **_lib/ colocation:** All logic for a screen lives next to its page. Underscore prefix excludes from Next.js routing. This prevents a shared `services/` folder that becomes a grab-bag.
- **_lib/*.service.ts:** Business rules (e.g., "Casa and Empresa never mix directly") live here, not in actions. Services are plain TypeScript — testable with Vitest without Next.js context.
- **lib/prisma.ts singleton:** Essential for serverless/Vercel — prevents a new PrismaClient per request and connection pool exhaustion.
- **components/ui/:** shadcn/ui components live here; they are generated files not hand-authored. The custom currency-input and date-input wrappers enforce Brazilian formatting uniformly.
- **api/import/route.ts:** The CSV/OFX upload needs a real Route Handler (not a Server Action) because it handles multipart form data streaming and returns structured JSON for client-side progress feedback.

---

## Architectural Patterns

### Pattern 1: Server Actions for All Mutations

**What:** `_lib/feature.actions.ts` files marked `'use server'` handle all create/update/delete operations. They validate input with Zod, call the service, and call `revalidatePath()` to invalidate the cache.

**When to use:** Every write operation triggered by the user inside the app — creating a lançamento, updating a PlanoDoMês, registering a Transferência (pró-labore).

**Trade-offs:** Simpler than REST API routes for internal mutations; framework handles CSRF, serialization, and transport. Downside: not callable from mobile native apps or external services (not relevant for this project).

**Example:**
```typescript
// app/(app)/lancamento/_lib/lancamento.actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { LancamentoSchema } from './lancamento.schema'
import { criarLancamento } from './lancamento.service'

export async function criarLancamentoAction(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = LancamentoSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten() }

  await criarLancamento(parsed.data)
  revalidatePath('/lancamento')
  revalidatePath('/dashboard')
}
```

### Pattern 2: Account Context via URL + Zustand

**What:** The currently active account (Casa / Empresa) is tracked in a Zustand store, initialized from the URL or localStorage. All loaders and actions receive the `contaId` explicitly.

**When to use:** Every screen that is account-scoped (Dashboard, Planejamento, Lançamento, Relatório).

**Trade-offs:** Zustand is ~2 KB, zero boilerplate for this use case. Avoids prop-drilling the account through deeply nested server components. URL-first means the state survives page refresh.

**Example:**
```typescript
// lib/stores/conta-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ContaStore = {
  contaAtiva: 'casa' | 'empresa'
  setContaAtiva: (conta: 'casa' | 'empresa') => void
}

export const useContaStore = create<ContaStore>()(
  persist(
    (set) => ({
      contaAtiva: 'casa',
      setContaAtiva: (conta) => set({ contaAtiva: conta }),
    }),
    { name: 'conta-ativa' }
  )
)
```

### Pattern 3: Prisma Global Singleton

**What:** A single `PrismaClient` instance stored on `globalThis` to survive Next.js hot reloads and avoid connection pool exhaustion on Vercel's serverless functions.

**When to use:** Always — every Prisma query in the app goes through this singleton.

**Trade-offs:** Slightly unconventional pattern but is the official Prisma recommendation for Next.js. Without it, development hot-reloads create hundreds of idle connections.

**Example:**
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Pattern 4: Transfer-Only Account Boundary

**What:** The `Transferência` entity is the only permitted link between `Conta` "Casa" and `Conta` "Empresa". All service-level functions that create lançamentos validate that `contaOrigemId !== contaDestinoId` and that cross-account movement only occurs through `criarTransferencia()`.

**When to use:** Enforced at the service layer, not the database layer. The Prisma schema does not enforce this — the rule lives in `transferencia.service.ts`.

**Trade-offs:** Putting it in the service (not a DB constraint) is simpler but relies on all writes going through the service. Acceptable since there is no external API surface in the MVP.

---

## Prisma Schema Organization

### Key Models and Relations

```
Conta (casa | empresa)
  ├── Lancamento[]           (tipo: receita | despesa)
  ├── ContaOrigem → Transferencia[]
  ├── ContaDestino → Transferencia[]
  └── PlanoDoMes[]

Categoria
  ├── contaId (scoped to one Conta)
  └── Lancamento[]

PlanoDoMes
  ├── contaId
  ├── mes / ano
  ├── tetoTotal
  └── PlanoCategoriaItem[]   (categoria + teto + semana1-4)

ContaFixa
  ├── contaId
  ├── descricao, valor, diaVencimento
  └── active: Boolean

GastoAnual
  ├── contaId
  ├── descricao, valorTotal
  └── valorMensal (valorTotal / 12, computed or stored)

Meta
  ├── contaId
  ├── descricao, valorAlvo
  └── valorAcumulado

Canal (empresa only)
  ├── nome (Dicas da Liz | Achadinhos da Mel | Infoproduto)
  ├── plataforma (Shopee | Shein | ...)
  ├── Comissao[]
  └── Anuncio[]

Divida
  ├── contaId (empresa)
  ├── descricao (Pronampe | Simples)
  ├── valorTotal, valorPago
  └── Parcela[]

RegraDeImportacao
  ├── contaId
  ├── palavraChave, categoriaId
  └── tipo (receita | despesa)
```

### Schema Design Notes

- All models include `id String @id @default(cuid())`, `criadoEm DateTime @default(now())`, `atualizadoEm DateTime @updatedAt`.
- `Lancamento.valor` is `Decimal @db.Decimal(12,2)` — never Float for money.
- `Transferencia` has `contaOrigemId`, `contaDestinoId`, `valor`, `data`, `descricao` (defaults to "Pró-labore").
- `Canal` has a `contaId` FK to `Conta` — always Empresa; service validates this.
- Supabase RLS policies are set per table to `auth.uid() = userId` — add a `userId` column to every root-level model for the multi-user evolution path, even if the MVP only has one user.

---

## Data Flow

### Typical Read Flow (Server Rendered)

```
User navigates to /dashboard
        ↓
app/(app)/dashboard/page.tsx (RSC)
        ↓
dashboard.loader.ts → prisma.lancamento.findMany({ where: { contaId, mes, ano } })
        ↓
Returns serialized data props to <DashboardView /> Client Component
        ↓
Client renders with no additional fetch (data is already in HTML)
```

### Typical Write Flow (Server Action)

```
User submits Lançamento form
        ↓
<LancamentoForm> calls criarLancamentoAction(formData)
        ↓
lancamento.actions.ts: ZodParse → call lancamento.service.ts
        ↓
lancamento.service.ts: validates conta, categoria ownership → prisma.lancamento.create()
        ↓
revalidatePath('/lancamento') + revalidatePath('/dashboard')
        ↓
Next.js re-renders affected RSC pages (user sees updated list)
```

### CSV/OFX Import Flow

```
User uploads file on /importar
        ↓
POST /api/import/route.ts (Route Handler — handles multipart)
        ↓
Parse CSV/OFX → match against RegraDeImportacao[]
        ↓
Return preview JSON to client (unconfirmed rows)
        ↓
User confirms → importarLancamentosAction(confirmedRows[])
        ↓
Bulk prisma.lancamento.createMany() in $transaction
        ↓
revalidatePath('/lancamento')
```

### State Management

```
Zustand Store (conta-ativa, mes-selecionado, modal states)
        ↑↓
Client Components ←→ Server Actions (mutate) → Prisma → Supabase
        ↑
React Server Components (fetch at render, no client state needed)
```

---

## Build Order Implications

The dependency tree drives phase ordering:

```
Phase 1 — Foundation
  Prisma schema + Supabase setup + auth middleware
  (everything else depends on this)

Phase 2 — Core CRUD
  Conta, Categoria, Lancamento, Transferencia
  (Dashboard, Lançamento Rápido, and all reports need this)

Phase 3 — Planning Layer
  PlanoDoMes, ContaFixa, GastoAnual, Meta
  (Planejamento/Semanas screen needs Lancamentos to exist)

Phase 4 — Business (Empresa)
  Canal, Comissao, Anuncio, fluxo de caixa
  (Canais screen; depends on Conta Empresa and Lancamento)

Phase 5 — Dívidas + Calendário
  Divida, Parcela; vencimento calendar
  (Dívidas screen; depends on Lancamento for payment recording)

Phase 6 — Reports + Import
  Relatório PDF, RegraDeImportacao, CSV/OFX parser
  (needs all data to exist; import needs Categoria and Conta)

Phase 7 — PWA Polish
  Serwist, manifest, offline shell, 44px touch targets
  (add last — does not block any functional phase)
```

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Postgres | Prisma via Transaction Pooler (port 6543) + pgbouncer=true | DIRECT_URL for migrations |
| Supabase Auth | @supabase/ssr, middleware session refresh | Email + password, no OAuth needed |
| Vercel | Next.js Edge middleware + serverless functions | DATABASE_URL env var via Vercel dashboard |
| PDF generation | react-pdf or @react-pdf/renderer in a Route Handler | Avoid browser-only PDF libs in Server Actions |
| Serwist (PWA) | withSerwist() in next.config.ts | Must disable Turbopack in dev (--no-turbo) |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Casa ↔ Empresa | Only via Transferencia entity | Enforced in transferencia.service.ts |
| RSC ↔ Client | Serialized props (no functions, no class instances) | Use DTOs / plain objects from loaders |
| Server Actions ↔ Business Logic | Service function calls | Actions stay thin; services hold rules |
| Auth ↔ Data | Supabase session in middleware; userId passed to loaders | No RLS bypass; userId always explicit |

---

## Anti-Patterns

### Anti-Pattern 1: Direct Prisma in Server Components

**What people do:** Call `prisma.lancamento.findMany()` directly inside `page.tsx` RSC bodies.

**Why it's wrong:** Mixes data-fetching concerns into routing files; makes it impossible to test the query logic or reuse it across pages without copy-pasting.

**Do this instead:** Extract all Prisma queries into `_lib/feature.loader.ts`. The page calls the loader. The loader owns the query.

### Anti-Pattern 2: Float for Money Values

**What people do:** Use `Float` in Prisma schema for `valor` fields.

**Why it's wrong:** IEEE 754 floating-point arithmetic causes rounding errors in financial calculations (e.g., 0.1 + 0.2 ≠ 0.3). Shown to users as R$ 149,9999999.

**Do this instead:** Use `Decimal @db.Decimal(12,2)` in Prisma schema. Use the `decimal.js` library or JavaScript's `Intl.NumberFormat` for display. Never do math with raw JS numbers on financial data.

### Anti-Pattern 3: New PrismaClient Per Module

**What people do:** `const prisma = new PrismaClient()` at the top of each service file.

**Why it's wrong:** Each hot-reload creates a new pool; each Vercel invocation starts with 1+ connections. At moderate load this exhausts Supabase's connection limit (25 on free tier).

**Do this instead:** Import from `lib/prisma.ts` everywhere.

### Anti-Pattern 4: Mixing Casa and Empresa State

**What people do:** Store lançamentos from both accounts in the same React state slice, then filter in the component.

**Why it's wrong:** Increases risk of accidentally rendering or computing cross-account totals. Violates the project's core rule.

**Do this instead:** Every loader and query is parameterized by `contaId`. The Zustand store holds `contaAtiva` as the single source of truth. No component ever holds mixed-account arrays.

### Anti-Pattern 5: Business Logic in Server Actions

**What people do:** Put all validation and rules directly in the `'use server'` action function.

**Why it's wrong:** Actions are untestable (they require Next.js internals). Rules buried in actions get duplicated when a second entry point appears (e.g., import flow).

**Do this instead:** Actions call services. Services are tested with Vitest in isolation.

---

## Scaling Considerations

This is a single-user personal tool — scaling is not the primary concern. The architecture is still chosen to avoid rewrites if a second user is ever added.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user (MVP) | Single Supabase project, free tier, no RLS needed but add userId columns now |
| 2-10 users (future) | Enable Supabase RLS policies, add userId FK to all tables, no other changes needed |
| 100+ users | Consider Prisma Accelerate or upgrade Supabase plan for higher connection limits; add Redis for session caching |

### Scaling Priorities

1. **First bottleneck:** Supabase free tier connection limit (25). Supavisor pooling + Prisma pgbouncer=true mode handles this for Vercel serverless.
2. **Second bottleneck:** PDF generation (heavy CPU). Move to a queue or background job if report generation blocks UX.

---

## Sources

- [Next.js App Router Project Structure — MakerKit](https://makerkit.dev/blog/tutorials/nextjs-app-router-project-structure) (MEDIUM confidence — community guide, cross-referenced)
- [Next.js 15 App Router Structure That Scales — DEV Community](https://dev.to/krunal_groovy/the-nextjs-15-app-router-project-structure-that-scales-with-examples-47ha) (LOW confidence — community post)
- [Prisma ORM v6 + Supabase — official docs](https://www.prisma.io/docs/orm/v6/overview/databases/supabase) (HIGH confidence — official)
- [Supabase Connection Pooling with PgBouncer on Vercel — DEV Community](https://dev.to/mahdi_benrhouma_fe1c6005/supabase-connection-pooling-with-pgbouncer-on-vercel-serverless-1o33) (LOW confidence — community post, verified against official docs)
- [Server Actions vs API Routes — Wisp CMS](https://www.wisp.blog/blog/server-actions-vs-api-routes-in-nextjs-15-which-should-i-use) (LOW confidence — community)
- [Building PWA with Serwist in Next.js — Plain English](https://javascript.plainenglish.io/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7) (LOW confidence — community tutorial)
- [Prisma Server Actions in Next.js — DEV Community](https://dev.to/jtorchia/prisma-server-actions-in-nextjs-16-the-patterns-that-work-and-the-n1-that-sneaks-up-on-you-19h2) (LOW confidence — community)
- [Zustand + TanStack Query state management — StackCompare](https://stackcompare.dev/zustand-vs-tanstack-query) (LOW confidence — community comparison)

---
*Architecture research for: Duas Contas — personal finance web app (dual-account)*
*Researched: 2026-10-28*
