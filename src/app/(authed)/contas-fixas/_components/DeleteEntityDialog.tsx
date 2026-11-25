'use client'
// src/app/(authed)/contas-fixas/_components/DeleteEntityDialog.tsx
// One reusable destructive Dialog parameterized by entity kind, rendering the
// per-entity copy from 03-UI-SPEC.
import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  deleteFixedAccountAction,
  deleteAnnualExpenseAction,
  deleteGoalAction,
} from '../_lib/actions'

export type EntityKind = 'fixedAccount' | 'annualExpense' | 'goal'

interface DeleteEntityDialogProps {
  open: boolean
  onClose: () => void
  kind: EntityKind
  id: string
  name: string
}

const COPY: Record<
  EntityKind,
  { title: string; body: (name: string) => React.ReactNode }
> = {
  fixedAccount: {
    title: 'Excluir conta fixa?',
    body: (name) => (
      <>
        Esta ação não pode ser desfeita. <strong>{name}</strong> deixará de entrar
        no plano dos próximos meses.
      </>
    ),
  },
  annualExpense: {
    title: 'Excluir gasto anual?',
    body: (name) => (
      <>
        Esta ação não pode ser desfeita. O gasto <strong>{name}</strong> será
        removido.
      </>
    ),
  },
  goal: {
    title: 'Excluir meta?',
    body: (name) => (
      <>
        Esta ação não pode ser desfeita. A meta <strong>{name}</strong> e seu
        progresso serão removidos.
      </>
    ),
  },
}

const DELETE_ACTION: Record<EntityKind, (id: string) => Promise<{ success: boolean; error?: string }>> = {
  fixedAccount: deleteFixedAccountAction,
  annualExpense: deleteAnnualExpenseAction,
  goal: deleteGoalAction,
}

export function DeleteEntityDialog({
  open,
  onClose,
  kind,
  id,
  name,
}: DeleteEntityDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')

  const copy = COPY[kind]

  function handleConfirm() {
    setErrorMsg('')
    startTransition(async () => {
      const result = await DELETE_ACTION[kind](id)
      if (result.success) {
        onClose()
      } else {
        setErrorMsg(result.error ?? 'Não foi possível excluir.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !isPending) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription asChild>
            <p className="text-sm text-text-secondary mt-1">{copy.body(name)}</p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="min-h-[44px]">
            Manter
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            aria-busy={isPending}
            className="min-h-[44px]"
          >
            {isPending ? 'Excluindo…' : 'Excluir'}
          </Button>
        </DialogFooter>
        {errorMsg && (
          <p className="text-sm text-destructive mt-2" role="alert">{errorMsg}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
