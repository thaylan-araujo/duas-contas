'use client'
// src/app/(authed)/visao-geral/_components/MarcarPagoDialog.tsx
// Dialog "marcar pago" (C3). Valor certo: confirma e chama marcarPagoAction(id).
// "A definir" (luz/água): mostra Input de valor real (parseBRLInput, pré-preenchido
// com a estimativa) e chama marcarPagoAction(id, valorCents). Botões ≥44px; pt-BR.
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatBRL } from '@/lib/format'
import { parseBRLInput } from '@/app/(authed)/contas-fixas/_lib/money'
import { marcarPagoAction } from '../_lib/actions'

interface MarcarPagoDialogProps {
  open: boolean
  onClose: () => void
  transacao: {
    id: string
    descricao: string
    isVariableAmount: boolean
    estimatedCents: number | null
  }
}

export function MarcarPagoDialog({ open, onClose, transacao }: MarcarPagoDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')
  const estimativa = transacao.estimatedCents ?? 0
  const [valorCents, setValorCents] = useState<number>(estimativa)

  const ehADefinir = transacao.isVariableAmount

  function handleConfirm() {
    setErrorMsg('')
    startTransition(async () => {
      const result = ehADefinir
        ? await marcarPagoAction(transacao.id, valorCents)
        : await marcarPagoAction(transacao.id)
      if (result.success) {
        onClose()
      } else {
        setErrorMsg(result.error ?? 'Não foi possível marcar como pago.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !isPending) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como pago?</DialogTitle>
          <DialogDescription asChild>
            <p className="text-sm text-text-secondary mt-1">
              {ehADefinir ? (
                <>
                  Informe o valor real de <strong>{transacao.descricao}</strong> para
                  marcar como pago.
                </>
              ) : (
                <>
                  Confirmar o pagamento de <strong>{transacao.descricao}</strong>.
                </>
              )}
            </p>
          </DialogDescription>
        </DialogHeader>

        {ehADefinir && (
          <div className="space-y-1.5">
            <Label htmlFor="mp-valor" className="text-sm font-medium text-text-primary">
              Valor pago
            </Label>
            <Input
              id="mp-valor"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              className="min-h-[44px] font-mono"
              defaultValue={
                estimativa > 0
                  ? (estimativa / 100).toFixed(2).replace('.', ',')
                  : ''
              }
              onChange={(e) => setValorCents(parseBRLInput(e.target.value))}
            />
            <p className="text-sm font-mono text-text-secondary">
              {formatBRL(valorCents)}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="min-h-[44px]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            aria-busy={isPending}
            className="min-h-[44px]"
          >
            {isPending ? 'Salvando…' : 'Marcar pago'}
          </Button>
        </DialogFooter>
        {errorMsg && (
          <p className="text-sm text-destructive mt-2" role="alert">{errorMsg}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
