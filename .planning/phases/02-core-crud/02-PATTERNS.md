# Phase 2: Core CRUD — Pattern Map

**Mapped:** 2026-11-23
**Files analyzed:** 20
**Analogs found:** 14 / 20

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `prisma/schema.prisma` | config | — | `prisma/schema.prisma` (extend) | exact |
| `prisma/seed.ts` | config | batch | `prisma/seed.ts` (extend) | exact |
| `src/app/(authed)/lancamentos/page.tsx` | component (Server) | request-response | `src/app/(authed)/layout.tsx` | role-match |
| `src/app/(authed)/lancamentos/_lib/loader.ts` | utility | CRUD | No analog (new pattern) | none |
| `src/app/(authed)/lancamentos/_lib/service.ts` | service | CRUD | No analog (new pattern) | none |
| `src/app/(authed)/lancamentos/_lib/actions.ts` | controller | request-response | No analog (new pattern) | none |
| `src/app/(authed)/lancamentos/_lib/schema.ts` | utility | transform | `src/app/(auth)/login/_components/LoginForm.tsx` lines 14-19 | partial |
| `src/app/(authed)/lancamentos/_components/TransactionList.tsx` | component (Server) | CRUD | `src/app/(authed)/_components/Sidebar.tsx` | partial |
| `src/app/(authed)/lancamentos/_components/TransactionRow.tsx` | component (Server) | CRUD | No analog | none |
| `src/app/(authed)/lancamentos/_components/TransactionSheet.tsx` | component (Client) | request-response | `src/app/(auth)/login/_components/LoginForm.tsx` | role-match |
| `src/app/(authed)/lancamentos/_components/DeleteDialog.tsx` | component (Client) | request-response | `src/app/(auth)/login/_components/LoginForm.tsx` | partial |
| `src/app/(authed)/lancamentos/_components/ManageCategoriesSheet.tsx` | component (Client) | CRUD | `src/app/(auth)/login/_components/LoginForm.tsx` | partial |
| `src/app/(authed)/lancamentos/_components/AccountFilterToggle.tsx` | component (Client) | event-driven | `src/app/(authed)/_components/Sidebar.tsx` | partial |
| `src/app/(authed)/lancamentos/_components/MonthSelector.tsx` | component (Client) | event-driven | `src/store/conta.ts` | partial |
| `src/app/(authed)/visao-geral/page.tsx` | component (Server) | request-response | `src/app/(authed)/layout.tsx` | role-match |
| `src/app/(authed)/visao-geral/_lib/loader.ts` | utility | CRUD | No analog | none |
| `src/app/(authed)/visao-geral/_lib/service.ts` | service | CRUD | No analog | none |
| `src/app/(authed)/visao-geral/_lib/actions.ts` | controller | request-response | No analog | none |
| `src/app/(authed)/visao-geral/_components/InlineCeilingEditor.tsx` | component (Client) | request-response | `src/app/(auth)/login/_components/LoginForm.tsx` | partial |
| `src/app/(authed)/visao-geral/_components/WeeklyBarChart.tsx` | component (Client) | transform | No analog (recharts, new) | none |

---

## Pattern Assignments

### `prisma/schema.prisma` — extend existing schema

**Analog:** existing `prisma/schema.prisma`

**Current Transaction model** (lines 41-56) — add `pairId` field after `origin`:
```prisma
model Transaction {
  id          String          @id @default(cuid())
  date        DateTime        @db.Date
  description String
  amountCents Int
  type        TransactionType
  category    Category        @relation(fields: [categoryId], references: [id])
  categoryId  String
  account     ContaType
  user        User            @relation(fields: [userId], references: [id])
  userId      String
  origin      String          @default("manual")
  pairId      String?         // links two transactions in a pró-labore pair
  notes       String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}
```

**New MonthlyBudget model** — follow same User FK + @@unique pattern used in Category (line 38):
```prisma
model MonthlyBudget {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  month        String   // "YYYY-MM"
  ceilingCents Int
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([userId, month])
}
```

**Category model** — add `isDefault` field (line 29-39):
```prisma
model Category {
  id        String    @id @default(cuid())
  name      String
  account   ContaType
  isDefault Boolean   @default(false)  // ADD THIS — seed categories = true, user categories = false
  user      User      @relation(fields: [userId], references: [id])
  userId    String
  ...
}
```

**User model** — add MonthlyBudget relation after `transactions`:
```prisma
model User {
  id             String          @id
  categories     Category[]
  transactions   Transaction[]
  monthlyBudgets MonthlyBudget[]
  createdAt      DateTime        @default(now())
}
```

---

### `prisma/seed.ts` — extend existing seed

**Analog:** `prisma/seed.ts` (lines 1-107)

**Existing upsert pattern** (lines 44-48) — copy for all new seed upserts:
```typescript
await prisma.user.upsert({
  where: { id: SUPABASE_USER_ID },
  update: {},
  create: { id: SUPABASE_USER_ID },
})
```

**Category upsert pattern with isDefault** (lines 59-71) — update to pass `isDefault: true`:
```typescript
await prisma.category.upsert({
  where: {
    name_account_userId: { name, account: ContaType.CASA, userId: SUPABASE_USER_ID },
  },
  update: {},
  create: { name, account: ContaType.CASA, userId: SUPABASE_USER_ID, isDefault: true },
})
```

---

### `src/app/(authed)/lancamentos/_lib/schema.ts` — Zod schema

**Analog:** `src/app/(auth)/login/_components/LoginForm.tsx` lines 14-19 (Zod + type inference pattern)

**Zod schema pattern to copy:**
```typescript
import { z } from 'zod'

// From LoginForm.tsx lines 14-19:
const loginSchema = z.object({
  email: z.string().min(1, 'Preencha o e-mail e a senha para continuar.').email('E-mail inválido'),
  password: z.string().min(1, 'Preencha o e-mail e a senha para continuar.'),
})
type LoginFormValues = z.infer<typeof loginSchema>
```

**Apply this same pattern** for transaction schema:
```typescript
import { z } from 'zod'

export const transactionSchema = z.object({
  date: z.string().min(1, 'Data obrigatória'),           // "YYYY-MM-DD" from input[type=date]
  description: z.string().min(1, 'Descrição obrigatória'),
  amountCents: z.number().int().positive('Valor deve ser maior que zero'),
  type: z.enum(['ENTRADA', 'SAIDA']),
  account: z.enum(['CASA', 'EMPRESA']),
  categoryId: z.string().min(1, 'Categoria obrigatória'),
  notes: z.string().optional(),
})

export type TransactionFormData = z.infer<typeof transactionSchema>

export const proLaboreSchema = z.object({
  date: z.string().min(1, 'Data obrigatória'),
  amountCents: z.number().int().positive('Valor deve ser maior que zero'),
  categoryId: z.string().min(1, 'Categoria obrigatória'),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(50, 'Máximo 50 caracteres'),
  account: z.enum(['CASA', 'EMPRESA']),
})

export const ceilingSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Formato inválido'),
  ceilingCents: z.number().int().positive('Teto deve ser maior que zero'),
})
```

---

### `src/app/(authed)/lancamentos/_lib/actions.ts` — Server Actions

**Analog:** No exact analog in codebase. Use pattern from RESEARCH.md Pattern 1.

**'use server' thin-action pattern** (from RESEARCH.md):
```typescript
'use server'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Auth pattern — always read userId from session, NEVER from form data
// Copy from src/lib/supabase/server.ts pattern:
async function getUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user.id
}

// Thin action structure: parse → userId → service → revalidate → return
export async function createTransactionAction(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const userId = await getUserId()
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  try {
    await createTransactionService({ ...parsed.data, userId })
    revalidatePath('/lancamentos')
    return { success: true }
  } catch {
    return { success: false, error: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' }
  }
}
```

**Revalidation rule:** transactions actions revalidate `/lancamentos`; budget/dashboard actions revalidate `/visao-geral`. Actions that affect both revalidate both paths.

---

### `src/app/(authed)/lancamentos/_lib/service.ts` — Business Logic

**Analog:** No exact analog. Use RESEARCH.md patterns. Key rules from codebase:
- Always import prisma from `src/lib/prisma.ts` (line 1 of `src/lib/prisma.ts`)
- Always include `userId` in every where clause (security rule from RESEARCH.md)
- Use `prisma.$transaction` for pró-labore (atomic pair)

**Prisma import pattern** (from `src/lib/prisma.ts`):
```typescript
import { prisma } from '@/lib/prisma'
```

**Atomic transaction pattern for pró-labore** (RESEARCH.md Pattern 2):
```typescript
export async function createProLaboreService(input: ProLaboreInput) {
  const pairId = crypto.randomUUID()
  return prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: { ...input, pairId, type: 'SAIDA', account: 'EMPRESA' }
    })
    await tx.transaction.create({
      data: { ...input, pairId, type: 'ENTRADA', account: 'CASA' }
    })
  })
}

export async function deleteProLaboreService(pairId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { pairId, userId } })
  })
}
```

**pairId guard pattern** — always check before single-record edit/delete:
```typescript
export async function deleteTransactionService(id: string, userId: string) {
  const record = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!record) throw new Error('Lançamento não encontrado')
  if (record.pairId) throw new Error('USE_PAIR_DELETE')  // caller routes to pair-delete flow
  return prisma.transaction.delete({ where: { id } })
}
```

---

### `src/app/(authed)/lancamentos/_lib/loader.ts` — Data Loading

**Analog:** No exact analog. Server Component data-loading utility.

**Prisma import** — same as service:
```typescript
import { prisma } from '@/lib/prisma'
```

**URL search params pattern** (from RESEARCH.md Open Question 1 answer):
```typescript
// Loader receives userId + filters from page.tsx searchParams
export async function getTransactions(
  userId: string,
  month: string,     // "YYYY-MM" from searchParams.month
  account?: string   // "CASA" | "EMPRESA" | undefined from searchParams.account
) {
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(year, monthNum - 1, 1)
  const end = new Date(year, monthNum, 0)

  return prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
      ...(account ? { account: account as ContaType } : {}),
    },
    include: { category: true },
    orderBy: { date: 'desc' },
  })
}
```

---

### `src/app/(authed)/lancamentos/page.tsx` — Server Component page

**Analog:** `src/app/(authed)/layout.tsx` (Server Component shell pattern)

**Server Component + searchParams pattern** (layout.tsx lines 1-23):
```typescript
// No 'use client' directive — Server Component by default
// Reads searchParams from function argument (Next.js 15 App Router)

interface PageProps {
  searchParams: Promise<{ month?: string; account?: string }>
}

export default async function LancamentosPage({ searchParams }: PageProps) {
  const { month, account } = await searchParams
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const currentMonth = month ?? new Date().toISOString().slice(0, 7)
  const transactions = await getTransactions(user!.id, currentMonth, account)
  const categories = await getCategories(user!.id)

  return (
    // Pass data as props to Client Components
    <TransactionList transactions={transactions} categories={categories} month={currentMonth} />
  )
}
```

---

### `src/app/(authed)/lancamentos/_components/TransactionSheet.tsx` — Client Component form

**Analog:** `src/app/(auth)/login/_components/LoginForm.tsx`

**'use client' + React Hook Form + zodResolver pattern** (LoginForm.tsx lines 1-62):
```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
```

**Form submit via useTransition + Server Action** (LoginForm.tsx onSubmit + startTransition):
```typescript
const [isPending, startTransition] = useTransition()
const form = useForm<TransactionFormData>({
  resolver: zodResolver(transactionSchema),
})

const onSubmit = form.handleSubmit((data) => {
  startTransition(async () => {
    const result = await createTransactionAction(null, data)
    if (result.success) {
      // close sheet, reset form
    }
    // show result.error if present
  })
})
```

**pairId read-only guard** (D-06) — check at render time:
```typescript
// If transaction has pairId, render read-only mode:
if (transaction?.pairId) {
  return (
    <Sheet>
      <p className="text-sm text-text-secondary">
        Este lançamento faz parte de um pró-labore.
      </p>
      <Button variant="destructive" onClick={handleDeletePair}>
        Excluir pró-labore
      </Button>
    </Sheet>
  )
}
```

**Error display pattern** (LoginForm.tsx lines 135-141):
```typescript
{result?.error && (
  <p role="alert" className="text-sm text-destructive">
    {result.error}
  </p>
)}
```

**min-h-[44px] on all interactive elements** (LoginForm.tsx line 100):
```typescript
<Input className="min-h-[44px]" ... />
<Button className="w-full min-h-[44px]" ... />
```

---

### `src/app/(authed)/lancamentos/_components/DeleteDialog.tsx` — Client Component

**Analog:** `src/app/(auth)/login/_components/LoginForm.tsx` (useTransition + server action call)

**useTransition for server action call** (LoginForm.tsx lines 34-61):
```typescript
'use client'
import { useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function DeleteDialog({ transactionId, pairId, open, onClose }) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      if (pairId) {
        await deleteProLaboreAction(pairId)
      } else {
        await deleteTransactionAction(transactionId)
      }
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {pairId ? 'Excluir pró-labore' : 'Excluir lançamento'}
          </DialogTitle>
        </DialogHeader>
        {/* Dialog copy from 02-UI-SPEC.md */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Excluindo…' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

### `src/app/(authed)/lancamentos/_components/AccountFilterToggle.tsx` — Client Component

**Analog:** `src/store/conta.ts` (useContaStore pattern) + `src/app/(authed)/_components/Sidebar.tsx` (active state styling)

**Store read + URL sync pattern:**
```typescript
'use client'
import { useContaStore } from '@/store/conta'
import { useRouter, useSearchParams } from 'next/navigation'

export function AccountFilterToggle() {
  const { contaAtiva, setContaAtiva } = useContaStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(conta: 'CASA' | 'EMPRESA') {
    setContaAtiva(conta)
    // Sync to URL so Server Component receives updated filter
    const params = new URLSearchParams(searchParams.toString())
    params.set('account', conta)
    router.push(`/lancamentos?${params.toString()}`)
  }
  // ...
}
```

**Active state Tailwind classes** (Sidebar.tsx lines 50-54):
```typescript
// CASA active: bg-casa-light text-casa
// EMPRESA active: bg-empresa-light text-empresa
// Inactive: text-text-primary hover:bg-bg
```

---

### `src/app/(authed)/lancamentos/_components/MonthSelector.tsx` — Client Component

**Analog:** `src/store/conta.ts` + URL sync (same pattern as AccountFilterToggle)

```typescript
'use client'
import { useContaStore } from '@/store/conta'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, addMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function MonthSelector() {
  const { mesSelecionado, setMesSelecionado } = useContaStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  function navigate(offset: number) {
    const current = parseISO(mesSelecionado + '-01')
    const next = format(addMonths(current, offset), 'yyyy-MM')
    setMesSelecionado(next)
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', next)
    router.push(`/lancamentos?${params.toString()}`)
  }
}
```

---

### `src/app/(authed)/visao-geral/page.tsx` — Server Component page

**Analog:** `src/app/(authed)/layout.tsx` (Server Component shell)

**Same Server Component + searchParams pattern as LancamentosPage**, but loads dashboard data:
```typescript
// No 'use client' — Server Component
export default async function VisaoGeralPage({ searchParams }) {
  const { month } = await searchParams
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user!.id
  const currentMonth = month ?? new Date().toISOString().slice(0, 7)

  // All data fetched server-side, passed as props to Client Components
  const [budget, categorySpending, weeklySpending] = await Promise.all([
    getOrCreateMonthlyBudget(userId, currentMonth),
    getCategorySpending(userId, currentMonth),
    getWeeklySpending(userId, currentMonth),
  ])

  return (
    <>
      <DashboardCards budget={budget} totalSpent={...} />
      <WeeklyBarChart data={weeklySpending} />  {/* 'use client' */}
    </>
  )
}
```

---

### `src/app/(authed)/visao-geral/_lib/service.ts` — Dashboard services

**Key patterns from RESEARCH.md:**

**MonthlyBudget upsert with compound key** (RESEARCH.md Pattern 3):
```typescript
import { prisma } from '@/lib/prisma'

export async function getOrCreateMonthlyBudget(userId: string, month: string) {
  const existing = await prisma.monthlyBudget.findUnique({
    where: { userId_month: { userId, month } },
  })
  if (existing) return existing

  const previous = await prisma.monthlyBudget.findFirst({
    where: { userId, month: { lt: month } },
    orderBy: { month: 'desc' },
  })
  const ceilingCents = previous?.ceilingCents ?? 300_000

  return prisma.monthlyBudget.upsert({
    where: { userId_month: { userId, month } },
    update: {},
    create: { userId, month, ceilingCents },
  })
}
```

---

### `src/app/(authed)/visao-geral/_components/InlineCeilingEditor.tsx` — Client Component

**Analog:** `src/app/(auth)/login/_components/LoginForm.tsx` (controlled input + async action)

**Controlled input with onBlur save** (D-03):
```typescript
'use client'
import { useState, useTransition } from 'react'
import { formatBRL } from '@/lib/format'

export function InlineCeilingEditor({ initialCents, month }) {
  const [editing, setEditing] = useState(false)
  const [rawValue, setRawValue] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleBlur() {
    setEditing(false)
    // Parse: remove R$, dots, replace comma with dot, multiply × 100
    const cents = Math.round(
      parseFloat(rawValue.replace(/[R$\s.]/g, '').replace(',', '.')) * 100
    )
    if (isNaN(cents) || cents <= 0) return
    startTransition(async () => {
      await upsertMonthlyBudgetAction({ month, ceilingCents: cents })
    })
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setEditing(true); setRawValue('') }}
        className="font-mono text-2xl font-semibold text-text-primary hover:underline min-h-[44px]"
      >
        {formatBRL(initialCents)}
      </button>
    )
  }

  return (
    <input
      type="text"
      className="font-mono text-2xl font-semibold border-b border-casa focus:outline-none min-h-[44px]"
      value={rawValue}
      onChange={(e) => setRawValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      autoFocus
    />
  )
}
```

---

### `src/app/(authed)/visao-geral/_components/WeeklyBarChart.tsx` — Client Component

**Analog:** No existing analog. Use RESEARCH.md Pattern 5.

```typescript
'use client'  // REQUIRED — Recharts uses browser DOM APIs
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatBRL } from '@/lib/format'

type WeekData = { week: string; totalCents: number }

export function WeeklyBarChart({ data }: { data: WeekData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="week" />
        <YAxis tickFormatter={(v) => formatBRL(v)} />
        <Tooltip formatter={(v: number) => formatBRL(v)} />
        <Bar dataKey="totalCents" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

---

### `src/app/(authed)/lancamentos/_components/ManageCategoriesSheet.tsx` — Client Component

**Analog:** `src/app/(auth)/login/_components/LoginForm.tsx` (useTransition + action calls)

**Pattern: list + inline edit + delete with guard** (D-07, D-08):
```typescript
'use client'
import { useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ManageCategoriesSheet({ categories, open, onClose }) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleDelete(categoryId: string) {
    startTransition(async () => {
      const result = await deleteCategoryAction(categoryId)
      if (!result.success) {
        setErrors({ [categoryId]: result.error! })
      }
    })
  }

  // isDefault categories: render name only, no edit/delete buttons
  // User categories: show Pencil + Trash2 icons with min-h-[44px]
}
```

---

## Shared Patterns

### Session / userId in Server Actions and Server Components

**Source:** `src/lib/supabase/server.ts` (all 29 lines) + `src/middleware.ts` lines 32
**Apply to:** All Server Actions (`_lib/actions.ts`) and all page Server Components

```typescript
// In actions.ts — always read userId from session
import { createSupabaseServerClient } from '@/lib/supabase/server'

async function getUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user.id
}
```

```typescript
// In page.tsx Server Components
const supabase = await createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
// middleware guarantees user is set; use user!.id safely
```

### Currency Formatting

**Source:** `src/lib/format.ts` lines 9-15
**Apply to:** All components that display monetary values — NEVER format inline

```typescript
import { formatBRL } from '@/lib/format'
// Usage: {formatBRL(amountCents)}
```

### Date Formatting

**Source:** `src/lib/format.ts` lines 22-24
**Apply to:** All components that display dates — NEVER use .toLocaleDateString()

```typescript
import { formatDate } from '@/lib/format'
// Usage: {formatDate(transaction.date)}
// Store/pass dates as ISO strings across server/client boundary
```

### Prisma Singleton Import

**Source:** `src/lib/prisma.ts` lines 1-12
**Apply to:** All service files and loader files

```typescript
import { prisma } from '@/lib/prisma'
// NEVER new PrismaClient() outside this file
```

### Minimum Touch Target

**Source:** `src/app/(auth)/login/_components/LoginForm.tsx` lines 100, 149
**Apply to:** Every `<Button>`, `<Input>`, `<button>`, `<a>` in Client Components

```typescript
className="min-h-[44px]"
```

### Error Message Language

**Source:** `src/app/(auth)/login/_components/LoginForm.tsx` lines 48-59
**Apply to:** All error strings in actions and components — always Portuguese BR, generic on network errors

```typescript
// Connection error:
'Não foi possível salvar. Verifique sua conexão e tente novamente.'
// Not found:
'Lançamento não encontrado.'
// Category blocked delete (D-08):
`Esta categoria tem ${count} lançamento${count !== 1 ? 's' : ''} e não pode ser excluída.`
```

### userId Security Rule

**Source:** RESEARCH.md Security Domain
**Apply to:** ALL service functions in `_lib/service.ts` files

Every Prisma query that reads or mutates must include `userId` in the `where` clause. Never query by `id` alone:
```typescript
// CORRECT:
prisma.transaction.findFirst({ where: { id, userId } })
// WRONG:
prisma.transaction.findFirst({ where: { id } })
```

---

## No Analog Found

Files with no close codebase match — use RESEARCH.md patterns:

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `lancamentos/_lib/loader.ts` | utility | CRUD | No server-side data loaders exist yet in the project |
| `lancamentos/_lib/service.ts` | service | CRUD | No service layer files exist yet |
| `lancamentos/_lib/actions.ts` | controller | request-response | No Server Actions exist yet |
| `visao-geral/_lib/loader.ts` | utility | CRUD | No server-side data loaders exist yet |
| `visao-geral/_lib/service.ts` | service | CRUD | No service layer files exist yet |
| `visao-geral/_lib/actions.ts` | controller | request-response | No Server Actions exist yet |
| `visao-geral/_components/WeeklyBarChart.tsx` | component | transform | No Recharts components exist yet |

For these files, follow the patterns documented in RESEARCH.md sections "Pattern 1" through "Pattern 5" and the Code Examples section.

---

## Metadata

**Analog search scope:** `src/` (all TypeScript/TSX files), `prisma/`
**Files scanned:** 30
**Pattern extraction date:** 2026-11-23
