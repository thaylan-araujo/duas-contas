// src/app/(authed)/planejamento/_lib/acompanhamento.test.ts
// Testes unitários das funções puras de acompanhamento (D-02/D-03/D-04).
import { describe, it, expect } from 'vitest'
import {
  computeRestanteMes,
  computeCategoriaStatus,
  groupWeeklyByCategory,
  type WeeklyTransactionInput,
} from './acompanhamento'

describe('computeRestanteMes (D-02)', () => {
  it('retorna dinheiro do mês menos despesas', () => {
    expect(computeRestanteMes(850_000, 530_000)).toBe(320_000)
  })

  it('pode ser negativo quando gastou mais que o definido', () => {
    expect(computeRestanteMes(500_000, 600_000)).toBe(-100_000)
  })

  it('sem despesas devolve o dinheiro do mês inteiro', () => {
    expect(computeRestanteMes(850_000, 0)).toBe(850_000)
  })
})

describe('computeCategoriaStatus (D-03)', () => {
  it('sem teto (limitCents null): só o gasto, sem pct nem restante', () => {
    expect(computeCategoriaStatus({ gastoCents: 90_000, limitCents: null })).toEqual({
      temTeto: false,
      restanteCents: null,
      pct: null,
    })
  })

  it('com teto: restante = teto − gasto e pct arredondado', () => {
    // 900 de 1500 → restante 600, pct 60
    expect(computeCategoriaStatus({ gastoCents: 90_000, limitCents: 150_000 })).toEqual({
      temTeto: true,
      restanteCents: 60_000,
      pct: 60,
    })
  })

  it('passou do teto: restante negativo e pct limitado a 100', () => {
    // 2000 de 1500 → restante -500, pct limitado a 100 (nunca bloqueia)
    expect(computeCategoriaStatus({ gastoCents: 200_000, limitCents: 150_000 })).toEqual({
      temTeto: true,
      restanteCents: -50_000,
      pct: 100,
    })
  })

  it('teto zero: pct = 100 (evita divisão por zero)', () => {
    expect(computeCategoriaStatus({ gastoCents: 10_000, limitCents: 0 })).toEqual({
      temTeto: true,
      restanteCents: -10_000,
      pct: 100,
    })
  })

  it('arredonda o pct para o inteiro mais próximo', () => {
    // 100 de 300 → 33.33% → 33
    expect(computeCategoriaStatus({ gastoCents: 10_000, limitCents: 30_000 }).pct).toBe(33)
  })
})

describe('groupWeeklyByCategory (D-04)', () => {
  const month = '2026-11' // novembro tem 30 dias

  it('lista vazia: 4 semanas com categorias vazias', () => {
    const semanas = groupWeeklyByCategory([], month)
    expect(semanas).toHaveLength(4)
    for (let i = 0; i < 4; i++) {
      expect(semanas[i].weekIndex).toBe(i)
      expect(semanas[i].label).toBe(`Semana ${i + 1}`)
      expect(semanas[i].categorias).toEqual([])
    }
  })

  it('dayRange de cada semana via weekDateRange (1–7 / 8–14 / 15–21 / 22–30)', () => {
    const semanas = groupWeeklyByCategory([], month)
    expect(semanas[0].dayRange).toEqual({ startDay: 1, endDay: 7 })
    expect(semanas[1].dayRange).toEqual({ startDay: 8, endDay: 14 })
    expect(semanas[2].dayRange).toEqual({ startDay: 15, endDay: 21 })
    expect(semanas[3].dayRange).toEqual({ startDay: 22, endDay: 30 })
  })

  it('agrupa por semana e soma por categoria dentro da semana', () => {
    const txs: WeeklyTransactionInput[] = [
      // Semana 1 (dias 1–7)
      { date: new Date(2026, 10, 3), amountCents: 10_000, categoryId: 'c1', categoryName: 'Alimentação' },
      { date: new Date(2026, 10, 5), amountCents: 5_000, categoryId: 'c1', categoryName: 'Alimentação' },
      { date: new Date(2026, 10, 6), amountCents: 2_000, categoryId: 'c2', categoryName: 'Gasolina' },
      // Semana 2 (dias 8–14)
      { date: new Date(2026, 10, 10), amountCents: 3_000, categoryId: 'c2', categoryName: 'Gasolina' },
      // Semana 4 (dias 22–30)
      { date: new Date(2026, 10, 28), amountCents: 7_000, categoryId: 'c1', categoryName: 'Alimentação' },
    ]
    const semanas = groupWeeklyByCategory(txs, month)

    // Semana 1: Alimentação 15.000, Gasolina 2.000
    const s1 = semanas[0].categorias
    expect(s1.find((c) => c.categoryId === 'c1')?.totalCents).toBe(15_000)
    expect(s1.find((c) => c.categoryId === 'c2')?.totalCents).toBe(2_000)

    // Semana 2: Gasolina 3.000, sem Alimentação
    const s2 = semanas[1].categorias
    expect(s2.find((c) => c.categoryId === 'c2')?.totalCents).toBe(3_000)
    expect(s2.find((c) => c.categoryId === 'c1')).toBeUndefined()

    // Semana 3: vazia
    expect(semanas[2].categorias).toEqual([])

    // Semana 4: Alimentação 7.000
    expect(semanas[3].categorias.find((c) => c.categoryId === 'c1')?.totalCents).toBe(7_000)
  })

  it('carrega o nome da categoria junto do total', () => {
    const txs: WeeklyTransactionInput[] = [
      { date: new Date(2026, 10, 2), amountCents: 1_000, categoryId: 'c9', categoryName: 'Refeição livre' },
    ]
    const semanas = groupWeeklyByCategory(txs, month)
    expect(semanas[0].categorias[0]).toMatchObject({
      categoryId: 'c9',
      categoryName: 'Refeição livre',
      totalCents: 1_000,
    })
  })
})
