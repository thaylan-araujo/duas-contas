'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ceilingUpdateSchema, type CeilingUpdateData } from './schema'
import { upsertMonthlyBudget } from './service'

async function getUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user.id
}

/**
 * Upserts the monthly budget ceiling for the authenticated user.
 * T-02-14: userId always comes from session — never from form input.
 * T-02-15: ceilingUpdateSchema rejects non-positive ceilingCents.
 */
export async function upsertMonthlyBudgetAction(
  _prev: unknown,
  data: CeilingUpdateData
): Promise<{ success: boolean; error?: string }> {
  const parsed = ceilingUpdateSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const userId = await getUserId()
    await upsertMonthlyBudget(userId, parsed.data.month, parsed.data.ceilingCents)
    revalidatePath('/visao-geral')
    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
    }
  }
}
