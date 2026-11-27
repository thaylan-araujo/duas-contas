// src/app/(authed)/planejamento/_lib/comprometido.test.ts
// Testes unitários das funções puras do "comprometido" / "posso gastar" (R-2).
// Sem Prisma — maximamente testáveis. Dinheiro em centavos (Int), literais com
// underscore (ex.: 320_000). Cobre a regra "cada linha conta uma vez só": a
// transição em aberto→pago NÃO duplica o comprometido (anti-objetivo §4).
import { describe, it, expect } from 'vitest'
import {
  computeComprometido,
  computePossoGastar,
  type EmAbertoLinha,
} from './comprometido'

describe('computeComprometido (R-2)', () => {
  it('só pagos, em aberto vazio → devolve os pagos', () => {
    expect(computeComprometido(530_000, [])).toBe(530_000)
  })

  it('uma linha em aberto de valor certo (isVariableAmount=false) soma amountCents', () => {
    const emAberto: EmAbertoLinha[] = [
      { amountCents: 15_000, estimatedCents: null, isVariableAmount: false },
    ]
    expect(computeComprometido(100_000, emAberto)).toBe(115_000)
  })

  it('uma linha "a definir" (isVariableAmount=true) soma estimatedCents, não amountCents', () => {
    const emAberto: EmAbertoLinha[] = [
      // amountCents deve ser ignorado quando "a definir"; usa a estimativa.
      { amountCents: 99_999, estimatedCents: 20_000, isVariableAmount: true },
    ]
    expect(computeComprometido(100_000, emAberto)).toBe(120_000)
  })

  it('"a definir" com estimatedCents null → soma 0 (não infla — R-5 sem histórico)', () => {
    const emAberto: EmAbertoLinha[] = [
      { amountCents: 99_999, estimatedCents: null, isVariableAmount: true },
    ]
    expect(computeComprometido(100_000, emAberto)).toBe(100_000)
  })

  it('mistura: pagos + uma certa + uma a definir → soma correta', () => {
    const emAberto: EmAbertoLinha[] = [
      { amountCents: 15_000, estimatedCents: null, isVariableAmount: false }, // certa → 15.000
      { amountCents: 0, estimatedCents: 8_000, isVariableAmount: true }, // a definir → 8.000
    ]
    // 100.000 pagos + 15.000 + 8.000 = 123.000
    expect(computeComprometido(100_000, emAberto)).toBe(123_000)
  })

  it('transição em aberto→pago NÃO duplica: mesma linha dá o MESMO comprometido', () => {
    // ANTES: nada pago ainda, 1 conta em aberto de 15.000.
    const antes = computeComprometido(0, [
      { amountCents: 15_000, estimatedCents: null, isVariableAmount: false },
    ])
    // DEPOIS: a MESMA linha virou PAGO (status muda, não cria outra linha):
    // agora entra na parcela de pagos e some da lista de em aberto.
    const depois = computeComprometido(15_000, [])
    expect(antes).toBe(depois) // cada linha conta uma vez só (R-2)
    expect(depois).toBe(15_000)
  })
})

describe('computePossoGastar', () => {
  it('entradas − comprometido', () => {
    expect(computePossoGastar(850_000, 530_000)).toBe(320_000)
  })

  it('pode ser negativo quando comprometido > entradas', () => {
    expect(computePossoGastar(500_000, 600_000)).toBe(-100_000)
  })

  it('sem comprometido devolve as entradas inteiras', () => {
    expect(computePossoGastar(850_000, 0)).toBe(850_000)
  })
})
