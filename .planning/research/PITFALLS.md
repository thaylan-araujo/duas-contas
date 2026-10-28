# Domain Pitfalls — Duas Contas

**Project:** Duas Contas (personal finance web app)
**Stack:** Next.js + TypeScript + Tailwind + Supabase (Postgres) + Prisma + Recharts + PWA
**Deploy:** Vercel
**Researched:** 2026-10-28
**Overall confidence:** MEDIUM (cross-checked against official docs + community post-mortems)

---

## Critical Pitfalls

Mistakes that cause data corruption, silent failures, or full rewrites.

---

### Pitfall 1: Prisma + Supabase Pooler — Prepared Statement Crash

**What goes wrong:** Supabase's transaction-mode pooler (Supavisor, port 6543) does not persist prepared statements between connections. Prisma creates prepared statements by default. The result is one of these runtime errors appearing randomly, more often under concurrent load:
- `PrismaClientUnknownRequestError: prepared statement "s0" already exists`
- `bind message supplies N parameters, but prepared statement requires M`

These errors are silent in development (direct connection on port 5432 works fine) and only surface on Vercel.

**Why it happens:** In serverless, each function invocation may receive a different underlying Postgres connection from the pool. Prisma's prepared statement `s0` was created on connection A; the next request lands on connection B, which does not have it.

**Consequences:** Random 500 errors in production. Inconsistent — some requests succeed, some fail. Very hard to reproduce locally.

**Prevention:**
1. Set TWO separate environment variables in Vercel:
   - `DATABASE_URL` → Supabase pooler URL (port 6543) with `?pgbouncer=true&connection_limit=1` appended
   - `DIRECT_URL` → Supabase direct URL (port 5432, no extra params)
2. In `prisma/schema.prisma`, declare both:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```
3. The pooler URL is used at runtime; the direct URL is used by `prisma migrate deploy` and `prisma db push`.

**Detection:** `"prepared statement" already exists` in Vercel function logs. Only appears in production, not locally.

**Phase:** Etapa 1 (Base) — configure this before writing any Prisma queries.

---

### Pitfall 2: Prisma on Vercel — Exhausting Postgres Connections

**What goes wrong:** Each Vercel serverless function invocation creates its own Prisma client (or its own connection pool). Under any moderate load, the Supabase free tier's Postgres limit (default 15 direct connections, higher via pooler) is breached. New requests start failing with `Timed out fetching a new connection from the connection pool`.

**Why it happens:** Prisma's default `connection_limit` is based on CPU count, which in a serverless environment means it opens more connections than intended. With 10 concurrent function instances each holding 2 connections, you hit the limit instantly.

**Consequences:** App goes down under moderate traffic. Silent in development.

**Prevention:**
1. Always append `?connection_limit=1` (or 2) to `DATABASE_URL` for Vercel deploys.
2. Create the Prisma client as a singleton to avoid re-instantiation on hot reloads in development:
   ```typescript
   // lib/prisma.ts
   import { PrismaClient } from '@prisma/client'
   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
   export const prisma = globalForPrisma.prisma ?? new PrismaClient()
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
   ```
3. Add `"postinstall": "prisma generate"` to `package.json` so Vercel build generates the client.

**Detection:** `Timed out fetching a new connection` in logs, or Supabase dashboard showing connection spike.

**Phase:** Etapa 1 (Base).

---

### Pitfall 3: Financial Calculations Using JavaScript Floating-Point

**What goes wrong:** JavaScript's `number` type uses IEEE 754 double-precision floating-point. Simple additions produce wrong results: `0.1 + 0.2 === 0.30000000000000004`. In a financial app tracking R$ budgets, this causes budget balances that are off by a few cents, which compound into visible errors across weekly summaries and monthly totals.

**Why it happens:** Decimal fractions like 0.10 cannot be represented exactly in binary. Every arithmetic operation accumulates a small error.

**Consequences:** Budget "folga" (slack) shown as R$ 0,00 when it should be R$ 0,01. Cash flow projections drifting over 6 months. Users lose trust in the numbers.

**Prevention:**
1. Store all monetary values in the database as integers in centavos (R$ 12,50 → `1250`). Never store floats.
2. For display: divide by 100 only at the point of rendering.
3. For all arithmetic (adding up weekly plan items, calculating folga, cash flow projections): operate on centavo integers only.
4. Use `Intl.NumberFormat` for display formatting:
   ```typescript
   export function formatBRL(centavos: number): string {
     return new Intl.NumberFormat('pt-BR', {
       style: 'currency',
       currency: 'BRL',
     }).format(centavos / 100)
     // outputs: R$ 1.234,56
   }
   ```
5. For complex rounding (percentage splits, retorno do canal): use `dinero.js` v2 or `decimal.js` — do not implement custom rounding.

**Detection:** `console.log(0.1 + 0.2)` → `0.30000000000000004`. Any arithmetic on `number` values that represent reais (not centavos) is a bug.

**Phase:** Etapa 1 (Base) — establish the centavo convention in the Prisma schema before any calculations are written. All `Decimal`/`Float` fields for money should be `Int` (centavos).

---

### Pitfall 4: BRL Currency Formatting — Locale Inversion

**What goes wrong:** The default `toLocaleString()` behavior depends on the runtime locale, which on Vercel's Node.js servers may not be `pt-BR`. The result is `1,234.56` (US format) instead of `1.234,56` (BR format) — or worse, the formatting is inconsistent between server-rendered and client-rendered output, causing React hydration mismatches.

**Why it happens:** Brazilian format uses period as thousands separator and comma as decimal separator — the opposite of US/EU defaults. Without an explicit locale, Node.js and browsers differ.

**Consequences:** Hydration errors in Next.js (server HTML differs from client HTML). Numbers displayed in wrong format to the user.

**Prevention:**
1. Always pass locale explicitly: `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
2. Create a single shared `formatBRL(centavos: number)` utility in `lib/format.ts` and use it everywhere — never inline `toLocaleString()` or manual string formatting.
3. For user input fields, use a masked input library (e.g., `react-currency-input-field` with locale `pt-BR`) so the user types `250,00` and the app stores `25000`.
4. Enforce `NEXT_LOCALE=pt-BR` in Vercel environment variables to make server output consistent.

**Detection:** Any monetary value displayed as `1,234.56` instead of `R$ 1.234,56` is this bug. Also watch for React hydration warnings in the browser console.

**Phase:** Etapa 1 (Base) — the `formatBRL` utility must exist before the first UI screen.

---

### Pitfall 5: Prisma Migrations in Production — Using `migrate dev` Instead of `migrate deploy`

**What goes wrong:** Running `prisma migrate dev` against the production Supabase database is interactive, generates new migration files (potentially wiping the shadow database), and can corrupt the migration history. Running it on Vercel build is even worse — it hangs waiting for terminal input.

**Why it happens:** Developers use `migrate dev` locally and forget to switch for production deploys.

**Consequences:** Broken production deployment. Migration history mismatch. Potential data loss if Prisma tries to reset the database.

**Prevention:**
1. In `package.json`, add a build script that Vercel uses:
   ```json
   "vercel-build": "prisma migrate deploy && next build"
   ```
2. Never run `prisma migrate dev` against `DATABASE_URL` pointing to production.
3. Keep `prisma/migrations/` committed to git — Vercel needs these files during deploy.
4. Always test migrations locally against a copy of the Supabase schema before pushing.

**Detection:** Vercel build hanging at the Prisma step, or `Error: P3009 migrate found failed migrations in the target database`.

**Phase:** Etapa 1 (Base) — set up the correct build script before first deploy.

---

## Moderate Pitfalls

---

### Pitfall 6: PDF Generation — Puppeteer Incompatibility with Vercel Serverless

**What goes wrong:** Puppeteer bundles Chromium (~100 MB). Vercel's default serverless runtime previously had a 50 MB limit (now raised to 250 MB as of mid-2026, possibly higher). Even within limits, Chromium cold starts take 2–5 seconds, and PDF generation can exceed the Hobby tier's 10-second function timeout.

**Why it happens:** Puppeteer was built for long-running server processes. Vercel's serverless environment destroys the process after each request.

**Consequences:** PDF download times out. App crashes with 504 on Hobby plan.

**Prevention:**
- Use `@react-pdf/renderer` (2 MB bundle, sub-500ms, works on Vercel without configuration) for the monthly report PDF.
- Accept its limitations: no Tailwind, no arbitrary CSS, layout uses a Flexbox-like API, fonts must be registered manually.
- Register Manrope and IBM Plex Mono font files (place in `public/fonts/`) via `Font.register()`.
- If Puppeteer is ever needed: use `@sparticuz/chromium-min` + `puppeteer-core` and serve from a route handler (not a server action), with explicit `maxDuration: 60` (requires Vercel Pro).

**Detection:** 504 errors on the PDF download endpoint. Bundle size warnings during `next build`.

**Phase:** Etapa 6 (Relatório).

---

### Pitfall 7: PWA Push Notifications — iOS Requires Home Screen Install First

**What goes wrong:** `window.PushManager` is `undefined` in a normal iOS Safari browser tab. The push notification subscription code silently fails or throws, and the user never gets alerts.

**Why it happens:** Apple only enables Web Push for PWAs running in `standalone` display mode (installed to the Home Screen). iOS 16.4+ supports it, but only post-install.

**Consequences:** The calendar alert feature (3 days before vencimento) does not work on iPhone unless the user has explicitly installed the PWA.

**Prevention:**
1. Gate the push notification subscription behind a `display-mode: standalone` media query check:
   ```typescript
   const isStandalone = window.matchMedia('(display-mode: standalone)').matches
   if (!isStandalone) {
     // Show "Add to Home Screen" instructions instead of subscribing
   }
   ```
2. Show an explicit "Instale o app para receber notificações" prompt to iOS users who are in browser mode.
3. Push permission must be requested from a user gesture (button click) — never on page load.
4. Set `display: standalone` in the web app manifest (required for iOS PWA).
5. The service worker file must be at `public/sw.js` to be served from the origin root.

**Detection:** `TypeError: Cannot read properties of undefined (reading 'subscribe')` in iOS Safari. Test on real iPhone, not simulator.

**Phase:** Etapa 5 (Calendário), then revisited in Etapa 8 (Celular/PWA).

---

### Pitfall 8: Date and Timezone — Brazil/Sao_Paulo DST Shifts

**What goes wrong:** JavaScript `Date` objects are always UTC internally. When a user inputs "hoje" (today) or a due date like "20/11/2026", the app stores `new Date(2026, 10, 20)` which is interpreted in the browser's local timezone. On Vercel's server (UTC), the same string produces a different timestamp. Dates appear shifted by one day for users in America/Sao_Paulo.

**Why it happens:** Brazil used to observe Daylight Saving Time (UTC-2 in summer, UTC-3 in winter). Brazil permanently abolished DST in 2019 — it is now fixed at UTC-3 year-round. But libraries like `date-fns` without timezone support still assume UTC and can shift dates.

**Consequences:** A transaction entered as "28/10/2026" is stored as "27/10/2026" in the database. Calendar vencimentos appear on the wrong day.

**Prevention:**
1. Store dates in Postgres as `DATE` (not `TIMESTAMP`) for day-precision financial data (vencimentos, lançamentos). This avoids timezone offset math entirely.
2. When parsing user-input dates (dd/mm/yyyy), parse to a local date without UTC conversion:
   ```typescript
   import { parse } from 'date-fns'
   const date = parse('28/10/2026', 'dd/MM/yyyy', new Date())
   ```
3. For any server-side date logic (e.g., "is this due in 3 days?"), use `date-fns-tz` with `'America/Sao_Paulo'` explicitly.
4. Never use `new Date('2026-10-28')` (ISO string without time) — it parses as UTC midnight and shifts by 3 hours.

**Detection:** A lançamento entered at 22:30 local time (01:30 UTC next day) appears dated "tomorrow". Check with `console.log(new Date('2026-10-28').toISOString())`.

**Phase:** Etapa 1 (Base) — the date parsing utility must be correct before any data entry works.

---

### Pitfall 9: OFX File Parsing — Format Variations from Brazilian Banks

**What goes wrong:** OFX files from Brazilian banks are not uniformly formatted. Itaú exports OFX 1.x (SGML, not XML). Bradesco and Nubank may export with different encodings (ISO-8859-1 vs UTF-8), inconsistent DTSTART/DTEND header formats, or malformed tags. A strict parser throws on the first deviation; the user sees a generic error with no recovery path.

**Why it happens:** OFX 1.x is technically SGML, not XML, and the spec is loosely interpreted. Brazilian banks implemented it years ago with their own quirks.

**Consequences:** Import fails silently or with a cryptic error. Users cannot import their bank data, which is a core feature.

**Prevention:**
1. Use a lenient OFX parser (e.g., `ofx-js` or a custom parser that handles SGML OFX 1.x).
2. Detect encoding by reading the `ENCODING:` header line at the start of the file — convert ISO-8859-1 to UTF-8 before parsing.
3. Show the raw parse error to the user in the UI with a "copie o erro para reportar" option, not just "falha ao importar".
4. Support manual column mapping for CSV: the spec defines one CSV format, but users may export differently from each bank. Present a column-mapping UI step.
5. The duplicate-detection strategy: hash the combination of `(date + description + value_centavos)` per transaction. Store the hash on the `Lancamento` model. On import, reject rows whose hash already exists. Handle legitimate same-day identical transactions by including an occurrence-count in the hash.

**Detection:** Import fails on Itaú OFX file. Check for `ENCODING:USASCII` or `CHARSET:1252` headers in the file.

**Phase:** Etapa 7 (Importar extrato) — plan for lenient parsing from the start, not as a fix after complaints.

---

### Pitfall 10: Next.js App Router — Server Actions File Upload Size Limit

**What goes wrong:** Next.js Server Actions have a default request body limit of 1 MB. A CSV or OFX file from a year of transactions can easily exceed this. The upload silently fails or returns a cryptic error.

**Why it happens:** Server Actions serialize their arguments as form data with a default size cap to prevent abuse.

**Consequences:** Large file imports fail without a helpful error message.

**Prevention:**
1. Use a Route Handler (`app/api/import/route.ts`) instead of a Server Action for file uploads — Route Handlers do not have the 1 MB body limit by default.
2. Or, increase the limit in `next.config.ts`:
   ```typescript
   experimental: {
     serverActions: {
       bodySizeLimit: '10mb'
     }
   }
   ```
3. Parse the file client-side first (using the browser's `FileReader` API), then send the parsed rows as JSON to a Server Action or Route Handler. This is the most robust pattern — the file never hits the server as a binary blob.

**Detection:** 413 or generic network error on the import step for files over ~500 KB.

**Phase:** Etapa 7 (Importar extrato).

---

## Minor Pitfalls

---

### Pitfall 11: Prisma `postinstall` Missing — Client Not Generated on Vercel

**What goes wrong:** Vercel builds succeed locally (where `node_modules/.prisma` already exists) but fail in production with `Cannot find module '@prisma/client'` or a stale client that doesn't match the current schema.

**Prevention:** Add `"postinstall": "prisma generate"` to `package.json`. This runs automatically after `npm install` during every Vercel build.

**Phase:** Etapa 1 (Base).

---

### Pitfall 12: PWA — `beforeinstallprompt` Not Available on iOS or Safari

**What goes wrong:** Code that listens for `beforeinstallprompt` to show a custom "Install App" button works on Android Chrome but never fires on iOS Safari or any iOS browser (which are all Safari under the hood due to Apple's WebKit restriction).

**Prevention:** Do not use `beforeinstallprompt` as the only install trigger. Show a persistent banner to iOS users with instructions: "Toque em Compartilhar → Adicionar à Tela de Início." The banner should only show if `window.matchMedia('(display-mode: standalone)').matches` is false.

**Phase:** Etapa 8 (Celular/PWA).

---

### Pitfall 13: iOS Service Worker Cache — Cleared After 7 Days

**What goes wrong:** iOS Safari clears service worker caches after approximately 7 days of inactivity. Users who haven't opened the PWA for a week will lose offline capability and may see a blank screen if the network is slow.

**Prevention:** The app is online-first (Supabase is the source of truth), so cache loss just means a brief loading state, not data loss. Keep service worker caching minimal: cache only the shell (HTML, CSS, JS) and no financial data. Do not attempt offline writes.

**Phase:** Etapa 8 (Celular/PWA).

---

### Pitfall 14: `@react-pdf/renderer` — Fonts Not Embedded

**What goes wrong:** PDFs generated with `@react-pdf/renderer` without registered fonts default to Helvetica. The report shows a different font than the app's Manrope/IBM Plex Mono design.

**Prevention:**
1. Download Manrope and IBM Plex Mono TTF/OTF files into `public/fonts/`.
2. Register them at module level:
   ```typescript
   import { Font } from '@react-pdf/renderer'
   Font.register({ family: 'Manrope', src: '/fonts/Manrope-Regular.ttf' })
   Font.register({ family: 'IBMPlexMono', src: '/fonts/IBMPlexMono-Regular.ttf' })
   ```
3. Use absolute URLs in production (not relative paths): `${process.env.NEXT_PUBLIC_BASE_URL}/fonts/Manrope-Regular.ttf`.

**Phase:** Etapa 6 (Relatório).

---

### Pitfall 15: Supabase RLS Bypassed by Prisma's Postgres Role

**What goes wrong:** Prisma connects using the `postgres` superuser role (from the Supabase connection string), which has `BYPASSRLS`. Any Row Level Security policies written in Supabase are completely ignored for all Prisma queries.

**Why it matters for this project:** For a single-user personal app, this is not a security risk — there are no other users to protect data from. But if the project ever evolves to multi-user, RLS will not protect anything, creating a false sense of security.

**Prevention:**
- For the MVP, accept the bypass and protect data at the application layer (verify ownership in every query/server action).
- Document this decision in PROJECT.md as a known limitation.
- If multi-user support is ever added, create a dedicated `app_user` Postgres role with `NOBYPASSRLS` and update the connection string to use it.

**Phase:** Etapa 1 (Base) — document in PROJECT.md; revisit if multi-user is added.

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Etapa 1 — Base | Prisma connection pooling not configured before first Vercel deploy | Set both DATABASE_URL + DIRECT_URL with `pgbouncer=true` in Vercel env vars on day one |
| Etapa 1 — Base | Monetary values stored as floats in Prisma schema | Declare all money fields as `Int` (centavos) in schema, never `Float` or `Decimal` |
| Etapa 1 — Base | Date parsing using `new Date(isoString)` causing UTC shift | Use `date-fns` parse with explicit format `dd/MM/yyyy` from the first input field |
| Etapa 2 — Planejamento | Budget arithmetic on raw reais values | All arithmetic on centavo integers; format only for display |
| Etapa 5 — Calendário | Push notification code runs before PWA is installed on iOS | Gate subscription behind `(display-mode: standalone)` check |
| Etapa 6 — Relatório | Choosing Puppeteer for PDF (timeout + size issues on Vercel) | Use `@react-pdf/renderer`; register fonts from `public/fonts/` |
| Etapa 7 — Importar | Strict OFX parser failing on Itaú SGML files | Test against actual Itaú/Bradesco OFX exports during planning; use lenient parser |
| Etapa 7 — Importar | Server Action body limit blocking large CSV uploads | Use Route Handler or parse file client-side first |
| Etapa 8 — Celular | Showing `beforeinstallprompt` banner on iOS | Show manual "Adicionar à Tela de Início" instructions for iOS users instead |

---

## Sources

- [Supabase Prisma Troubleshooting — official docs](https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting)
- [Prisma connection pooling in serverless (prisma.io)](https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/databases-connections)
- [Supabase Connection Pooling with PgBouncer on Vercel — DEV Community](https://dev.to/mahdi_benrhouma_fe1c6005/supabase-connection-pooling-with-pgbouncer-on-vercel-serverless-1o33)
- [Currency calculations in JavaScript — Honeybadger](https://www.honeybadger.io/blog/currency-money-calculations-in-javascript/)
- [How to handle monetary values in JavaScript — freeCodeCamp](https://www.freecodecamp.org/news/how-to-handle-monetary-values-in-javascript-3fef5eeb3eda/)
- [PDF generation on Vercel: Puppeteer vs @react-pdf/renderer — DEV Community](https://dev.to/iurii_rogulia/pdf-generation-on-the-server-puppeteer-vs-react-pdfrenderer-a-production-comparison-44cg)
- [PDF generation in Next.js: complete guide for App Router — pdf4.dev](https://pdf4.dev/blog/pdf-generation-nextjs)
- [Does Prisma respect Supabase RLS? No — guardlayer.io](https://www.guardlayer.io/blog/orm-bypasses-supabase-rls)
- [PWA iOS Limitations and Safari Support — magicbell.com](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Web Push in the Next.js App Router: field notes on iOS — DEV Community](https://dev.to/ahmed_mahmoud360/web-push-in-the-nextjs-app-router-field-notes-on-service-workers-vapid-and-the-ios-rule-that-1oj2)
- [How to build a PWA with Next.js — Next.js official docs](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [How to Set Up Prisma Database Migrations in Production on Vercel — hassanr.com](https://hassanr.com/blogs/prisma-migrations-production-nextjs-vercel.html)
- [Debugging Timezone Date Bugs: UTC vs Local Time — buglyst.com](https://buglyst.com/blog/debugging-date-timezone-bugs)
- [Duplicate detection — Firefly III documentation](https://docs.firefly-iii.org/references/data-importer/duplicate-detection/)
- [Next.js Upload Size Limit: Causes and Fixes — saurav.digital](https://saurav.digital/blog/nextjs-file-upload-size-limit)
- [Prisma Migrations in Production: Zero-Downtime Deployments — DEV Community](https://dev.to/whoffagents/prisma-migrations-in-production-zero-downtime-deployments-with-expand-contract-2l1p)
