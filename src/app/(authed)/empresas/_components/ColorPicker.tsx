'use client'
// src/app/(authed)/empresas/_components/ColorPicker.tsx
// Seletor de cor da empresa (UI-SPEC §3/Accessibility). Sem analog direto.
// role="radiogroup" com aria-labelledby "Cor"; 6 swatches role="radio" ≥ 44px;
// selecionado com ring-2 na cor + ícone Check. O swatch interno (bolinha) é
// decorativo (aria-hidden); a cor nunca é o único sinal — cada radio tem
// aria-label "Cor Laranja" etc.
import { Check } from 'lucide-react'
import {
  EMPRESA_COR_KEYS,
  EMPRESA_CORES_MAP,
  type EmpresaCorKey,
} from '@/lib/empresa-cores'

interface ColorPickerProps {
  value: EmpresaCorKey
  onChange: (cor: EmpresaCorKey) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-labelledby="empresa-cor-label"
      className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap"
    >
      {EMPRESA_COR_KEYS.map((cor) => {
        const desc = EMPRESA_CORES_MAP[cor]
        const selected = value === cor
        return (
          <button
            key={cor}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Cor ${desc.label}`}
            onClick={() => onChange(cor)}
            className={[
              'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-all',
              'ring-offset-2 ring-offset-card focus:outline-none focus-visible:ring-2',
              desc.ring,
              selected ? 'ring-2' : 'ring-0',
            ].join(' ')}
          >
            <span
              aria-hidden="true"
              className={[
                'flex h-8 w-8 items-center justify-center rounded-full',
                desc.bg,
              ].join(' ')}
            >
              {selected && <Check size={16} className="text-white" aria-hidden="true" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
