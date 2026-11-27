// src/lib/whatsapp/pending.test.ts
// Testes dos helpers de ação pendente (multi-turno) do 09-03 Task 1. Estado
// persistido no Postgres porque o serverless é stateless (D-07): quando falta
// destino/categoria, o bot guarda a extração PARCIAL com TTL e a próxima
// mensagem completa o lançamento. Mocka o singleton `@/lib/prisma` e inspeciona
// as chamadas de findFirst/upsert/deleteMany — nenhuma rede/DB real.
//
// Invariantes testadas (ver threat_model do plano):
// - findPendingAction só considera pendência viva (expiresAt > now) — TTL evita
//   que uma pendência velha "sequestre" uma mensagem nova e solta (T-09-08).
// - upsertPendingAction grava/atualiza por `phone` (@unique) com expiresAt futuro.
// - clearPendingAction remove a pendência (chamado ao completar o lançamento).
import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  whatsappPendingAction: {
    findFirst: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))

import {
  findPendingAction,
  upsertPendingAction,
  clearPendingAction,
} from './service'

const PHONE = '5511999999999'
const NOW = new Date('2026-11-27T12:00:00.000Z')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('findPendingAction', () => {
  it('retorna a pendência viva (expiresAt > now) com partial e kind', async () => {
    const pendencia = {
      id: 'p1',
      phone: PHONE,
      kind: 'ask_destino',
      partial: { valorCents: 5000, categoria: 'Gasolina' },
      expiresAt: new Date('2026-11-27T12:10:00.000Z'),
    }
    prismaMock.whatsappPendingAction.findFirst.mockResolvedValue(pendencia)

    const res = await findPendingAction(PHONE, NOW)

    expect(res).toBe(pendencia)
    // escopada por phone + só pendência viva (expiresAt > now)
    expect(prismaMock.whatsappPendingAction.findFirst).toHaveBeenCalledWith({
      where: { phone: PHONE, expiresAt: { gt: NOW } },
    })
  })

  it('pendência expirada → o filtro não a retorna (null) — não sequestra msg nova (T-09-08)', async () => {
    // O Prisma não retorna linhas com expiresAt <= now por causa do filtro `gt`.
    prismaMock.whatsappPendingAction.findFirst.mockResolvedValue(null)

    const res = await findPendingAction(PHONE, NOW)

    expect(res).toBeNull()
    expect(prismaMock.whatsappPendingAction.findFirst).toHaveBeenCalledWith({
      where: { phone: PHONE, expiresAt: { gt: NOW } },
    })
  })
})

describe('upsertPendingAction', () => {
  it('grava/atualiza a pendência por phone com partial e expiresAt = now + ttl', async () => {
    prismaMock.whatsappPendingAction.upsert.mockResolvedValue({ id: 'p1' })
    const partial = { valorCents: 5000, categoria: 'Gasolina' }

    await upsertPendingAction({
      phone: PHONE,
      kind: 'ask_destino',
      partial,
      ttlMinutes: 15,
      now: NOW,
    })

    expect(prismaMock.whatsappPendingAction.upsert).toHaveBeenCalledTimes(1)
    const arg = prismaMock.whatsappPendingAction.upsert.mock.calls[0][0]
    // upsert por phone (@unique): uma pendência por número
    expect(arg.where).toEqual({ phone: PHONE })
    // expiresAt = now + 15 min = 12:15
    const esperado = new Date('2026-11-27T12:15:00.000Z')
    expect(arg.create).toMatchObject({ phone: PHONE, kind: 'ask_destino', partial })
    expect(arg.create.expiresAt.getTime()).toBe(esperado.getTime())
    expect(arg.update).toMatchObject({ kind: 'ask_destino', partial })
    expect(arg.update.expiresAt.getTime()).toBe(esperado.getTime())
  })

  it('usa o relógio real quando `now` não é injetado', async () => {
    prismaMock.whatsappPendingAction.upsert.mockResolvedValue({ id: 'p1' })
    const antes = Date.now()

    await upsertPendingAction({
      phone: PHONE,
      kind: 'ask_categoria',
      partial: { valorCents: 300 },
      ttlMinutes: 15,
    })

    const arg = prismaMock.whatsappPendingAction.upsert.mock.calls[0][0]
    const depois = Date.now()
    // expiresAt deve cair ~15 min no futuro a partir de agora (tolerância de 1 min)
    const ts = arg.create.expiresAt.getTime()
    expect(ts).toBeGreaterThanOrEqual(antes + 15 * 60 * 1000 - 60 * 1000)
    expect(ts).toBeLessThanOrEqual(depois + 15 * 60 * 1000 + 60 * 1000)
  })
})

describe('clearPendingAction', () => {
  it('remove a pendência do phone (chamado ao completar o lançamento)', async () => {
    prismaMock.whatsappPendingAction.deleteMany.mockResolvedValue({ count: 1 })

    await clearPendingAction(PHONE)

    expect(prismaMock.whatsappPendingAction.deleteMany).toHaveBeenCalledWith({
      where: { phone: PHONE },
    })
  })
})
