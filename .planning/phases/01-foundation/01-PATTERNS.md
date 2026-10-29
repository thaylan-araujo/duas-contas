# Phase 1: Foundation — Pattern Map

**Mapped:** 2026-10-29
**Files analyzed:** 22 new files
**Analogs found:** 0 / 22 (greenfield project — no existing code)

> Note: No existing analogs in the codebase. All patterns are derived from the locked stack conventions in CLAUDE.md and the verified code examples in RESEARCH.md. The planner MUST copy these patterns verbatim — they prevent three silent production bugs (pooler crash, float drift, timezone displacement).

---

## File Classification

| New File | Role | Data Flow | Pattern Archetype | Match Quality |
|----------|------|-----------|-------------------|---------------|
| `src/middleware.ts` | middleware | request-response | Next.js App Router middleware + Supabase SSR | research-derived |
| `src/lib/supabase/server.ts` | utility | request-response | Supabase SSR server client | research-derived |
| `src/lib/supabase/client.ts` | utility | request-response | Supabase SSR browser client | research-derived |
| `src/lib/prisma.ts` | utility | CRUD | Prisma globalThis singleton | research-derived |
| `src/lib/format.ts` | utility | transform | Pure formatter functions | research-derived |
| `prisma/schema.prisma` | config | CRUD | Prisma schema with dual-URL datasource | research-derived |
| `prisma/seed.ts` | utility | CRUD | Prisma seed script | research-derived |
| `src/app/layout.tsx` | component | request-response | Next.js root layout — Server Component | research-derived |
| `src/app/globals.css` | config | — | Tailwind v4 CSS-first config with @theme | research-derived |
| `src/app/(auth)/login/page.tsx` | component | request-response | Next.js page — Client Component | research-derived |
| `src/app/(auth)/login/_components/LoginForm.tsx` | component | request-response | React Hook Form + Zod + Supabase signInWithPassword | research-derived |
| `src/app/(authed)/layout.tsx` | component | request-response | Next.js group layout — Server Component (shell) | research-derived |
| `src/app/(authed)/page.tsx` | component | request-response | Redirect page — Server Component | research-derived |
| `src/app/(authed)/visao-geral/page.tsx` | component | request-response | Placeholder page — Server Component | research-derived |
| `src/app/(authed)/lancamentos/page.tsx` | component | request-response | Placeholder page — Server Component | research-derived |
| `src/app/(authed)/planejamento/page.tsx` | component | request-response | Placeholder page — Server Component | research-derived |
| `src/app/(authed)/contas-fixas/page.tsx` | component | request-response | Placeholder page — Server Component | research-derived |
| `src/app/(authed)/canais/page.tsx` | component | request-response | Placeholder page — Server Component | research-derived |
| `src/app/(authed)/dividas/page.tsx` | component | request-response | Placeholder page — Server Component | research-derived |
| `src/app/(authed)/calendario/page.tsx` | component | request-response | Placeholder page — Server Component | research-derived |
| `src/app/(authed)/relatorio/page.tsx` | component | request-response | Placeholder page — Server Component | research-derived |
| `src/store/conta.ts` | store | event-driven | Zustand store with localStorage persistence | research-derived |

---

## Pattern Assignments

### `src/middleware.ts` (middleware, request-response)

**Archetype:** Next.js App Router middleware with Supabase SSR session refresh and route protection

**Critical rule:** Use `getUser()` — NOT `getSession()`. `getSession()` reads the cookie without verifying the JWT signature; a forged cookie can bypass auth.

**Full pattern** (copy verbatim from RESEARCH.md Pattern 3):

```typescript
// src/middleware.ts
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

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

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

---

### `src/lib/supabase/server.ts` (utility, request-response)

**Archetype:** Supabase SSR server client — used in Server Components and Server Actions

**Full pattern** (copy verbatim from RESEARCH.md Pattern 1):

```typescript
// src/lib/supabase/server.ts
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

---

### `src/lib/supabase/client.ts` (utility, request-response)

**Archetype:** Supabase SSR browser client — used in Client Components

**Full pattern** (copy verbatim from RESEARCH.md Pattern 2):

```typescript
// src/lib/supabase/client.ts
'use client'
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

### `src/lib/prisma.ts` (utility, CRUD)

**Archetype:** Prisma globalThis singleton — prevents connection pool exhaustion on dev hot-reload

**Critical rule:** Without this singleton, every Next.js hot reload creates a new PrismaClient instance with its own connection pool. Supabase free tier allows 20 connections; ~20 hot reloads exhaust the limit.

**Full pattern** (copy verbatim from RESEARCH.md Pattern 4):

```typescript
// src/lib/prisma.ts
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

---

### `src/lib/format.ts` (utility, transform)

**Archetype:** Pure formatter functions — single source of truth for all monetary and date display

**Critical rules:**
- `formatBRL` accepts only integers (cents). Never pass floats. `123456` → `"R$ 1.234,56"`.
- `formatDate` uses `date-fns format()` with a fixed pattern — NOT `date.toLocaleDateString()`. The latter produces different output on Node.js UTC (Vercel) vs browser local timezone → React hydration mismatch.
- Both functions must be used for ALL display. Never format inline.

**Full pattern** (copy verbatim from RESEARCH.md Pattern 5):

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

---

### `prisma/schema.prisma` (config, CRUD)

**Archetype:** Prisma schema with dual-URL datasource configuration

**Critical rules:**
- `url` points to port 6543 (PgBouncer pooler) with `?pgbouncer=true` — prevents prepared statement errors at runtime.
- `directUrl` points to port 5432 (direct Postgres) — used only by `prisma migrate` CLI; prevents migration hangs on advisory locks.
- `amountCents Int` — NEVER `Float` or `Decimal`. Int arithmetic is exact.
- `date DateTime @db.Date` — the `@db.Date` annotation maps to Postgres `DATE` type. Without it, Prisma defaults to `TIMESTAMP WITH TIME ZONE`, breaking the timezone strategy.

**Full pattern** (copy verbatim from RESEARCH.md Pattern 6):

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

---

### `prisma/seed.ts` (utility, CRUD)

**Archetype:** Prisma seed script — creates User mirror record + default categories per account

**Key conventions:**
- Import `prisma` from the singleton in `lib/prisma.ts` — NOT `new PrismaClient()` directly in the script.
- Wrap in `main()` function, call `prisma.$disconnect()` in `finally`.
- Create User with the Supabase Auth UUID (obtained from Supabase Dashboard after creating the user there first, per D-04).
- Categories are account-specific: each `Category` row has `account: 'CASA'` or `account: 'EMPRESA'` — never a shared category without an account.
- Use `upsert` (not `create`) so the script is re-runnable without throwing duplicate errors.

**Structural pattern:**

```typescript
// prisma/seed.ts
import { PrismaClient, ContaType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const SUPABASE_USER_ID = process.env.SEED_USER_ID!
  // 1. Mirror the Supabase Auth user in Prisma
  await prisma.user.upsert({
    where: { id: SUPABASE_USER_ID },
    update: {},
    create: { id: SUPABASE_USER_ID },
  })

  // 2. Default categories for CASA
  const casaCategories = ['Alimentação', 'Combustível', 'Lazer', 'Contas fixas', 'Outros']
  for (const name of casaCategories) {
    await prisma.category.upsert({
      where: { name_account_userId: { name, account: ContaType.CASA, userId: SUPABASE_USER_ID } },
      update: {},
      create: { name, account: ContaType.CASA, userId: SUPABASE_USER_ID },
    })
  }

  // 3. Default categories for EMPRESA
  const empresaCategories = ['Fornecedores', 'Anúncios', 'Taxas e impostos', 'Pró-labore', 'Outros']
  for (const name of empresaCategories) {
    await prisma.category.upsert({
      where: { name_account_userId: { name, account: ContaType.EMPRESA, userId: SUPABASE_USER_ID } },
      update: {},
      create: { name, account: ContaType.EMPRESA, userId: SUPABASE_USER_ID },
    })
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
```

---

### `src/app/layout.tsx` (component, request-response)

**Archetype:** Next.js root layout — Server Component, sets `lang="pt-BR"`, mounts font CSS variables

**Critical rules:**
- `lang="pt-BR"` on `<html>` — required for correct browser locale behavior and accessibility.
- Both fonts loaded via `next/font/google` and applied as CSS variables wired into Tailwind `@theme`. The variable names must match what is declared in `globals.css`.
- This is a Server Component (no `'use client'`).

**Full pattern** (copy verbatim from RESEARCH.md Pattern 8):

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
  weight: ['400', '600'],
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

---

### `src/app/globals.css` (config, —)

**Archetype:** Tailwind v4 CSS-first configuration with `@theme` design tokens

**Critical rules:**
- `@import "tailwindcss"` replaces the old three-directive pattern (`@tailwind base/components/utilities`). Using the old directives in a v4 project causes build errors.
- All design tokens go in `@theme inline { … }` — there is no `tailwind.config.js` in v4.
- Font variables reference the CSS variables set by `next/font` on `<html>` — they must use `var(--font-manrope)` not a raw font name.
- Opacity is slash syntax: `bg-blue-500/50`, NOT `bg-opacity-50` (v3 syntax, removed in v4).

**Full pattern** (copy verbatim from RESEARCH.md Pattern 7):

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

---

### `src/app/(auth)/login/page.tsx` (component, request-response)

**Archetype:** Next.js page shell — renders `<LoginForm>`. Can be a Server Component since it has no direct interactivity.

**Key conventions:**
- File is a thin wrapper that renders `<LoginForm />` from `_components/`.
- No `'use client'` here — the Client Component boundary lives in `LoginForm.tsx`.

```typescript
// src/app/(auth)/login/page.tsx
import { LoginForm } from './_components/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg">
      <LoginForm />
    </main>
  )
}
```

---

### `src/app/(auth)/login/_components/LoginForm.tsx` (component, request-response)

**Archetype:** React Hook Form + Zod + Supabase `signInWithPassword()` — Client Component

**Key conventions:**
- `'use client'` at top — this is a Client Component (has form state, loading state, error display).
- Schema validated with `zod@3` (`z.object({ email: z.string().email(), password: z.string().min(1) })`).
- Uses `react-hook-form` with `zodResolver`.
- Calls `createSupabaseBrowserClient()` from `lib/supabase/client.ts` — NOT a direct import of `@supabase/supabase-js`.
- On success: `router.push('/visao-geral')` via `useRouter` from `next/navigation`.
- Error messages in Portuguese: "Email ou senha inválidos", "Ocorreu um erro. Tente novamente."
- Input and button components from shadcn/ui. Button minimum height 44px (mobile requirement).

```typescript
// src/app/(auth)/login/_components/LoginForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) {
      setServerError('Email ou senha inválidos')
      return
    }
    router.push('/visao-geral')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4 p-6 bg-card rounded-lg shadow">
      <h1 className="text-xl font-semibold text-text-primary">Entrar</h1>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>
      {serverError && <p className="text-sm text-red-500">{serverError}</p>}
      <Button type="submit" disabled={isSubmitting} className="w-full min-h-[44px]">
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
```

---

### `src/app/(authed)/layout.tsx` (component, request-response)

**Archetype:** Next.js group layout — Server Component — renders the shell (sidebar + bottom nav) around all authenticated pages

**Key conventions:**
- Server Component (no `'use client'`) — the shell itself is static markup; active link state is handled client-side inside child components.
- Renders `<Sidebar>` (desktop, hidden on mobile) and `<BottomNav>` (mobile, hidden on desktop) as siblings to `{children}`.
- Both `<Sidebar>` and `<BottomNav>` are in `_components/` collocated in `(authed)/`.
- Desktop sidebar contains all sections from D-07: Visão geral, Casa (Lançamentos, Planejamento e semanas, Contas fixas e metas), Empresa (Canais e caixa, Dívidas), Geral (Calendário, Relatório mensal).
- Mobile bottom nav shows the 5 highest-priority sections as icon tabs (per Claude's Discretion in D-08).

```typescript
// src/app/(authed)/layout.tsx
import { Sidebar } from './_components/Sidebar'
import { BottomNav } from './_components/BottomNav'

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar />
      {/* Main content */}
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      {/* Mobile bottom nav — hidden on desktop */}
      <BottomNav />
    </div>
  )
}
```

---

### Placeholder Pages: visao-geral, lancamentos, planejamento, contas-fixas, canais, dividas, calendario, relatorio (component, request-response)

**Archetype:** Next.js Server Component page — minimal "Em breve" placeholder

**Key conventions:**
- No `'use client'` — Server Components by default.
- All display text in Portuguese.
- Structure is identical for all placeholder pages; only the title changes.

```typescript
// src/app/(authed)/visao-geral/page.tsx  (repeat pattern for each route)
export default function VisaoGeralPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2 text-text-secondary">
      <p className="text-lg font-medium">Visão Geral</p>
      <p className="text-sm">Em breve</p>
    </div>
  )
}
```

---

### `src/app/(authed)/page.tsx` (component, request-response)

**Archetype:** Server Component redirect — routes `/` to `/visao-geral`

```typescript
// src/app/(authed)/page.tsx
import { redirect } from 'next/navigation'

export default function AuthedRootPage() {
  redirect('/visao-geral')
}
```

---

### `src/store/conta.ts` (store, event-driven)

**Archetype:** Zustand store with localStorage persistence — holds `contaAtiva` and `mesSelecionado`

**Key conventions:**
- `'use client'` is NOT added to the store file itself; it's used only in Client Components.
- Persistence via `zustand/middleware` `persist` with `localStorage` storage.
- `contaAtiva` type is `'CASA' | 'EMPRESA'` — same values as the Prisma `ContaType` enum (but as a plain union type, not imported from `@prisma/client` which is server-only).
- `mesSelecionado` is a string in `'YYYY-MM'` format for easy serialization.

```typescript
// src/store/conta.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ContaAtiva = 'CASA' | 'EMPRESA'

interface ContaStore {
  contaAtiva: ContaAtiva
  mesSelecionado: string  // 'YYYY-MM' format
  setContaAtiva: (conta: ContaAtiva) => void
  setMesSelecionado: (mes: string) => void
}

export const useContaStore = create<ContaStore>()(
  persist(
    (set) => ({
      contaAtiva: 'CASA',
      mesSelecionado: new Date().toISOString().slice(0, 7), // current month
      setContaAtiva: (conta) => set({ contaAtiva: conta }),
      setMesSelecionado: (mes) => set({ mesSelecionado: mes }),
    }),
    {
      name: 'duas-contas-store',
    }
  )
)
```

---

## Shared Patterns

### Environment Variables
**Apply to:** `.env.local`, Vercel dashboard env var configuration, any file that references `process.env`

```bash
# .env.local — NEVER commit to git
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]

# Runtime (port 6543 — transaction pooler, pgbouncer mode)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Migrations only (port 5432 — direct connection, bypasses PgBouncer)
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Required for seed.ts only — not committed; set manually before running seed
SEED_USER_ID=[supabase-auth-uuid]
```

### TypeScript Import Path Convention
**Apply to:** All TypeScript files

- Use `@/` alias for all project imports: `import { prisma } from '@/lib/prisma'`
- Never use relative paths that traverse more than one directory level up: `../../lib/prisma` → `@/lib/prisma`
- `@/` maps to `src/` (configured in `tsconfig.json` via `create-next-app --import-alias "@/*"`)

### Monetary Value Convention
**Apply to:** All components, services, actions, and the Prisma schema

- Store: `Int` in Postgres (cents). Example: R$ 12,34 is stored as `1234`.
- Display: always call `formatBRL(cents)` from `@/lib/format`.
- Never pass a float to any database write. Convert at the form boundary: `Math.round(parseFloat(input.replace(',', '.')) * 100)`.
- Never format inline with `.toFixed(2)` or string manipulation.

### Date Convention
**Apply to:** All components, services, actions, and the Prisma schema

- Store: Prisma `DateTime @db.Date` → Postgres `DATE` column. No time component.
- Display: always call `formatDate(date)` from `@/lib/format`.
- Never use `date.toLocaleDateString()`, `Intl.DateTimeFormat`, or `moment()`.
- Input: HTML `<input type="date">` returns `'YYYY-MM-DD'` string; convert with `new Date(value + 'T00:00:00')` before writing to DB.

### Portuguese UI Text Convention
**Apply to:** All components

- All user-facing strings in Portuguese do Brasil.
- Error messages: "Email ou senha inválidos", "Ocorreu um erro. Tente novamente.", "Campo obrigatório."
- Loading states: "Carregando…", "Salvando…", "Entrando…"
- Empty states: "Nenhum lançamento encontrado", "Em breve"
- Never use English in any text the user sees.

### Mobile Touch Target Convention
**Apply to:** All interactive components (buttons, links, inputs)

- Minimum height `44px` on all clickable elements: `min-h-[44px]` in Tailwind.
- This is a hard requirement per CLAUDE.md for PWA usability.

---

## No Analog Found

All files in this phase are new (greenfield project). The table below records files with no precedent in either the codebase or standard framework boilerplate — the planner should derive these from RESEARCH.md patterns directly.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/app/(authed)/_components/Sidebar.tsx` | component | request-response | Navigation shell component — no framework analog; derive from D-07 section list |
| `src/app/(authed)/_components/BottomNav.tsx` | component | request-response | Mobile bottom navigation bar — no framework analog; derive from D-08 and spec.md |
| `.github/workflows/keep-alive.yml` | config | — | GitHub Actions keep-alive cron — no app code analog; 10-line YAML pattern from RESEARCH.md Pitfall 5 |
| `next.config.ts` | config | — | Standard Next.js config stub; must leave `@serwist/next` stub commented or imported for Phase 8 readiness |
| `.env.local.example` | config | — | Environment variable template for developer onboarding |

---

## Anti-Patterns Reference

The following are explicitly forbidden. The planner must flag any plan step that would introduce these.

| Anti-Pattern | Forbidden Code | Safe Alternative |
|--------------|----------------|-----------------|
| Forged session vulnerability | `supabase.auth.getSession()` in middleware | `supabase.auth.getUser()` |
| Migration hang | `npx prisma migrate dev` without DIRECT_URL | Set DIRECT_URL to port 5432 |
| Float money | `amountCents Float` or `amount Decimal` in schema | `amountCents Int` (cents) |
| Timezone hydration mismatch | `date.toLocaleDateString('pt-BR')` in any component | `formatDate(date)` from lib/format |
| Deprecated auth package | `@supabase/auth-helpers-nextjs` | `@supabase/ssr` |
| Unmaintained PWA | `shadowwalker/next-pwa` | `@serwist/next` |
| Connection pool exhaustion | Multiple `new PrismaClient()` calls | Single singleton in `lib/prisma.ts` |
| Wrong Next.js version | `npx create-next-app@latest` | `npx create-next-app@15` |
| Wrong library versions | `npm install zod` / `prisma` / `date-fns` without pins | `zod@3`, `prisma@6`, `date-fns@3` |
| Tailwind v3 directives in v4 | `@tailwind base; @tailwind components; @tailwind utilities` | `@import "tailwindcss"` |
| English UI text | Any English string in component render output | Portuguese do Brasil |

---

## Metadata

**Analog search scope:** No search performed — project is greenfield with no existing source files.
**Pattern source:** RESEARCH.md verified patterns + CLAUDE.md locked conventions + CONTEXT.md decisions.
**Files scanned:** 0 source files (planning documents only).
**Pattern extraction date:** 2026-10-29
**Valid until:** 2026-11-29 (stack is stable per RESEARCH.md)
