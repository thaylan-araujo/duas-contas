'use client'
// src/app/(authed)/planejamento/_components/CopyPlanButton.tsx
// Copies the previous month's plan items into the current month (PLAN-05).
// Disabled (not removed) with a tooltip when there is no prior-month plan.
import { useTransition } from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { copyPlanAction } from '../_lib/actions'

interface CopyPlanButtonProps {
  month: string
  hasPreviousPlan: boolean
}

export function CopyPlanButton({ month, hasPreviousPlan }: CopyPlanButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await copyPlanAction(month)
    })
  }

  // Native title tooltip lives on the wrapper so it shows even when the button
  // is disabled (disabled elements don't reliably fire title on all browsers).
  return (
    <span title={!hasPreviousPlan ? 'Nenhum plano no mês anterior.' : undefined}>
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={!hasPreviousPlan || isPending}
        aria-busy={isPending}
        className="min-h-[44px]"
      >
        <Copy size={16} className="mr-2" aria-hidden="true" />
        {isPending ? 'Copiando…' : 'Copiar plano do mês anterior'}
      </Button>
    </span>
  )
}
