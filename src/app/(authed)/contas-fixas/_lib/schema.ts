// src/app/(authed)/contas-fixas/_lib/schema.ts
// Zod schemas only — no 'use server' or 'use client'
import { z } from 'zod'

// --- Conta fixa (FIXA-01) ---

export const fixedAccountSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  dueDay: z
    .number()
    .int()
    .min(1, 'Informe um dia entre 1 e 31.')
    .max(31, 'Informe um dia entre 1 e 31.'),
  amountCents: z.number().int().positive('Digite um valor maior que zero.'),
  autoDebit: z.boolean(),
  isVariableAmount: z.boolean(),
})

export type FixedAccountFormData = z.infer<typeof fixedAccountSchema>

export const updateFixedAccountSchema = fixedAccountSchema.extend({
  id: z.string().min(1, 'ID obrigatório'),
})

export type UpdateFixedAccountFormData = z.infer<typeof updateFixedAccountSchema>

// --- Gasto anual (FIXA-02) ---

export const annualExpenseSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  yearlyCents: z.number().int().positive('Digite um valor maior que zero.'),
  dueMonth: z.number().int().min(1).max(12),
})

export type AnnualExpenseFormData = z.infer<typeof annualExpenseSchema>

export const updateAnnualExpenseSchema = annualExpenseSchema.extend({
  id: z.string().min(1, 'ID obrigatório'),
})

export type UpdateAnnualExpenseFormData = z.infer<typeof updateAnnualExpenseSchema>

// --- Meta de poupança (META-01) ---

// Base object (without refine) so the update variant can .extend() before
// re-applying the refine — a ZodEffects (post-refine) cannot be extended.
const goalBase = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  targetCents: z.number().int().nonnegative(),
  savedCents: z.number().int().nonnegative(),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
})

const savedNotGreaterThanTarget = (d: { savedCents: number; targetCents: number }) =>
  d.savedCents <= d.targetCents

const savedRefineOpts = {
  message: 'O valor guardado não pode ser maior que a meta.',
  path: ['savedCents'],
}

export const goalSchema = goalBase.refine(savedNotGreaterThanTarget, savedRefineOpts)

export type GoalFormData = z.infer<typeof goalSchema>

export const updateGoalSchema = goalBase
  .extend({ id: z.string().min(1, 'ID obrigatório') })
  .refine(savedNotGreaterThanTarget, savedRefineOpts)

export type UpdateGoalFormData = z.infer<typeof updateGoalSchema>
