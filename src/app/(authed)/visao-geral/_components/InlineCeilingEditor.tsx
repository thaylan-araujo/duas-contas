'use client'

import { useState, useTransition } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL } from '@/lib/format'
import { upsertMonthlyBudgetAction } from '../_lib/actions'

interface InlineCeilingEditorProps {
  initialCents: number
  month: string // "YYYY-MM"
}

export function InlineCeilingEditor({ initialCents, month }: InlineCeilingEditorProps) {
  const [editing, setEditing] = useState(false)
  const [rawValue, setRawValue] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleBlur() {
    setEditing(false)
    // Parse: strip non-numeric chars except comma and dot, replace comma with dot, then convert to cents
    const cleaned = rawValue.replace(/[^0-9.,]/g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    if (isNaN(parsed) || parsed <= 0) return

    const ceilingCents = Math.round(parsed * 100)
    startTransition(async () => {
      await upsertMonthlyBudgetAction(null, { month, ceilingCents })
    })
  }

  if (isPending) {
    return <Skeleton className="h-8 w-32 animate-pulse" />
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setEditing(true)
          setRawValue('')
        }}
        className="font-mono text-2xl font-semibold text-text-primary hover:underline min-h-[44px] p-0 bg-transparent border-none cursor-pointer"
      >
        {formatBRL(initialCents)}
      </button>
    )
  }

  return (
    <input
      type="text"
      className="font-mono text-2xl font-semibold border-b-2 border-casa focus:outline-none w-full min-h-[44px] bg-transparent"
      value={rawValue}
      onChange={(e) => setRawValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
      onBlur={handleBlur}
      autoFocus
      placeholder="0,00"
    />
  )
}
