'use client'
// src/app/(authed)/lancamentos/_components/AccountFilterToggle.tsx
import { useRouter, useSearchParams } from 'next/navigation'
import { useContaStore } from '@/store/conta'
import { cn } from '@/lib/utils'

interface AccountFilterToggleProps {
  currentAccount?: string // "CASA" | "EMPRESA" | undefined (all)
}

type FilterOption = 'ALL' | 'CASA' | 'EMPRESA'

export function AccountFilterToggle({ currentAccount }: AccountFilterToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setContaAtiva } = useContaStore()

  // Determine active filter from URL (not from Zustand store — matches server-rendered state)
  const active: FilterOption =
    currentAccount === 'CASA'
      ? 'CASA'
      : currentAccount === 'EMPRESA'
      ? 'EMPRESA'
      : 'ALL'

  function handleChange(value: FilterOption) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'ALL') {
      params.delete('account')
      setContaAtiva('CASA')
    } else {
      params.set('account', value)
      setContaAtiva(value as 'CASA' | 'EMPRESA')
    }
    router.push(`/lancamentos?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => handleChange('ALL')}
        className={cn(
          'px-4 min-h-[44px] rounded-lg text-sm font-medium transition-colors',
          active === 'ALL'
            ? 'bg-text-primary text-white'
            : 'bg-card text-text-secondary border border-border hover:bg-bg'
        )}
      >
        Todos
      </button>

      <button
        type="button"
        onClick={() => handleChange('CASA')}
        className={cn(
          'px-4 min-h-[44px] rounded-lg text-sm font-medium transition-colors',
          active === 'CASA'
            ? 'bg-casa text-white'
            : 'bg-card text-text-secondary border border-border hover:bg-bg'
        )}
      >
        Casa
      </button>

      <button
        type="button"
        onClick={() => handleChange('EMPRESA')}
        className={cn(
          'px-4 min-h-[44px] rounded-lg text-sm font-medium transition-colors',
          active === 'EMPRESA'
            ? 'bg-empresa text-white'
            : 'bg-card text-text-secondary border border-border hover:bg-bg'
        )}
      >
        Empresa
      </button>
    </div>
  )
}
