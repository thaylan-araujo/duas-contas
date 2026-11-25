'use server'
// src/app/(authed)/empresas/_lib/actions.ts
// Server Actions finas: parse → userId da sessão → service → revalidatePath.
// userId SEMPRE lido da sessão, nunca do form (T-04-09). Mutações de empresa
// afetam /empresas, /lancamentos e /visao-geral.
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  empresaSchema,
  updateEmpresaSchema,
  type EmpresaFormData,
  type UpdateEmpresaFormData,
} from './schema'
import {
  createEmpresaService,
  updateEmpresaService,
  deleteEmpresaService,
} from './service'

const GENERIC_ERROR =
  'Não foi possível salvar. Verifique sua conexão e tente novamente.'

/**
 * Lê o userId da sessão — NUNCA do input do form (T-04-09).
 */
async function getUserId(): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user.id
}

/** Revalida as rotas afetadas por mudanças de empresa. */
function revalidate() {
  revalidatePath('/empresas')
  revalidatePath('/lancamentos')
  revalidatePath('/visao-geral')
}

type ActionResult = { success: boolean; error?: string }

export async function createEmpresaAction(
  _prev: unknown,
  data: EmpresaFormData
): Promise<ActionResult> {
  const parsed = empresaSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  try {
    const userId = await getUserId()
    await createEmpresaService({ ...parsed.data, userId })
    revalidate()
    return { success: true }
  } catch (err) {
    // Nome duplicado viola @@unique([nome, userId]).
    if (
      err instanceof Error &&
      (err.message.includes('Unique constraint') ||
        err.message.includes('nome_userId'))
    ) {
      return { success: false, error: 'Já existe uma empresa com esse nome.' }
    }
    return { success: false, error: GENERIC_ERROR }
  }
}

export async function updateEmpresaAction(
  _prev: unknown,
  data: UpdateEmpresaFormData
): Promise<ActionResult> {
  const parsed = updateEmpresaSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }
  try {
    const userId = await getUserId()
    const { id, ...rest } = parsed.data
    await updateEmpresaService(id, userId, rest)
    revalidate()
    return { success: true }
  } catch (err) {
    if (err instanceof Error && err.message === 'Empresa não encontrada.') {
      return { success: false, error: err.message }
    }
    if (
      err instanceof Error &&
      (err.message.includes('Unique constraint') ||
        err.message.includes('nome_userId'))
    ) {
      return { success: false, error: 'Já existe uma empresa com esse nome.' }
    }
    return { success: false, error: GENERIC_ERROR }
  }
}

export async function deleteEmpresaAction(id: string): Promise<ActionResult> {
  try {
    const userId = await getUserId()
    await deleteEmpresaService(id, userId)
    revalidate()
    return { success: true }
  } catch (err) {
    // Repassa tanto "não encontrada" quanto a mensagem de bloqueio D-08.
    if (err instanceof Error) {
      return { success: false, error: err.message }
    }
    return { success: false, error: GENERIC_ERROR }
  }
}
