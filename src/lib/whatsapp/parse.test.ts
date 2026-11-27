// src/lib/whatsapp/parse.test.ts
// Testes puros de parseInbound (payload da Evolution → campos normalizados).
// Fatia 1 (Wave 0). Nenhum acesso a Prisma/rede.
import { describe, it, expect } from 'vitest'
import { parseInbound } from './parse'

describe('parseInbound', () => {
  it('extrai texto de data.message.conversation', () => {
    const r = parseInbound({
      data: {
        key: { remoteJid: '5511999998888@s.whatsapp.net', fromMe: false, id: 'ABC' },
        message: { conversation: 'gastei 50 de gasolina' },
        pushName: 'Thaylan',
      },
    })
    expect(r.text).toBe('gastei 50 de gasolina')
    expect(r.messageId).toBe('ABC')
    expect(r.pushName).toBe('Thaylan')
  })

  it('extrai texto de extendedTextMessage.text quando não há conversation', () => {
    const r = parseInbound({
      data: {
        key: { remoteJid: '5511999998888@s.whatsapp.net', id: 'X' },
        message: { extendedTextMessage: { text: 'paguei 400 de imposto' } },
      },
    })
    expect(r.text).toBe('paguei 400 de imposto')
  })

  it('marca fromMe quando data.key.fromMe é true', () => {
    const r = parseInbound({
      data: { key: { remoteJid: '5511999998888@s.whatsapp.net', fromMe: true, id: 'Y' }, message: { conversation: 'oi' } },
    })
    expect(r.fromMe).toBe(true)
  })

  it('detecta grupo quando remoteJid termina em @g.us', () => {
    const r = parseInbound({
      data: { key: { remoteJid: '120363000000@g.us', id: 'G' }, message: { conversation: 'oi grupo' } },
    })
    expect(r.isGroup).toBe(true)
  })

  it('usa remoteJidAlt (número real) quando remoteJid é @lid', () => {
    const r = parseInbound({
      data: {
        key: { remoteJid: '123456@lid', remoteJidAlt: '5511999998888@s.whatsapp.net', id: 'L' },
        message: { conversation: 'oi' },
      },
    })
    expect(r.phone).toBe('5511999998888')
  })

  it('phone contém só dígitos (sufixo de domínio removido)', () => {
    const r = parseInbound({
      data: { key: { remoteJid: '5511999998888@s.whatsapp.net', id: 'Z' }, message: { conversation: 'oi' } },
    })
    expect(r.phone).toBe('5511999998888')
    expect(r.phone).toMatch(/^\d+$/)
  })

  it('texto vazio quando a mensagem não tem conversation nem extendedTextMessage', () => {
    const r = parseInbound({
      data: { key: { remoteJid: '5511999998888@s.whatsapp.net', id: 'E' }, message: {} },
    })
    expect(r.text).toBe('')
  })
})
