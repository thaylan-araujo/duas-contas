# Stack Research

**Domain:** Personal finance web app (two-account ledger with PWA)
**Researched:** 2026-10-28
**Confidence:** MEDIUM (cross-referenced official docs, Prisma.io, Supabase.com, and community posts)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.x (latest 15.5.28) | Full-stack React framework | Vercel-native, App Router is the stable paradigm since v15, Server Actions eliminate the need for a separate API layer, Turbopack stable for dev |
| TypeScript | 5.x (min 5.1 required by Prisma 6) | Type safety across front and back | Catches schema/form/query mismatches at compile time — critical in finance apps where a wrong number type is a real bug |
| Tailwind CSS | 4.x | Utility-first CSS | V4 ships with CSS-first config (no tailwind.config.js), automatic content detection, 6x faster builds than v3; native in Next.js create command |
| Supabase | Managed (no version, use latest JS client) | Postgres hosting + Auth + Storage | Free tier covers this project's entire lifetime; RLS enforces data isolation at DB level; pairing Supabase Auth with Supabase DB avoids a second dependency |
| Prisma | 6.x | ORM and migration runner | Type-safe queries, schema-as-code migrations, first-class Supabase guide; v6 has rewritten internals for better performance |

### Router Decision

**Use App Router, not Pages Router.**

App Router is the default since Next.js 13 and is now the only architecture receiving new features. Pages Router is in maintenance mode. For a greenfield project starting in 2025/2026, Pages Router is a dead end.

Pattern to follow:
- All pages and layouts → Server Components by default (zero JS sent to browser)
- Forms, charts, interactive UI → Client Components (`'use client'`)
- Data mutations → Server Actions (replaces API routes for writes)
- Protected routes → `middleware.ts` that checks `supabase.auth.getUser()`

### Authentication

**Use Supabase Auth, not NextAuth.**

Since the project is already on Supabase, Supabase Auth is the zero-overhead choice. It integrates via cookie-based sessions through `@supabase/ssr`, which is the only officially supported package for Next.js 15 App Router (the old `auth-helpers` package is deprecated). Single-user app needs email+password only — no OAuth, no magic links needed.

NextAuth v5 would require an additional database adapter configuration, a separate session strategy, and more env vars — all complexity with no payoff when Supabase Auth already exists.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | 2.x | Supabase client for queries and auth | Every file that reads/writes DB or checks auth state |
| @supabase/ssr | latest | Cookie-based sessions for App Router | Required for auth to work server-side; replaces `@supabase/auth-helpers-nextjs` |
| recharts | 2.x (2.12+) | Charts — bar, line, area, pie | Financial dashboards (spending by category, cash flow projection); must be wrapped in `'use client'` |
| shadcn/ui | latest | Accessible component primitives | Buttons, dialogs, sheets, select, datepicker — copy-paste components built on Radix UI; compatible with Tailwind v4 as of 2025 |
| react-hook-form | 7.x | Form state management | Every data entry form; use with zod resolver for client-side validation |
| zod | 3.x | Schema validation | Shared between client form validation and Server Action validation — single schema eliminates drift |
| date-fns | 3.x | Date manipulation and formatting | DD/MM/YYYY formatting, PT-BR locale (import `ptBR` from `date-fns/locale/pt-BR`), week/month calculations for budget periods |
| @serwist/next | latest | PWA service worker + manifest | Required for installable PWA on mobile; replaces the deprecated `next-pwa` and `@ducanh2912/next-pwa` |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Prisma CLI | Schema migrations and DB introspection | `npx prisma migrate dev` (always uses DIRECT_URL, never the pooler) |
| Vercel CLI | Local dev with production env parity | `vercel dev` runs Next.js with actual env vars from Vercel dashboard |
| Prettier | Code formatting | No config needed in most cases; add `prettier-plugin-tailwindcss` for class sorting |
| ESLint | Linting | Next.js ships with ESLint config; enable `react-hooks` rules |

---

## Critical Configuration: Prisma + Supabase Connection Pooling

This is the most common source of broken deployments. Get it right from day one.

### Environment Variables

```env
# .env.local
# Transaction pooler — used by Prisma Client at runtime (port 6543)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection — used ONLY by Prisma CLI for migrations (port 5432)
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

The `?pgbouncer=true` disables prepared statements, which is mandatory for PgBouncer transaction mode. The `?connection_limit=1` prevents Vercel serverless functions from exhausting the 60-connection limit (each invocation would otherwise open its own pool).

### Prisma Schema

```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### What the Two Ports Are

| Port | Mode | Used By |
|------|------|---------|
| 6543 | PgBouncer transaction pooler | App at runtime — efficient, but no prepared statements |
| 5432 | Direct Postgres | Prisma CLI migrations only — full SQL feature support |

Never run `prisma migrate dev` against port 6543. It will hang indefinitely on advisory lock acquisition.

---

## PWA Setup

### Use `@serwist/next`

The original `shadowwalker/next-pwa` has not been updated in 2+ years. `@ducanh2912/next-pwa` itself recommends migrating to `@serwist/next` (same author, Serwist is the successor).

```js
// next.config.mjs
import withSerwist from "@serwist/next";

const withSerwistConfig = withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

export default withSerwistConfig({ /* your Next.js config */ });
```

```ts
// app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

### Web App Manifest

Use Next.js built-in manifest support — no separate manifest.json file needed:

```ts
// app/manifest.ts
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Duas Contas",
    short_name: "Duas Contas",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F5F7",
    theme_color: "#1D4ED8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
```

---

## Supabase Free Tier: The Pause Problem

Free projects are paused after **7 days of database inactivity**. For a personal finance app used daily this is usually fine, but add a safety net with a Vercel Cron Job from day one:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/ping",
      "schedule": "0 8 * * *"
    }
  ]
}
```

The `/api/ping` route runs a trivial `SELECT 1` query. Free Vercel hobby plan supports 2 cron jobs. This also prevents the cold-start delay from a paused project surprising the user.

---

## Tailwind v4 Key Differences vs v3

| Feature | v3 | v4 |
|---------|----|----|
| Config file | `tailwind.config.js` required | No config file; tokens go in CSS `@theme` |
| CSS directives | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| Content paths | Must be declared in config | Auto-detected from project files |
| Opacity utilities | `bg-opacity-50`, `text-opacity-75` | `bg-blue-500/50` slash syntax only |
| Build speed | ~1100ms | ~180ms |

The project's custom colors (Casa blue `#1D4ED8`, Empresa amber `#B45309`) are defined in the CSS file:

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-casa: #1D4ED8;
  --color-empresa: #B45309;
  --color-background: #F3F5F7;
  --font-sans: "Manrope", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
}
```

---

## Recharts in App Router: Required Pattern

Recharts uses browser DOM APIs and cannot render on the server. Every chart component must be a Client Component:

```tsx
// components/spending-chart.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export function SpendingChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        {/* ... */}
      </BarChart>
    </ResponsiveContainer>
  );
}
```

If needed for code-splitting, import with `next/dynamic`:

```tsx
const SpendingChart = dynamic(() => import("./spending-chart"), { ssr: false });
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| App Router | Pages Router | Maintenance mode; no new features; Server Actions not available |
| Supabase Auth | NextAuth v5 | Adds a second auth layer when Supabase Auth is already available with zero extra infra |
| Prisma 6 | Drizzle ORM | Prisma has deeper Supabase docs and the schema migration workflow is more mature for non-power-users; Drizzle is faster but requires more manual setup |
| Recharts | Chart.js / Victory | Recharts is React-native and TypeScript-first; Chart.js is canvas-based and requires wrappers; Victory is heavier |
| @serwist/next | shadowwalker/next-pwa | next-pwa is unmaintained; Serwist is its maintained successor |
| date-fns v3 | dayjs | date-fns is tree-shakeable (only what you import); dayjs requires plugins for PT-BR which adds config overhead |
| shadcn/ui | Mantine / Ant Design | shadcn copies components into your repo — no version lock, full control, and the project already has a custom design system defined |
| Tailwind v4 | Tailwind v3 | v4 is the current stable release for Next.js 15 new projects; v3 requires explicit content paths and is slower |
| zod | yup / valibot | zod has the best TypeScript inference and is the de-facto standard for Next.js Server Actions validation |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `shadowwalker/next-pwa` | Unmaintained for 2+ years; broken with Next.js 14+ App Router | `@serwist/next` |
| `@supabase/auth-helpers-nextjs` | Deprecated; replaced by @supabase/ssr | `@supabase/ssr` |
| `moment.js` | Deprecated by its own maintainers; huge bundle size | `date-fns` v3 |
| `Pages Router` (`pages/` directory) | Maintenance mode in Next.js; no Server Actions; no PPR | App Router (`app/` directory) |
| NextAuth for this project | Adds unnecessary complexity on top of Supabase Auth | Supabase Auth via `@supabase/ssr` |
| `npx prisma migrate` against port 6543 | Hangs indefinitely — PgBouncer transaction mode blocks advisory locks | Always use DIRECT_URL (port 5432) for migrations |
| `DATABASE_URL` without `?pgbouncer=true` | Prepared statements fail in transaction pooler mode | Add `?pgbouncer=true` to the pooler URL |

---

## Installation

```bash
# Scaffold
npx create-next-app@latest duas-contas \
  --typescript --tailwind --eslint --app \
  --src-dir=false --import-alias="@/*"

# ORM + database
npm install prisma @prisma/client
npx prisma init

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# UI components
npx shadcn@latest init
# (shadcn pulls in Radix UI primitives automatically)

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# Charts
npm install recharts

# Date utilities
npm install date-fns

# PWA
npm install @serwist/next serwist
npm install -D webpack

# Fonts (if loading via next/font)
# Manrope and IBM Plex Mono are available via Google Fonts in next/font/google
```

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 15 | React 19 | React 19 is required for React Server Components in v15 |
| Prisma 6 | Node ≥ 18.18, TypeScript ≥ 5.1 | Check Node version on Vercel; use Node 20 runtime |
| Tailwind v4 | postcss ≥ 8 | Vercel auto-runs PostCSS; no extra config needed |
| @serwist/next | Next.js 13.2+ | Compatible with 15 |
| recharts 2.x | React 18 + 19 | Works; must be Client Component in App Router |
| shadcn/ui latest | Tailwind v4 | shadcn updated for v4 compatibility in 2025 |

---

## Sources

- [Prisma ORM v6 + Supabase official docs](https://www.prisma.io/docs/orm/v6/overview/databases/supabase) — DATABASE_URL / DIRECT_URL setup, port numbers
- [Configure Prisma with PgBouncer](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/pgbouncer) — `?pgbouncer=true` requirement
- [Prisma migrations hanging on Supabase poolers](https://dev.to/cekuu35/prisma-migrations-hanging-on-supabase-connection-poolers-root-cause-fix-3oic) — advisory lock root cause
- [Serwist docs for Next.js](https://serwist.pages.dev/docs/next) — PWA setup with App Router
- [Next.js 15 release notes](https://nextjs.org/blog/next-15) — caching changes, Turbopack stable, PPR stable
- [Tailwind v4 changes vs v3](https://dev.to/nayankyada/how-i-migrated-a-large-nextjs-project-from-tailwind-css-v3-to-v4-133e) — CSS-first config, breaking utility class changes
- [Supabase free tier limits](https://nayankyada.com/blog/supabase-pricing-2026-free-tier-limits-compute-costs-when-to-upgrade) — pause behavior, connection counts
- [Keep Supabase free tier active](https://shadhujan.medium.com/how-to-keep-supabase-free-tier-projects-active-d60fd4a17263) — cron job approach
- [Auth comparison for indie hackers](https://dev.to/masatoman/auth-for-indie-hackers-2026-clerk-vs-supabase-auth-vs-nextauth-v5-3fmg) — Supabase Auth vs NextAuth vs Clerk
- [Recharts SSR discussion](https://github.com/recharts/recharts/discussions/6390) — App Router/SSR workarounds

---

*Stack research for: Duas Contas — personal finance web app*
*Researched: 2026-10-28*
