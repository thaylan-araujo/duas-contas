'use client'
// src/app/(authed)/lancamentos/_components/TransactionRow.tsx
// Note: 'use client' is needed because this component handles click events (edit/delete triggers)
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { formatBRL, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { TransactionSheet } from './TransactionSheet'
import { DeleteDialog } from './DeleteDialog'
import type { Category } from '@prisma/client'

interface TransactionWithCategory {
  id: string
  date: Date
  description: string
  amountCents: number
  type: 'ENTRADA' | 'SAIDA'
  empresaId: string | null // null = Casa
  categoryId: string
  notes?: string | null
  pairId: string | null
  category: Category
}

interface TransactionRowProps {
  transaction: TransactionWithCategory
  categories: Category[]
}

export function TransactionRow({ transaction, categories }: TransactionRowProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const isEntrada = transaction.type === 'ENTRADA'

  return (
    <>
      {/* Mobile layout: stacked card row */}
      <div
        className="lg:hidden flex items-start justify-between p-4 border-b border-border last:border-0 hover:bg-bg/60 cursor-pointer"
        onClick={() => setSheetOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSheetOpen(true) }}
        aria-label={`Editar lançamento: ${transaction.description}`}
      >
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-xs font-medium rounded-full px-2 py-0.5 shrink-0',
                isEntrada
                  ? 'bg-positive/10 text-positive'
                  : 'bg-red-50 text-red-600'
              )}
            >
              {isEntrada ? 'ENTRADA' : 'SAÍDA'}
            </span>
            <span className="text-base text-text-primary font-medium truncate">
              {transaction.description}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-sm text-text-secondary">
            <span>{transaction.category.name}</span>
            <span>·</span>
            <span className="font-sans">{formatDate(transaction.date)}</span>
            <span>·</span>
            <span
              className={cn(
                'text-xs rounded-full px-2 py-0.5',
                transaction.empresaId === null
                  ? 'bg-casa-light text-casa'
                  : 'bg-empresa-light text-empresa'
              )}
            >
              {transaction.empresaId === null ? 'Casa' : 'Empresa'}
            </span>
          </div>
        </div>
        <span
          className={cn(
            'font-mono text-sm font-medium shrink-0 ml-3',
            isEntrada ? 'text-positive' : 'text-red-600'
          )}
        >
          {formatBRL(transaction.amountCents)}
        </span>
      </div>

      {/* Desktop layout: table row */}
      <tr className="hidden lg:table-row hover:bg-bg/60 border-b border-border last:border-0">
        <td className="px-4 py-3">
          <span
            className={cn(
              'text-xs font-medium rounded-full px-2 py-0.5',
              isEntrada
                ? 'bg-positive/10 text-positive'
                : 'bg-red-50 text-red-600'
            )}
          >
            {isEntrada ? 'ENTRADA' : 'SAÍDA'}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-text-secondary font-sans whitespace-nowrap">
          {formatDate(transaction.date)}
        </td>
        <td className="px-4 py-3 text-base text-text-primary max-w-[240px] truncate">
          {transaction.description}
        </td>
        <td className="px-4 py-3 text-sm text-text-secondary">
          {transaction.category.name}
        </td>
        <td className="px-4 py-3">
          <span
            className={cn(
              'text-xs rounded-full px-2 py-0.5',
              transaction.empresaId === null
                ? 'bg-casa-light text-casa'
                : 'bg-empresa-light text-empresa'
            )}
          >
            {transaction.empresaId === null ? 'Casa' : 'Empresa'}
          </span>
        </td>
        <td className="px-4 py-3">
          <span
            className={cn(
              'font-mono text-sm',
              isEntrada ? 'text-positive' : 'text-red-600'
            )}
          >
            {formatBRL(transaction.amountCents)}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 justify-end">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label={`Editar ${transaction.description}`}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-bg text-text-secondary hover:text-text-primary transition-colors"
            >
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              aria-label={`Excluir ${transaction.description}`}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        </td>
      </tr>

      {/* Sheet for editing */}
      <TransactionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        transaction={transaction}
        categories={categories}
      />

      {/* Delete confirmation dialog */}
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        transaction={{
          id: transaction.id,
          description: transaction.description,
          amountCents: transaction.amountCents,
          pairId: transaction.pairId,
        }}
      />
    </>
  )
}
