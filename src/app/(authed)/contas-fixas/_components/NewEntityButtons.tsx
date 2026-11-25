'use client'
// src/app/(authed)/contas-fixas/_components/NewEntityButtons.tsx
// Small client wrappers that open each entity's creation Sheet from the
// Server Component page. One per card CTA + the dashed "+ Nova meta" add-card.
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FixedAccountSheet } from './FixedAccountSheet'
import { AnnualExpenseSheet } from './AnnualExpenseSheet'
import { GoalSheet } from './GoalSheet'

export function NewFixedAccountButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="min-h-[44px]">
        <Plus size={16} className="mr-2" aria-hidden="true" />
        Nova conta fixa
      </Button>
      <FixedAccountSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function NewAnnualExpenseButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="min-h-[44px]">
        <Plus size={16} className="mr-2" aria-hidden="true" />
        Novo gasto anual
      </Button>
      <AnnualExpenseSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}

/**
 * Dashed "+ Nova meta" add-card — the trailing cell of the metas grid
 * (03-UI-SPEC §3.3). Opens the GoalSheet in creation mode.
 */
export function NewGoalAddCard() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        aria-label="Nova meta"
        onClick={() => setOpen(true)}
        className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-text-secondary transition-colors hover:bg-bg/60"
      >
        <Plus size={20} aria-hidden="true" />
        <span className="text-sm font-medium">+ Nova meta</span>
      </button>
      <GoalSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
