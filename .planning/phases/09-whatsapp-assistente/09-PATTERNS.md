# Phase 9 · Fatia 1 — WhatsApp: Texto → lançar — Pattern Map

**Mapped:** 2026-11-26
**Files analyzed:** 12 new + 1 edit
**Analogs found:** 9 / 13 (4 are net-new seams with no in-repo analog)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/api/whatsapp/webhook/route.ts` | route (webhook) | event-driven / request-response | `src/app/api/health/route.ts` | role-match (minimal — net-new orchestration) |
| `src/lib/whatsapp/parse.ts` | utility (pure) | transform | `canais/_lib/pnl.ts` (pure fns) | role-match |
| `src/lib/whatsapp/resolve.ts` | utility (pure) | transform | `canais/_lib/pnl.ts` `normalizarNome` | exact (accent-norm match) |
| `src/lib/whatsapp/schema.ts` | schema (Zod) | validation | `lancamentos/_lib/schema.ts` | exact |
| `src/lib/whatsapp/ai.ts` | service (external HTTP) | request-response | — | **net-new — no analog** (first Anthropic client) |
| `src/lib/whatsapp/evolution.ts` | service (external HTTP) | request-response | — | **net-new — no analog** (first outbound REST client) |
| `src/lib/whatsapp/messages.ts` (reply) | utility | transform | `src/lib/format.ts` | role-match |
| `src/lib/whatsapp/service.ts` (dedupe/pending) | service | CRUD | `lancamentos/_lib/service.ts` + `empresas/_lib/loader.ts` | exact |
| Prisma models (3 new tables) | model/migration | — | migration `20261126125639_add_origem_empresa_id` | exact |
| `src/lib/whatsapp/*.test.ts` (pure) | test | — | `canais/_lib/pnl.test.ts` | exact |
| `src/lib/whatsapp/service.test.ts` (prisma) | test | — | `lancamentos/_lib/service.test.ts` | exact |
| `route.test.ts` (handler) | test | — | `lancamentos/_lib/service.test.ts` (mock style) | role-match |
| `src/middleware.ts` (EDIT) | middleware | request-response | itself (current matcher) | self |

---

## Pattern Assignments

### `src/app/api/whatsapp/webhook/route.ts` (route, event-driven)

**Analog:** `src/app/api/health/route.ts` (the ONLY existing Route Handler — it is a 7-line GET with no DB/Auth). It proves the `app/api/.../route.ts` + `Response.json({...}, { status })` convention but has **no** POST/body/Prisma orchestration precedent.

**Health route excerpt** (lines 1-7):
```typescript
// src/app/api/health/route.ts
export function GET() {
  return Response.json({ status: 'ok' }, { status: 200 })
}
```

**Conventions to replicate:**
- Response shape: `Response.json(payload, { status })` (not `NextResponse.json`) — matches the one existing handler.
- **Net-new to add (no analog, from RESEARCH §Pattern 1):** `export const runtime = 'nodejs'` (Prisma can't run on edge) and `export const dynamic = 'force-dynamic'` (never cache a webhook).
- **Always return 200** even on internal/business errors (RESEARCH Pitfall 2/§Pattern 1) — a 4xx/5xx makes Evolution retry → duplicate lançamento.
- Use the singleton `@/lib/prisma` — never `new PrismaClient()` (RESEARCH Anti-Patterns).
- Orchestration (secret → parse → contact → dedupe → pending → ai → resolve → create → send) is **net-new glue** — treat carefully; there is no existing multi-step handler to copy.

---

### `src/lib/whatsapp/service.ts` (service/CRUD — dedupe + pending + contact loaders)

**Analog:** `src/app/(authed)/empresas/_lib/loader.ts` (ownership-guarded reads) + `src/app/(authed)/lancamentos/_lib/service.ts` (writes, `crypto.randomUUID`, `$transaction`).

**Loader pattern — every query filters by scope** (loader.ts lines 1-12):
```typescript
// Módulo simples (sem 'use server') — Ownership-guarded: toda query filtra por userId (ASVS V4).
import { prisma } from '@/lib/prisma'

export async function getEmpresas(userId: string) {
  return prisma.empresa.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
}
```

**Conventions to replicate:**
- No `'use server'` — these are plain server modules called directly by the webhook (matches D-02: webhook is a trusted server-side caller, not an action).
- `resolveContact(phone)` → `prisma.whatsappContact.findFirst({ where: { phone, active: true } })` returning `userId` — mirrors the `where`-scoped loader style.
- Dedupe: `prisma.whatsappInbound.create(...)` inside try/catch; Prisma `P2002` (unique violation) → treat as "já processado" and return 200 (RESEARCH §Dedupe + Pitfall 2). `createTransactionService` already imports nothing special — follow its plain-async style.
- Loaders for AI context already exist — **reuse, do not rewrite**: `getEmpresas(userId)` from `empresas/_lib/loader.ts` and `getCategories(userId)` from `lancamentos/_lib/service.ts` (or the identical one in `lancamentos/_lib/loader.ts`).

---

### `src/lib/whatsapp/resolve.ts` + `parse.ts` (pure utilities, transform)

**Analog:** `src/app/(authed)/canais/_lib/pnl.ts` — the canonical "pure TypeScript, no Prisma, maximally testable, all values in cents" module. It already contains the exact accent/case normalization `resolveDestino`/`resolveCategoria` need.

**Normalization excerpt** (pnl.ts lines 38-40, header lines 1-6):
```typescript
// Funções puras ... TypeScript puro — SEM Prisma, SEM nada de servidor
// (maximamente testáveis). Todos os valores em centavos (Int).
function normalizarNome(nome: string): string {
  return nome
    .trim()
    // ...lowercase + NFD + descarte de diacríticos (.normalize('NFD').replace(/[̀-ͯ]/g,''))
}
```

**Conventions to replicate:**
- Pure functions only; no imports from `@/lib/prisma`. One call-site passes already-loaded `empresas[]`/`categorias[]`.
- Money stays integer **cents** end-to-end (`valorCents`), same as `pnl.ts` and `transactionSchema.amountCents`.
- Return a discriminated union for the "ask vs resolve" decision (`{ empresaId } | { ambiguo: true } | { faltou: true }`) — resolve only on exactly-one match (RESEARCH §Match tolerante, anti-objetivo nº 1).
- `parse.ts` reads text from BOTH `message.conversation` AND `message.extendedTextMessage.text`, prefers `remoteJidAlt` over `remoteJid` when `@lid` (RESEARCH Pitfall 1).

---

### `src/lib/whatsapp/schema.ts` (Zod validation)

**Analog:** `src/app/(authed)/lancamentos/_lib/schema.ts`.

**Excerpt** (schema.ts lines 1-15):
```typescript
// Zod schemas only — no 'use server' or 'use client'
import { z } from 'zod'

export const transactionSchema = z.object({
  date: z.string().min(1, 'Data obrigatória'),
  description: z.string().min(1, 'A descrição é obrigatória.').max(120, 'Máximo 120 caracteres'),
  amountCents: z.number().int().positive('Digite um valor maior que zero.'),
  type: z.enum(['ENTRADA', 'SAIDA']),
  empresaId: z.string().nullable(), // null = Casa
  categoryId: z.string().min(1, 'Selecione uma categoria.'),
  notes: z.string().max(200, 'Máximo 200 caracteres').optional(),
})
export type TransactionFormData = z.infer<typeof transactionSchema>
```

**Conventions to replicate:**
- File comment `// Zod schemas only`; import `{ z } from 'zod'` (already installed `^3.25.76`).
- PT-BR error messages; `z.enum(['ENTRADA','SAIDA'])` for `tipo`; `empresaId: z.string().nullable()` with `// null = Casa` comment (D-03).
- `export type X = z.infer<typeof schema>`.
- **Reuse `transactionSchema` itself** to validate the final payload before `createTransactionService` (RESEARCH §Code Examples — `transactionSchema.safeParse(data)`), so the WhatsApp AI schema only validates the *AI output shape*, not the DB write.

---

### `src/lib/whatsapp/messages.ts` (reply formatting)

**Analog:** `src/lib/format.ts`.

**Excerpt** (format.ts lines 9-15):
```typescript
export function formatBRL(cents: number): string {
  const value = cents / 100
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
```

**Conventions to replicate:**
- **NEVER format money/date inline** (project rule, enforced in format.ts docstring). Build confirmation via `formatBRL(amountCents)` / `formatDate(date)` imported from `@/lib/format`.
- Confirmation text: `✓ ${formatBRL(amountCents)} · ${categoriaNome} · ${destinoLabel}` where `destinoLabel = empresaId ? empresaNome : 'Casa'`.

---

### Reuse target: `createTransactionService` (NO new file — call it)

**Source:** `src/app/(authed)/lancamentos/_lib/service.ts` lines 21-32.

```typescript
export async function createTransactionService(
  data: TransactionFormData & { userId: string }
) {
  const { date, userId, ...rest } = data
  return prisma.transaction.create({
    data: { ...rest, date: parseISO(date), userId },
  })
}
```

**Exact signature / conventions:**
- `createTransactionService(data: TransactionFormData & { userId: string })` — already pure (no `'use server'`), takes `userId` explicitly. **No refactor needed** (D-02).
- `date` must be `"YYYY-MM-DD"` string; the service does `parseISO(date)` to avoid timezone drift (RESEARCH Pitfall 6) — the AI tool must emit exactly that format; do NOT build `Date` by hand.
- `empresaId: null` = Casa; `categoryId` must be an **existing** category of the destino (D-04). `type` is `'ENTRADA' | 'SAIDA'`, `amountCents` positive int.
- Ownership/IDOR is covered because the service writes with the allowlist `userId`; destino/categoria resolution must stay within that `userId`'s loaded empresas/categorias.

---

### Prisma models: `WhatsappContact`, `WhatsappInbound`, `WhatsappPendingAction` (additive migration)

**Analog:** `prisma/migrations/20261126125639_add_origem_empresa_id/migration.sql` (last additive migration).

```sql
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "origemEmpresaId" TEXT;
-- CreateIndex
CREATE INDEX "Transaction_origemEmpresaId_idx" ON "Transaction"("origemEmpresaId");
-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_origemEmpresaId_fkey" FOREIGN KEY ... ON DELETE RESTRICT;
```

**Conventions to replicate:**
- Purely additive (new tables only — `CREATE TABLE`, no drops/renames). Add inverse relation `whatsappContacts WhatsappContact[]` on `User`.
- **Run with `npx prisma migrate dev` using `DIRECT_URL` (port 5432), NEVER the pooler (6543)** — RESEARCH Pitfall 7 + CLAUDE.md. Backup checkpoint before (data-touching rule, even though additive). Never shadow-db the real bank.
- `@@unique(messageId)` on `WhatsappInbound` is the idempotency guarantee; `phone @unique` on `WhatsappContact` and `WhatsappPendingAction`.
- Schema style: `id String @id @default(cuid())`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt` (matches existing models).

---

### Tests

**Pure-function tests** (`parse.test.ts`, `resolve.test.ts`) — Analog: `canais/_lib/pnl.test.ts`.
```typescript
import { describe, it, expect } from 'vitest'
import { computeBruto, /* ... */ } from './pnl'
// no mocks, direct assertions on pure outputs; values in cents
```
- Co-located `*.test.ts` next to the module (vitest `include: ['src/**/*.test.ts']`).
- No DOM (`environment: node`), alias `@`→`src` already configured.

**Prisma/handler tests** (`service.test.ts`, `route.test.ts`) — Analog: `lancamentos/_lib/service.test.ts`.
```typescript
const prismaMock = vi.hoisted(() => ({
  whatsappInbound: { create: vi.fn() },
  whatsappContact: { findFirst: vi.fn() },
  // ...
}))
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
```
- Mock `@/lib/prisma` with `vi.hoisted` + `vi.mock`; inspect calls (dedupe P2002, allowlist miss → ignore).
- For the handler/AI: additionally mock the Anthropic client and `fetch` (evolution send). **No existing precedent for mocking an HTTP client** — design `ai.ts`/`evolution.ts` so the client is injectable/mockable.

**Test command:** `npx vitest run src/lib/whatsapp` (fast loop); `npm test` (full).

---

### EDIT: `src/middleware.ts` (exclude `/api/whatsapp` from auth)

**Current matcher** (lines 52-56) — quote exactly so the planner knows what to change:
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```
Current middleware body (line 32-40) calls `supabase.auth.getUser()` and redirects any no-cookie request to `/login`. The webhook has no cookie → would 307 to `/login` and never run (RESEARCH Pitfall 4 — **mandatory task**).

**Two acceptable changes (pick one, mirror existing style):**
- (a) Add `api/whatsapp` to the negative lookahead of the matcher regex, OR
- (b) Early-return at the top of `middleware()`: `if (request.nextUrl.pathname.startsWith('/api/whatsapp')) return NextResponse.next()`.

Option (b) is the smaller, clearer diff and keeps the matcher readable.

---

## Shared Patterns

### Money as integer cents
**Source:** `src/lib/format.ts`, `canais/_lib/pnl.ts`, `transactionSchema.amountCents`.
**Apply to:** every WhatsApp file touching value. Never floats; format only via `formatBRL`.

### Ownership / `where: { userId }`
**Source:** `empresas/_lib/loader.ts` line 8, `service.ts` findFirst guards.
**Apply to:** all WhatsApp DB reads/writes — scope by the allowlist-resolved `userId` (ASVS V4, anti-objetivo nº 4).

### Timezone-safe dates
**Source:** `service.ts` line 28 (`parseISO(date)`), `format.ts` `formatDate`.
**Apply to:** AI emits `YYYY-MM-DD`; let `createTransactionService` do `parseISO`. Never `new Date("2026-11-26")`.

### Prisma singleton
**Source:** `@/lib/prisma`.
**Apply to:** all WhatsApp server modules. Never instantiate a new client.

### Pure vs server split
**Source:** `canais/_lib/pnl.ts` (pure, testable) vs `service.ts` (Prisma). No `'use server'` in either — the webhook calls services directly (D-02).
**Apply to:** keep Casa×Empresa rules (`parse`, `resolve`, schema mapping) in pure modules; keep I/O (Prisma, Anthropic, Evolution) in thin seams.

---

## No Analog Found (net-new seams — planner treats carefully)

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/lib/whatsapp/ai.ts` | service (Anthropic SDK) | request-response | First LLM/Anthropic integration in repo. `@anthropic-ai/sdk` not yet installed (`npm install @anthropic-ai/sdk` → 1.14.0). Follow RESEARCH §Pattern 2 (tool use + `tool_choice:{type:'tool'}`, model `claude-haiku-4-5`, no effort/thinking). Keep client injectable for tests. |
| `src/lib/whatsapp/evolution.ts` | service (outbound REST) | request-response | First outbound HTTP client in repo. `fetch` to `{EVOLUTION_API_URL}/message/sendText/{instance}` with `apikey` header. Body shape version-sensitive (Pitfall 5) — centralize here; confirm against real instance (`checkpoint:human-verify`). |
| `src/app/api/whatsapp/webhook/route.ts` orchestration | route | event-driven | Only existing route is a 7-line GET; the multi-step POST orchestration (secret → dedupe → AI → resolve → create → reply, always-200) has no in-repo precedent. |
| Webhook secret compare (`verifyWebhookSecret`) | utility (crypto) | — | First use of `crypto.timingSafeEqual` for a shared secret (RESEARCH §Don't Hand-Roll). `crypto.randomUUID` is already used in `service.ts`, but constant-time compare is net-new. |

## Metadata

**Analog search scope:** `src/app/api/`, `src/app/(authed)/lancamentos/_lib/`, `src/app/(authed)/empresas/_lib/`, `src/app/(authed)/canais/_lib/`, `src/lib/`, `src/middleware.ts`, `prisma/migrations/`, `vitest.config.ts`.
**Files scanned:** ~12 read in full/part.
**Pattern extraction date:** 2026-11-26
</content>
</invoke>
