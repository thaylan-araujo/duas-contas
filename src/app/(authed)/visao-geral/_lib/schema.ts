import { z } from 'zod'

export const ceilingUpdateSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Formato inválido'),
  ceilingCents: z.number().int().positive('Teto deve ser maior que zero'),
})

export type CeilingUpdateData = z.infer<typeof ceilingUpdateSchema>
