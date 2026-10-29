// src/store/conta.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ContaAtiva = 'CASA' | 'EMPRESA'

interface ContaStore {
  contaAtiva: ContaAtiva
  mesSelecionado: string  // 'YYYY-MM' format
  setContaAtiva: (conta: ContaAtiva) => void
  setMesSelecionado: (mes: string) => void
}

export const useContaStore = create<ContaStore>()(
  persist(
    (set) => ({
      contaAtiva: 'CASA',
      mesSelecionado: new Date().toISOString().slice(0, 7), // current month
      setContaAtiva: (conta) => set({ contaAtiva: conta }),
      setMesSelecionado: (mes) => set({ mesSelecionado: mes }),
    }),
    {
      name: 'duas-contas-store',
    }
  )
)
