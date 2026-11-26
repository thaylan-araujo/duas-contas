// src/app/(authed)/canais/_lib/das.test.ts
// Testes unitários da função pura de DAS estimado por empresa (Fatia 4 — CONS-02 / D-03).
// Valores sempre em centavos (Int); alíquota em percentual. Nenhum acesso a Prisma/servidor.
import { describe, it, expect } from 'vitest'
import { computeDasEstimado } from './das'

describe('computeDasEstimado (CONS-02 / D-03)', () => {
  it('6% de R$ 10.000,00 (1_000_000 centavos) = R$ 600,00 (60_000 centavos)', () => {
    expect(computeDasEstimado(6, 1_000_000)).toBe(60_000)
  })

  it('aceita alíquota fracionária: 15,5% de 1_000_000 = 155_000', () => {
    expect(computeDasEstimado(15.5, 1_000_000)).toBe(155_000)
  })

  it('alíquota null → 0 (a UI decide exibir "não definido", não aqui)', () => {
    expect(computeDasEstimado(null, 1_000_000)).toBe(0)
  })

  it('faturamento bruto zero → 0', () => {
    expect(computeDasEstimado(6, 0)).toBe(0)
  })

  it('arredonda frações de centavo via Math.round: 6% de 333 = 19,98 → 20', () => {
    expect(computeDasEstimado(6, 333)).toBe(20)
  })

  it('nunca negativo quando as entradas são ≥ 0', () => {
    expect(computeDasEstimado(0, 1_000_000)).toBe(0)
    expect(computeDasEstimado(100, 1_000_000)).toBe(1_000_000)
    expect(computeDasEstimado(6, 0)).toBe(0)
  })
})
