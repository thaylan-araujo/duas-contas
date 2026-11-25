'use client'
// src/app/(authed)/lancamentos/_components/TransactionList.tsx
// 'use client' needed because it contains TransactionRow which requires client-side interactions
import { useState } from 'react'
import { ArrowLeftRight, Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { TransactionRow } from './TransactionRow'
import { TransactionSheet } from './TransactionSheet'
import type { Category } from '@prisma/client'

interface TransactionWithCategory {
  id: string
  date: Date
  description: string
  amountCents: number
  type: 'ENTRADA' | 'SAIDA'
  account: 'CASA' | 'EMPRESA'
  categoryId: string
  notes?: string | null
  pairId: string | null
  category: Category
}

interface TransactionListProps {
  transactions: TransactionWithCategory[]
  categories: Category[]
  currentMonth: string // "YYYY-MM"
  onNewTransaction?: () => void
}

export function TransactionList({
  transactions,
  categories,
  currentMonth,
  onNewTransaction,
}: TransactionListProps) {
  const [createSheetOpen, setCreateSheetOpen] = useState(false)

  const monthLabel = format(parseISO(currentMonth + '-01'), 'MMM/yyyy', {
    locale: ptBR,
  })

  function handleNewTransaction() {
    if (onNewTransaction) {
      onNewTransaction()
    } else {
      setCreateSheetOpen(true)
    }
  }

  if (transactions.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <ArrowLeftRight
            size={48}
            className="text-text-secondary"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-text-primary">
              Nenhum lançamento em {monthLabel}
            </h2>
            <p className="text-base text-text-secondary">
              Registre o primeiro lançamento do mês usando o botão acima.
            </p>
          </div>
          <Button
            onClick={handleNewTransaction}
            className="min-h-[44px]"
          >
            <Plus size={16} className="mr-2" aria-hidden="true" />
            Novo lançamento
          </Button>
        </div>

        <TransactionSheet
          open={createSheetOpen}
          onClose={() => setCreateSheetOpen(false)}
          categories={categories}
        />
      </>
    )
  }

  return (
    <>
      {/* Mobile: stacked card list */}
      <div className="lg:hidden bg-card rounded-2xl border border-border overflow-hidden">
        {transactions.map((t) => (
          <TransactionRow key={t.id} transaction={t} categories={categories} />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden lg:block bg-card rounded-2xl border border-border overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg">
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Tipo
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Data
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Descrição
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Categoria
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Conta
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                Valor
              </th>
              <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-text-secondary">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <TransactionRow key={t.id} transaction={t} categories={categories} />
            ))}
          </tbody>
        </table>
      </div>

      <TransactionSheet
        open={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        categories={categories}
      />
    </>
  )
}
