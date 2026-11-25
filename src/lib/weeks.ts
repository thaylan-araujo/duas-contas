/**
 * Faixa de semana compartilhada da Casa (fonte única — PLAN-04).
 *
 * As semanas fixas do mês (spec §Cálculos):
 *   semana 1 = dias 1–7
 *   semana 2 = dias 8–14
 *   semana 3 = dias 15–21
 *   semana 4 = dias 22 até o fim do mês (28/29/30/31 conforme o mês)
 *
 * Esta lógica era inline em `getWeeklySpending` (visao-geral/_lib/service.ts).
 * Extraída aqui para que o gráfico semanal do dashboard e os cartões semanais
 * do planejamento concordem sobre em qual semana uma transação cai — não
 * duplicar as faixas (anti-pattern).
 */

/**
 * Índice de semana (0..3) para um dia do mês (1..31).
 */
export function weekIndexForDay(day: number): 0 | 1 | 2 | 3 {
  if (day <= 7) return 0
  if (day <= 14) return 1
  if (day <= 21) return 2
  return 3 // 22 até o fim do mês (spec §Cálculos)
}

/**
 * Intervalo de datas [start, end] da semana `weekIndex` no mês `month`
 * ('YYYY-MM'). A semana 4 termina no último dia do mês — `new Date(y, m, 0)`
 * resolve 28/29/30/31 nativamente (fevereiro/bissexto/30-31 dias), sem lógica
 * manual de ano bissexto (03-RESEARCH §Don't Hand-Roll).
 */
export function weekDateRange(
  month: string,
  weekIndex: 0 | 1 | 2 | 3
): { start: Date; end: Date } {
  const [year, monthNum] = month.split('-').map(Number)
  const lastDay = new Date(year, monthNum, 0).getDate() // último dia do mês
  const startDay = weekIndex * 7 + 1
  const endDay = weekIndex === 3 ? lastDay : startDay + 6
  return {
    start: new Date(year, monthNum - 1, startDay),
    end: new Date(year, monthNum - 1, endDay),
  }
}
