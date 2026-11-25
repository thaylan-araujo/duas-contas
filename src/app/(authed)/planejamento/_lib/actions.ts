'use server'
// src/app/(authed)/planejamento/_lib/actions.ts
// Thin Server Actions: parse Zod → userId from session → service → revalidatePath.
// month is a SERVER-TRUSTED argument (from the page's selected month), NOT a
// form field — the Zod schema contains no month and no userId (T-03-03).
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  planItemSchema,
  updatePlanItemSchema,
  weeklySpendSchema,
  type PlanItemFormData,
  type UpdatePlanItemFormData,
  type WeeklySpendFormData,
} from './schema'
import {
  createPlanItemService,
  updatePlanItemService,
  deletePlanItemService,
  copyPlanFromPreviousMonth,
  saveWeeklySpend,
  clearWeeklySpend,
} from './service'

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/

/**
 * Always reads userId from the session — NEVER from form input (security T-02-04/T-03-03).
 */
async function getUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user.id
}

export async function createPlanItemAction(
  data: PlanItemFormData,
  month: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = planItemSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  if (!monthRegex.test(month)) {
    return { success: false, error: 'Mês inválido.' }
  }

  try {
    const userId = await getUserId()
    await createPlanItemService({ ...parsed.data, userId, month })
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

export async function updatePlanItemAction(
  data: UpdatePlanItemFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = updatePlanItemSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const userId = await getUserId()
    const { id, ...rest } = parsed.data
    await updatePlanItemService(id, userId, rest)
    revalidatePath('/planejamento')
    revalidatePath('/visao-geral')
    return { success: true }
  } catch (err) {
    if (err instanceof Error && err.message === 'Item não encontrado.') {
      return { success: false, error: err.message }
    }
    return {
      success: false,
      error: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
    }
  }
}

export async function deletePlanItemAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getUserId()
    await deletePlanItemService(id, userId)
    revalidatePath('/planejamento')
    revalidatePath('/visao-geral')
    return { success: true }
  } catch (err) {
    if (err instanceof Error && err.message === 'Item não encontrado.') {
      return { success: false, error: err.message }
    }
    return {
      success: false,
      error: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
    }
  }
}

export async function copyPlanAction(
  month: string
): Promise<{ success: boolean; error?: string }> {
  if (!monthRegex.test(month)) {
    return { success: false, error: 'Mês inválido.' }
  }

  try {
    const userId = await getUserId()
    await copyPlanFromPreviousMonth(userId, month)
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
 * Persists a manual "Gastei R$" override (WeeklySpend). month/weekIndex/categoryId
 * are server-trusted args validated by Zod; userId always from the session
 * (T-03-10/T-03-12). manualCents may be 0 (Pitfall 4).
 */
export async function saveGasteiAction(
  data: WeeklySpendFormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = weeklySpendSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const userId = await getUserId()
    const { month, weekIndex, categoryId, manualCents } = parsed.data
    await saveWeeklySpend(userId, month, weekIndex, categoryId, manualCents)
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
 * Clears the manual override → the "Gastei R$" returns to the automatic sum.
 * userId from the session; month/weekIndex/categoryId validated by Zod.
 */
export async function clearGasteiAction(
  month: string,
  weekIndex: number,
  categoryId: string
): Promise<{ success: boolean; error?: string }> {
  // Reuse weeklySpendSchema (manualCents is irrelevant here → pass 0).
  const parsed = weeklySpendSchema.safeParse({
    month,
    weekIndex,
    categoryId,
    manualCents: 0,
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const userId = await getUserId()
    await clearWeeklySpend(userId, parsed.data.month, parsed.data.weekIndex, parsed.data.categoryId)
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
