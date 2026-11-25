'use client'
// src/app/(authed)/empresas/_components/NewEmpresaButton.tsx
// CTA "+ Nova empresa" do header + add-card tracejado da grade (copia o padrão
// de NewEntityButtons: NewGoalAddCard border-2 border-dashed). Ambos abrem o
// EmpresaSheet em modo criação.
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmpresaSheet } from './EmpresaSheet'

export function NewEmpresaButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="min-h-[44px]">
        <Plus size={16} className="mr-2" aria-hidden="true" />
        Nova empresa
      </Button>
      <EmpresaSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}

/**
 * Card tracejado "+ Nova empresa" — última célula da grade (UI-SPEC §2).
 */
export function NewEmpresaAddCard() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        aria-label="Nova empresa"
        onClick={() => setOpen(true)}
        className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-text-secondary transition-colors hover:bg-bg/60"
      >
        <Plus size={20} aria-hidden="true" />
        <span className="text-sm font-medium">+ Nova empresa</span>
      </button>
      <EmpresaSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
