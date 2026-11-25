// src/app/(authed)/canais/_lib/pnl.test.ts
// Testes unitários das funções puras do P&L por empresa (Fatia 2 — D-02/D-05).
// Valores sempre em centavos (Int). Nenhum acesso a Prisma/servidor.
import { describe, it, expect } from 'vitest'
import {
  computeBruto,
  computeImpostos,
  computeLiquido,
  computeLucro,
  groupByCategory,
  type CategoriaTotal,
} from './pnl'

describe('computeBruto (PNL-02)', () => {
  it('é identidade sobre o total de receitas (ENTRADA) já agregadas', () => {
    expect(computeBruto(1_000_000)).toBe(1_000_000)
  })

  it('mês sem receitas devolve 0', () => {
    expect(computeBruto(0)).toBe(0)
  })
})

describe('computeImpostos (D-02 — identificar por nome)', () => {
  it('soma só o total das categorias cujo nome normalizado é "imposto"', () => {
    const custos: CategoriaTotal[] = [
      { categoryId: 'c1', name: 'Imposto', totalCents: 30_000 },
      { categoryId: 'c2', name: 'Anúncios', totalCents: 50_000 },
    ]
    expect(computeImpostos(custos)).toBe(30_000)
  })

  it('empresa sem categoria de imposto devolve 0', () => {
    const custos: CategoriaTotal[] = [
      { categoryId: 'c2', name: 'Anúncios', totalCents: 50_000 },
      { categoryId: 'c3', name: 'Ferramentas', totalCents: 10_000 },
    ]
    expect(computeImpostos(custos)).toBe(0)
  })

  it('lista de custos vazia devolve 0', () => {
    expect(computeImpostos([])).toBe(0)
  })

  it('normaliza acento e caixa: "IMPOSTO", "Imposto " e "ímpôsto" contam', () => {
    const custos: CategoriaTotal[] = [
      { categoryId: 'c1', name: 'IMPOSTO', totalCents: 10_000 },
      { categoryId: 'c2', name: 'Imposto ', totalCents: 20_000 },
      { categoryId: 'c3', name: 'ímpôsto', totalCents: 5_000 },
      { categoryId: 'c4', name: 'Anúncios', totalCents: 50_000 },
    ]
    expect(computeImpostos(custos)).toBe(35_000)
  })
})

describe('computeLiquido (PNL-03)', () => {
  it('líquido = bruto − impostos', () => {
    expect(computeLiquido(1_000_000, 30_000)).toBe(970_000)
  })

  it('sem impostos o líquido é igual ao bruto', () => {
    expect(computeLiquido(1_000_000, 0)).toBe(1_000_000)
  })

  it('pode ser negativo quando os impostos excedem o bruto', () => {
    expect(computeLiquido(10_000, 30_000)).toBe(-20_000)
  })
})

describe('computeLucro (PNL-04)', () => {
  it('lucro = receitas − todos os custos (SAIDA)', () => {
    expect(computeLucro(1_000_000, 400_000)).toBe(600_000)
  })

  it('mês sem lançamentos: lucro 0', () => {
    expect(computeLucro(0, 0)).toBe(0)
  })

  it('custos maiores que receitas → lucro negativo', () => {
    expect(computeLucro(300_000, 500_000)).toBe(-200_000)
  })
})

describe('groupByCategory (PNL-05)', () => {
  it('lista vazia devolve []', () => {
    expect(groupByCategory([])).toEqual([])
  })

  it('ordena desc por totalCents', () => {
    const itens: CategoriaTotal[] = [
      { categoryId: 'c1', name: 'Anúncios', totalCents: 50_000 },
      { categoryId: 'c2', name: 'Imposto', totalCents: 30_000 },
      { categoryId: 'c3', name: 'Ferramentas', totalCents: 80_000 },
    ]
    const ordenado = groupByCategory(itens)
    expect(ordenado.map((i) => i.categoryId)).toEqual(['c3', 'c1', 'c2'])
    expect(ordenado.map((i) => i.totalCents)).toEqual([80_000, 50_000, 30_000])
  })

  it('não muta a lista de entrada', () => {
    const itens: CategoriaTotal[] = [
      { categoryId: 'c1', name: 'A', totalCents: 10_000 },
      { categoryId: 'c2', name: 'B', totalCents: 20_000 },
    ]
    const copia = [...itens]
    groupByCategory(itens)
    expect(itens).toEqual(copia)
  })
})
