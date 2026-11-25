// src/app/(authed)/lancamentos/_lib/schema.ts
// Zod schemas only — no 'use server' or 'use client'
import { z } from 'zod'

export const transactionSchema = z.object({
  date: z.string().min(1, 'Data obrigatória'),
  description: z.string().min(1, 'A descrição é obrigatória.').max(120, 'Máximo 120 caracteres'),
  amountCents: z.number().int().positive('Digite um valor maior que zero.'),
  type: z.enum(['ENTRADA', 'SAIDA']),
  account: z.enum(['CASA', 'EMPRESA']),
  categoryId: z.string().min(1, 'Selecione uma categoria.'),
  notes: z.string().max(200, 'Máximo 200 caracteres').optional(),
})

export type TransactionFormData = z.infer<typeof transactionSchema>

export const updateTransactionSchema = transactionSchema.extend({
  id: z.string().min(1, 'ID obrigatório'),
})

export type UpdateTransactionFormData = z.infer<typeof updateTransactionSchema>

// --- Pró-labore schema (LANC-05) ---

export const proLaboreSchema = z.object({
  date: z.string().min(1, 'Data obrigatória'),
  amountCents: z.number().int().positive('Valor deve ser maior que zero.'),
  categoryId: z.string().min(1, 'Categoria obrigatória'),
})

export type ProLaboreFormData = z.infer<typeof proLaboreSchema>

// --- Category schemas (LANC-06) ---

export const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(50, 'Máximo 50 caracteres'),
  account: z.enum(['CASA', 'EMPRESA']),
})

export type CategoryCreateData = z.infer<typeof categoryCreateSchema>

export const categoryUpdateSchema = z.object({
  id: z.string().min(1, 'ID obrigatório'),
  name: z.string().min(1, 'Nome obrigatório').max(50, 'Máximo 50 caracteres'),
})

export type CategoryUpdateData = z.infer<typeof categoryUpdateSchema>
