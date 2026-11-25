'use server'
// src/app/(authed)/lancamentos/_lib/actions.ts
// Thin Server Actions: parse → userId from session → service → revalidatePath
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  transactionSchema,
  updateTransactionSchema,
  proLaboreSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  type TransactionFormData,
  type UpdateTransactionFormData,
  type ProLaboreFormData,
  type CategoryCreateData,
  type CategoryUpdateData,
} from './schema'
import {
  createTransactionService,
  updateTransactionService,
  deleteTransactionService,
  createProLaboreService,
  deleteProLaboreService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from './service'

/**
 * Always reads userId from the session — NEVER from form input (security rule T-02-04).
 */
async function getUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user.id
}

export async function createTransactionAction(
  _prev: unknown,
  data: TransactionFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = transactionSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const userId = await getUserId()
    await createTransactionService({ ...parsed.data, userId })
    revalidatePath('/lancamentos')
    revalidatePath('/visao-geral')
    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
    }
  }
}

export async function updateTransactionAction(
  _prev: unknown,
  data: UpdateTransactionFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = updateTransactionSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const userId = await getUserId()
    const { id, ...rest } = parsed.data
    await updateTransactionService(id, userId, rest)
    revalidatePath('/lancamentos')
    revalidatePath('/visao-geral')
    return { success: true }
  } catch (err) {
    if (err instanceof Error && err.message === 'PAIRED_TRANSACTION') {
      return { success: false, error: 'PAIRED_TRANSACTION' }
    }
    if (err instanceof Error && err.message === 'Lançamento não encontrado.') {
      return { success: false, error: err.message }
    }
    return {
      success: false,
      error: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
    }
  }
}

export async function deleteTransactionAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getUserId()
    await deleteTransactionService(id, userId)
    revalidatePath('/lancamentos')
    revalidatePath('/visao-geral')
    return { success: true }
  } catch (err) {
    if (err instanceof Error && err.message === 'PAIRED_TRANSACTION') {
      return { success: false, error: 'PAIRED_TRANSACTION' }
    }
    if (err instanceof Error && err.message === 'Lançamento não encontrado.') {
      return { success: false, error: err.message }
    }
    return {
      success: false,
      error: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
    }
  }
}

// ---------------------------------------------------------------------------
// Pró-labore actions (LANC-05)
// ---------------------------------------------------------------------------

export async function createProLaboreAction(
  _prev: unknown,
  data: ProLaboreFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = proLaboreSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const userId = await getUserId()
    await createProLaboreService({ ...parsed.data, userId })
    revalidatePath('/lancamentos')
    revalidatePath('/visao-geral')
    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Não foi possível registrar o pró-labore. Verifique sua conexão e tente novamente.',
    }
  }
}

export async function deleteProLaboreAction(
  pairId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getUserId()
    await deleteProLaboreService(pairId, userId)
    revalidatePath('/lancamentos')
    revalidatePath('/visao-geral')
    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Não foi possível excluir o pró-labore. Verifique sua conexão e tente novamente.',
    }
  }
}

// ---------------------------------------------------------------------------
// Category actions (LANC-06)
// ---------------------------------------------------------------------------

export async function createCategoryAction(
  _prev: unknown,
  data: CategoryCreateData
): Promise<{ success: boolean; categoryId?: string; error?: string }> {
  const parsed = categoryCreateSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const userId = await getUserId()
    const category = await createCategoryService({ ...parsed.data, userId })
    revalidatePath('/lancamentos')
    return { success: true, categoryId: category.id }
  } catch (err) {
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      return { success: false, error: 'Já existe uma categoria com este nome nesta conta.' }
    }
    return {
      success: false,
      error: 'Não foi possível criar a categoria. Verifique sua conexão e tente novamente.',
    }
  }
}

export async function updateCategoryAction(
  _prev: unknown,
  data: CategoryUpdateData
): Promise<{ success: boolean; error?: string }> {
  const parsed = categoryUpdateSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const userId = await getUserId()
    const { id, name } = parsed.data
    await updateCategoryService(id, userId, name)
    revalidatePath('/lancamentos')
    return { success: true }
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message }
    }
    return {
      success: false,
      error: 'Não foi possível atualizar a categoria. Verifique sua conexão e tente novamente.',
    }
  }
}

export async function deleteCategoryAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getUserId()
    await deleteCategoryService(id, userId)
    revalidatePath('/lancamentos')
    return { success: true }
  } catch (err) {
    if (err instanceof Error) {
      return { success: false, error: err.message }
    }
    return {
      success: false,
      error: 'Não foi possível excluir a categoria. Verifique sua conexão e tente novamente.',
    }
  }
}
