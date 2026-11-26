// src/app/(authed)/consolidado/_lib/projecao.test.ts
// Testes Vitest das funções puras de projeção (Fatia 4 — CONS-03/CONS-04 / D-04/D-05).
// Sem Prisma: cobrem média/vazio, projeção não cumulativa de N meses, mês negativo
// com "quanto falta" (faltamCents) e virada de ano nos rótulos. Espelha o estilo de
// contas-fixas/_lib/service.test.ts e renda-familiar.
import { describe, it, expect } from 'vitest'
import {
  mediaUltimosMeses,
  projetarSobraMensal,
  projetarMeses,
  algumMesNegativo,
} from './projecao'

describe('mediaUltimosMeses (média simples — D-04)', () => {
  it('média de [100000, 200000, 300000] === 200000', () => {
    expect(mediaUltimosMeses([100_000, 200_000, 300_000])).toBe(200_000)
  })

  it('lista vazia → 0 (não NaN)', () => {
    expect(mediaUltimosMeses([])).toBe(0)
  })

  it('arredonda com Math.round (centavos Int)', () => {
    // (100 + 100 + 101) / 3 = 100.333… → 100
    expect(mediaUltimosMeses([100, 100, 101])).toBe(100)
    // (100 + 100 + 103) / 3 = 101 → 101 (exato)
    expect(mediaUltimosMeses([100, 100, 103])).toBe(101)
    // (100 + 101) / 2 = 100.5 → 101
    expect(mediaUltimosMeses([100, 101])).toBe(101)
  })
})

describe('projetarSobraMensal (receita − custo − DAS — D-04/D-05)', () => {
  it('sobra positiva: receita 500000 − custo 200000 − DAS 30000 = 270000', () => {
    const r = projetarSobraMensal(500_000, 200_000, 30_000)
    expect(r.sobraCents).toBe(270_000)
    expect(r.negativo).toBe(false)
    expect(r.faltamCents).toBe(0)
  })

  it('sobra zero: negativo false, faltamCents 0', () => {
    const r = projetarSobraMensal(100_000, 100_000, 0)
    expect(r.sobraCents).toBe(0)
    expect(r.negativo).toBe(false)
    expect(r.faltamCents).toBe(0)
  })

  it('sobra negativa: receita 100000 − custo 150000 − DAS 0 = -50000; faltam 50000 (D-05)', () => {
    const r = projetarSobraMensal(100_000, 150_000, 0)
    expect(r.sobraCents).toBe(-50_000)
    expect(r.negativo).toBe(true)
    expect(r.faltamCents).toBe(50_000)
  })

  it('família (das = 0): renda 300000 − despesas 350000 = -50000; faltam 50000', () => {
    const r = projetarSobraMensal(300_000, 350_000, 0)
    expect(r.sobraCents).toBe(-50_000)
    expect(r.negativo).toBe(true)
    expect(r.faltamCents).toBe(50_000)
  })
})

describe('projetarMeses (N meses, não cumulativa — D-04)', () => {
  it('3 meses a partir de 2026-11 → 2026-12, 2027-01, 2027-02 (virada de ano, date-fns)', () => {
    const linhas = projetarMeses('2026-11', 3, 500_000, 200_000, 30_000)
    expect(linhas).toHaveLength(3)
    // rótulos em pt-BR (mês/ano) a partir do mês SEGUINTE ao mesBase
    expect(linhas[0].mesLabel).toMatch(/2026/)
    expect(linhas[1].mesLabel).toMatch(/2027/)
    expect(linhas[2].mesLabel).toMatch(/2027/)
  })

  it('não cumulativa: todos os meses têm a MESMA sobra (cada mês independe do anterior)', () => {
    const linhas = projetarMeses('2026-01', 4, 500_000, 200_000, 30_000)
    expect(linhas).toHaveLength(4)
    for (const l of linhas) {
      expect(l.sobraCents).toBe(270_000)
      expect(l.negativo).toBe(false)
      expect(l.faltamCents).toBe(0)
    }
  })

  it('cada mês negativo marca negativo:true e faltamCents (D-05)', () => {
    const linhas = projetarMeses('2026-01', 3, 100_000, 150_000, 0)
    for (const l of linhas) {
      expect(l.sobraCents).toBe(-50_000)
      expect(l.negativo).toBe(true)
      expect(l.faltamCents).toBe(50_000)
    }
  })

  it('numMeses abaixo de 3 é clamped para 3', () => {
    const linhas = projetarMeses('2026-01', 1, 100_000, 50_000, 0)
    expect(linhas).toHaveLength(3)
  })

  it('numMeses acima de 6 é clamped para 6', () => {
    const linhas = projetarMeses('2026-01', 12, 100_000, 50_000, 0)
    expect(linhas).toHaveLength(6)
  })
})

describe('algumMesNegativo (conveniência de UI — D-05)', () => {
  it('true quando qualquer mês é negativo', () => {
    const linhas = projetarMeses('2026-01', 3, 100_000, 150_000, 0)
    expect(algumMesNegativo(linhas)).toBe(true)
  })

  it('false quando todos os meses são positivos/zero', () => {
    const linhas = projetarMeses('2026-01', 3, 500_000, 200_000, 30_000)
    expect(algumMesNegativo(linhas)).toBe(false)
  })

  it('false para lista vazia', () => {
    expect(algumMesNegativo([])).toBe(false)
  })
})
