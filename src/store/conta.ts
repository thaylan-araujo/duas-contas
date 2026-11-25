// src/store/conta.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Contexto ativo (D-06): Casa ou uma empresa específica.
// União discriminada substitui o antigo enum 'CASA' | 'EMPRESA'.
export type ContaAtiva = { tipo: 'CASA' } | { tipo: 'EMPRESA'; empresaId: string }

interface ContaStore {
  contaAtiva: ContaAtiva
  mesSelecionado: string // 'YYYY-MM' format
  setContaAtiva: (conta: ContaAtiva) => void
  setMesSelecionado: (mes: string) => void
}

/**
 * Helper PURO (D-06): resolve o contexto ativo em empresaId | null.
 * null = Casa (empresaId NULL no banco). É o que o loader usa para filtrar.
 */
export function empresaIdDoContexto(contaAtiva: ContaAtiva): string | null {
  return contaAtiva.tipo === 'EMPRESA' ? contaAtiva.empresaId : null
}

/**
 * Migração PURA do persist (v0 → v1): a forma antiga de `contaAtiva` era a string
 * 'CASA' | 'EMPRESA'. A nova é a união discriminada. Tanto 'EMPRESA' quanto 'CASA'
 * antigos caem para { tipo: 'CASA' } (não há como mapear 'EMPRESA' string a uma
 * empresa específica — o usuário reseleciona). `mesSelecionado` é preservado.
 * A forma nova (v1+) passa intacta.
 */
export function migrateContaStore(
  persisted: unknown,
  version: number
): { contaAtiva: ContaAtiva; mesSelecionado?: string } {
  const state = (persisted ?? {}) as {
    contaAtiva?: unknown
    mesSelecionado?: string
  }

  if (version === 0) {
    // forma antiga: contaAtiva era 'CASA' | 'EMPRESA' (string)
    return {
      ...state,
      contaAtiva: { tipo: 'CASA' },
    }
  }

  // v1+: já está na forma nova — passa intacto
  return state as { contaAtiva: ContaAtiva; mesSelecionado?: string }
}

export const useContaStore = create<ContaStore>()(
  persist(
    (set) => ({
      contaAtiva: { tipo: 'CASA' },
      mesSelecionado: new Date().toISOString().slice(0, 7), // current month
      setContaAtiva: (conta) => set({ contaAtiva: conta }),
      setMesSelecionado: (mes) => set({ mesSelecionado: mes }),
    }),
    {
      name: 'duas-contas-store',
      version: 1,
      migrate: (persisted, version) =>
        migrateContaStore(persisted, version) as ContaStore,
    }
  )
)
