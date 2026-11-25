'use client'
// src/app/(authed)/planejamento/_components/NewPlanItemButton.tsx
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlanItemSheet } from './PlanItemSheet'
import type { Category } from '@prisma/client'

interface NewPlanItemButtonProps {
  month: string
  categories: Category[]
}

export function NewPlanItemButton({ month, categories }: NewPlanItemButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className="min-h-[44px]">
        <Plus size={16} className="mr-2" aria-hidden="true" />
        Novo item do plano
      </Button>

      <PlanItemSheet
        open={open}
        onClose={() => setOpen(false)}
        month={month}
        categories={categories}
      />
    </>
  )
}
