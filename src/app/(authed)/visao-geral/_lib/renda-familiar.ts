// src/app/(authed)/visao-geral/_lib/renda-familiar.ts
// Função pura de agrupamento da renda familiar da Casa por empresa de ORIGEM
// (Fatia 3 — PL-05/D-04). TypeScript puro — SEM Prisma, SEM nada de servidor
// (maximamente testável, espelha canais/_lib/pnl.ts). Todos os valores em
// centavos (Int). A renda familiar por origem é uma VISÃO derivada das ENTRADAS
// da Casa: agrupa pelo `origemEmpresaId` (criado em 04c-01, preenchido pelo
// pró-labore em 04c-02) mais um grupo "Outras entradas" (origem null — ex.:
// salário). Nenhum modelo novo.

/** Rótulo do grupo das entradas sem empresa de origem (ex.: salário). */
export const OUTRAS_ENTRADAS_LABEL = 'Outras entradas'

/** Rótulo de fallback quando a empresa de origem não existe mais (origem órfã). */
export const EMPRESA_REMOVIDA_LABEL = 'Empresa removida'

/** Entrada já agregada por empresa de origem (vem do groupBy do service). */
export interface EntradaPorOrigem {
  /** Empresa DE ONDE o dinheiro veio; null = entrada sem origem (salário etc.). */
  origemEmpresaId: string | null
  totalCents: number
}

/** Nome + cor de uma empresa, para rotular as linhas do bloco. */
export interface EmpresaInfo {
  nome: string
  /** Chave da paleta fixa de cores de empresa (UI-SPEC §Color). */
  cor: string
}

/** Linha pronta para exibição no bloco "Renda familiar por origem". */
export interface LinhaRendaPorOrigem {
  origemEmpresaId: string | null
  /** Nome da empresa de origem, "Outras entradas" ou "Empresa removida". */
  nome: string
  /** Chave de cor da empresa, ou null (outras entradas / empresa removida). */
  cor: string | null
  totalCents: number
}

/**
 * Agrupa as ENTRADAS da Casa por empresa de origem (PL-05/D-04).
 *
 * Recebe a lista já agregada por origem (groupBy do service) e um mapa
 * id→{nome,cor} das empresas do usuário. Devolve uma linha por origem:
 * - empresas (origemEmpresaId != null) ordenadas DESC por totalCents;
 * - "Outras entradas" (origemEmpresaId === null, cor null) SEMPRE por último,
 *   independente do valor;
 * - origem órfã (id ausente no mapa — empresa excluída) cai no fallback
 *   "Empresa removida" (cor null) e NÃO quebra.
 *
 * Não muta a lista de entrada (usa [...entradas].sort, como groupByCategory).
 */
export function agruparRendaPorOrigem(
  entradas: EntradaPorOrigem[],
  empresas: Map<string, EmpresaInfo>
): LinhaRendaPorOrigem[] {
  const empresasLinhas: LinhaRendaPorOrigem[] = []
  let outras: LinhaRendaPorOrigem | null = null

  for (const entrada of entradas) {
    if (entrada.origemEmpresaId === null) {
      // Agrega todas as entradas sem origem numa única linha "Outras entradas".
      if (outras === null) {
        outras = {
          origemEmpresaId: null,
          nome: OUTRAS_ENTRADAS_LABEL,
          cor: null,
          totalCents: 0,
        }
      }
      outras.totalCents += entrada.totalCents
      continue
    }

    const info = empresas.get(entrada.origemEmpresaId)
    empresasLinhas.push({
      origemEmpresaId: entrada.origemEmpresaId,
      nome: info?.nome ?? EMPRESA_REMOVIDA_LABEL,
      cor: info?.cor ?? null,
      totalCents: entrada.totalCents,
    })
  }

  empresasLinhas.sort((a, b) => b.totalCents - a.totalCents)

  return outras === null ? empresasLinhas : [...empresasLinhas, outras]
}

/**
 * Soma os totalCents de todas as linhas da renda familiar. Fonte única para a
 * invariante "soma do bloco == Dinheiro do mês da Casa" (getTotalEntradas).
 */
export function somaRenda(linhas: LinhaRendaPorOrigem[]): number {
  return linhas.reduce((acc, l) => acc + l.totalCents, 0)
}
