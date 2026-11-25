'use client'
// src/app/(authed)/contas-fixas/_components/FixedAccountTable.tsx
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
import { Checkbox } from '@/components/ui/checkbox'
import { formatBRL } from '@/lib/format'
import { FixedAccountSheet, type ExistingFixedAccount } from './FixedAccountSheet'
import { DeleteEntityDialog } from './DeleteEntityDialog'

interface FixedAccountTableProps {
  accounts: ExistingFixedAccount[]
}

export function FixedAccountTable({ accounts }: FixedAccountTableProps) {
  const [editing, setEditing] = useState<ExistingFixedAccount | null>(null)
  const [deleting, setDeleting] = useState<ExistingFixedAccount | null>(null)

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg/40 p-6 text-center">
        <p className="text-base font-semibold text-text-primary">
          Nenhuma conta fixa cadastrada
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Cadastre luz, água, internet e outras contas que se repetem todo mês.
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
              <TableHead scope="col" className="text-xs uppercase tracking-wide text-text-secondary">CONTA</TableHead>
              <TableHead scope="col" className="text-xs uppercase tracking-wide text-text-secondary">VENCE DIA</TableHead>
              <TableHead scope="col" className="text-xs uppercase tracking-wide text-text-secondary">VALOR</TableHead>
              <TableHead scope="col" className="text-xs uppercase tracking-wide text-text-secondary">PAGAMENTO</TableHead>
              <TableHead scope="col" className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((acc) => (
              <TableRow key={acc.id} className="group">
                <TableCell className="text-base font-semibold text-text-primary">{acc.name}</TableCell>
                <TableCell className="font-mono text-sm text-text-primary">{acc.dueDay}</TableCell>
                <TableCell className="font-mono text-sm font-semibold text-text-primary">
                  {formatBRL(acc.amountCents)}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <Checkbox checked={acc.autoDebit} disabled aria-label="Débito automático" />
                    <span className="text-sm text-text-secondary">Débito automático</span>
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      aria-label={`Editar ${acc.name}`}
                      onClick={() => setEditing(acc)}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg"
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Excluir ${acc.name}`}
                      onClick={() => setDeleting(acc)}
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
        {accounts.map((acc) => (
          <div key={acc.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-text-primary">{acc.name}</p>
                <p className="mt-0.5 font-mono text-sm text-text-secondary">
                  Vence dia {acc.dueDay}
                </p>
              </div>
              <p className="font-mono text-sm font-semibold text-text-primary">
                {formatBRL(acc.amountCents)}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Checkbox checked={acc.autoDebit} disabled aria-label="Débito automático" />
                <span className="text-sm text-text-secondary">Débito automático</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Editar ${acc.name}`}
                  onClick={() => setEditing(acc)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg"
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Excluir ${acc.name}`}
                  onClick={() => setDeleting(acc)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-red-600 hover:bg-bg"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <FixedAccountSheet
          open={!!editing}
          onClose={() => setEditing(null)}
          account={editing}
        />
      )}
      {deleting && (
        <DeleteEntityDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          kind="fixedAccount"
          id={deleting.id}
          name={deleting.name}
        />
      )}
    </>
  )
}
