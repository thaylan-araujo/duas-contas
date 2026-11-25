'use client'
// src/app/(authed)/empresas/_components/DeleteEmpresaDialog.tsx
// Dialog de exclusão de empresa com body condicional (UI-SPEC §4):
// Caso A (0 lançamentos) → confirmação destrutiva.
// Caso B (>0 lançamentos) → bloqueio (D-08), CTA único "Entendi".
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
import { deleteEmpresaAction } from '../_lib/actions'

interface DeleteEmpresaDialogProps {
  open: boolean
  onClose: () => void
  empresa: {
    id: string
    nome: string
    lancamentoCount: number
  }
}

export function DeleteEmpresaDialog({ open, onClose, empresa }: DeleteEmpresaDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')

  // Caso B: bloqueio quando há lançamentos vinculados.
  const bloqueado = empresa.lancamentoCount > 0

  function handleConfirm() {
    setErrorMsg('')
    startTransition(async () => {
      const result = await deleteEmpresaAction(empresa.id)
      if (result.success) {
        onClose()
      } else {
        setErrorMsg(result.error ?? 'Não foi possível excluir a empresa.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !isPending) onClose() }}>
      <DialogContent className="sm:max-w-md">
        {bloqueado ? (
          <>
            <DialogHeader>
              <DialogTitle>Não é possível excluir</DialogTitle>
              <DialogDescription asChild>
                <p className="mt-1 text-sm text-warning">
                  A empresa <strong>{empresa.nome}</strong> tem{' '}
                  <strong>{empresa.lancamentoCount}</strong>{' '}
                  {empresa.lancamentoCount === 1 ? 'lançamento' : 'lançamentos'}{' '}
                  {empresa.lancamentoCount === 1 ? 'vinculado' : 'vinculados'}. Remova
                  ou mova os lançamentos antes de excluir a empresa.
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} className="min-h-[44px]">
                Entendi
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Excluir empresa?</DialogTitle>
              <DialogDescription asChild>
                <p className="mt-1 text-sm text-text-secondary">
                  Esta ação não pode ser desfeita. A empresa{' '}
                  <strong>{empresa.nome}</strong> e todas as suas categorias serão
                  removidas.
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
                Manter empresa
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={isPending}
                aria-busy={isPending}
                className="min-h-[44px] bg-red-600 text-white hover:bg-red-700"
              >
                {isPending ? 'Excluindo…' : 'Excluir empresa'}
              </Button>
            </DialogFooter>
            {errorMsg && (
              <p className="mt-2 text-sm text-destructive" role="alert">{errorMsg}</p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
