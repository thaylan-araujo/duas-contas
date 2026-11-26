// src/app/(authed)/consolidado/_lib/projecao.ts
// Funções puras da PROJEÇÃO simples (Fatia 4 — CONS-03/CONS-04 / D-04/D-05).
// TypeScript puro — SEM Prisma, SEM nada de servidor (maximamente testável,
// espelha canais/_lib/das.ts e visao-geral/_lib/renda-familiar.ts). Todos os
// valores de dinheiro em centavos (Int).
//
// Decisão D-04: a projeção é SIMPLES e NÃO CUMULATIVA — não rastreamos saldo de
// caixa. Cada mês é uma ESTIMATIVA independente baseada na média dos últimos
// meses de lançamentos:
//   - Por empresa: receita esperada − custo esperado − DAS estimado.
//   - Família:     renda esperada − despesas esperadas (DAS = 0).
// "Esperado" = média dos últimos ~3 meses (mediaUltimosMeses). O loader monta a
// série histórica e aplica estas funções; aqui só vive a aritmética testável.
//
// Decisão D-05: quando a sobra projetada de um mês fica negativa (família OU
// qualquer empresa), a linha marca `negativo` e `faltamCents` (quanto falta).
//
// Para avançar os meses usamos date-fns (addMonths/format + locale ptBR) — NUNCA
// aritmética de mês na mão (precedente contas-fixas/_lib/service.ts), para a
// virada de ano ser sempre correta.
import { addMonths, format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Janela mínima/máxima de meses da projeção (D-04: próximos 3–6 meses). */
const MIN_MESES = 3
const MAX_MESES = 6

/**
 * Média simples de uma lista de valores em centavos (Math.round para não devolver
 * fração de centavo — mesma disciplina de computeDasEstimado/computeAnnualMonthly).
 * Lista vazia → 0 (sem histórico vira zero, nunca NaN).
 * Ex.: mediaUltimosMeses([100000, 200000, 300000]) === 200000.
 */
export function mediaUltimosMeses(valoresCents: number[]): number {
  if (valoresCents.length === 0) return 0
  const soma = valoresCents.reduce((acc, v) => acc + v, 0)
  return Math.round(soma / valoresCents.length)
}

/** Uma linha da projeção: a sobra estimada de UM mês (não cumulativa — D-04). */
export interface MesProjetado {
  /** Rótulo do mês em pt-BR (ex.: "dez. de 2026"), gerado via date-fns. */
  mesLabel: string
  /** Sobra projetada do mês = receita − custo − DAS (pode ser negativa). */
  sobraCents: number
  /** true quando a sobra é negativa — a UI destaca o mês (D-05). */
  negativo: boolean
  /** Quanto falta no mês (valor absoluto da sobra) quando negativo; 0 caso contrário. */
  faltamCents: number
}

/**
 * Sobra projetada de UM mês (D-04/D-05): receita − custo − DAS.
 * - sobra = receitaEsperada − custoEsperado − dasEsperado.
 * - negativo = sobra < 0.
 * - faltamCents = negativo ? -sobra : 0 (quanto falta — D-05).
 *
 * A FAMÍLIA usa esta mesma função passando `dasEsperadoCents = 0` e
 * `custoEsperadoCents = contas fixas + média das despesas variáveis` (família não
 * tem DAS).
 */
export function projetarSobraMensal(
  receitaEsperadaCents: number,
  custoEsperadoCents: number,
  dasEsperadoCents: number
): { sobraCents: number; negativo: boolean; faltamCents: number } {
  const sobraCents = receitaEsperadaCents - custoEsperadoCents - dasEsperadoCents
  const negativo = sobraCents < 0
  return {
    sobraCents,
    negativo,
    faltamCents: negativo ? -sobraCents : 0,
  }
}

/** Mantém numMeses dentro de 3..6 (D-04: próximos 3–6 meses). */
function clampNumMeses(numMeses: number): number {
  return Math.min(MAX_MESES, Math.max(MIN_MESES, Math.trunc(numMeses)))
}

/**
 * Projeta `numMeses` (clamped a 3..6 — D-04) a partir do mês SEGUINTE ao `mesBase`
 * ('YYYY-MM'). Cada linha usa o MESMO cálculo não cumulativo (projetarSobraMensal):
 * a projeção não acumula saldo — cada mês é independente (D-04).
 *
 * Os rótulos de mês avançam com date-fns (addMonths sobre o primeiro dia do mês-
 * base; format com locale ptBR) — a virada de ano é sempre correta, nunca hand-
 * roll (precedente contas-fixas/_lib/service.ts).
 */
export function projetarMeses(
  mesBase: string,
  numMeses: number,
  receitaEsperadaCents: number,
  custoEsperadoCents: number,
  dasEsperadoCents: number
): MesProjetado[] {
  const n = clampNumMeses(numMeses)
  // parse 'YYYY-MM' → primeiro dia do mês-base (frame de tempo local).
  const base = parse(mesBase, 'yyyy-MM', new Date())

  const { sobraCents, negativo, faltamCents } = projetarSobraMensal(
    receitaEsperadaCents,
    custoEsperadoCents,
    dasEsperadoCents
  )

  const linhas: MesProjetado[] = []
  for (let i = 1; i <= n; i++) {
    const mesDate = addMonths(base, i) // i=1 → mês SEGUINTE ao mesBase
    linhas.push({
      mesLabel: format(mesDate, "MMM 'de' yyyy", { locale: ptBR }),
      sobraCents,
      negativo,
      faltamCents,
    })
  }
  return linhas
}

/**
 * true quando QUALQUER mês da projeção é negativo — conveniência para a UI
 * destacar o alerta de saldo negativo (D-05). Lista vazia → false.
 */
export function algumMesNegativo(linhas: MesProjetado[]): boolean {
  return linhas.some((l) => l.negativo)
}
