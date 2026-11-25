// src/app/(authed)/planejamento/_lib/acompanhamento.ts
// Funções puras do acompanhamento da Casa (sem Prisma — maximamente testáveis).
// D-02: barra "dinheiro do mês"; D-03: teto por categoria (referência); D-04:
// gasto semanal automático por categoria. As faixas de semana vêm de @/lib/weeks
// (fonte única — não reimplementar).
import { weekIndexForDay, weekDateRange } from '@/lib/weeks'

// ---------------------------------------------------------------------------
// D-02 — Dinheiro do mês
// ---------------------------------------------------------------------------

/**
 * Restante do mês (D-02) = dinheiro do mês − despesas (SAIDA) da Casa no mês.
 * Pode ser negativo (gastou mais que o definido). Ex.: (850000, 530000) → 320000.
 */
export function computeRestanteMes(
  dinheiroMesCents: number,
  despesasMesCents: number
): number {
  return dinheiroMesCents - despesasMesCents
}

// ---------------------------------------------------------------------------
// D-03 — Teto por categoria (referência, NUNCA bloqueia)
// ---------------------------------------------------------------------------

/** Status de uma categoria contra seu teto mensal (D-03). */
export interface CategoriaStatus {
  /** Se a categoria tem teto definido. Sem teto → mostra só o gasto. */
  temTeto: boolean
  /** teto − gasto. Pode ser negativo (passou do teto). null quando sem teto. */
  restanteCents: number | null
  /** % do teto gasto, limitado a 100. null quando sem teto. */
  pct: number | null
}

/**
 * Status de uma categoria vs. seu teto (D-03). É só referência — nunca bloqueia.
 * - limitCents null → { temTeto: false, restanteCents: null, pct: null }.
 * - limitCents definido → restante = teto − gasto (pode ser negativo); pct =
 *   min(100, round(gasto/teto*100)) quando teto > 0, ou 100 quando teto = 0
 *   (evita divisão por zero).
 */
export function computeCategoriaStatus({
  gastoCents,
  limitCents,
}: {
  gastoCents: number
  limitCents: number | null
}): CategoriaStatus {
  if (limitCents === null) {
    return { temTeto: false, restanteCents: null, pct: null }
  }
  const restanteCents = limitCents - gastoCents
  const pct =
    limitCents > 0 ? Math.min(100, Math.round((gastoCents / limitCents) * 100)) : 100
  return { temTeto: true, restanteCents, pct }
}

// ---------------------------------------------------------------------------
// D-04 — Gasto semanal automático por categoria
// ---------------------------------------------------------------------------

/** Lançamento mínimo (Casa SAIDA) que alimenta o agrupamento semanal (D-04). */
export interface WeeklyTransactionInput {
  date: Date
  amountCents: number
  categoryId: string
  categoryName: string
}

/** Total gasto de uma categoria dentro de uma semana. */
export interface CategoriaSemana {
  categoryId: string
  categoryName: string
  totalCents: number
}

/** Uma das 4 semanas, com seu intervalo de dias e os totais por categoria. */
export interface SemanaCategoria {
  weekIndex: 0 | 1 | 2 | 3
  label: string // "Semana N"
  dayRange: { startDay: number; endDay: number }
  categorias: CategoriaSemana[]
}

const WEEK_INDEXES: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3]

/**
 * Agrupa os lançamentos (Casa SAIDA) do mês em 4 semanas (D-04), somando por
 * categoria dentro de cada semana. Zero digitação — derivado dos lançamentos.
 * O bucket da semana vem de `weekIndexForDay` e o intervalo de dias de
 * `weekDateRange` (fonte única das faixas — @/lib/weeks). Lista vazia devolve
 * 4 semanas com `categorias: []`.
 */
export function groupWeeklyByCategory(
  transactions: WeeklyTransactionInput[],
  month: string
): SemanaCategoria[] {
  // Acumula por semana → por categoria.
  const totalsByWeek: Array<Map<string, CategoriaSemana>> = [
    new Map(),
    new Map(),
    new Map(),
    new Map(),
  ]

  for (const tx of transactions) {
    const day = new Date(tx.date).getDate()
    const weekIndex = weekIndexForDay(day)
    const bucket = totalsByWeek[weekIndex]
    const existing = bucket.get(tx.categoryId)
    if (existing) {
      existing.totalCents += tx.amountCents
    } else {
      bucket.set(tx.categoryId, {
        categoryId: tx.categoryId,
        categoryName: tx.categoryName,
        totalCents: tx.amountCents,
      })
    }
  }

  return WEEK_INDEXES.map((weekIndex) => {
    const { start, end } = weekDateRange(month, weekIndex)
    return {
      weekIndex,
      label: `Semana ${weekIndex + 1}`,
      dayRange: { startDay: start.getDate(), endDay: end.getDate() },
      categorias: Array.from(totalsByWeek[weekIndex].values()).sort(
        (a, b) => b.totalCents - a.totalCents
      ),
    }
  })
}
