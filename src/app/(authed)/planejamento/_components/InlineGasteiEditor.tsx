'use client'
// src/app/(authed)/planejamento/_components/InlineGasteiEditor.tsx
// Campo "Gastei R$" por (semana × categoria) — D-02. Valor exibido =
// resolveGastei(manualCents, autoCents): override manual (inclusive 0) tem
// precedência; sem override → soma automática. Blur/Enter persiste o override
// (saveGasteiAction); "Recalcular" limpa o override (clearGasteiAction).
import { useState, useTransition } from 'react'
import { Pencil } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL } from '@/lib/format'
import { saveGasteiAction, clearGasteiAction } from '../_lib/actions'

interface InlineGasteiEditorProps {
  month: string
  weekIndex: number
  categoryId: string
  autoGasteiCents: number
  manualCents: number | null // override persistido (null → automático)
}

export function InlineGasteiEditor({
  month,
  weekIndex,
  categoryId,
  autoGasteiCents,
  manualCents,
}: InlineGasteiEditorProps) {
  const [editing, setEditing] = useState(false)
  const [rawValue, setRawValue] = useState('')
  const [isPending, startTransition] = useTransition()

  const hasOverride = manualCents !== null
  // Valor exibido: override (inclusive 0) tem precedência sobre o automático.
  const displayedCents = hasOverride ? (manualCents as number) : autoGasteiCents

  function handleBlur() {
    setEditing(false)
    const cleaned = rawValue.replace(/[^0-9.,]/g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    // Campo vazio / inválido → não altera nada.
    if (rawValue.trim() === '' || isNaN(parsed) || parsed < 0) return

    const value = Math.round(parsed * 100)
    startTransition(async () => {
      await saveGasteiAction({ month, weekIndex, categoryId, manualCents: value })
    })
  }

  function handleRecalcular() {
    startTransition(async () => {
      await clearGasteiAction(month, weekIndex, categoryId)
    })
  }

  if (isPending) {
    return <Skeleton className="h-11 w-28 animate-pulse" />
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col">
        <span className="text-xs text-text-secondary">Gastei R$</span>
        {editing ? (
          <input
            type="text"
            inputMode="decimal"
            className="min-h-[44px] w-24 border-b-2 border-casa bg-transparent font-mono text-base font-semibold focus:outline-none"
            value={rawValue}
            onChange={(e) => setRawValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
            onBlur={handleBlur}
            autoFocus
            placeholder="0,00"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditing(true)
              setRawValue('')
            }}
            className="min-h-[44px] cursor-pointer border-none bg-transparent p-0 text-left font-mono text-base font-semibold text-text-primary hover:underline"
          >
            {formatBRL(displayedCents)}
          </button>
        )}
      </div>

      {hasOverride && (
        <div className="flex items-center gap-1">
          <Pencil
            size={12}
            className="text-casa"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={handleRecalcular}
            title="Valor digitado manualmente — toque em Recalcular para voltar ao automático."
            className="min-h-[44px] cursor-pointer border-none bg-transparent p-0 text-sm text-casa hover:underline"
          >
            Recalcular
          </button>
        </div>
      )}
    </div>
  )
}
