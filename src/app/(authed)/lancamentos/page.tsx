// src/app/(authed)/lancamentos/page.tsx
// Server Component — no 'use client'
// Hub de edição da Casa em abas (Fatia 2 / ROADMAP-P11-C2):
//   Lançamentos (default) · Contas fixas · Tetos & categorias.
// As abas Contas fixas / Tetos são conceitos da Casa — só aparecem no contexto
// Casa (empresaIdContexto === null, espelhando o gate isCasa da Visão Geral).
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getTransactions, getCategories } from './_lib/loader'
import { TransactionList } from './_components/TransactionList'
import { MonthSelector } from './_components/MonthSelector'
import { NewTransactionButton } from './_components/NewTransactionButton'
import { ManageCategoriesButton } from './_components/ManageCategoriesButton'
import { LancamentosTabs } from './_components/LancamentosTabs'
import { ContasFixasTabContent } from './_components/ContasFixasTabContent'
import { TetosTabContent } from './_components/TetosTabContent'

interface PageProps {
  searchParams: Promise<{ month?: string; empresaId?: string; aba?: string }>
}

export default async function LancamentosPage({ searchParams }: PageProps) {
  const { month, empresaId, aba } = await searchParams

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // middleware guarantees user is set; use user!.id safely
  const userId = user!.id

  const currentMonth = month ?? new Date().toISOString().slice(0, 7)

  // Contexto ativo (ContaSelector global): empresaId presente = empresa; ausente = Casa.
  // Casa filtra empresaId IS NULL; empresa filtra pelo id. (D-06 / EMPF-06)
  const empresaIdContexto: string | null = empresaId ?? null
  const isCasa = empresaIdContexto === null

  const abaAtiva = aba ?? 'lancamentos'

  const [transactions, categories] = await Promise.all([
    getTransactions(userId, currentMonth, empresaIdContexto),
    getCategories(userId),
  ])

  // Corpo atual de Lançamentos → conteúdo da aba "Lançamentos" (verbatim).
  const lancamentosTab = (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ManageCategoriesButton categories={categories} />
          <NewTransactionButton
            categories={categories}
            empresaIdContexto={empresaIdContexto}
          />
        </div>
      </div>

      {/* Month selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MonthSelector currentMonth={currentMonth} />
      </div>

      {/* Transaction list */}
      <TransactionList
        transactions={transactions}
        categories={categories}
        currentMonth={currentMonth}
        empresaIdContexto={empresaIdContexto}
      />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text-primary">Lançamentos</h1>

      <LancamentosTabs
        aba={abaAtiva}
        lancamentos={lancamentosTab}
        contasFixas={
          isCasa ? (
            <ContasFixasTabContent userId={userId} currentMonth={currentMonth} />
          ) : null
        }
        tetos={
          isCasa ? (
            <TetosTabContent userId={userId} currentMonth={currentMonth} />
          ) : null
        }
      />
    </div>
  )
}
