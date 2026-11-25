'use client'
// src/app/(authed)/planejamento/_components/InlineCategoriaTetoEditor.tsx
// Editor inline do teto de UMA categoria (D-03). Espelha o InlineCeilingEditor:
// botão que vira input, parse de R$ → cents, useTransition. Valor > 0 salva
// (saveCategoriaTetoAction); vazio/zero remove (clearCategoriaTetoAction).
import { useState, useTransition } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL } from '@/lib/format'
import {
  saveCategoriaTetoAction,
  clearCategoriaTetoAction,
} from '../_lib/actions'

interface InlineCategoriaTetoEditorProps {
  month: string // "YYYY-MM"
  categoryId: string
  /** Teto atual em cents, ou null quando a categoria não tem teto. */
  limitCents: number | null
}

export function InlineCategoriaTetoEditor({
  month,
  categoryId,
  limitCents,
}: InlineCategoriaTetoEditorProps) {
  const [editing, setEditing] = useState(false)
  const [rawValue, setRawValue] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleBlur() {
    setEditing(false)
    // Parse: mantém só dígitos, vírgula e ponto; vírgula → ponto; converte a cents.
    const cleaned = rawValue.replace(/[^0-9.,]/g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)

    // Vazio ou zero → remover o teto (volta a "sem teto").
    if (rawValue.trim() === '' || isNaN(parsed) || parsed <= 0) {
      // Só chama a limpeza se já havia um teto (evita no-op desnecessário).
      if (limitCents !== null) {
        startTransition(async () => {
          await clearCategoriaTetoAction(month, categoryId)
        })
      }
      return
    }

    const newLimitCents = Math.round(parsed * 100)
    startTransition(async () => {
      await saveCategoriaTetoAction({ month, categoryId, limitCents: newLimitCents })
    })
  }

  if (isPending) {
    return <Skeleton className="h-11 w-28 animate-pulse" />
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setEditing(true)
          setRawValue('')
        }}
        className="min-h-[44px] cursor-pointer border-none bg-transparent p-0 font-mono text-sm font-medium text-text-secondary hover:underline"
      >
        {limitCents !== null ? `Teto ${formatBRL(limitCents)}` : 'Definir teto'}
      </button>
    )
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      className="min-h-[44px] w-28 border-b-2 border-casa bg-transparent font-mono text-sm font-medium focus:outline-none"
      value={rawValue}
      onChange={(e) => setRawValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
      onBlur={handleBlur}
      autoFocus
      placeholder="0,00 (vazio remove)"
    />
  )
}
