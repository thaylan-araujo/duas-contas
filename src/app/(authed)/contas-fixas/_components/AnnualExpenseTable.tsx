'use client'
// src/app/(authed)/contas-fixas/_components/AnnualExpenseTable.tsx
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatBRL } from '@/lib/format'
import { computeAnnualMonthly } from '../_lib/service'
import { AnnualExpenseSheet, type ExistingAnnualExpense } from './AnnualExpenseSheet'
import { DeleteEntityDialog } from './DeleteEntityDialog'

interface AnnualExpenseTableProps {
  expenses: ExistingAnnualExpense[]
}

export function AnnualExpenseTable({ expenses }: AnnualExpenseTableProps) {
  const [editing, setEditing] = useState<ExistingAnnualExpense | null>(null)
  const [deleting, setDeleting] = useState<ExistingAnnualExpense | null>(null)

  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg/40 p-6 text-center">
        <p className="text-base font-semibold text-text-primary">
          Nenhum gasto anual cadastrado
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Cadastre IPVA, licenciamento, manutenção do carro e presentes de fim de ano.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="text-xs uppercase tracking-wide text-text-secondary">GASTO</TableHead>
              <TableHead scope="col" className="text-xs uppercase tracking-wide text-text-secondary">VALOR NO ANO</TableHead>
              <TableHead scope="col" className="text-xs uppercase tracking-wide text-text-secondary">POR MÊS</TableHead>
              <TableHead scope="col" className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((exp) => (
              <TableRow key={exp.id} className="group">
                <TableCell className="text-base font-semibold text-text-primary">{exp.name}</TableCell>
                <TableCell>
                  <span className="font-mono text-sm font-semibold text-text-primary">
                    {formatBRL(exp.yearlyCents)}
                  </span>{' '}
                  <span className="font-mono text-sm text-text-secondary">÷ 12</span>
                </TableCell>
                <TableCell className="font-mono text-sm text-casa">
                  {formatBRL(computeAnnualMonthly(exp.yearlyCents))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      aria-label={`Editar ${exp.name}`}
                      onClick={() => setEditing(exp)}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg"
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Excluir ${exp.name}`}
                      onClick={() => setDeleting(exp)}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-red-600 hover:bg-bg"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card-list */}
      <div className="flex flex-col gap-3 lg:hidden">
        {expenses.map((exp) => (
          <div key={exp.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-base font-semibold text-text-primary">{exp.name}</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Editar ${exp.name}`}
                  onClick={() => setEditing(exp)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg"
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Excluir ${exp.name}`}
                  onClick={() => setDeleting(exp)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-red-600 hover:bg-bg"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span>
                <span className="font-mono font-semibold text-text-primary">
                  {formatBRL(exp.yearlyCents)}
                </span>{' '}
                <span className="font-mono text-text-secondary">÷ 12</span>
              </span>
              <span className="font-mono text-casa">
                {formatBRL(computeAnnualMonthly(exp.yearlyCents))}
                <span className="ml-1 text-xs text-text-secondary">/mês</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <AnnualExpenseSheet
          open={!!editing}
          onClose={() => setEditing(null)}
          expense={editing}
        />
      )}
      {deleting && (
        <DeleteEntityDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          kind="annualExpense"
          id={deleting.id}
          name={deleting.name}
        />
      )}
    </>
  )
}
