// src/lib/whatsapp/schema.ts
// Zod do resultado estruturado da IA (tool_use.input do Claude). Valida o shape
// que a extração devolve antes de qualquer uso. Fatia 1 (09-01). Só Zod.
import { z } from 'zod'

export const aiResultSchema = z.object({
  // intenção da mensagem (relatório é reconhecido aqui, mas respondido na Fatia 3)
  intent: z.enum(['lancar', 'relatorio', 'esclarecer', 'ajuda']),
  tipo: z.enum(['ENTRADA', 'SAIDA']).optional(),
  valorCents: z.number().int().positive().optional(),
  data: z.string().optional(), // YYYY-MM-DD (o service faz parseISO)
  categoria: z.string().optional(),
  destino: z.string().optional(), // "Casa" ou o nome de uma empresa
  confianca: z.enum(['alta', 'media', 'baixa']),
})

export type AiResult = z.infer<typeof aiResultSchema>
