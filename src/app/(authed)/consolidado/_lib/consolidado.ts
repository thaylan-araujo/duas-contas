// src/app/(authed)/consolidado/_lib/consolidado.ts
// Funções puras de agregação da tela Consolidado (Fatia 4 — CONS-01/D-02).
// TypeScript puro — SEM Prisma, SEM nada de servidor (maximamente testável,
// espelha visao-geral/_lib/renda-familiar.ts e canais/_lib/pnl.ts). Todos os
// valores de dinheiro em centavos (Int). O Consolidado é uma VISÃO derivada:
// soma, no mês, os números já calculados de CADA empresa do usuário (faturamento
// bruto/líquido, lucro, DAS estimado e pró-labore) — nenhum modelo novo, nenhuma
// mistura entre empresas. A invariante "total == soma das linhas" é exatamente o
// reduce de `somarConsolidado` (correção-crítica — T-04d-07).

/** Uma linha do consolidado: os números de UMA empresa no mês. */
export interface LinhaConsolidado {
  empresaId: string
  /** Nome da empresa (rótulo da linha). */
  nome: string
  /** Chave da paleta fixa de cores de empresa (UI-SPEC §Color). */
  cor: string
  /** Faturamento bruto = soma das receitas (ENTRADA) da empresa no mês (PNL-02). */
  brutoCents: number
  /** Faturamento líquido = bruto − impostos (PNL-03). */
  liquidoCents: number
  /** Lucro = receitas − todos os custos SAIDA da empresa no mês (PNL-04). */
  lucroCents: number
  /** DAS estimado do mês = alíquota × bruto (CONS-02/D-03); 0 quando sem alíquota. */
  dasEstimadoCents: number
  /** false → a empresa ainda não tem alíquota; UI mostra "não definido" (D-03). */
  aliquotaDefinida: boolean
  /** Pró-labore pago pela empresa no mês (SAÍDAS marcadas por origemEmpresaId — 04c). */
  proLaboreCents: number
}

/** Totais somados de todas as linhas do consolidado (sem identidade de empresa). */
export interface TotaisConsolidado {
  brutoCents: number
  liquidoCents: number
  lucroCents: number
  dasEstimadoCents: number
  /** Pró-labore total do mês — é exatamente o que vira renda familiar na Casa. */
  proLaboreCents: number
}

/**
 * Devolve uma CÓPIA das linhas ordenada DESC por lucroCents (maior lucro
 * primeiro), no mesmo espírito de groupByCategory. Não muta a entrada
 * (usa [...linhas].sort).
 */
export function ordenarLinhas(linhas: LinhaConsolidado[]): LinhaConsolidado[] {
  return [...linhas].sort((a, b) => b.lucroCents - a.lucroCents)
}

/**
 * Soma cada campo numérico de todas as linhas (CONS-01). É a FONTE ÚNICA dos
 * totais da tela: a invariante "total == soma das linhas" é este reduce. Lista
 * vazia → todos os totais zero. Não muta as linhas de entrada.
 */
export function somarConsolidado(
  linhas: LinhaConsolidado[]
): TotaisConsolidado {
  return linhas.reduce<TotaisConsolidado>(
    (acc, l) => ({
      brutoCents: acc.brutoCents + l.brutoCents,
      liquidoCents: acc.liquidoCents + l.liquidoCents,
      lucroCents: acc.lucroCents + l.lucroCents,
      dasEstimadoCents: acc.dasEstimadoCents + l.dasEstimadoCents,
      proLaboreCents: acc.proLaboreCents + l.proLaboreCents,
    }),
    {
      brutoCents: 0,
      liquidoCents: 0,
      lucroCents: 0,
      dasEstimadoCents: 0,
      proLaboreCents: 0,
    }
  )
}
