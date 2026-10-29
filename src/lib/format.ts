import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Converts integer cents to Brazilian Real display string.
 * Input: 123456 → "R$ 1.234,56"
 * NEVER pass floats. NEVER format inline. Use this function only.
 */
export function formatBRL(cents: number): string {
  const value = cents / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formats a Date object as dd/mm/aaaa string.
 * Uses date-fns with explicit format pattern — prevents timezone drift.
 * NEVER use .toLocaleDateString(). Use this function only.
 */
export function formatDate(date: Date): string {
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}
