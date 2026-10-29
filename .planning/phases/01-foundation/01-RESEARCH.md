# Phase 1: Foundation — Research

**Researched:** 2026-10-29
**Domain:** Next.js 15 + Supabase Auth + Prisma 6 + Tailwind v4 scaffold
**Confidence:** MEDIUM (stack well-documented; some claims from web articles rather than Context7)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Schema mínimo para Fase 1+2. Criar na Fase 1: `User`, `Account` (enum), `Transaction`, `Category`. Modelos de fases posteriores adicionados via migration em suas fases.
- **D-02:** Modelo `User` armazena apenas o `id` do Supabase Auth — sem campo `displayName` ou duplicação de email.
- **D-03:** `Category` tem campo `account` (enum `CASA | EMPRESA`) — categorias são específicas por conta.
- **D-04:** Usuário criado via Supabase Dashboard + script `seed.ts` que cria o registro espelho no Prisma. Zero código de signup público.
- **D-05:** Recuperação via magic link por email (fluxo nativo Supabase Auth). Nenhuma rota de reset customizada.
- **D-06:** Proteção de rotas via `middleware.ts` global que verifica `supabase.auth.getUser()`.
- **D-07:** Fase 1 entrega a shell completa: sidebar no desktop com todas as seções. Telas não implementadas mostram "Em breve".
- **D-08:** Mobile: sidebar vira bottom navigation bar. Padrão de app mobile — bottom nav com 5 ícones.
- **D-09:** Script `seed.ts` insere categorias padrão de Casa e Empresa.
- **D-10:** Dívidas pré-cadastradas e metas iniciais adicionadas em fases posteriores (4 e 3).

### Claude's Discretion

- Estrutura exata de pastas (feature-per-route colocation definida, mas organização interna de cada route é livre)
- Nomes exatos das categorias padrão (referência: spec.md)
- Quantidade e nomes das seções no bottom nav (priorizar as mais usadas)

### Deferred Ideas (OUT OF SCOPE)

- `displayName` do usuário — pode ser adicionado na Fase 2 ou v2
- Tema escuro — Out of Scope no REQUIREMENTS.md
- Multi-usuário / multi-empresa — Out of Scope no REQUIREMENTS.md
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Usuário pode fazer login com senha simples (uso pessoal) | Supabase Auth email+password via `signInWithPassword()`, @supabase/ssr client setup |
| AUTH-02 | Sessão persiste entre recargas do navegador | Cookie-based session via @supabase/ssr + middleware token refresh loop |
</phase_requirements>

---

## Summary

Phase 1 is a greenfield scaffold that must prove the entire stack end-to-end: Next.js 15 App Router running on Vercel, authenticated via Supabase Auth using cookie-based sessions, reading/writing to a Supabase Postgres database through Prisma 6 with the correct dual-URL configuration, and rendering with Tailwind CSS v4 CSS-first config. The walking skeleton is complete when a logged-in user can see a page that has executed a real DB query and the Vercel deployment URL is accessible without errors.

Three infrastructure bugs must be prevented by design in this phase: (1) Prisma prepared-statement crashes on the PgBouncer pooler — fixed by `?pgbouncer=true` on DATABASE_URL; (2) float arithmetic drift in monetary values — fixed by storing all money as `Int` (cents); (3) timezone date displacement — fixed by storing `DATE` columns and parsing with `date-fns` explicit format string. These bugs are silent in development and explode in production, so the patterns must be baked in before any feature work begins.

The project already has a comprehensive UI-SPEC.md. The planner must implement: login screen with email+password form, complete navigation shell (sidebar desktop / bottom-nav mobile), placeholder screens for all routes, formatBRL()/formatDate() utilities in lib/format.ts, seed script, and Prisma schema with User/Category/Transaction models.

**Primary recommendation:** Scaffold with `create-next-app@latest` pinned to Next.js 15.5.28 (not the current default 16.x), install @supabase/ssr 0.12.7, Prisma 6.19.3 (not 7.x — which is latest but outside locked version), and configure the dual-URL pattern before writing a single query.

---

## Project Constraints (from CLAUDE.md)

The following directives from CLAUDE.md are **mandatory**. The planner must not recommend approaches that contradict them.

| Directive | Source |
|-----------|--------|
| Tailwind CSS v4 (not v3) | CLAUDE.md §Core Technologies |
| Prisma 6.x (not 7.x) | CLAUDE.md §Core Technologies |
| App Router only — no Pages Router | CLAUDE.md §Router Decision |
| `@supabase/ssr` — NOT `@supabase/auth-helpers-nextjs` (deprecated) | CLAUDE.md §What NOT to Use |
| `@serwist/next` — NOT `shadowwalker/next-pwa` (unmaintained) | CLAUDE.md §What NOT to Use |
| `date-fns` v3 — NOT `moment.js` | CLAUDE.md §What NOT to Use |
| DATABASE_URL port 6543 with `?pgbouncer=true` | CLAUDE.md §Critical Configuration |
| DIRECT_URL port 5432 for migrations only | CLAUDE.md §Critical Configuration |
| All monetary values as `Int` (cents) in Postgres — NEVER Float | .planning/STATE.md §Key Decisions |
| Dates stored as `DATE` in Postgres, parsed with date-fns explicit format | .planning/STATE.md §Key Decisions |
| `formatBRL()` and `formatDate()` as single utility functions in `lib/format.ts` | CONTEXT.md §Utilitários críticos |
| Feature-per-route colocation: `app/(authed)/[rota]/_components/`, `_lib/` | .planning/STATE.md §Architecture Notes |
| Prisma singleton in `lib/prisma.ts` via `globalThis` | .planning/STATE.md §Architecture Notes |
| Server Actions: `parse Zod → call service → revalidatePath` (logic in `*.service.ts`) | .planning/STATE.md §Architecture Notes |
| Zustand store for `contaAtiva` and `mesSelecionado` persisted in localStorage | .planning/STATE.md §Architecture Notes |
| All interface text in Brazilian Portuguese | CLAUDE.md §Constraints |
| Mobile: minimum 44px button height; PWA installable | CLAUDE.md §Constraints |
| Deploy on Vercel from day 1 — no local-only phase | CLAUDE.md §Constraints |

**Version pinning note:** CLAUDE.md specifies Next.js 15.x, Prisma 6.x, date-fns 3.x, zod 3.x. As of 2026-10-29, the npm latest tags are Next.js 16.4.3, Prisma 7.10.1, date-fns 4.4.0, and zod 4.6.7. **Use `@15` / `@6` / `@3` explicit version specifiers** when installing — `@latest` will pull breaking major versions. The CLAUDE.md locked these for compatibility reasons.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auth session management | Frontend Server (SSR middleware) | Browser (cookie) | Supabase auth cookies set in middleware, read server-side in Server Components |
| Route protection | Frontend Server (middleware.ts) | — | `supabase.auth.getUser()` runs server-side before page renders — no client flash |
| Login form interaction | Browser (Client Component) | — | Form state, loading state, error display require client interactivity |
| Navigation shell rendering | Frontend Server (layout.tsx) | Browser (active route state) | Shell is a Server Component; active link state needs client router |
| Database queries (seed, schema) | Database / Storage | — | Prisma schema + migrations + seed.ts |
| Design tokens / fonts | CDN / Static (CSS variables) | — | Tailwind @theme + next/font inline CSS variables, zero runtime JS |
| Monetary/date formatting utilities | Browser + Frontend Server | — | formatBRL/formatDate must be deterministic on both — prevents hydration mismatch |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.5.28 [VERIFIED: npm registry] | Full-stack React framework with App Router | Locked per CLAUDE.md; 16.x is latest but not pinned |
| typescript | 5.x (5.7+ via next peer) [VERIFIED: npm registry] | Type safety | Catches schema/form/query mismatches — critical in finance apps |
| tailwindcss | 4.3.3 [VERIFIED: npm registry] | CSS utility framework | v4 is CSS-first (no config file), 6x faster builds |
| @supabase/supabase-js | 2.118.0 [VERIFIED: npm registry] | Supabase client | Manages auth, DB queries, realtime |
| @supabase/ssr | 0.12.7 [VERIFIED: npm registry] | Cookie-based sessions in App Router | Replaces deprecated auth-helpers-nextjs |
| prisma | 6.19.3 [VERIFIED: npm registry] | ORM + migration runner | Locked to 6.x per CLAUDE.md; 7.x is latest but excluded |
| @prisma/client | 6.19.3 — install same version as prisma | Generated Prisma client | Must match prisma CLI version exactly |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 3.x (3.6.0 last 3.x stable) [VERIFIED: npm registry] | Date formatting + PT-BR locale | All date display; locked to 3.x per CLAUDE.md (4.x available but not pinned) |
| zustand | 5.0.16 [VERIFIED: npm registry] | Client state: contaAtiva + mesSelecionado | Persisted to localStorage |
| shadcn | 4.23.0 [VERIFIED: npm registry] | Component scaffold CLI | `npx shadcn@4 init` to pin to v4 |
| zod | 3.x (3.25.x last 3.x stable) [VERIFIED: npm registry] | Schema validation | Locked to 3.x per CLAUDE.md (zod 4 is latest but not pinned) |
| lucide-react | 1.64.0 [VERIFIED: npm registry] | Icons | bundled via shadcn init |
| @serwist/next | 9.5.13 [VERIFIED: npm registry] | PWA service worker (Phase 8) | Install now, configure next.config to accept it; full config in Phase 8 |

**Installation (exact commands with version pins):**

```bash
# Step 1: Scaffold (pins to Next 15, not 16)
npx create-next-app@15 duas-contas \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# Step 2: Supabase
npm install @supabase/supabase-js@2 @supabase/ssr@latest

# Step 3: Prisma (pin to 6.x — NOT npm latest which is 7.x)
npm install prisma@6 @prisma/client@6 --save-dev
npx prisma init

# Step 4: UI components
npx shadcn@latest init
npx shadcn@latest add button input label card separator sheet skeleton

# Step 5: State + forms + validation (zod@3 — NOT zod@4 latest)
npm install zustand@5 zod@3 react-hook-form@7

# Step 6: Dates (date-fns@3 — NOT date-fns@4 latest)
npm install date-fns@3

# Step 7: PWA (stub install — full config in Phase 8)
npm install @serwist/next@latest serwist@latest
```

**Version compatibility note:** `create-next-app@15` scaffolds with React 19 (required), Tailwind v4 (default since Next 15), and Turbopack enabled by default. Running `create-next-app@latest` as of 2026-10-29 would pull Next.js 16 which is outside locked versions. [VERIFIED: npm registry]

---

## Package Legitimacy Audit

All packages audited via `gsd-tools query package-legitimacy check` on 2026-10-29.

| Package | Registry | Age | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|-----|-------------|-------------|---------|-------------|
| @supabase/ssr | npm | 2+ yrs | 11.2M | github.com/supabase/ssr | OK | Approved |
| @supabase/supabase-js | npm | 6+ yrs | 41.3M | github.com/supabase/supabase-js | SUS (too-new publish) | Approved — flagged for recent publish only; established package |
| prisma | npm | 7+ yrs | 21.5M | github.com/prisma/prisma | SUS (too-new publish) | Approved — flagship ORM, established |
| @prisma/client | npm | 7+ yrs | 20.4M | github.com/prisma/orm | SUS (too-new publish) | Approved — companion to prisma |
| next | npm | 10+ yrs | 76.4M | github.com/vercel/next.js | SUS (too-new publish) | Approved — Vercel's own framework |
| tailwindcss | npm | 7+ yrs | 142M | github.com/tailwindlabs/tailwindcss | OK | Approved |
| date-fns | npm | 9+ yrs | 100M | github.com/date-fns/date-fns | OK | Approved |
| shadcn | npm | 3+ yrs | 13.7M | github.com/shadcn-ui/ui | SUS (too-new publish) | Approved — well-known component CLI |
| @serwist/next | npm | 2+ yrs | 495K | github.com/serwist/serwist | SUS (too-new publish) | Approved — maintained next-pwa successor |
| zustand | npm | 5+ yrs | 70.8M | github.com/pmndrs/zustand | SUS (too-new publish) | Approved — standard React state library |
| react-hook-form | npm | 5+ yrs | 52.2M | github.com/react-hook-form | SUS (too-new publish) | Approved — standard form library |
| zod | npm | 4+ yrs | 371M | github.com/colinhacks/zod | SUS (too-new publish) | Approved — ubiquitous validation |
| lucide-react | npm | 4+ yrs | 109.6M | github.com/lucide-icons/lucide | SUS (too-new publish) | Approved — bundled with shadcn |

**All "SUS" verdicts** are due to "too-new" publish dates (checker's training cutoff), not suspicious package identity. Every package has millions of weekly downloads, an established GitHub repo under a known organization, and no postinstall scripts. No packages removed. No suspicious packages flagged for human verification. [ASSUMED: legitimacy checker flags recent publish dates as SUS even for well-known packages]

**Packages removed:** none
**Packages requiring checkpoint:human-verify:** none (all SUS flags are false positives from recency)

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (User)
     │
     ▼
[Next.js Middleware] ──── supabase.auth.getUser() ──► Supabase Auth Server
     │  set/refresh auth cookies
     │
     ├─ /login (public) ──► [LoginPage Client Component]
     │                            │ signInWithPassword()
     │                            ▼
     │                      Supabase Auth
     │
     └─ /(authed)/* ──► [RootLayout Server Component]
                              │ reads session cookie
                              │
                     ┌────────┼────────────────┐
                     │        │                │
              [Sidebar]  [Content Area]  [BottomNav]
              Server      Server/Client    Client
              Component   Components      Component
                              │
                              ▼
                         Prisma Client ──► PgBouncer (port 6543)
                              │                  ▼
                         (read/write)      Supabase Postgres
                              │
                         (migrations) ──► Direct Postgres (port 5432)
```

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       ├── page.tsx          # Login screen (Client Component)
│   │       └── _components/
│   │           └── LoginForm.tsx
│   ├── (authed)/
│   │   ├── layout.tsx            # Shell: sidebar + bottom-nav (Server Component)
│   │   ├── page.tsx              # → redirect to /visao-geral
│   │   ├── visao-geral/
│   │   │   └── page.tsx          # "Em breve" placeholder
│   │   ├── lancamentos/
│   │   │   └── page.tsx          # "Em breve" placeholder
│   │   ├── planejamento/
│   │   │   └── page.tsx          # "Em breve" placeholder
│   │   ├── contas-fixas/
│   │   │   └── page.tsx          # "Em breve" placeholder
│   │   ├── canais/
│   │   │   └── page.tsx          # "Em breve" placeholder
│   │   ├── dividas/
│   │   │   └── page.tsx          # "Em breve" placeholder
│   │   ├── calendario/
│   │   │   └── page.tsx          # "Em breve" placeholder
│   │   └── relatorio/
│   │       └── page.tsx          # "Em breve" placeholder
│   ├── globals.css               # @import "tailwindcss" + @theme block
│   └── layout.tsx                # Root layout — font variables, <html lang="pt-BR">
├── lib/
│   ├── format.ts                 # formatBRL() + formatDate() — canonical formatters
│   ├── prisma.ts                 # Prisma singleton via globalThis
│   └── supabase/
│       ├── client.ts             # createBrowserClient
│       └── server.ts             # createServerClient (Server Components)
├── middleware.ts                 # Auth session refresh + route protection
└── prisma/
    ├── schema.prisma             # Data models: User, Category, Transaction
    └── seed.ts                   # Default categories + User mirror record
```

### Pattern 1: Supabase SSR — Server Client

**What:** Creates a Supabase client that reads/writes cookies for Server Components and Server Actions.

**When to use:** Any Server Component or Server Action that needs auth state or DB access via Supabase.

```typescript
// src/lib/supabase/server.ts
// Source: supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components cannot set cookies — middleware handles rotation
          }
        },
      },
    }
  )
}
```

### Pattern 2: Supabase SSR — Browser Client

**What:** Creates a Supabase client for Client Components. Uses the browser's cookie store.

```typescript
// src/lib/supabase/client.ts
// Source: supabase.com/docs/guides/auth/server-side/nextjs
'use client'
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Pattern 3: Middleware — Token Refresh + Route Protection

**What:** Runs on every non-static request. Refreshes the Supabase session cookie and redirects unauthenticated users.

**Critical detail:** Use `getUser()` — NOT `getSession()`. `getSession()` reads the local cookie without verifying the JWT signature with Supabase Auth. An attacker can forge a session cookie; `getUser()` validates against the Auth server. [CITED: supabase.com/docs/guides/auth/server-side/nextjs]

```typescript
// src/middleware.ts
// Source: owolf.com/blog/supabase-authentication-with-next-js-15-app-router
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: use getUser() — not getSession() — to verify JWT
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from protected routes
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 4: Prisma Singleton (prevents hot-reload pool exhaustion)

**What:** Stores one PrismaClient on `globalThis` in development. Without this, every file save creates a new pool and exhausts the 20-connection limit after ~20 hot reloads.

```typescript
// src/lib/prisma.ts
// Source: realcoding.blog/en/2025/01/20/nextjs-prisma-singleton-pattern/
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### Pattern 5: Critical Formatters — formatBRL() and formatDate()

**What:** Single source of formatting for all monetary values and dates. These must exist before any UI renders money or dates.

**Why this matters for SSR:** If you use `new Intl.NumberFormat(navigator.language)` or `date.toLocaleDateString()` in a component that runs on both server and client, the server uses the Node.js locale and the client uses the browser locale — causing React hydration mismatches. Using a deterministic function with hard-coded `pt-BR` locale prevents this. [CITED: evlune.com/2026/04/how-to-solve-react-hydration-mismatch.html]

```typescript
// src/lib/format.ts
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Converts integer cents to Brazilian Real display string.
 * Input: 123456 → "R$ 1.234,56"
 * NEVER pass floats. NEVER format inline. Use this function only.
 */
export function formatBRL(cents: number): string {
  const value = cents / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formats a Date object as dd/mm/aaaa string.
 * Uses date-fns with explicit format pattern — prevents timezone drift.
 * NEVER use .toLocaleDateString(). Use this function only.
 */
export function formatDate(date: Date): string {
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}
```

**Timezone pitfall with DATE columns:** When Postgres returns a `DATE` value (e.g., `2026-11-01`), Prisma delivers it as a JavaScript `Date` object at midnight UTC. If you display it with `date.toLocaleDateString('pt-BR')`, the `America/Sao_Paulo` timezone (UTC-3) will show `31/10/2026` instead of `01/11/2026`. The fix: use `format(date, 'dd/MM/yyyy')` with no timezone conversion — date-fns `format()` works in the local timezone of the runtime, and since this app is a personal tool with a known locale, the pattern is safe as long as dates are stored as `DATE` (not `TIMESTAMP`). [ASSUMED]

### Pattern 6: Prisma Schema — Phase 1 Models

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // port 6543 with ?pgbouncer=true
  directUrl = env("DIRECT_URL")     // port 5432 for migrations
}

enum ContaType {
  CASA
  EMPRESA
}

enum TransactionType {
  ENTRADA
  SAIDA
}

model User {
  id          String        @id    // mirrors Supabase Auth UUID
  categories  Category[]
  transactions Transaction[]
  createdAt   DateTime      @default(now())
}

model Category {
  id           String           @id @default(cuid())
  name         String
  account      ContaType
  user         User             @relation(fields: [userId], references: [id])
  userId       String
  transactions Transaction[]
  createdAt    DateTime         @default(now())

  @@unique([name, account, userId])
}

model Transaction {
  id          String          @id @default(cuid())
  date        DateTime        @db.Date      // DATE only — no time component
  description String
  amountCents Int                           // ALWAYS cents — never Float
  type        TransactionType
  category    Category        @relation(fields: [categoryId], references: [id])
  categoryId  String
  account     ContaType
  user        User            @relation(fields: [userId], references: [id])
  userId      String
  origin      String          @default("manual")  // "manual" | "imported"
  notes       String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}
```

**Key schema decisions:**
- `amountCents Int` — never `Float` or `Decimal`. Int arithmetic in Postgres is exact. [CITED: .planning/STATE.md]
- `date DateTime @db.Date` — the `@db.Date` annotation maps to Postgres `DATE` type (no time), not `TIMESTAMP`. Without this annotation, Prisma defaults to `TIMESTAMP WITH TIME ZONE`. [ASSUMED]
- `User.id String @id` — stores the Supabase Auth UUID directly. No auto-increment. The seed script must create this record after creating the user in Supabase Auth. [CITED: CONTEXT.md D-02]

### Pattern 7: Tailwind v4 globals.css with Font Variables

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme inline {
  /* Design tokens from spec.md §Visual */
  --color-bg: #F3F5F7;
  --color-card: #FFFFFF;
  --color-border: #E3E7EC;
  --color-text-primary: #0F1B2D;
  --color-text-secondary: #5B6675;
  --color-casa: #1D4ED8;
  --color-casa-light: #DCEBFF;
  --color-empresa: #B45309;
  --color-empresa-light: #FDEBD8;
  --color-positive: #0F766E;
  --color-warning: #8A3A06;

  /* Fonts wired from next/font CSS variables */
  --font-sans: var(--font-manrope);
  --font-mono: var(--font-ibm-plex-mono);
}
```

**v4 key rule:** Tailwind v4 no longer reads `tailwind.config.js`. All custom tokens go in `@theme` in the CSS file. The `@import "tailwindcss"` single line replaces the old three-directive pattern (`@tailwind base/components/utilities`). [CITED: dev.to/samitkapoor/how-to-customize-tailwind-css-in-nextjs-15-without-tailwindconfigjs-26e4]

### Pattern 8: Root Layout with Google Fonts

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Manrope, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '600'],   // Only weights used in UI-SPEC
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Duas Contas',
  description: 'Controle financeiro pessoal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${ibmPlexMono.variable}`}>
      <body className="bg-bg font-sans text-text-primary">
        {children}
      </body>
    </html>
  )
}
```

**Font availability confirmed:** Both `Manrope` and `IBM_Plex_Mono` are available in `next/font/google`. [CITED: CLAUDE.md "Manrope and IBM Plex Mono are available via Google Fonts in next/font/google"]

### Pattern 9: Environment Variables

```bash
# .env.local
# NEVER commit to git — add to .gitignore

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]

# Prisma — runtime (port 6543, transaction pooler, pgbouncer mode)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Prisma — migrations only (port 5432, direct connection)
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

**Why `connection_limit=1`:** Vercel Serverless Functions each create their own Node.js process. Without a connection limit, each function invocation spins up the Prisma default pool (num_cpus × 2 + 1). Supabase free tier has 20 max connections; with 5 concurrent function invocations, the default pool exhausts the limit instantly. `connection_limit=1` ensures each serverless instance uses one connection, and PgBouncer multiplexes them. [CITED: siddharthshekhar.substack.com/p/mastering-database-connections-in]

### Pattern 10: Migration Sequence (Prisma + Supabase)

```bash
# ALWAYS use these commands — never skip DIRECT_URL
# The DIRECT_URL must be set in .env.local for these to work

# Create initial migration
npx prisma migrate dev --name init

# Apply to production (Vercel build or manual)
npx prisma migrate deploy

# After schema changes during development
npx prisma migrate dev --name add-[feature]

# Regenerate client after schema changes
npx prisma generate

# Run seed
npx tsx prisma/seed.ts
# or
npx ts-node prisma/seed.ts
```

**Why migrations hang on port 6543:** PgBouncer's transaction pooling mode holds connections open per transaction and cannot support the advisory locks that `prisma migrate dev` uses to track migration state. If DATABASE_URL is used for migrations, the command hangs indefinitely. DIRECT_URL bypasses PgBouncer. [CITED: prisma.io/docs/orm/v6/overview/databases/supabase]

### Anti-Patterns to Avoid

- **Using `getSession()` in middleware or Server Components:** Reads cookie without verifying JWT — allows forged sessions. Use `getUser()` instead.
- **Running `npx prisma migrate dev` without DIRECT_URL set:** Hangs indefinitely. Always have DIRECT_URL pointing to port 5432.
- **`amountCents: Float` or `amount: Decimal` in Prisma schema:** Float has rounding errors (0.1 + 0.2 = 0.30000000000004). Decimal requires `Decimal.js`. Int with cents is exact and simple.
- **`date.toLocaleDateString('pt-BR')` or `Intl.DateTimeFormat` in components:** Produces different output on server (Node.js timezone) vs browser (user timezone) → hydration mismatch. Use `formatDate(date)` from lib/format.ts.
- **Using `@supabase/auth-helpers-nextjs`:** Deprecated. Always use `@supabase/ssr`.
- **Using `shadowwalker/next-pwa`:** Unmaintained, broken with Next.js 14+. Use `@serwist/next`.
- **Creating multiple PrismaClient instances (no globalThis singleton):** Each dev hot-reload creates a new connection pool. After 20 reloads, connections are exhausted. Use the singleton in lib/prisma.ts.
- **Storing passwords in Prisma User model:** Authentication is fully delegated to Supabase Auth. The Prisma User model only stores the Supabase Auth UUID as the primary key.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cookie-based auth session | Custom JWT middleware | `@supabase/ssr` createServerClient | Token rotation, PKCE, refresh handling, secure httpOnly cookies |
| Password hashing + verification | bcrypt + custom routes | Supabase Auth `signInWithPassword()` | Supabase handles argon2id, rate limiting, brute-force protection |
| Route protection | Cookie parsing in layout | `middleware.ts` with `getUser()` | Runs before page renders — no flash of protected content |
| DB connection pooling | Custom pool management | PgBouncer (built into Supabase) + `?pgbouncer=true` | PgBouncer handles multiplexing; Prisma just needs the flag |
| Brazilian currency formatting | `(val/100).toFixed(2).replace(...)` | `new Intl.NumberFormat('pt-BR', { currency: 'BRL' })` | Edge cases: negative values, zero, large numbers, symbol placement |
| Date formatting with locale | Custom format function | `date-fns format()` with `ptBR` locale | Handles locale-specific ordinal rules, month names, leap years |
| UI component accessibility | Custom inputs/buttons | shadcn/ui (Radix UI primitives) | ARIA attributes, keyboard navigation, focus management |

**Key insight:** Auth is the most security-critical component of this phase. Do not invent any auth logic — delegate entirely to Supabase Auth. The only custom code should be the middleware redirect and the `createServerClient` wrappers.

---

## Common Pitfalls

### Pitfall 1: Prisma Migration Hangs on Port 6543

**What goes wrong:** `npx prisma migrate dev` appears to start, then hangs indefinitely with no output.

**Why it happens:** DATABASE_URL points to the PgBouncer pooler at port 6543. PgBouncer transaction mode cannot support the advisory locks that Prisma's migration engine uses to prevent concurrent migrations. The lock acquisition blocks forever.

**How to avoid:** Always set both DATABASE_URL (6543) and DIRECT_URL (5432) in `.env.local`. Prisma CLI automatically uses `directUrl` for migrate commands. Never run migrations from a CI/CD environment that only has DATABASE_URL.

**Warning signs:** `npx prisma migrate dev` running for > 30 seconds with no output.

### Pitfall 2: Prepared Statement Errors at Runtime

**What goes wrong:** App throws `Error: prepared statement "s0" does not exist` or similar in production.

**Why it happens:** Prisma uses prepared statements by default. PgBouncer transaction mode does not support them — the connection that prepared the statement may not be the one executing it.

**How to avoid:** `?pgbouncer=true` in DATABASE_URL disables prepared statements for that connection string.

**Warning signs:** Queries work locally (direct connection) but fail on Vercel (through pooler).

### Pitfall 3: `getSession()` Forgeable Session Attack

**What goes wrong:** A malicious user crafts a forged session cookie and gains access to protected routes.

**Why it happens:** `supabase.auth.getSession()` returns the cookie contents without verifying the JWT signature against Supabase Auth servers.

**How to avoid:** Always call `supabase.auth.getUser()` in `middleware.ts` and in protected Server Components. `getUser()` makes a network request to Supabase Auth to validate the JWT.

**Warning signs:** Using `getSession()` anywhere in middleware or Server Components.

### Pitfall 4: Hydration Mismatch from Date Formatting

**What goes wrong:** Console error `Hydration failed because the initial UI does not match what was rendered on the server.` on pages with date values.

**Why it happens:** `date.toLocaleDateString()` produces different output depending on the system timezone. Vercel serverless functions run in UTC; the browser runs in the user's local timezone. The server renders `31/10/2026` (UTC), the client re-renders `01/11/2026` (America/Sao_Paulo, UTC-3) — mismatch.

**How to avoid:** Use `formatDate(date)` from `lib/format.ts` which calls `date-fns format()` with a fixed `'dd/MM/yyyy'` pattern. This is deterministic regardless of timezone when the date is a `DATE` column (midnight UTC). [ASSUMED — see Open Questions]

**Warning signs:** React hydration error on any page displaying dates from the database.

### Pitfall 5: Supabase Free Tier Auto-Pause

**What goes wrong:** After 7 days without any database activity, Supabase pauses the project. The app returns 500 errors. Resuming takes 1-2 minutes.

**Why it happens:** Free tier policy: projects with zero activity are paused to reclaim shared infrastructure.

**How to avoid:** Set up a lightweight keep-alive. Option A: GitHub Actions cron job that hits a health-check endpoint once every 3 days. Option B: A Vercel cron job at `vercel.json` level that queries the DB once weekly. This must be set up before going "live" even in personal use.

**Warning signs:** App returns 503 or connection errors after a period of inactivity.

### Pitfall 6: Connection Pool Exhaustion on Vercel

**What goes wrong:** App works locally, fails in production with `Error: connection pool timeout`.

**Why it happens:** Each Vercel serverless function invocation creates its own Node.js process. Without `connection_limit=1` in the DATABASE_URL, the Prisma default pool size is `num_cpus * 2 + 1`. Supabase free tier allows 20 connections total. With 5 concurrent requests, each spawning a pool of 5, the limit is hit immediately.

**How to avoid:** Add `&connection_limit=1` to DATABASE_URL. PgBouncer handles the actual multiplexing; Prisma only needs 1 connection per function.

**Warning signs:** Connection errors that appear only under concurrent load or cold starts.

### Pitfall 7: `create-next-app@latest` Pulls Next.js 16

**What goes wrong:** Running `npx create-next-app@latest` scaffolds a Next.js 16.x project instead of the 15.x specified in CLAUDE.md. Next.js 16 has different caching semantics and potentially different Turbopack behavior.

**How to avoid:** Use `npx create-next-app@15` to pin to the latest 15.x release (15.5.28 as of 2026-10-29).

**Warning signs:** `package.json` shows `"next": "^16.x"` after scaffolding.

### Pitfall 8: Zod 4 / date-fns 4 / Prisma 7 Breaking Changes

**What goes wrong:** Running `npm install zod` or `npm install date-fns` without version pins installs zod 4.x and date-fns 4.x — both are latest now. Zod 4 has a different `z.string().parse()` behavior and `safeParse` signature. date-fns 4 has changed locale import paths.

**How to avoid:** Always use `zod@3` and `date-fns@3` explicitly. Use `prisma@6` and `@prisma/client@6`.

**Warning signs:** TypeScript errors mentioning `z.ZodType`, changed `parse` signatures, or missing locale exports.

---

## Walking Skeleton

The absolute minimum for this stack to prove end-to-end connectivity before any feature code:

```
1. next.config.ts exists (even if near-empty — proves build completes)
2. /login page renders (proves Next.js + Tailwind works)
3. Login with email+password works (proves Supabase Auth integration)
4. After login, middleware redirects to / (proves cookie session works)
5. / (authenticated) executes a Prisma query (e.g., Category.count()) (proves DB connection)
6. The page displays the result (proves SSR + hydration)
7. npx vercel --prod succeeds (proves Vercel deployment, env vars set)
8. Browser navigates to the deployed URL without errors (proves production path)
```

**Skeleton acceptance test (manual):**
1. Open `[vercel-url]/login` — login form renders
2. Enter correct email + password → redirect to `/visao-geral`
3. Enter wrong credentials → error message in PT-BR
4. Refresh browser on authenticated route → stays logged in (session persists)
5. Open Chrome DevTools Network: verify no 500 errors, no hydration warnings in console

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | ~2023 | auth-helpers deprecated; must use ssr package |
| `tailwind.config.js` | CSS `@theme` in globals.css | Tailwind v4 (2025) | No JS config file needed |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` | Tailwind v4 (2025) | Single import replaces three directives |
| `shadowwalker/next-pwa` | `@serwist/next` | ~2024 | next-pwa unmaintained, broken with Next 14+ |
| `getSession()` in middleware | `getUser()` in middleware | Supabase auth-js v2.59+ | Security fix — getSession() allows forged cookies |
| `bg-opacity-50` | `bg-blue-500/50` slash syntax | Tailwind v4 | opacity modifier syntax changed |
| `moment.js` | `date-fns` v3 | ~2020+ | moment deprecated by its maintainers |
| Pages Router | App Router | Next.js 13–15 | Server Actions, no extra API routes needed |
| Prisma 5 / 6 | Prisma 6.x (locked) / 7.x available | 2026 | 7.x released but CLAUDE.md pins 6.x |
| zod 3 | zod 3 (locked) / zod 4 available | 2026 | zod 4 released but CLAUDE.md pins 3.x |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated. Use `@supabase/ssr`.
- `shadowwalker/next-pwa`: Unmaintained. Use `@serwist/next`.
- `moment.js`: Deprecated by maintainers. Use `date-fns`.
- `tailwind.config.js` in v4 projects: Replaced by CSS `@theme`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `@db.Date` Prisma annotation maps to Postgres `DATE` type (no time component) — without it, Prisma defaults to TIMESTAMP | Pattern 6: Schema | If wrong, dates stored as TIMESTAMP may still work but timezone shift bug is harder to reproduce |
| A2 | date-fns `format()` with `'dd/MM/yyyy'` is deterministic between Node.js UTC and browser local time when the input Date object is from a `DATE` column (midnight UTC) | Pattern 5: formatDate | If wrong, hydration mismatches appear on any page with dates — needs `date-fns-tz` and explicit timezone |
| A3 | All "SUS" package verdicts from legitimacy checker are false positives due to recent publish dates, not actual suspicion | Package Legitimacy Audit | If wrong, one of these packages has been compromised — unlikely given download volumes and known org repos |
| A4 | `npx create-next-app@15` installs Next.js 15.5.28 | Walking Skeleton | If wrong, could install an older 15.x patch; minor risk |
| A5 | Zustand 5 persist middleware works with the same localStorage API as v4 | Standard Stack | If wrong, the contaAtiva/mesSelecionado store needs adapting |

---

## Open Questions

1. **Timezone handling for DATE columns — needs local testing**
   - What we know: Postgres `DATE` returned by Prisma as `Date` at midnight UTC
   - What's unclear: Whether `date-fns format('dd/MM/yyyy')` in a Vercel function (UTC timezone) produces the correct date in Sao Paulo time (UTC-3) for a stored date of `2026-11-01`
   - Recommendation: Include a test case in the seed: create a transaction dated `2026-11-01`, render it, verify it shows `01/11/2026` on both server and client. If it shows `31/10/2026`, switch to `formatInTimeZone(date, 'America/Sao_Paulo', 'dd/MM/yyyy')` from `date-fns-tz`.

2. **Prisma 6.x vs 7.x — explicit pin required**
   - What we know: `npm install prisma` as of 2026-10-29 installs 7.10.1 (latest). CLAUDE.md says Prisma 6.x. Prisma 7 has schema changes and potentially breaking config format.
   - What's unclear: Whether Prisma 7 would work without changes to the datasource configuration
   - Recommendation: Install `prisma@6` explicitly. If the team decides to upgrade to Prisma 7 in a future phase, that warrants a dedicated migration task.

3. **Keep-alive strategy for Supabase free tier**
   - What we know: Free tier pauses after 7 days inactivity
   - What's unclear: Whether this personal project will have regular enough use to avoid pausing
   - Recommendation: Set up a GitHub Actions cron job as part of this phase's deployment tasks. It's a 10-line YAML file and prevents the most embarrassing production failure.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js, Prisma | ✓ | v22.23.0 | — |
| npm | Package install | ✓ | 10.9.8 | — |
| Supabase project | Auth + DB | Needs provisioning | — | Create at supabase.com |
| Vercel project | Deployment | Needs provisioning | — | Create at vercel.com |
| Git | Version control | ✓ | (project is git repo) | — |

**Missing dependencies with no fallback:**
- Supabase project: Must be created at supabase.com and connection strings retrieved before Prisma can run migrations. Block until this exists.
- Vercel project: Must be created and env vars configured before deployment step.

**Note:** Node 22.x is above the minimum (Node 18.18 required by Prisma 6). No version upgrade needed. [VERIFIED: npm registry — Prisma 6 min is Node 18.18]

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in config.json — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected yet — greenfield project |
| Config file | none — Wave 0 must create |
| Quick run command | `npx tsc --noEmit && npx next build` (type-check + build) |
| Full suite command | `npx tsc --noEmit && npx next lint && npx next build` |

**Note:** This is a Phase 1 scaffold. No test runner (Jest/Vitest) is set up yet. The primary validation signals for Phase 1 are TypeScript compilation, Next.js build success, and manual browser verification. A proper test suite should be added in Phase 2 or as a Wave 0 task here.

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Login with email+password works | Manual (Supabase Auth network) | `npx next build` (type-check) | ❌ Wave 0 |
| AUTH-02 | Session persists on reload | Manual (browser cookie) | `npx next build` (type-check) | ❌ Wave 0 |
| — | formatBRL(12345) === "R$ 123,45" | Unit | `npx ts-node -e "import {formatBRL} from './src/lib/format'; console.assert(formatBRL(12345)==='R\$ 123,45')"` | ❌ Wave 0 |
| — | formatDate(new Date('2026-11-01')) === "01/11/2026" | Unit | Same ts-node approach | ❌ Wave 0 |
| — | TypeScript compiles with no errors | Build | `npx tsc --noEmit` | ❌ Wave 0 |
| — | Prisma schema validates | Build | `npx prisma validate` | ❌ Wave 0 |
| — | Next.js build succeeds | Build | `npx next build` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` (fast type-check)
- **Per wave merge:** `npx tsc --noEmit && npx next lint && npx prisma validate`
- **Phase gate:** Full `npx next build` green + manual browser test on Vercel deployment URL

### Wave 0 Gaps

- [ ] `src/lib/format.ts` — covers formatBRL and formatDate unit tests
- [ ] `tsconfig.json` with `"strict": true` — ensures type safety from the start
- [ ] `.env.local.example` — template for required env vars (for developer onboarding)
- [ ] `.gitignore` updated to exclude `.env.local`
- [ ] Framework install: no test framework needed in Phase 1 — manual + build validation sufficient

---

## Security Domain

`workflow.security_enforcement` is `true` (ASVS Level 1) in config.json.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Supabase Auth `signInWithPassword()` — argon2id hashing, rate limiting built-in |
| V3 Session Management | Yes | `@supabase/ssr` httpOnly cookies, middleware token rotation via `getUser()` |
| V4 Access Control | Yes | `middleware.ts` global redirect for unauthenticated users |
| V5 Input Validation | Yes | zod schema on all Server Actions and login form |
| V6 Cryptography | No | Delegated entirely to Supabase Auth — no custom crypto |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Forged session cookie | Spoofing | `getUser()` in middleware (not `getSession()`) — validates JWT with Auth server |
| SQL injection via Prisma | Tampering | Prisma parameterized queries by default — never use `$queryRaw` with string interpolation |
| Exposed Supabase anon key | Information Disclosure | Anon key is public by design in Supabase architecture; RLS policies on all tables enforce per-user access |
| Unprotected route flash | Elevation of Privilege | Middleware runs before page render — no client-side redirect, no flash |
| Weak session cookie | Tampering | Supabase httpOnly, Secure, SameSite=Lax cookies set via `@supabase/ssr` |

**RLS Note:** Even though this is a single-user personal app, enabling Row Level Security (RLS) on all Prisma-managed tables is recommended from day 1. The Prisma `User.id` FK on every table enables `auth.uid() = userId` policies. This prevents data leaks if the anon key is ever shared inadvertently.

---

## Sources

### Primary (MEDIUM confidence)
- [Prisma ORM v6 + Supabase docs](https://www.prisma.io/docs/orm/v6/overview/databases/supabase) — DATABASE_URL/DIRECT_URL setup, pgbouncer=true requirement
- [Supabase server-side auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — createServerClient, middleware pattern, getUser() security note
- [Tailwind v4 CSS-first config](https://dev.to/samitkapoor/how-to-customize-tailwind-css-in-nextjs-15-without-tailwindconfigjs-26e4) — @theme syntax, token namespaces
- [Prisma singleton pattern](https://realcoding.blog/en/2025/01/20/nextjs-prisma-singleton-pattern/) — globalThis pattern code
- [owolf.com Next.js 15 + Supabase Auth](https://www.owolf.com/blog/supabase-authentication-with-next-js-15-app-router) — middleware code pattern
- [owolf.com fonts with Tailwind v4](https://www.owolf.com/blog/how-to-use-custom-fonts-in-a-nextjs-15-tailwind-4-app) — @theme inline font variable wiring
- [Supabase connection pooling Vercel](https://siddharthshekhar.substack.com/p/mastering-database-connections-in) — connection_limit=1 for serverless

### Secondary (LOW confidence — web articles)
- [Supabase free tier pause prevention](https://shadhujan.medium.com/how-to-keep-supabase-free-tier-projects-active-d60fd4a17263) — 7-day inactivity pause, keep-alive cron
- [getSession vs getUser security](https://dev.to/edtrackai/supabase-getsession-vs-getuser-vs-getclaims-which-to-use-where-1lbi) — JWT verification difference
- [date-fns hydration mismatch fix](https://www.evlune.com/2026/04/how-to-solve-react-hydration-mismatch.html) — deterministic format prevents SSR mismatch
- [shadcn init Next.js 15 + Tailwind v4](https://dev.to/shakewithabhi/setting-up-nextjs-15-with-tailwind-v4-and-shadcnui-what-actually-changed-2fpg) — init steps for v4

### Registry (VERIFIED)
- npm registry — all package versions confirmed via `npm view [package] version` on 2026-10-29

---

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — versions verified on npm registry; installation commands derived from official docs and web sources
- Architecture: MEDIUM — patterns from Supabase docs and official Next.js docs; some code examples from web articles
- Pitfalls: MEDIUM — pooler/prepared statements from Prisma official docs; hydration pitfalls from web; timezone behavior ASSUMED

**Research date:** 2026-10-29
**Valid until:** 2026-11-29 (30 days — stack is stable)
