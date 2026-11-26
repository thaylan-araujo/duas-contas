// src/app/(authed)/consolidado/_lib/loader.ts
// Orquestra a tela Consolidado (Fatia 4 — CONS-01/D-02): para CADA empresa do
// usuário no mês, reaproveita o P&L da Fatia 2 (loadPnlData → bruto/líquido/
// lucro + DAS estimado, nenhuma query nova para os totais) e soma o pró-labore
// pago pela empresa no mês (SAÍDAS marcadas por origemEmpresaId — 04c). Monta as
// LinhaConsolidado[], aplica as funções puras ordenarLinhas/somarConsolidado e
// devolve { linhas, totais }. É uma VISÃO derivada — nenhum modelo/migração novo.
// Toda query filtra por userId (ASVS V4 / T-04d-06); o consolidado só inclui as
// empresas do próprio usuário — nenhuma mistura entre usuários nem entre donos.
import { subMonths, parse, format } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { getEmpresas } from '@/app/(authed)/empresas/_lib/loader'
import { loadPnlData } from '@/app/(authed)/canais/_lib/loader'
import {
  getTotalEntradas,
  getTotalSpent,
} from '@/app/(authed)/visao-geral/_lib/service'
import { getFixedAccounts } from '@/app/(authed)/contas-fixas/_lib/service'
import { computeDasEstimado } from '@/app/(authed)/canais/_lib/das'
import {
  ordenarLinhas,
  somarConsolidado,
  type LinhaConsolidado,
  type TotaisConsolidado,
} from './consolidado'
import {
  mediaUltimosMeses,
  projetarMeses,
  type MesProjetado,
} from './projecao'

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/

/** Janela histórica (em meses) usada para estimar a média (Discrição do Claude — D-04). */
const JANELA_MESES = 3

/**
 * Meses anteriores ao `month` ('YYYY-MM'), do mais antigo ao mais recente, via
 * date-fns (subMonths) — nunca aritmética de mês na mão (virada de ano correta).
 * Ex.: mesesAnteriores('2026-01', 3) → ['2025-10', '2025-11', '2025-12'].
 */
function mesesAnteriores(month: string, janela: number): string[] {
  const base = parse(month, 'yyyy-MM', new Date())
  const meses: string[] = []
  for (let i = janela; i >= 1; i--) {
    meses.push(format(subMonths(base, i), 'yyyy-MM'))
  }
  return meses
}

/**
 * Pró-labore pago por UMA empresa no mês = soma das SAÍDAS marcadas como
 * pró-labore dessa empresa (04c: a saída do par nasce com empresaId = origem e
 * origemEmpresaId = origem). É exatamente o valor que, somado, vira renda
 * familiar na Casa. Sempre filtra por userId (T-04d-06 — nunca query sem escopo).
 */
async function getProLaboreDaEmpresa(
  userId: string,
  month: string,
  empresaId: string
): Promise<number> {
  if (!monthRegex.test(month)) throw new Error('Formato de mês inválido')
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(year, monthNum - 1, 1)
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999)

  const result = await prisma.transaction.aggregate({
    _sum: { amountCents: true },
    where: {
      userId,
      empresaId, // a saída do pró-labore vive na própria empresa (04c)
      origemEmpresaId: empresaId, // marcada como pró-labore DESTA empresa
      type: 'SAIDA',
      date: { gte: start, lte: end },
    },
  })
  return result._sum.amountCents ?? 0
}

export interface ConsolidadoData {
  linhas: LinhaConsolidado[]
  totais: TotaisConsolidado
}

/**
 * Carrega o Consolidado do usuário para o mês: itera TODAS as empresas do
 * usuário (getEmpresas), e para cada uma, em paralelo, reaproveita loadPnlData
 * (bruto/líquido/lucro + DAS estimado) e soma o pró-labore do mês. Aplica as
 * funções puras (ordenarLinhas/somarConsolidado). Nenhuma empresa → { [], zeros }.
 */
export async function loadConsolidadoData(
  userId: string,
  month: string
): Promise<ConsolidadoData> {
  const empresas = await getEmpresas(userId)

  const linhas: LinhaConsolidado[] = await Promise.all(
    empresas.map(async (empresa): Promise<LinhaConsolidado> => {
      // Decimal? do Prisma → number | null; null = "sem alíquota" (D-03).
      const aliquotaDasPercent =
        empresa.aliquotaDasPercent != null
          ? Number(empresa.aliquotaDasPercent)
          : null

      const [pnl, proLaboreCents] = await Promise.all([
        loadPnlData(userId, month, empresa.id, aliquotaDasPercent),
        getProLaboreDaEmpresa(userId, month, empresa.id),
      ])

      return {
        empresaId: empresa.id,
        nome: empresa.nome,
        cor: empresa.cor,
        brutoCents: pnl.brutoCents,
        liquidoCents: pnl.liquidoCents,
        lucroCents: pnl.lucroCents,
        dasEstimadoCents: pnl.dasEstimadoCents,
        aliquotaDefinida: pnl.aliquotaDefinida,
        proLaboreCents,
      }
    })
  )

  const linhasOrdenadas = ordenarLinhas(linhas)
  const totais = somarConsolidado(linhasOrdenadas)

  return { linhas: linhasOrdenadas, totais }
}

/** Projeção de uma empresa (nome/cor para rotular + os meses projetados). */
export interface ProjecaoEmpresa {
  empresaId: string
  nome: string
  cor: string
  meses: MesProjetado[]
}

export interface ProjecaoData {
  /** Projeção da FAMÍLIA (Casa): renda esperada − despesas esperadas (D-04). */
  projecaoFamilia: MesProjetado[]
  /** Projeção POR empresa: receita − custo − DAS estimado (D-04). */
  projecaoPorEmpresa: ProjecaoEmpresa[]
}

/**
 * Monta as séries históricas (últimos ~3 meses) e projeta os próximos `numMeses`
 * (3–6) — por empresa e para a família — aplicando as funções puras de ./projecao
 * (CONS-03 / D-04). NÃO cumulativa: cada mês projetado é a média independente.
 *
 * Correção-crítica (T-04d-09): TODA query filtra por userId — a projeção só usa
 * dados do próprio usuário; nenhuma mistura entre empresas nem entre usuários. As
 * buscas por mês/empresa vão em Promise.all (padrão loadDashboardData).
 *
 * Família: renda esperada = média das ENTRADAS da Casa (origem null incluída) dos
 * últimos meses. Despesas esperadas = contas fixas da Casa (getFixedAccounts, que
 * têm valor e são obrigações datadas) + média das despesas VARIÁVEIS da Casa
 * (getTotalSpent da Casa menos as contas fixas, por mês, nunca negativo) — como
 * pede o CONTEXT ("contas fixas + média das despesas variáveis"). Família não tem
 * DAS (dasEsperado = 0).
 */
export async function loadProjecaoData(
  userId: string,
  month: string,
  numMeses = JANELA_MESES
): Promise<ProjecaoData> {
  if (!monthRegex.test(month)) throw new Error('Formato de mês inválido')

  const janela = mesesAnteriores(month, JANELA_MESES)
  const [empresas, contasFixas] = await Promise.all([
    getEmpresas(userId),
    getFixedAccounts(userId),
  ])

  // Soma das contas fixas da Casa (obrigações datadas, valor conhecido — D-04).
  const contasFixasCents = contasFixas.reduce((acc, c) => acc + c.amountCents, 0)

  // --- Família (Casa, empresaId null) -------------------------------------
  const [entradasCasaSerie, saidasCasaSerie] = await Promise.all([
    Promise.all(janela.map((m) => getTotalEntradas(userId, m, null))),
    Promise.all(janela.map((m) => getTotalSpent(userId, m, null))),
  ])
  // Despesa variável do mês = saída total da Casa − contas fixas, nunca negativa.
  const variaveisSerie = saidasCasaSerie.map((saida) =>
    Math.max(0, saida - contasFixasCents)
  )
  const rendaEsperada = mediaUltimosMeses(entradasCasaSerie)
  const despesaEsperadaFamilia = contasFixasCents + mediaUltimosMeses(variaveisSerie)
  const projecaoFamilia = projetarMeses(
    month,
    numMeses,
    rendaEsperada,
    despesaEsperadaFamilia,
    0 // família não tem DAS (D-04)
  )

  // --- Por empresa --------------------------------------------------------
  const projecaoPorEmpresa: ProjecaoEmpresa[] = await Promise.all(
    empresas.map(async (empresa): Promise<ProjecaoEmpresa> => {
      const [entradasSerie, saidasSerie] = await Promise.all([
        Promise.all(janela.map((m) => getTotalEntradas(userId, m, empresa.id))),
        Promise.all(janela.map((m) => getTotalSpent(userId, m, empresa.id))),
      ])
      const receitaEsperada = mediaUltimosMeses(entradasSerie)
      const custoEsperado = mediaUltimosMeses(saidasSerie)

      // DAS estimado sobre a receita MÉDIA projetada (reusa a fn de 04d-02).
      const aliquota =
        empresa.aliquotaDasPercent != null
          ? Number(empresa.aliquotaDasPercent)
          : null
      const dasEsperado = computeDasEstimado(aliquota, receitaEsperada)

      return {
        empresaId: empresa.id,
        nome: empresa.nome,
        cor: empresa.cor,
        meses: projetarMeses(
          month,
          numMeses,
          receitaEsperada,
          custoEsperado,
          dasEsperado
        ),
      }
    })
  )

  return { projecaoFamilia, projecaoPorEmpresa }
}
