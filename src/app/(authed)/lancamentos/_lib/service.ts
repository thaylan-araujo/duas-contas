// src/app/(authed)/lancamentos/_lib/service.ts
// Pure TypeScript business logic — no 'use server'
import { parseISO } from 'date-fns'
import { prisma } from '@/lib/prisma'
import type { TransactionFormData, ProLaboreFormData, CategoryCreateData } from './schema'

/**
 * Returns all categories for the given user, ordered by name.
 */
export async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })
}

/**
 * Creates a new transaction for the user.
 * Uses parseISO to convert "YYYY-MM-DD" string to a Date — prevents timezone drift.
 */
export async function createTransactionService(
  data: TransactionFormData & { userId: string }
) {
  // `status` flui por ...rest (default PAGO já aplicado pelo schema). `dueDate`
  // precisa de parseISO (string YYYY-MM-DD → Date) e é pulado quando vazio.
  const { date, userId, dueDate, ...rest } = data
  return prisma.transaction.create({
    data: {
      ...rest,
      date: parseISO(date),
      ...(dueDate ? { dueDate: parseISO(dueDate) } : {}),
      userId,
    },
  })
}

/**
 * Updates an existing transaction.
 * Guards: userId ownership check + pairId guard (D-06).
 */
export async function updateTransactionService(
  id: string,
  userId: string,
  data: Partial<TransactionFormData>
) {
  const record = await prisma.transaction.findFirst({
    where: { id, userId },
  })

  if (!record) {
    throw new Error('Lançamento não encontrado.')
  }

  if (record.pairId !== null) {
    throw new Error('PAIRED_TRANSACTION')
  }

  // `status` flui por ...rest. `date`/`dueDate` são condicionais (parseISO só
  // quando presentes — string vazia/ausente não grava, evita data inválida).
  const { date, dueDate, ...rest } = data

  return prisma.transaction.update({
    where: { id },
    data: {
      ...rest,
      ...(date ? { date: parseISO(date) } : {}),
      ...(dueDate ? { dueDate: parseISO(dueDate) } : {}),
    },
  })
}

/**
 * Deletes a transaction.
 * Guards: userId ownership check + pairId guard (D-06).
 */
export async function deleteTransactionService(id: string, userId: string) {
  const record = await prisma.transaction.findFirst({
    where: { id, userId },
  })

  if (!record) {
    throw new Error('Lançamento não encontrado.')
  }

  if (record.pairId !== null) {
    throw new Error('PAIRED_TRANSACTION')
  }

  return prisma.transaction.delete({
    where: { id },
  })
}

// ---------------------------------------------------------------------------
// Pró-labore services (LANC-05 / 04c-02 — par atômico multi-empresa)
// ---------------------------------------------------------------------------

const PRO_LABORE_CATEGORIA = 'Pró-labore'

/**
 * Garante (getOrCreate, idempotente) a categoria "Pró-labore" para um escopo
 * (empresa `empresaId` ou Casa quando `empresaId` é null), com o `kind` dado.
 * Mesmo padrão idempotente de getOrSeedCategorias (upsert na chave composta
 * name_empresaId_userId). Para a Casa (empresaId null) o upsert do Prisma pode
 * recusar a chave composta com null (04-02 Pitfall #2) — nesse caso fazemos
 * findFirst + create como fallback, apoiados no índice NULLS NOT DISTINCT do SQL.
 */
async function getOrCreateProLaboreCategoria(
  userId: string,
  empresaId: string | null,
  kind: 'CUSTO' | null
): Promise<{ id: string }> {
  if (empresaId !== null) {
    return prisma.category.upsert({
      where: {
        name_empresaId_userId: {
          name: PRO_LABORE_CATEGORIA,
          empresaId,
          userId,
        },
      },
      update: {}, // já existe → não duplica, não sobrescreve
      create: {
        name: PRO_LABORE_CATEGORIA,
        empresaId,
        userId,
        kind,
        isDefault: true,
      },
    })
  }

  // Casa (empresaId null): findFirst + create (fallback do pitfall de null na
  // chave composta do Prisma). O índice NULLS NOT DISTINCT do banco evita duplicata.
  const existing = await prisma.category.findFirst({
    where: { name: PRO_LABORE_CATEGORIA, empresaId: null, userId },
  })
  if (existing) return existing
  return prisma.category.create({
    data: {
      name: PRO_LABORE_CATEGORIA,
      empresaId: null,
      userId,
      kind,
      isDefault: true,
    },
  })
}

/**
 * Cria atomicamente o par de pró-labore multi-empresa (PL-01/PL-02/PL-03/PL-04):
 * 1. IDOR (ASVS V4): a empresa de origem DEVE pertencer ao userId — senão erro, nada gravado.
 * 2. getOrCreate da categoria "Pró-labore" na empresa (CUSTO) e na Casa (kind null).
 * 3. Numa única prisma.$transaction, cria a SAÍDA na empresa (empresaId = origem,
 *    origemEmpresaId = origem, categoria da empresa) e a ENTRADA na Casa (empresaId
 *    null, origemEmpresaId = origem, categoria da Casa), ambas com o MESMO pairId.
 * A SAÍDA conta como custo → reduz o lucro da empresa (PL-03); a ENTRADA soma no
 * Dinheiro do mês da Casa (PL-04). A edição/exclusão individual fica bloqueada pelo
 * guard pairId; a exclusão do par é atômica (deleteProLaboreService).
 */
export async function createProLaboreService(
  input: ProLaboreFormData & { userId: string }
) {
  const { userId, origemEmpresaId, amountCents, date } = input

  // 1. IDOR: a empresa de origem deve pertencer ao usuário.
  const empresa = await prisma.empresa.findFirst({
    where: { id: origemEmpresaId, userId },
  })
  if (!empresa) {
    throw new Error('Empresa não encontrada.')
  }

  // 2. Categoria "Pró-labore" garantida na empresa (CUSTO) e na Casa (null kind).
  const categoriaEmpresa = await getOrCreateProLaboreCategoria(
    userId,
    origemEmpresaId,
    'CUSTO'
  )
  const categoriaCasa = await getOrCreateProLaboreCategoria(userId, null, null)

  // 3. Par atômico: SAÍDA empresa + ENTRADA Casa, mesmo pairId.
  const pairId = crypto.randomUUID()
  const parsedDate = parseISO(date)

  return prisma.$transaction(async (tx) => {
    const saida = await tx.transaction.create({
      data: {
        type: 'SAIDA',
        description: PRO_LABORE_CATEGORIA,
        amountCents,
        date: parsedDate,
        empresaId: origemEmpresaId,
        origemEmpresaId,
        categoryId: categoriaEmpresa.id,
        userId,
        pairId,
      },
    })
    const entrada = await tx.transaction.create({
      data: {
        type: 'ENTRADA',
        description: PRO_LABORE_CATEGORIA,
        amountCents,
        date: parsedDate,
        empresaId: null, // Casa
        origemEmpresaId,
        categoryId: categoriaCasa.id,
        userId,
        pairId,
      },
    })
    return { saida, entrada }
  })
}

/**
 * Deletes both transactions in a pró-labore pair atomically.
 * T-02-10: userId filter ensures user can only delete their own pró-labore pairs.
 */
export async function deleteProLaboreService(pairId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({
      where: { pairId, userId },
    })
  })
}

// ---------------------------------------------------------------------------
// Category services (LANC-06)
// ---------------------------------------------------------------------------

/**
 * Creates a new custom category for the user.
 * T-02-13: userId is always set, so categories are user-scoped.
 * T-04-06 (IDOR): when empresaId is provided, verifies the empresa belongs to
 * the user BEFORE writing — a cliente nunca pode criar categoria numa empresa
 * de outro usuário.
 */
export async function createCategoryService(
  data: CategoryCreateData & { userId: string }
) {
  if (data.empresaId !== null && data.empresaId !== undefined) {
    const empresa = await prisma.empresa.findFirst({
      where: { id: data.empresaId, userId: data.userId },
    })
    if (!empresa) {
      throw new Error('Empresa não encontrada.')
    }
  }
  return prisma.category.create({
    data: {
      name: data.name,
      empresaId: data.empresaId, // null = Casa
      kind: data.kind ?? null,
      userId: data.userId,
      isDefault: false,
    },
  })
}

/**
 * Updates the name of a user-created category.
 * T-02-12: throws if the category is a default category (isDefault: true).
 * T-02-13: findFirst with { id, userId } ensures ownership.
 */
export async function updateCategoryService(
  id: string,
  userId: string,
  name: string
) {
  const record = await prisma.category.findFirst({
    where: { id, userId },
  })

  if (!record) {
    throw new Error('Categoria não encontrada.')
  }

  if (record.isDefault) {
    throw new Error('Categorias padrão não podem ser editadas.')
  }

  return prisma.category.update({
    where: { id },
    data: { name },
  })
}

/**
 * Deletes a user-created category.
 * T-02-11: counts linked transactions; throws if count > 0 — never cascades deletion (D-08).
 * T-02-12: throws if category is a default category.
 * T-02-13: findFirst with { id, userId } ensures ownership.
 */
export async function deleteCategoryService(id: string, userId: string) {
  const record = await prisma.category.findFirst({
    where: { id, userId },
  })

  if (!record) {
    throw new Error('Categoria não encontrada.')
  }

  if (record.isDefault) {
    throw new Error('Categorias padrão não podem ser excluídas.')
  }

  const count = await prisma.transaction.count({
    where: { categoryId: id, userId },
  })

  if (count > 0) {
    const word = count === 1 ? 'lançamento' : 'lançamentos'
    throw new Error(`Esta categoria tem ${count} ${word} e não pode ser excluída.`)
  }

  return prisma.category.delete({
    where: { id },
  })
}
