'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ceilingUpdateSchema, type CeilingUpdateData } from './schema'
import { upsertMonthlyBudget } from './service'
import {
  gerarContasDoMesService,
  markTransacaoPagaService,
} from './geracao-mensal'

const GENERIC_ERROR =
  'Não foi possível salvar. Verifique sua conexão e tente novamente.'

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
    return { success: false, error: GENERIC_ERROR }
  }
}

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/

/**
 * Gera (idempotente) as contas fixas do mês como linhas EM_ABERTO da Casa (C2).
 * userId SEMPRE da sessão. Revalida Casa + planejamento (tetos/semanal).
 */
export async function gerarContasDoMesAction(
  month: string
): Promise<{ success: boolean; error?: string; criadas?: number }> {
  if (!monthRegex.test(month)) {
    return { success: false, error: 'Mês inválido.' }
  }
  try {
    const userId = await getUserId()
    const { criadas } = await gerarContasDoMesService(userId, month)
    revalidatePath('/visao-geral')
    revalidatePath('/planejamento')
    return { success: true, criadas }
  } catch {
    return { success: false, error: GENERIC_ERROR }
  }
}

/**
 * Marca uma despesa em aberto como paga (C3). Nas "a definir", `valorCents` traz
 * o valor real (parseado no cliente). userId SEMPRE da sessão; ownership no
 * service. Revalida Casa + planejamento (o valor pago passa a contar no caixa).
 */
export async function marcarPagoAction(
  id: string,
  valorCents?: number
): Promise<{ success: boolean; error?: string }> {
  if (!id) {
    return { success: false, error: 'Lançamento inválido.' }
  }
  try {
    const userId = await getUserId()
    await markTransacaoPagaService(id, userId, valorCents)
    revalidatePath('/visao-geral')
    revalidatePath('/planejamento')
    return { success: true }
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === 'Lançamento não encontrado.' ||
        err.message === 'Informe o valor real para marcar como pago.' ||
        err.message === 'Valor inválido.')
    ) {
      return { success: false, error: err.message }
    }
    return { success: false, error: GENERIC_ERROR }
  }
}
