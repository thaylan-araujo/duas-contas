'use client'
// src/app/(authed)/lancamentos/_components/ManageCategoriesButton.tsx
// Client component needed to manage ManageCategoriesSheet open state from the page header
import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ManageCategoriesSheet } from './ManageCategoriesSheet'
import type { Category } from '@prisma/client'

interface ManageCategoriesButtonProps {
  categories: Category[]
}

export function ManageCategoriesButton({ categories }: ManageCategoriesButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="min-h-[44px] text-text-secondary"
        onClick={() => setOpen(true)}
        aria-label="Gerenciar categorias"
      >
        <Settings size={16} className="mr-2" aria-hidden="true" />
        Gerenciar categorias
      </Button>

      <ManageCategoriesSheet
        categories={categories}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
