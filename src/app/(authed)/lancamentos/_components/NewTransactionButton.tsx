'use client'
// src/app/(authed)/lancamentos/_components/NewTransactionButton.tsx
// Client component needed to manage Sheet open state from the page header
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransactionSheet } from './TransactionSheet'
import type { Category } from '@prisma/client'

interface NewTransactionButtonProps {
  categories: Category[]
  // empresaId do contexto ativo (null = Casa) — o novo lançamento nasce nele.
  empresaIdContexto?: string | null
}

export function NewTransactionButton({
  categories,
  empresaIdContexto = null,
}: NewTransactionButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className="min-h-[44px]">
        <Plus size={16} className="mr-2" aria-hidden="true" />
        Novo lançamento
      </Button>

      <TransactionSheet
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        empresaIdContexto={empresaIdContexto}
      />
    </>
  )
}
