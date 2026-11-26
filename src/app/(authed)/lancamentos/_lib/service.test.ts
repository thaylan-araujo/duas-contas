// src/app/(authed)/lancamentos/_lib/service.test.ts
// Testes do par atômico de pró-labore multi-empresa (04c-02 / PL-01/PL-02/PL-06).
//
// Mocka o Prisma client (`@/lib/prisma`) e inspeciona as chamadas de
// $transaction/create/upsert/findFirst. Cobre:
// - createProLaboreService cria EXATAMENTE duas transactions numa única $transaction
// - SAÍDA na empresa (type SAIDA, empresaId = origem, origemEmpresaId = origem, categoria CUSTO)
// - ENTRADA na Casa (type ENTRADA, empresaId null, origemEmpresaId = origem, categoria kind null)
// - ambas compartilham o MESMO pairId (não null)
// - categoria "Pró-labore" obtida/criada (getOrCreate) na empresa e na Casa (idempotente)
// - IDOR: empresa de origem de outro usuário → erro, nada gravado
// - guard de edição/exclusão individual (PAIRED_TRANSACTION) continua travado
import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Prisma mock ---------------------------------------------------------
// Estrutura de mock que espelha as chamadas que o service faz: empresa.findFirst
// (IDOR), category.upsert / category.findFirst / category.create (getOrCreate da
// categoria "Pró-labore"), transaction.create/findFirst, e $transaction (callback
// recebe um `tx` com os mesmos mocks + lista de operações atômica).
// vi.hoisted: o factory de vi.mock é içado ao topo do arquivo; a estrutura do
// mock precisa existir ANTES dele — hoisted garante essa ordem.
const prismaMock = vi.hoisted(() => ({
  empresa: {
    findFirst: vi.fn(),
  },
  category: {
    upsert: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  transaction: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import {
  createProLaboreService,
  updateTransactionService,
  deleteTransactionService,
} from './service'

const USER = 'user-1'
const EMPRESA = 'emp-1'
const CAT_EMPRESA_ID = 'cat-empresa-pro-labore'
const CAT_CASA_ID = 'cat-casa-pro-labore'

beforeEach(() => {
  vi.clearAllMocks()

  // Empresa pertence ao usuário por padrão (IDOR ok)
  prismaMock.empresa.findFirst.mockResolvedValue({ id: EMPRESA, userId: USER })

  // getOrCreate da categoria "Pró-labore": upsert devolve a categoria
  // apropriada conforme o empresaId pedido (empresa → CUSTO; Casa → null kind).
  prismaMock.category.upsert.mockImplementation(
    async (args: {
      where: { name_empresaId_userId: { empresaId: string | null } }
      create: { empresaId: string | null }
    }) => {
      const empresaId = args.where.name_empresaId_userId.empresaId
      if (empresaId === EMPRESA) {
        return { id: CAT_EMPRESA_ID, name: 'Pró-labore', empresaId: EMPRESA, kind: 'CUSTO', userId: USER }
      }
      return { id: CAT_CASA_ID, name: 'Pró-labore', empresaId: null, kind: null, userId: USER }
    }
  )

  // Fallback findFirst/create (Casa empresaId null) — mesma resolução.
  prismaMock.category.findFirst.mockResolvedValue(null)
  prismaMock.category.create.mockImplementation(
    async (args: { data: { empresaId: string | null } }) => {
      const empresaId = args.data.empresaId
      if (empresaId === EMPRESA) {
        return { id: CAT_EMPRESA_ID, name: 'Pró-labore', empresaId: EMPRESA, kind: 'CUSTO', userId: USER }
      }
      return { id: CAT_CASA_ID, name: 'Pró-labore', empresaId: null, kind: null, userId: USER }
    }
  )

  // transaction.create devolve o próprio data (com um id fictício)
  prismaMock.transaction.create.mockImplementation(
    async (args: { data: Record<string, unknown> }) => ({ id: 'tx-' + Math.random(), ...args.data })
  )

  // $transaction: executa o callback com um `tx` que expõe os mesmos mocks.
  prismaMock.$transaction.mockImplementation(
    async (arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (tx: typeof prismaMock) => unknown)(prismaMock)
      }
      // forma array: resolve cada promise
      return Promise.all(arg as Promise<unknown>[])
    }
  )
})

describe('createProLaboreService (PL-01 — par atômico multi-empresa)', () => {
  const input = {
    userId: USER,
    origemEmpresaId: EMPRESA,
    amountCents: 100000,
    date: '2026-11-15',
  }

  it('valida a posse da empresa de origem (IDOR) antes de gravar', async () => {
    await createProLaboreService(input)
    expect(prismaMock.empresa.findFirst).toHaveBeenCalledWith({
      where: { id: EMPRESA, userId: USER },
    })
  })

  it('cria EXATAMENTE duas transactions', async () => {
    await createProLaboreService(input)
    expect(prismaMock.transaction.create).toHaveBeenCalledTimes(2)
  })

  it('cria as duas linhas dentro de uma única prisma.$transaction', async () => {
    await createProLaboreService(input)
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
  })

  it('a SAÍDA: type SAIDA, empresaId = origem, origemEmpresaId = origem, categoria da empresa', async () => {
    await createProLaboreService(input)
    const saida = prismaMock.transaction.create.mock.calls
      .map((c) => c[0].data)
      .find((d: Record<string, unknown>) => d.type === 'SAIDA')
    expect(saida).toBeDefined()
    expect(saida.empresaId).toBe(EMPRESA)
    expect(saida.origemEmpresaId).toBe(EMPRESA)
    expect(saida.categoryId).toBe(CAT_EMPRESA_ID)
    expect(saida.amountCents).toBe(100000)
  })

  it('a ENTRADA: type ENTRADA, empresaId null (Casa), origemEmpresaId = origem, categoria da Casa', async () => {
    await createProLaboreService(input)
    const entrada = prismaMock.transaction.create.mock.calls
      .map((c) => c[0].data)
      .find((d: Record<string, unknown>) => d.type === 'ENTRADA')
    expect(entrada).toBeDefined()
    expect(entrada.empresaId).toBeNull()
    expect(entrada.origemEmpresaId).toBe(EMPRESA)
    expect(entrada.categoryId).toBe(CAT_CASA_ID)
    expect(entrada.amountCents).toBe(100000)
  })

  it('as duas linhas compartilham o MESMO pairId (não null)', async () => {
    await createProLaboreService(input)
    const datas = prismaMock.transaction.create.mock.calls.map((c) => c[0].data)
    const pairIds = datas.map((d: Record<string, unknown>) => d.pairId)
    expect(pairIds[0]).toBeTruthy()
    expect(pairIds[0]).toBe(pairIds[1])
  })

  it('garante a categoria "Pró-labore" na empresa (getOrCreate)', async () => {
    await createProLaboreService(input)
    // Deve ter resolvido uma categoria "Pró-labore" cujo empresaId = a empresa.
    const createdEmpresaCat =
      prismaMock.category.upsert.mock.calls.some(
        (c) =>
          c[0].where.name_empresaId_userId.name === 'Pró-labore' &&
          c[0].where.name_empresaId_userId.empresaId === EMPRESA
      ) ||
      prismaMock.category.create.mock.calls.some(
        (c) => c[0].data.empresaId === EMPRESA && c[0].data.name === 'Pró-labore'
      )
    expect(createdEmpresaCat).toBe(true)
  })

  it('garante a categoria "Pró-labore" na Casa (empresaId null)', async () => {
    await createProLaboreService(input)
    const createdCasaCat =
      prismaMock.category.upsert.mock.calls.some(
        (c) =>
          c[0].where.name_empresaId_userId.name === 'Pró-labore' &&
          c[0].where.name_empresaId_userId.empresaId === null
      ) ||
      prismaMock.category.create.mock.calls.some(
        (c) => c[0].data.empresaId === null && c[0].data.name === 'Pró-labore'
      )
    expect(createdCasaCat).toBe(true)
  })

  it('rodar duas vezes não duplica a categoria (upsert idempotente na chave composta)', async () => {
    await createProLaboreService(input)
    await createProLaboreService(input)
    // Toda resolução de categoria passa por upsert na chave composta
    // name_empresaId_userId (ou findFirst+create como fallback) — nunca um
    // create cego que duplicaria.
    for (const call of prismaMock.category.upsert.mock.calls) {
      expect(call[0].where.name_empresaId_userId).toBeDefined()
      expect(call[0].where.name_empresaId_userId.name).toBe('Pró-labore')
    }
  })

  it('IDOR: empresa de origem de outro usuário → erro e NÃO cria nada', async () => {
    prismaMock.empresa.findFirst.mockResolvedValueOnce(null)
    await expect(createProLaboreService(input)).rejects.toThrow()
    expect(prismaMock.transaction.create).not.toHaveBeenCalled()
  })
})

describe('guard de par (PL-06 — edição/exclusão individual bloqueada)', () => {
  it('updateTransactionService lança PAIRED_TRANSACTION quando pairId != null', async () => {
    prismaMock.transaction.findFirst.mockResolvedValueOnce({
      id: 'tx-1',
      userId: USER,
      pairId: 'pair-1',
    })
    await expect(
      updateTransactionService('tx-1', USER, { amountCents: 500 })
    ).rejects.toThrow('PAIRED_TRANSACTION')
    expect(prismaMock.transaction.update).not.toHaveBeenCalled()
  })

  it('deleteTransactionService lança PAIRED_TRANSACTION quando pairId != null', async () => {
    prismaMock.transaction.findFirst.mockResolvedValueOnce({
      id: 'tx-1',
      userId: USER,
      pairId: 'pair-1',
    })
    await expect(deleteTransactionService('tx-1', USER)).rejects.toThrow(
      'PAIRED_TRANSACTION'
    )
    expect(prismaMock.transaction.delete).not.toHaveBeenCalled()
  })
})
