'use client'
// src/app/(authed)/lancamentos/_components/DeleteDialog.tsx
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
import { formatBRL } from '@/lib/format'
import { deleteTransactionAction, deleteProLaboreAction } from '../_lib/actions'

interface DeleteDialogProps {
  open: boolean
  onClose: () => void
  transaction: {
    id: string
    description: string
    amountCents: number
    pairId: string | null
  }
}

export function DeleteDialog({ open, onClose, transaction }: DeleteDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')

  const isPaired = transaction.pairId !== null

  function handleConfirm() {
    setErrorMsg('')
    startTransition(async () => {
      let result
      if (isPaired && transaction.pairId) {
        result = await deleteProLaboreAction(transaction.pairId)
      } else {
        result = await deleteTransactionAction(transaction.id)
      }
      if (result.success) {
        onClose()
      } else {
        setErrorMsg(result.error ?? 'Não foi possível excluir o lançamento.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !isPending) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir lançamento?</DialogTitle>
          <DialogDescription asChild>
            <p className="text-sm text-text-secondary mt-1">
              {isPaired ? (
                'Este lançamento faz parte de um pró-labore. Ambos os lançamentos (saída da Empresa e entrada na Casa) serão excluídos.'
              ) : (
                <>
                  Esta ação não pode ser desfeita. O lançamento{' '}
                  <strong>{transaction.description}</strong> de{' '}
                  <strong>{formatBRL(transaction.amountCents)}</strong> será removido
                  permanentemente.
                </>
              )}
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
            Manter lançamento
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            aria-busy={isPending}
            className="min-h-[44px]"
          >
            {isPending ? 'Excluindo…' : 'Excluir lançamento'}
          </Button>
        </DialogFooter>
        {errorMsg && (
          <p className="text-sm text-destructive mt-2" role="alert">{errorMsg}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
