// src/app/(authed)/empresas/_lib/schema.ts
// Zod schemas only — no 'use server' or 'use client'
import { z } from 'zod'

// Tipos de empresa fixos pré-definidos (D-02).
export const EMPRESA_TIPOS = [
  'AFILIADO',
  'JURIDICO_SERVICOS',
  'INFOPRODUTO',
  'GENERICO',
] as const

// Paleta fixa de 6 cores (UI-SPEC §Color). Chaves semânticas, não hex.
export const EMPRESA_CORES = [
  'laranja',
  'verde',
  'roxo',
  'rosa',
  'ambar',
  'cinza-azulado',
] as const

export const empresaSchema = z.object({
  nome: z
    .string()
    .min(1, 'O nome é obrigatório.')
    .max(60, 'Máximo 60 caracteres'),
  tipo: z.enum(EMPRESA_TIPOS, { message: 'Selecione um tipo.' }),
  cor: z.enum(EMPRESA_CORES, { message: 'Selecione uma cor.' }).default('laranja'),
})

export type EmpresaFormData = z.infer<typeof empresaSchema>

export const updateEmpresaSchema = empresaSchema.extend({
  id: z.string().min(1, 'ID obrigatório'),
})

export type UpdateEmpresaFormData = z.infer<typeof updateEmpresaSchema>
