'use client'
// src/app/(authed)/planejamento/_components/DeletePlanItemDialog.tsx
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
import { deletePlanItemAction } from '../_lib/actions'

interface DeletePlanItemDialogProps {
  open: boolean
  onClose: () => void
  item: { id: string; name: string }
}

export function DeletePlanItemDialog({
  open,
  onClose,
  item,
}: DeletePlanItemDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')

  function handleConfirm() {
    setErrorMsg('')
    startTransition(async () => {
      const result = await deletePlanItemAction(item.id)
      if (result.success) {
        onClose()
      } else {
        setErrorMsg(result.error ?? 'Não foi possível excluir o item.')
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isPending) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir item do plano?</DialogTitle>
          <DialogDescription asChild>
            <p className="text-sm text-text-secondary mt-1">
              Esta ação não pode ser desfeita. O item{' '}
              <strong>{item.name}</strong> será removido do plano deste mês.
            </p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="min-h-[44px]"
          >
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
          <p className="text-sm text-destructive mt-2" role="alert">
            {errorMsg}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
