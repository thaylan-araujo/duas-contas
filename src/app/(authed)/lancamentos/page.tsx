// src/app/(authed)/lancamentos/page.tsx
// Server Component — no 'use client'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getTransactions, getCategories } from './_lib/loader'
import { TransactionList } from './_components/TransactionList'
import { MonthSelector } from './_components/MonthSelector'
import { AccountFilterToggle } from './_components/AccountFilterToggle'
import { NewTransactionButton } from './_components/NewTransactionButton'
import { ManageCategoriesButton } from './_components/ManageCategoriesButton'

interface PageProps {
  searchParams: Promise<{ month?: string; account?: string }>
}

export default async function LancamentosPage({ searchParams }: PageProps) {
  const { month, account } = await searchParams

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // middleware guarantees user is set; use user!.id safely
  const userId = user!.id

  const currentMonth = month ?? new Date().toISOString().slice(0, 7)

  // Traduz o filtro de URL (eixo antigo CASA/EMPRESA) para empresaId:
  // 'CASA' → null (Casa); ausente → undefined (todos). A seleção real de empresa
  // chega com o ContaSelector (Plano 04-04); por ora 'EMPRESA' também cai em "todos".
  const empresaIdFilter: string | null | undefined =
    account === 'CASA' ? null : undefined

  const [transactions, categories] = await Promise.all([
    getTransactions(userId, currentMonth, empresaIdFilter),
    getCategories(userId),
  ])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Lançamentos</h1>
        <div className="flex items-center gap-2">
          <ManageCategoriesButton categories={categories} />
          <NewTransactionButton categories={categories} />
        </div>
      </div>

      {/* Month selector + Account filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MonthSelector currentMonth={currentMonth} />
        <AccountFilterToggle currentAccount={account} />
      </div>

      {/* Transaction list */}
      <TransactionList
        transactions={transactions}
        categories={categories}
        currentMonth={currentMonth}
      />
    </div>
  )
}
