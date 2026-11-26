// src/app/(authed)/consolidado/_lib/loader.ts
// Orquestra a tela Consolidado (Fatia 4 — CONS-01/D-02): para CADA empresa do
// usuário no mês, reaproveita o P&L da Fatia 2 (loadPnlData → bruto/líquido/
// lucro + DAS estimado, nenhuma query nova para os totais) e soma o pró-labore
// pago pela empresa no mês (SAÍDAS marcadas por origemEmpresaId — 04c). Monta as
// LinhaConsolidado[], aplica as funções puras ordenarLinhas/somarConsolidado e
// devolve { linhas, totais }. É uma VISÃO derivada — nenhum modelo/migração novo.
// Toda query filtra por userId (ASVS V4 / T-04d-06); o consolidado só inclui as
// empresas do próprio usuário — nenhuma mistura entre usuários nem entre donos.
import { prisma } from '@/lib/prisma'
import { getEmpresas } from '@/app/(authed)/empresas/_lib/loader'
import { loadPnlData } from '@/app/(authed)/canais/_lib/loader'
import {
  ordenarLinhas,
  somarConsolidado,
  type LinhaConsolidado,
  type TotaisConsolidado,
} from './consolidado'

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/

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
