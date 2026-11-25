'use server'
// src/app/(authed)/planejamento/_lib/actions.ts
// Server Actions finas do acompanhamento: parse Zod → userId da sessão → service
// → revalidatePath. userId SEMPRE vem de supabase.auth.getUser, nunca do form
// (T-03b-10). month e categoryId são args server-trusted validados por Zod.
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { categoriaTetoSchema, type CategoriaTetoFormData } from './schema'
import {
  upsertCategoryBudgetService,
  deleteCategoryBudgetService,
} from './service'

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/

/**
 * Sempre lê userId da sessão — NUNCA do input do form (T-03b-10).
 */
async function getUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user.id
}

/**
 * Define/edita o teto mensal de uma categoria (D-03). limitCents inteiro
 * positivo (categoriaTetoSchema); para REMOVER o teto usa-se clearCategoriaTetoAction.
 */
export async function saveCategoriaTetoAction(
  data: CategoriaTetoFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = categoriaTetoSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const userId = await getUserId()
    const { month, categoryId, limitCents } = parsed.data
    await upsertCategoryBudgetService(userId, month, categoryId, limitCents)
    revalidatePath('/planejamento')
    revalidatePath('/visao-geral')
    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
    }
  }
}

/**
 * Remove o teto de uma categoria (→ volta a "sem teto"). month/categoryId são
 * server-trusted; userId sempre da sessão (T-03b-10/T-03b-12).
 */
export async function clearCategoriaTetoAction(
  month: string,
  categoryId: string
): Promise<{ success: boolean; error?: string }> {
  if (!monthRegex.test(month)) {
    return { success: false, error: 'Mês inválido.' }
  }
  if (!categoryId || categoryId.length < 1) {
    return { success: false, error: 'Categoria obrigatória.' }
  }

  try {
    const userId = await getUserId()
    await deleteCategoryBudgetService(userId, month, categoryId)
    revalidatePath('/planejamento')
    revalidatePath('/visao-geral')
    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
    }
  }
}
