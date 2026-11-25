// src/app/(authed)/contas-fixas/_lib/service.test.ts
// Unit tests for the pure display-calc functions + the Zod schemas.
// No Prisma here — these cover FIXA-02 (÷12 rounding), META-01
// ((meta−guardado)/meses + null/past-deadline guard) and the seed goals.
import { describe, it, expect } from 'vitest'
import {
  computeAnnualMonthly,
  computeGoalMonthly,
  SEED_GOAL_NAMES,
} from './service'
import { goalSchema, fixedAccountSchema, annualExpenseSchema } from './schema'

describe('computeAnnualMonthly (÷12 — FIXA-02, Pitfall 1)', () => {
  it('R$1.000,00/ano → R$83,33/mês (100000 → 8333, Math.round)', () => {
    expect(computeAnnualMonthly(100_000)).toBe(8_333)
  })

  it('divide exato quando o ano é múltiplo de 12', () => {
    expect(computeAnnualMonthly(120_000)).toBe(10_000)
  })

  it('arredonda para cima quando ≥ .5 de centavo', () => {
    // 1000 / 12 = 83.33… → 83
    expect(computeAnnualMonthly(1_000)).toBe(83)
    // 10000 / 12 = 833.33… → 833
    expect(computeAnnualMonthly(10_000)).toBe(833)
  })
})

describe('computeGoalMonthly ((meta−guardado)/meses — META-01, Pitfall 3)', () => {
  // Note: use the local-time Date constructor new Date(year, monthIndex, day)
  // so `now` and date-fns `parse('YYYY-MM')` live in the same timezone frame.
  // `new Date('2026-11-01')` is UTC midnight and drifts to the prior month in
  // negative-offset timezones (e.g. BRT), which would corrupt the month count.
  it('prazo 12 meses à frente → round((1200000−0)/12) = 100000', () => {
    const result = computeGoalMonthly(
      { targetCents: 1_200_000, savedCents: 0, deadline: '2027-11' },
      new Date(2026, 10, 1) // Nov 1 2026, local
    )
    expect(result).toBe(100_000)
  })

  it('desconta o já guardado antes de dividir', () => {
    // meses(nov/26 → mai/27) = 6; (1200000 − 600000) / 6 = 100000
    const result = computeGoalMonthly(
      { targetCents: 1_200_000, savedCents: 600_000, deadline: '2027-05' },
      new Date(2026, 10, 1) // Nov 1 2026, local
    )
    expect(result).toBe(100_000)
  })

  it('deadline null → retorna null (não divide — Pitfall 3)', () => {
    expect(
      computeGoalMonthly({ targetCents: 100_000, savedCents: 0, deadline: null })
    ).toBeNull()
  })

  it('deadline undefined → retorna null', () => {
    expect(
      computeGoalMonthly({
        targetCents: 100_000,
        savedCents: 0,
        deadline: undefined,
      })
    ).toBeNull()
  })

  it('prazo no passado (meses < 0) → retorna null', () => {
    const result = computeGoalMonthly(
      { targetCents: 100_000, savedCents: 0, deadline: '2026-01' },
      new Date(2026, 10, 1) // Nov 1 2026, local
    )
    expect(result).toBeNull()
  })

  it('prazo igual ao mês atual (meses = 0) → retorna null (sem divisão por zero)', () => {
    const result = computeGoalMonthly(
      { targetCents: 100_000, savedCents: 0, deadline: '2026-11' },
      new Date(2026, 10, 15) // Nov 15 2026, local
    )
    expect(result).toBeNull()
  })
})

describe('goalSchema', () => {
  it('aceita uma meta válida (guardado ≤ meta)', () => {
    const r = goalSchema.safeParse({
      name: 'Reserva',
      targetCents: 100_000,
      savedCents: 50_000,
      deadline: '2027-11',
    })
    expect(r.success).toBe(true)
  })

  it('aceita meta sem prazo (deadline opcional)', () => {
    const r = goalSchema.safeParse({
      name: 'Reserva',
      targetCents: 0,
      savedCents: 0,
    })
    expect(r.success).toBe(true)
  })

  it('rejeita savedCents > targetCents com a mensagem exata', () => {
    const r = goalSchema.safeParse({
      name: 'Reserva',
      targetCents: 100_000,
      savedCents: 150_000,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].message).toBe(
        'O valor guardado não pode ser maior que a meta.'
      )
    }
  })
})

describe('fixedAccountSchema', () => {
  const valid = {
    name: 'Luz',
    dueDay: 10,
    amountCents: 15_000,
    autoDebit: true,
  }

  it('aceita uma conta fixa válida', () => {
    expect(fixedAccountSchema.safeParse(valid).success).toBe(true)
  })

  it('rejeita dueDay 0 com a mensagem exata', () => {
    const r = fixedAccountSchema.safeParse({ ...valid, dueDay: 0 })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].message).toBe('Informe um dia entre 1 e 31.')
    }
  })

  it('rejeita dueDay 32 com a mensagem exata', () => {
    const r = fixedAccountSchema.safeParse({ ...valid, dueDay: 32 })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].message).toBe('Informe um dia entre 1 e 31.')
    }
  })

  it('rejeita valor não positivo', () => {
    const r = fixedAccountSchema.safeParse({ ...valid, amountCents: 0 })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].message).toBe('Digite um valor maior que zero.')
    }
  })
})

describe('annualExpenseSchema', () => {
  it('aceita um gasto anual válido', () => {
    const r = annualExpenseSchema.safeParse({
      name: 'IPVA',
      yearlyCents: 120_000,
      dueMonth: 3,
    })
    expect(r.success).toBe(true)
  })

  it('rejeita dueMonth fora de 1-12', () => {
    expect(
      annualExpenseSchema.safeParse({ name: 'IPVA', yearlyCents: 120_000, dueMonth: 13 }).success
    ).toBe(false)
  })
})

describe('SEED_GOAL_NAMES (D-06 / META-02)', () => {
  it('semeia exatamente as duas metas por nome', () => {
    expect(SEED_GOAL_NAMES).toEqual([
      'Reserva de emergência',
      'Caixinha do carro',
    ])
  })
})
