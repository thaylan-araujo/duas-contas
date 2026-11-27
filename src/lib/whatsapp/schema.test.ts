// src/lib/whatsapp/schema.test.ts
// Testes do schema Zod que valida a saída estruturada da IA (tool_use.input).
import { describe, it, expect } from 'vitest'
import { aiResultSchema } from './schema'

describe('aiResultSchema', () => {
  it('aceita um lançamento válido', () => {
    const r = aiResultSchema.safeParse({
      intent: 'lancar',
      tipo: 'SAIDA',
      valorCents: 5000,
      data: '2026-11-27',
      categoria: 'Combustível',
      destino: 'Casa',
      confianca: 'alta',
    })
    expect(r.success).toBe(true)
  })

  it('aceita intenção de relatório sem campos de lançamento', () => {
    const r = aiResultSchema.safeParse({ intent: 'relatorio', confianca: 'media' })
    expect(r.success).toBe(true)
  })

  it('rejeita intent fora do enum', () => {
    const r = aiResultSchema.safeParse({ intent: 'pagar', confianca: 'alta' })
    expect(r.success).toBe(false)
  })

  it('rejeita valorCents negativo', () => {
    const r = aiResultSchema.safeParse({ intent: 'lancar', valorCents: -100, confianca: 'alta' })
    expect(r.success).toBe(false)
  })

  it('rejeita quando falta confianca', () => {
    const r = aiResultSchema.safeParse({ intent: 'lancar' })
    expect(r.success).toBe(false)
  })
})
