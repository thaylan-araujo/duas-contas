// src/lib/whatsapp/resolve.test.ts
// Testes puros da resolução de destino/categoria (regra Casa × Empresa, D-03/D-04).
// "Na dúvida, pergunta" — nunca adivinha. Fixtures usam `nome` para empresa e
// `name` para categoria (W2: a Empresa expõe `nome`, não `name`).
import { describe, it, expect } from 'vitest'
import { resolveDestino, resolveCategoria, type EmpresaRef, type CategoriaRef } from './resolve'

const empresas: EmpresaRef[] = [
  { id: 'e1', nome: 'Elite Juris' },
  { id: 'e2', nome: 'Achadinhos' },
  { id: 'e3', nome: 'Infoproduto' },
]

describe('resolveDestino', () => {
  it('vazio/undefined → faltou (nunca adivinha — D-03)', () => {
    expect(resolveDestino('', empresas)).toEqual({ faltou: true })
    expect(resolveDestino(undefined, empresas)).toEqual({ faltou: true })
    expect(resolveDestino('   ', empresas)).toEqual({ faltou: true })
  })

  it('"Casa" (qualquer caixa) → empresaId null', () => {
    expect(resolveDestino('Casa', empresas)).toEqual({ empresaId: null })
    expect(resolveDestino('casa', empresas)).toEqual({ empresaId: null })
    expect(resolveDestino('CASA', empresas)).toEqual({ empresaId: null })
  })

  it('match exato único por nome (normalizado, sem acento)', () => {
    expect(resolveDestino('achadinhos', empresas)).toEqual({ empresaId: 'e2' })
    expect(resolveDestino('Elite Juris', empresas)).toEqual({ empresaId: 'e1' })
  })

  it('match por substring única', () => {
    expect(resolveDestino('elite', empresas)).toEqual({ empresaId: 'e1' })
  })

  it('zero matches → ambiguo', () => {
    expect(resolveDestino('mercado livre', empresas)).toEqual({ ambiguo: true })
  })

  it('múltiplos matches → ambiguo', () => {
    const dup: EmpresaRef[] = [
      { id: 'a', nome: 'Loja Shopee' },
      { id: 'b', nome: 'Loja Shein' },
    ]
    expect(resolveDestino('loja', dup)).toEqual({ ambiguo: true })
  })
})

const categorias: CategoriaRef[] = [
  { id: 'c1', name: 'Combustível', empresaId: null },
  { id: 'c2', name: 'Alimentação', empresaId: null },
  { id: 'c3', name: 'Anúncios', empresaId: 'e2' },
  { id: 'c4', name: 'Comissões', empresaId: 'e2' },
]

describe('resolveCategoria', () => {
  it('vazio → faltou', () => {
    expect(resolveCategoria('', categorias, null)).toEqual({ faltou: true })
  })

  it('filtra pelo empresaId do destino já resolvido (Casa = null)', () => {
    expect(resolveCategoria('combustivel', categorias, null)).toEqual({ categoryId: 'c1' })
    // "Anúncios" é da empresa e2 — não existe na Casa → ambiguo
    expect(resolveCategoria('anuncios', categorias, null)).toEqual({ ambiguo: true })
  })

  it('resolve categoria da empresa quando empresaId bate', () => {
    expect(resolveCategoria('anuncios', categorias, 'e2')).toEqual({ categoryId: 'c3' })
  })

  it('nenhuma correspondência → ambiguo (nunca cria categoria — D-04)', () => {
    expect(resolveCategoria('viagem', categorias, null)).toEqual({ ambiguo: true })
  })
})
