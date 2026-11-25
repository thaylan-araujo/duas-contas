'use client'
// src/app/(authed)/planejamento/_components/PlanTable.tsx
// Card "Quanto vai para cada coisa": the plan items table (desktop) / card-list
// (mobile). Row click opens the edit Sheet; desktop hover reveals Pencil/Trash2.
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import { countWeeks } from '../_lib/service'
import { groupColor } from './groupColors'
import { PlanItemSheet, type ExistingPlanItem } from './PlanItemSheet'
import { DeletePlanItemDialog } from './DeletePlanItemDialog'
import { NewPlanItemButton } from './NewPlanItemButton'
import type { Category } from '@prisma/client'

export interface PlanTableItem extends ExistingPlanItem {
  category: { id: string; name: string }
}

interface PlanTableProps {
  items: PlanTableItem[]
  ceilingCents: number
  month: string
  categories: Category[]
}

function pctOfCeiling(totalCents: number, ceilingCents: number): string {
  if (ceilingCents <= 0) return '0%'
  return `${Math.round((totalCents / ceilingCents) * 100)}%`
}

export function PlanTable({
  items,
  ceilingCents,
  month,
  categories,
}: PlanTableProps) {
  const [editItem, setEditItem] = useState<ExistingPlanItem | undefined>()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<{ id: string; name: string } | null>(
    null
  )

  function openEdit(item: PlanTableItem) {
    setEditItem({
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      valuePerCents: item.valuePerCents,
      week1: item.week1,
      week2: item.week2,
      week3: item.week3,
      week4: item.week4,
    })
    setEditOpen(true)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Quanto vai para cada coisa
          </h2>
          <p className="text-sm text-text-secondary">
            Digite o valor de cada vez que o gasto acontece. O total do mês é
            calculado sozinho.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-base font-semibold text-text-primary">
            Nenhum item planejado para este mês
          </p>
          <p className="text-sm text-text-secondary">
            Adicione o primeiro item do plano ou copie o plano do mês anterior.
          </p>
          <div className="mt-3">
            <NewPlanItemButton month={month} categories={categories} />
          </div>
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    scope="col"
                    className="text-xs uppercase tracking-wide text-text-secondary"
                  >
                    Gasto
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-xs uppercase tracking-wide text-text-secondary"
                  >
                    Grupo
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-xs uppercase tracking-wide text-text-secondary"
                  >
                    Valor por vez
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-xs uppercase tracking-wide text-text-secondary"
                  >
                    Vezes
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-xs uppercase tracking-wide text-text-secondary"
                  >
                    Total no mês
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-xs uppercase tracking-wide text-text-secondary"
                  >
                    % do teto
                  </TableHead>
                  <TableHead scope="col" className="w-20">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const n = countWeeks(item)
                  const total = item.valuePerCents * n
                  return (
                    <TableRow
                      key={item.id}
                      className="group cursor-pointer hover:bg-bg/60"
                      onClick={() => openEdit(item)}
                    >
                      <TableCell className="font-sans text-base font-semibold text-text-primary">
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2 text-base text-text-primary">
                          <span
                            aria-hidden="true"
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: groupColor(item.category.name) }}
                          />
                          {item.category.name}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-base font-semibold text-text-primary">
                        {formatBRL(item.valuePerCents)}
                      </TableCell>
                      <TableCell className="font-mono text-base text-text-secondary">
                        × {n}
                      </TableCell>
                      <TableCell className="font-mono text-base font-semibold text-text-primary">
                        {formatBRL(total)}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-text-secondary">
                        {pctOfCeiling(total, ceilingCents)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            aria-label={`Editar ${item.name}`}
                            className="text-text-secondary hover:text-text-primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(item)
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Excluir ${item.name}`}
                            className="text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteItem({ id: item.id, name: item.name })
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: card-list */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {items.map((item) => {
              const n = countWeeks(item)
              const total = item.valuePerCents * n
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className={cn(
                      'flex w-full flex-col gap-2 rounded-xl border border-border p-3 text-left',
                      'min-h-[44px] hover:bg-bg/60'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans text-base font-semibold text-text-primary">
                        {item.name}
                      </span>
                      <span className="font-mono text-base font-semibold text-text-primary">
                        {formatBRL(total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm text-text-secondary">
                        <span
                          aria-hidden="true"
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: groupColor(item.category.name) }}
                        />
                        {item.category.name}
                      </span>
                      <span className="font-mono text-sm text-text-secondary">
                        {formatBRL(item.valuePerCents)} × {n} ·{' '}
                        {pctOfCeiling(total, ceilingCents)}
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {/* Edit Sheet */}
      <PlanItemSheet
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          setEditItem(undefined)
        }}
        month={month}
        categories={categories}
        item={editItem}
      />

      {/* Delete Dialog */}
      {deleteItem && (
        <DeletePlanItemDialog
          open={!!deleteItem}
          onClose={() => setDeleteItem(null)}
          item={deleteItem}
        />
      )}
    </div>
  )
}
