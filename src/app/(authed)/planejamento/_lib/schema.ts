// src/app/(authed)/planejamento/_lib/schema.ts
// Zod schemas only — no 'use server' or 'use client'
import { z } from 'zod'

// Base object (no refine) so we can extend it for the update schema before
// re-applying the "≥1 week" refine. A zod .refine() returns a ZodEffects,
// which cannot be .extend()ed — so we keep the plain object separate.
const planItemBase = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  categoryId: z.string().min(1, 'Selecione um grupo.'),
  valuePerCents: z.number().int().positive('Digite um valor maior que zero.'),
  week1: z.boolean(),
  week2: z.boolean(),
  week3: z.boolean(),
  week4: z.boolean(),
})

// At least one of the 4 weeks must be marked (D-01, Pitfall 2).
const atLeastOneWeek = (d: {
  week1: boolean
  week2: boolean
  week3: boolean
  week4: boolean
}) => d.week1 || d.week2 || d.week3 || d.week4

export const planItemSchema = planItemBase.refine(atLeastOneWeek, {
  message: 'Marque pelo menos uma semana.',
  path: ['week1'],
})

export type PlanItemFormData = z.infer<typeof planItemSchema>

export const updatePlanItemSchema = planItemBase
  .extend({ id: z.string().min(1, 'ID obrigatório') })
  .refine(atLeastOneWeek, {
    message: 'Marque pelo menos uma semana.',
    path: ['week1'],
  })

export type UpdatePlanItemFormData = z.infer<typeof updatePlanItemSchema>

// Override manual do "Gastei R$" por (mês, semana, categoria) — D-02, Pitfall 4.
// manualCents aceita 0 (um zero explícito ainda é um override). weekIndex é
// limitado a 0..3 e month ao formato 'YYYY-MM' (T-03-11).
export const weeklySpendSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Mês inválido.'),
  weekIndex: z.number().int().min(0).max(3),
  categoryId: z.string().min(1, 'Categoria obrigatória.'),
  manualCents: z.number().int().nonnegative('O valor não pode ser negativo.'),
})

export type WeeklySpendFormData = z.infer<typeof weeklySpendSchema>
