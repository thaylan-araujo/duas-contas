// src/app/(authed)/canais/_lib/pnl.ts
// Funções puras do P&L por empresa (Fatia 2 — D-05): bruto, impostos, líquido,
// lucro e agrupamento por categoria. TypeScript puro — SEM Prisma, SEM nada de
// servidor (maximamente testáveis, espelha planejamento/_lib/acompanhamento.ts).
// Todos os valores em centavos (Int). O P&L é uma VISÃO derivada dos lançamentos
// que já existem por empresa desde a Fatia 1 (D-01): nenhum modelo novo.

/** Total agregado de uma categoria (receita ou custo) no mês. */
export interface CategoriaTotal {
  categoryId: string
  name: string
  totalCents: number
}

// ---------------------------------------------------------------------------
// PNL-02 — Faturamento bruto
// ---------------------------------------------------------------------------

/**
 * Faturamento bruto (PNL-02) = soma das receitas (ENTRADA) da empresa no mês.
 * Recebe o total já agregado das entradas e é identidade sobre ele — mantida
 * como função nomeada para o P&L ter uma fonte única e legível por mês.
 * Ex.: computeBruto(1_000_000) === 1_000_000.
 */
export function computeBruto(receitasCents: number): number {
  return receitasCents
}

// ---------------------------------------------------------------------------
// D-02 — Impostos (identificar por NOME da categoria de custo)
// ---------------------------------------------------------------------------

/**
 * Normaliza um nome de categoria para comparação: trim + lowercase + remoção de
 * acentos (NFD + descarte de diacríticos). "Imposto ", "IMPOSTO" e "ímpôsto"
 * viram todos "imposto".
 */
function normalizarNome(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/**
 * Impostos do mês (D-02) = soma dos custos cujas categorias são de imposto.
 *
 * Decisão (D-02, discrição do Claude): identificar a categoria de imposto
 * **pelo NOME** — a categoria padrão "Imposto" semeada por tipo na Fatia 1 —, e
 * não por uma flag. É o caminho mais simples e não exige modelo/coluna nova
 * (D-01: VISÃO derivada). Compara o nome normalizado (trim + lowercase + sem
 * acento) com a palavra "imposto". Empresa sem categoria de imposto → 0.
 * Ex.: [{name:'Imposto',totalCents:30_000},{name:'Anúncios',totalCents:50_000}] → 30_000.
 */
export function computeImpostos(custosPorCategoria: CategoriaTotal[]): number {
  return custosPorCategoria
    .filter((c) => normalizarNome(c.name) === 'imposto')
    .reduce((acc, c) => acc + c.totalCents, 0)
}

// ---------------------------------------------------------------------------
// PNL-03 — Faturamento líquido
// ---------------------------------------------------------------------------

/**
 * Faturamento líquido (PNL-03) = bruto − impostos. Pode ser negativo quando os
 * impostos excedem o bruto. Ex.: computeLiquido(1_000_000, 30_000) === 970_000.
 */
export function computeLiquido(brutoCents: number, impostosCents: number): number {
  return brutoCents - impostosCents
}

// ---------------------------------------------------------------------------
// PNL-04 — Lucro
// ---------------------------------------------------------------------------

/**
 * Lucro (PNL-04) = receitas − TODOS os custos (SAIDA) do mês, não só impostos.
 * Pode ser negativo (custos maiores que receitas).
 * Ex.: computeLucro(1_000_000, 400_000) === 600_000.
 */
export function computeLucro(receitasCents: number, custosCents: number): number {
  return receitasCents - custosCents
}

// ---------------------------------------------------------------------------
// PNL-05 — Agrupamento por categoria (receitas e custos)
// ---------------------------------------------------------------------------

/**
 * Ordena as linhas por categoria em ordem decrescente de total (maior primeiro),
 * sem mutar a lista de entrada (PNL-05). Usado tanto para receitas quanto para
 * custos. Lista vazia → [].
 */
export function groupByCategory(itens: CategoriaTotal[]): CategoriaTotal[] {
  return [...itens].sort((a, b) => b.totalCents - a.totalCents)
}
