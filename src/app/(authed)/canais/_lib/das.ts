// src/app/(authed)/canais/_lib/das.ts
// Função pura do DAS estimado por empresa (Fatia 4 — CONS-02 / D-03).
// TypeScript puro — SEM Prisma, SEM nada de servidor (maximamente testável,
// espelha canais/_lib/pnl.ts). Valores de dinheiro em centavos (Int); a
// alíquota é um percentual (ex.: 6 = 6%, 15.5 = 15,5%).

/**
 * DAS estimado do mês (D-03) = alíquota × faturamento bruto.
 *
 * Fórmula (D-03): `Math.round((aliquotaPercent / 100) * brutoCents)`. O
 * faturamento bruto já vem em centavos de `loadPnlData` (PNL-02) e é ≥ 0, então
 * o resultado nunca é negativo quando a alíquota é ≥ 0.
 *
 * Decisões de correção-crítica:
 * - `Math.round` resolve frações de centavo (mesma disciplina de
 *   computeAnnualMonthly em contas-fixas/_lib/service.ts) — nunca devolve fração
 *   de centavo; sempre Int.
 * - `aliquotaPercent === null` → 0. A DISTINÇÃO entre "sem alíquota" e "0%" é
 *   responsabilidade da UI (mostrar "não definido" vs "R$ 0,00"); aqui apenas
 *   não há imposto a estimar, logo 0.
 *
 * Ex.: computeDasEstimado(6, 1_000_000) === 60_000 (6% de R$ 10.000,00).
 *      computeDasEstimado(15.5, 1_000_000) === 155_000.
 *      computeDasEstimado(6, 333) === 20 (19,98 arredondado).
 *      computeDasEstimado(null, 1_000_000) === 0.
 */
export function computeDasEstimado(
  aliquotaPercent: number | null,
  brutoCents: number
): number {
  if (aliquotaPercent === null) return 0
  return Math.round((aliquotaPercent / 100) * brutoCents)
}
