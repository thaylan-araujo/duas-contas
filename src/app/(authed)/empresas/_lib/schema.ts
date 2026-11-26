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

// Alíquota do DAS (%) opcional por empresa (D-03). Campo Decimal? no banco.
// Tipo de ENTRADA = SAÍDA = `number | null` (sem z.preprocess/.default() — ambos
// tornariam a entrada `unknown`/opcional e quebrariam a inferência do zodResolver
// no useForm, como na nota do campo `cor` abaixo). A normalização de string vazia
// do input HTML → null é feita no form via `setValueAs`; aqui só validamos 0–100.
const aliquotaDasPercentSchema = z
  .number({ message: 'Alíquota deve estar entre 0 e 100.' })
  .min(0, 'Alíquota deve estar entre 0 e 100.')
  .max(100, 'Alíquota deve estar entre 0 e 100.')
  .nullable()
  // Opcional: a chave pode ser omitida (ex.: objetos legados {nome,tipo,cor}).
  // Omissa ou null → "sem alíquota" (D-03).
  .optional()

export const empresaSchema = z.object({
  nome: z
    .string()
    .min(1, 'O nome é obrigatório.')
    .max(60, 'Máximo 60 caracteres'),
  tipo: z.enum(EMPRESA_TIPOS, { message: 'Selecione um tipo.' }),
  // Sem .default() aqui: o default é fornecido pelo defaultValues do form. O
  // .default() tornaria o tipo de ENTRADA do zod opcional (cor?) enquanto a
  // SAÍDA é obrigatória, quebrando a inferência do zodResolver no useForm.
  cor: z.enum(EMPRESA_CORES, { message: 'Selecione uma cor.' }),
  aliquotaDasPercent: aliquotaDasPercentSchema,
})

export type EmpresaFormData = z.infer<typeof empresaSchema>

export const updateEmpresaSchema = empresaSchema.extend({
  id: z.string().min(1, 'ID obrigatório'),
})

export type UpdateEmpresaFormData = z.infer<typeof updateEmpresaSchema>
