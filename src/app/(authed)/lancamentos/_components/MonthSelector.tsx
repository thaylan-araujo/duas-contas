'use client'
// src/app/(authed)/lancamentos/_components/MonthSelector.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter, useSearchParams } from 'next/navigation'
import { useContaStore } from '@/store/conta'

interface MonthSelectorProps {
  currentMonth: string // "YYYY-MM"
}

export function MonthSelector({ currentMonth }: MonthSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setMesSelecionado } = useContaStore()

  function navigate(offset: number) {
    const current = parseISO(currentMonth + '-01')
    const next = format(addMonths(current, offset), 'yyyy-MM')
    setMesSelecionado(next)
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', next)
    router.push(`/lancamentos?${params.toString()}`)
  }

  const displayLabel = format(parseISO(currentMonth + '-01'), 'MMMM yyyy', {
    locale: ptBR,
  })

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Mês anterior"
        onClick={() => navigate(-1)}
        className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-bg text-text-secondary hover:text-text-primary transition-colors"
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>

      <span className="text-base font-medium text-text-primary min-w-[160px] text-center capitalize">
        {displayLabel}
      </span>

      <button
        type="button"
        aria-label="Próximo mês"
        onClick={() => navigate(1)}
        className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-bg text-text-secondary hover:text-text-primary transition-colors"
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </div>
  )
}
