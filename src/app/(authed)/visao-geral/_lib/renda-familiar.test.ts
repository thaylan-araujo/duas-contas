// src/app/(authed)/visao-geral/_lib/renda-familiar.test.ts
// Testes unitários da função pura de agrupamento da renda familiar por origem
// (Fatia 3 — PL-05/D-04). Valores sempre em centavos (Int). Nenhum acesso a
// Prisma/servidor — espelha canais/_lib/pnl.test.ts.
import { describe, it, expect } from 'vitest'
import {
  agruparRendaPorOrigem,
  somaRenda,
  type EntradaPorOrigem,
  type EmpresaInfo,
} from './renda-familiar'

describe('agruparRendaPorOrigem (PL-05)', () => {
  it('lista vazia devolve []', () => {
    expect(agruparRendaPorOrigem([], new Map())).toEqual([])
  })

  it('só "outras entradas" (nenhum pró-labore) → 1 linha "Outras entradas"', () => {
    const entradas: EntradaPorOrigem[] = [
      { origemEmpresaId: null, totalCents: 500_000 },
    ]
    const linhas = agruparRendaPorOrigem(entradas, new Map())
    expect(linhas).toEqual([
      {
        origemEmpresaId: null,
        nome: 'Outras entradas',
        cor: null,
        totalCents: 500_000,
      },
    ])
  })

  it('2 empresas + 1 sem origem → empresas ordenadas desc, "Outras entradas" por último', () => {
    const entradas: EntradaPorOrigem[] = [
      { origemEmpresaId: 'e1', totalCents: 100_000 },
      { origemEmpresaId: null, totalCents: 500_000 },
      { origemEmpresaId: 'e2', totalCents: 300_000 },
    ]
    const empresas = new Map<string, EmpresaInfo>([
      ['e1', { nome: 'Afiliados', cor: 'laranja' }],
      ['e2', { nome: 'Jurídico', cor: 'verde' }],
    ])
    const linhas = agruparRendaPorOrigem(entradas, empresas)
    expect(linhas).toEqual([
      { origemEmpresaId: 'e2', nome: 'Jurídico', cor: 'verde', totalCents: 300_000 },
      { origemEmpresaId: 'e1', nome: 'Afiliados', cor: 'laranja', totalCents: 100_000 },
      { origemEmpresaId: null, nome: 'Outras entradas', cor: null, totalCents: 500_000 },
    ])
  })

  it('"Outras entradas" fica por último mesmo quando é o maior valor', () => {
    const entradas: EntradaPorOrigem[] = [
      { origemEmpresaId: null, totalCents: 900_000 },
      { origemEmpresaId: 'e1', totalCents: 100_000 },
    ]
    const empresas = new Map<string, EmpresaInfo>([
      ['e1', { nome: 'Afiliados', cor: 'laranja' }],
    ])
    const linhas = agruparRendaPorOrigem(entradas, empresas)
    expect(linhas.map((l) => l.origemEmpresaId)).toEqual(['e1', null])
  })

  it('origem de empresa removida (id ausente no mapa) → fallback "Empresa removida", cor null, não quebra', () => {
    const entradas: EntradaPorOrigem[] = [
      { origemEmpresaId: 'orfa', totalCents: 200_000 },
    ]
    const linhas = agruparRendaPorOrigem(entradas, new Map())
    expect(linhas).toEqual([
      {
        origemEmpresaId: 'orfa',
        nome: 'Empresa removida',
        cor: null,
        totalCents: 200_000,
      },
    ])
  })

  it('não muta a lista de entrada', () => {
    const entradas: EntradaPorOrigem[] = [
      { origemEmpresaId: 'e1', totalCents: 100_000 },
      { origemEmpresaId: 'e2', totalCents: 300_000 },
    ]
    const copia = JSON.parse(JSON.stringify(entradas))
    agruparRendaPorOrigem(
      entradas,
      new Map([
        ['e1', { nome: 'A', cor: 'laranja' }],
        ['e2', { nome: 'B', cor: 'verde' }],
      ])
    )
    expect(entradas).toEqual(copia)
  })
})

describe('somaRenda (invariante soma == Dinheiro do mês)', () => {
  it('lista vazia soma 0', () => {
    expect(somaRenda([])).toBe(0)
  })

  it('soma os totalCents de todas as linhas', () => {
    const linhas = agruparRendaPorOrigem(
      [
        { origemEmpresaId: 'e1', totalCents: 100_000 },
        { origemEmpresaId: null, totalCents: 500_000 },
        { origemEmpresaId: 'e2', totalCents: 300_000 },
      ],
      new Map([
        ['e1', { nome: 'A', cor: 'laranja' }],
        ['e2', { nome: 'B', cor: 'verde' }],
      ])
    )
    expect(somaRenda(linhas)).toBe(900_000)
  })
})
