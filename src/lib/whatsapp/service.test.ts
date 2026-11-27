// src/lib/whatsapp/service.test.ts
// Allowlist (resolveContact) + idempotência (dedupeInbound) da Fatia 1 (09-02 Task 2).
// Mocka o singleton `@/lib/prisma` (vi.hoisted + vi.mock, espelhando o estilo de
// lancamentos/_lib/service.test.ts) e inspeciona as chamadas. Nenhum banco real.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  whatsappContact: {
    findFirst: vi.fn(),
  },
  whatsappInbound: {
    create: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import { resolveContact, dedupeInbound } from './service'

const PHONE = '5511999999999'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('resolveContact (allowlist, T-09-04)', () => {
  it('retorna o contato ativo encontrado (com userId)', async () => {
    const contato = { id: 'c1', phone: PHONE, userId: 'user-1', active: true }
    prismaMock.whatsappContact.findFirst.mockResolvedValue(contato)

    const result = await resolveContact(PHONE)

    expect(result).toEqual(contato)
    expect(prismaMock.whatsappContact.findFirst).toHaveBeenCalledWith({
      where: { phone: PHONE, active: true },
    })
  })

  it('retorna null quando não há contato ativo (número fora da allowlist)', async () => {
    prismaMock.whatsappContact.findFirst.mockResolvedValue(null)

    const result = await resolveContact(PHONE)

    expect(result).toBeNull()
  })
})

describe('dedupeInbound (idempotência P2002, T-09-02)', () => {
  it('create bem-sucedido → { duplicate: false }', async () => {
    prismaMock.whatsappInbound.create.mockResolvedValue({ id: 'i1', messageId: 'MSG1', phone: PHONE })

    const result = await dedupeInbound({ messageId: 'MSG1', phone: PHONE })

    expect(result).toEqual({ duplicate: false })
    expect(prismaMock.whatsappInbound.create).toHaveBeenCalledWith({
      data: { messageId: 'MSG1', phone: PHONE, processed: false },
    })
  })

  it('violação unique P2002 → { duplicate: true } (mensagem já vista, não relança)', async () => {
    const p2002 = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
    prismaMock.whatsappInbound.create.mockRejectedValue(p2002)

    const result = await dedupeInbound({ messageId: 'MSG1', phone: PHONE })

    expect(result).toEqual({ duplicate: true })
  })

  it('erro não-P2002 propaga (não engole falhas inesperadas)', async () => {
    prismaMock.whatsappInbound.create.mockRejectedValue(new Error('conexão caiu'))

    await expect(dedupeInbound({ messageId: 'MSG1', phone: PHONE })).rejects.toThrow('conexão caiu')
  })
})
