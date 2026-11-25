'use server'
// src/app/(authed)/contas-fixas/_lib/actions.ts
// Thin Server Actions: parse → userId from session → service → revalidatePath.
// Fixed accounts feed the plan's derived rows (PLAN-06), so every mutation also
// revalidates /planejamento in addition to /contas-fixas.
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  fixedAccountSchema,
  updateFixedAccountSchema,
  annualExpenseSchema,
  updateAnnualExpenseSchema,
  goalSchema,
  updateGoalSchema,
  type FixedAccountFormData,
  type UpdateFixedAccountFormData,
  type AnnualExpenseFormData,
  type UpdateAnnualExpenseFormData,
  type GoalFormData,
  type UpdateGoalFormData,
} from './schema'
import {
  createFixedAccountService,
  updateFixedAccountService,
  deleteFixedAccountService,
  createAnnualExpenseService,
  updateAnnualExpenseService,
  deleteAnnualExpenseService,
  createGoalService,
  updateGoalService,
  deleteGoalService,
} from './service'

const GENERIC_ERROR =
  'Não foi possível salvar. Verifique sua conexão e tente novamente.'

/**
 * Always reads userId from the session — NEVER from form input (T-03-07).
 */
async function getUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user.id
}

/** Revalidates both the contas-fixas page and the plan it feeds (PLAN-06). */
function revalidate() {
  revalidatePath('/contas-fixas')
  revalidatePath('/planejamento')
}

type ActionResult = { success: boolean; error?: string }

// ---------------------------------------------------------------------------
// Conta fixa (FIXA-01)
// ---------------------------------------------------------------------------

export async function createFixedAccountAction(
  _prev: unknown,
  data: FixedAccountFormData
): Promise<ActionResult> {
  const parsed = fixedAccountSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  try {
    const userId = await getUserId()
    await createFixedAccountService({ ...parsed.data, userId })
    revalidate()
    return { success: true }
  } catch {
    return { success: false, error: GENERIC_ERROR }
  }
}

export async function updateFixedAccountAction(
  _prev: unknown,
  data: UpdateFixedAccountFormData
): Promise<ActionResult> {
  const parsed = updateFixedAccountSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  try {
    const userId = await getUserId()
    const { id, ...rest } = parsed.data
    await updateFixedAccountService(id, userId, rest)
    revalidate()
    return { success: true }
  } catch (err) {
    if (err instanceof Error && err.message === 'Conta fixa não encontrada.') {
      return { success: false, error: err.message }
    }
    return { success: false, error: GENERIC_ERROR }
  }
}

export async function deleteFixedAccountAction(id: string): Promise<ActionResult> {
  try {
    const userId = await getUserId()
    await deleteFixedAccountService(id, userId)
    revalidate()
    return { success: true }
  } catch (err) {
    if (err instanceof Error && err.message === 'Conta fixa não encontrada.') {
      return { success: false, error: err.message }
    }
    return { success: false, error: GENERIC_ERROR }
  }
}

// ---------------------------------------------------------------------------
// Gasto anual (FIXA-02)
// ---------------------------------------------------------------------------

export async function createAnnualExpenseAction(
  _prev: unknown,
  data: AnnualExpenseFormData
): Promise<ActionResult> {
  const parsed = annualExpenseSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  try {
    const userId = await getUserId()
    await createAnnualExpenseService({ ...parsed.data, userId })
    revalidate()
    return { success: true }
  } catch {
    return { success: false, error: GENERIC_ERROR }
  }
}

export async function updateAnnualExpenseAction(
  _prev: unknown,
  data: UpdateAnnualExpenseFormData
): Promise<ActionResult> {
  const parsed = updateAnnualExpenseSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  try {
    const userId = await getUserId()
    const { id, ...rest } = parsed.data
    await updateAnnualExpenseService(id, userId, rest)
    revalidate()
    return { success: true }
  } catch (err) {
    if (err instanceof Error && err.message === 'Gasto anual não encontrado.') {
      return { success: false, error: err.message }
    }
    return { success: false, error: GENERIC_ERROR }
  }
}

export async function deleteAnnualExpenseAction(id: string): Promise<ActionResult> {
  try {
    const userId = await getUserId()
    await deleteAnnualExpenseService(id, userId)
    revalidate()
    return { success: true }
  } catch (err) {
    if (err instanceof Error && err.message === 'Gasto anual não encontrado.') {
      return { success: false, error: err.message }
    }
    return { success: false, error: GENERIC_ERROR }
  }
}

// ---------------------------------------------------------------------------
// Meta de poupança (META-01)
// ---------------------------------------------------------------------------

export async function createGoalAction(
  _prev: unknown,
  data: GoalFormData
): Promise<ActionResult> {
  const parsed = goalSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  try {
    const userId = await getUserId()
    await createGoalService({ ...parsed.data, userId })
    revalidate()
    return { success: true }
  } catch {
    return { success: false, error: GENERIC_ERROR }
  }
}

export async function updateGoalAction(
  _prev: unknown,
  data: UpdateGoalFormData
): Promise<ActionResult> {
  const parsed = updateGoalSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  try {
    const userId = await getUserId()
    const { id, ...rest } = parsed.data
    await updateGoalService(id, userId, rest)
    revalidate()
    return { success: true }
  } catch (err) {
    if (err instanceof Error && err.message === 'Meta não encontrada.') {
      return { success: false, error: err.message }
    }
    return { success: false, error: GENERIC_ERROR }
  }
}

export async function deleteGoalAction(id: string): Promise<ActionResult> {
  try {
    const userId = await getUserId()
    await deleteGoalService(id, userId)
    revalidate()
    return { success: true }
  } catch (err) {
    if (err instanceof Error && err.message === 'Meta não encontrada.') {
      return { success: false, error: err.message }
    }
    return { success: false, error: GENERIC_ERROR }
  }
}
