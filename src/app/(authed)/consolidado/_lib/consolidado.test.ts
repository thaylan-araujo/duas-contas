// src/app/(authed)/consolidado/_lib/consolidado.test.ts
// Testes unitários das funções puras de agregação do Consolidado (Fatia 4 —
// CONS-01/D-02). Valores sempre em centavos (Int). Nenhum acesso a Prisma/
// servidor — espelha renda-familiar.test.ts e pnl.test.ts.
import { describe, it, expect } from 'vitest'
import {
  ordenarLinhas,
  somarConsolidado,
  type LinhaConsolidado,
  type TotaisConsolidado,
} from './consolidado'

function linha(over: Partial<LinhaConsolidado> = {}): LinhaConsolidado {
  return {
    empresaId: 'e1',
    nome: 'Empresa 1',
    cor: 'laranja',
    brutoCents: 0,
    liquidoCents: 0,
    lucroCents: 0,
    dasEstimadoCents: 0,
    aliquotaDefinida: true,
    proLaboreCents: 0,
    ...over,
  }
}

describe('somarConsolidado (CONS-01 — total == soma das linhas)', () => {
  it('lista vazia devolve todos os totais zero', () => {
    const totais = somarConsolidado([])
    const esperado: TotaisConsolidado = {
      brutoCents: 0,
      liquidoCents: 0,
      lucroCents: 0,
      dasEstimadoCents: 0,
      proLaboreCents: 0,
    }
    expect(totais).toEqual(esperado)
  })

  it('soma cada campo de 2 empresas — total == soma das linhas', () => {
    const linhas: LinhaConsolidado[] = [
      linha({
        empresaId: 'e1',
        brutoCents: 1_000_000,
        liquidoCents: 940_000,
        lucroCents: 500_000,
        dasEstimadoCents: 60_000,
        proLaboreCents: 200_000,
      }),
      linha({
        empresaId: 'e2',
        brutoCents: 2_000_000,
        liquidoCents: 1_800_000,
        lucroCents: 700_000,
        dasEstimadoCents: 200_000,
        proLaboreCents: 300_000,
      }),
    ]
    const totais = somarConsolidado(linhas)
    expect(totais).toEqual({
      brutoCents: 3_000_000,
      liquidoCents: 2_740_000,
      lucroCents: 1_200_000,
      dasEstimadoCents: 260_000,
      proLaboreCents: 500_000,
    })
  })

  it('empresa com DAS "não definido" (aliquotaDefinida false, dasEstimadoCents 0) soma 0 ao DAS e não quebra', () => {
    const linhas: LinhaConsolidado[] = [
      linha({
        empresaId: 'e1',
        brutoCents: 1_000_000,
        dasEstimadoCents: 60_000,
        aliquotaDefinida: true,
      }),
      linha({
        empresaId: 'e2',
        brutoCents: 500_000,
        dasEstimadoCents: 0,
        aliquotaDefinida: false,
      }),
    ]
    const totais = somarConsolidado(linhas)
    expect(totais.dasEstimadoCents).toBe(60_000)
    expect(totais.brutoCents).toBe(1_500_000)
  })

  it('não muta as linhas de entrada', () => {
    const linhas: LinhaConsolidado[] = [
      linha({ empresaId: 'e1', lucroCents: 100_000 }),
      linha({ empresaId: 'e2', lucroCents: 300_000 }),
    ]
    const copia = JSON.parse(JSON.stringify(linhas))
    somarConsolidado(linhas)
    expect(linhas).toEqual(copia)
  })
})

describe('ordenarLinhas (DESC por lucro, não muta)', () => {
  it('ordena DESC por lucroCents (maior lucro primeiro)', () => {
    const linhas: LinhaConsolidado[] = [
      linha({ empresaId: 'e1', lucroCents: 100_000 }),
      linha({ empresaId: 'e2', lucroCents: 300_000 }),
      linha({ empresaId: 'e3', lucroCents: 200_000 }),
    ]
    const ordenadas = ordenarLinhas(linhas)
    expect(ordenadas.map((l) => l.empresaId)).toEqual(['e2', 'e3', 'e1'])
  })

  it('não muta a lista de entrada (usa cópia)', () => {
    const linhas: LinhaConsolidado[] = [
      linha({ empresaId: 'e1', lucroCents: 100_000 }),
      linha({ empresaId: 'e2', lucroCents: 300_000 }),
    ]
    const copia = JSON.parse(JSON.stringify(linhas))
    const ordenadas = ordenarLinhas(linhas)
    expect(linhas).toEqual(copia)
    expect(ordenadas).not.toBe(linhas)
  })

  it('lista vazia devolve []', () => {
    expect(ordenarLinhas([])).toEqual([])
  })
})
