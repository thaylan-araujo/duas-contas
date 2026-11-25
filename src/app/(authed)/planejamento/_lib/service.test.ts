// src/app/(authed)/planejamento/_lib/service.test.ts
// Unit tests for the pure plan calc functions + the Zod plan item schema.
// No Prisma here — these cover PLAN-02 (total/%) and PLAN-03 (folga/acima).
import { describe, it, expect } from 'vitest'
import { countWeeks, computePlanSummary, type PlanRow } from './service'
import { planItemSchema } from './schema'

describe('countWeeks', () => {
  it('counts the number of marked weeks (D-01)', () => {
    expect(
      countWeeks({ week1: true, week2: false, week3: true, week4: true })
    ).toBe(3)
  })

  it('returns 0 when no week is marked', () => {
    expect(
      countWeeks({ week1: false, week2: false, week3: false, week4: false })
    ).toBe(0)
  })

  it('returns 4 when all weeks are marked', () => {
    expect(
      countWeeks({ week1: true, week2: true, week3: true, week4: true })
    ).toBe(4)
  })
})

describe('computePlanSummary', () => {
  it('total = Σ valor × nº semanas; folga = teto − planejado (D-01, spec §Cálculos)', () => {
    const rows: PlanRow[] = [
      // R$ 1.000 ×1 semana = 100000
      { valuePerCents: 100_000, week1: true, week2: false, week3: false, week4: false },
      // R$ 250 ×3 semanas = 75000
      { valuePerCents: 25_000, week1: false, week2: true, week3: true, week4: true },
    ]
    const summary = computePlanSummary(rows, 300_000)
    expect(summary.totalPlanejado).toBe(175_000) // 100000 + 75000
    expect(summary.folga).toBe(125_000) // 300000 − 175000
    expect(summary.acima).toBe(false)
  })

  it('folga < 0 and acima = true when total exceeds the ceiling', () => {
    const rows: PlanRow[] = [
      { valuePerCents: 200_000, week1: true, week2: true, week3: false, week4: false }, // ×2 = 400000
    ]
    const summary = computePlanSummary(rows, 300_000)
    expect(summary.totalPlanejado).toBe(400_000)
    expect(summary.folga).toBe(-100_000)
    expect(summary.acima).toBe(true)
  })

  it('empty plan → total 0, folga = ceiling, not acima', () => {
    const summary = computePlanSummary([], 300_000)
    expect(summary.totalPlanejado).toBe(0)
    expect(summary.folga).toBe(300_000)
    expect(summary.acima).toBe(false)
  })
})

describe('planItemSchema', () => {
  const valid = {
    name: 'Mercado',
    categoryId: 'cat-1',
    valuePerCents: 25_000,
    week1: false,
    week2: true,
    week3: true,
    week4: true,
  }

  it('accepts a valid item', () => {
    expect(planItemSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects 0 marked weeks with the exact message (Pitfall 2)', () => {
    const result = planItemSchema.safeParse({
      ...valid,
      week1: false,
      week2: false,
      week3: false,
      week4: false,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Marque pelo menos uma semana.')
    }
  })

  it('rejects non-positive valuePerCents', () => {
    const result = planItemSchema.safeParse({ ...valid, valuePerCents: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Digite um valor maior que zero.')
    }
  })

  it('rejects empty name', () => {
    const result = planItemSchema.safeParse({ ...valid, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('O nome é obrigatório.')
    }
  })

  it('rejects empty categoryId (grupo)', () => {
    const result = planItemSchema.safeParse({ ...valid, categoryId: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Selecione um grupo.')
    }
  })
})
