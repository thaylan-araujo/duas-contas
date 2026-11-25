import { describe, expect, it } from 'vitest'
import { weekDateRange, weekIndexForDay } from './weeks'

describe('weekIndexForDay', () => {
  // Faixas fixas do mês (spec §Cálculos):
  // semana 1 = 1–7, 2 = 8–14, 3 = 15–21, 4 = 22 até o fim do mês.
  it('mapeia os dias de borda para o índice de semana correto', () => {
    expect(weekIndexForDay(1)).toBe(0)
    expect(weekIndexForDay(7)).toBe(0)
    expect(weekIndexForDay(8)).toBe(1)
    expect(weekIndexForDay(14)).toBe(1)
    expect(weekIndexForDay(15)).toBe(2)
    expect(weekIndexForDay(21)).toBe(2)
    expect(weekIndexForDay(22)).toBe(3)
    expect(weekIndexForDay(28)).toBe(3)
    expect(weekIndexForDay(31)).toBe(3)
  })

  it('cobre todos os dias 1..31 retornando sempre 0|1|2|3', () => {
    for (let day = 1; day <= 31; day++) {
      const idx = weekIndexForDay(day)
      expect([0, 1, 2, 3]).toContain(idx)
    }
  })
})

describe('weekDateRange', () => {
  it('semana 1 (índice 0) → dias 1..7', () => {
    const { start, end } = weekDateRange('2026-01', 0)
    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(0) // janeiro = 0
    expect(start.getDate()).toBe(1)
    expect(end.getDate()).toBe(7)
  })

  it('semana 2 (índice 1) → dias 8..14', () => {
    const { start, end } = weekDateRange('2026-01', 1)
    expect(start.getDate()).toBe(8)
    expect(end.getDate()).toBe(14)
  })

  it('semana 3 (índice 2) → dias 15..21', () => {
    const { start, end } = weekDateRange('2026-01', 2)
    expect(start.getDate()).toBe(15)
    expect(end.getDate()).toBe(21)
  })

  it('semana 4 (índice 3) começa no dia 22', () => {
    const { start } = weekDateRange('2026-01', 3)
    expect(start.getDate()).toBe(22)
  })

  // A semana 4 termina no ÚLTIMO dia do mês — a borda de maior risco.
  it('semana 4 termina em 31 num mês de 31 dias (janeiro)', () => {
    const { end } = weekDateRange('2026-01', 3)
    expect(end.getDate()).toBe(31)
  })

  it('semana 4 termina em 30 num mês de 30 dias (abril)', () => {
    const { end } = weekDateRange('2026-04', 3)
    expect(end.getDate()).toBe(30)
  })

  it('semana 4 termina em 28 em fevereiro de ano não bissexto (2026)', () => {
    const { end } = weekDateRange('2026-02', 3)
    expect(end.getMonth()).toBe(1) // fevereiro = 1
    expect(end.getDate()).toBe(28)
  })

  it('semana 4 termina em 29 em fevereiro de ano bissexto (2024)', () => {
    const { end } = weekDateRange('2024-02', 3)
    expect(end.getMonth()).toBe(1)
    expect(end.getDate()).toBe(29)
  })

  it('start e end caem sempre no mês informado', () => {
    for (const month of ['2026-02', '2024-02', '2026-04', '2026-01']) {
      for (const idx of [0, 1, 2, 3] as const) {
        const { start, end } = weekDateRange(month, idx)
        const [y, m] = month.split('-').map(Number)
        expect(start.getFullYear()).toBe(y)
        expect(start.getMonth()).toBe(m - 1)
        expect(end.getMonth()).toBe(m - 1)
        // end nunca antes de start
        expect(end.getDate()).toBeGreaterThanOrEqual(start.getDate())
      }
    }
  })
})
