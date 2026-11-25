// src/app/(authed)/planejamento/_lib/schema.ts
// Zod schemas only — no 'use server' or 'use client'.
import { z } from 'zod'

/**
 * Teto mensal de uma categoria da Casa (D-03/T-03b-13). É referência — nunca
 * bloqueia lançamento. Para REMOVER o teto usa-se clearCategoriaTetoAction (não
 * se envia limitCents zero aqui). month é server-trusted (validado por regex),
 * categoryId tem mínimo 1 e limitCents é inteiro positivo (teto maior que zero).
 */
export const categoriaTetoSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mês inválido.'),
  categoryId: z.string().min(1, 'Categoria obrigatória.'),
  limitCents: z.number().int().positive('Digite um valor maior que zero.'),
})

export type CategoriaTetoFormData = z.infer<typeof categoriaTetoSchema>
