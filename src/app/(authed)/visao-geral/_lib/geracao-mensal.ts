// src/app/(authed)/visao-geral/_lib/geracao-mensal.ts
// Geração mensal idempotente das contas fixas (C2) + marcar pago (C3).
// As decisões puras (quais fixas faltam gerar, montagem do valor da linha) são
// extraídas como funções SEM Prisma para serem testadas (geracao-mensal.test.ts).
// Dinheiro = Int centavos. Casa = empresaId null.
import { prisma } from '@/lib/prisma'

/** Nome da categoria Casa onde as fixas geradas entram. */
export const CONTAS_FIXAS_CATEGORIA = 'Contas fixas'

// ---------------------------------------------------------------------------
// Funções PURAS (sem Prisma) — testadas em geracao-mensal.test.ts
// ---------------------------------------------------------------------------

/**
 * Idempotência (guard de leitura — caminho feliz): dadas as contas fixas e os
 * `fixedAccountId` que JÁ têm uma Transaction no mês, devolve só as contas que
 * ainda NÃO foram geradas. Rodar de novo com tudo gerado devolve [] (não gera
 * nada). A camada atômica real é o índice único (fixedAccountId, dueDate) —
 * ver gerarContasDoMesService (captura P2002 sob double-tap).
 */
export function fixasFaltandoGerar<T extends { id: string }>(
  contas: T[],
  idsJaGerados: string[]
): T[] {
  const gerados = new Set(idsJaGerados)
  return contas.filter((c) => !gerados.has(c.id))
}

/**
 * Montagem do valor da linha gerada:
 * - conta de valor certo (isVariableAmount false) → amountCents = valor da fixa,
 *   estimatedCents = null.
 * - conta "a definir" (isVariableAmount true, ex.: luz/água) → amountCents = 0 e
 *   estimatedCents = estimativa (PAGO do mês anterior — R-5; 0 sem histórico, não
 *   infla). O comprometido (fatia 01) usa estimatedCents para as "a definir".
 */
export function valorLinhaGerada(input: {
  amountCents: number
  isVariableAmount: boolean
  estimativaCents: number
}): { amountCents: number; estimatedCents: number | null } {
  if (input.isVariableAmount) {
    return { amountCents: 0, estimatedCents: input.estimativaCents }
  }
  return { amountCents: input.amountCents, estimatedCents: null }
}

/**
 * date=dueDate do mês: dia `dueDay` do `month` ('YYYY-MM'), com clamp ao último
 * dia do mês (ex.: dueDay 31 em fevereiro → 28/29). Função pura, testável.
 */
export function dataVencimentoNoMes(month: string, dueDay: number): Date {
  const [year, monthNum] = month.split('-').map(Number)
  const ultimoDia = new Date(year, monthNum, 0).getDate()
  const dia = Math.min(dueDay, ultimoDia)
  return new Date(year, monthNum - 1, dia)
}

// ---------------------------------------------------------------------------
// Acesso Prisma
// ---------------------------------------------------------------------------

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/

/** Intervalo [start, end] do mês inteiro (end inclui 23:59:59.999 do último dia). */
function monthRange(month: string): { start: Date; end: Date } {
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(year, monthNum - 1, 1)
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999)
  return { start, end }
}

/** Mês anterior a 'YYYY-MM' no mesmo formato. */
function mesAnterior(month: string): string {
  const [year, monthNum] = month.split('-').map(Number)
  const d = new Date(year, monthNum - 2, 1) // monthNum-1 é o atual; -2 = anterior
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/**
 * Estimativa R-5: valor PAGO daquela fixa no mês anterior. Se o mês anterior
 * ainda está EM_ABERTO, usa o estimatedCents dele; sem histórico → 0 (não infla).
 * Sempre escopado por userId. Casa (empresaId null).
 */
export async function getEstimativaMesAnterior(
  userId: string,
  fixedAccountId: string,
  month: string
): Promise<number> {
  const { start, end } = monthRange(mesAnterior(month))

  const anterior = await prisma.transaction.findFirst({
    where: {
      userId,
      empresaId: null,
      type: 'SAIDA',
      fixedAccountId,
      date: { gte: start, lte: end },
    },
    orderBy: { date: 'desc' },
    select: { status: true, amountCents: true, estimatedCents: true },
  })

  if (!anterior) return 0
  if (anterior.status === 'PAGO') return anterior.amountCents
  // mês anterior ainda em aberto → usa a estimativa dele (ou 0 se nula)
  return anterior.estimatedCents ?? 0
}

/**
 * Garante a categoria Casa "Contas fixas" (empresaId null). findFirst + create —
 * o índice NULLS NOT DISTINCT do banco evita duplicata (mesmo padrão da categoria
 * Pró-labore da Casa em lancamentos/service.ts).
 */
async function getOrCreateContasFixasCategoria(
  userId: string
): Promise<{ id: string }> {
  const existing = await prisma.category.findFirst({
    where: { name: CONTAS_FIXAS_CATEGORIA, empresaId: null, userId },
  })
  if (existing) return existing
  return prisma.category.create({
    data: {
      name: CONTAS_FIXAS_CATEGORIA,
      empresaId: null,
      userId,
      kind: null,
      isDefault: true,
    },
  })
}

/**
 * Geração mensal idempotente (C2, R-3): para cada FixedAccount do usuário ainda
 * SEM Transaction naquele mês, cria uma Transaction SAIDA EM_ABERTO da Casa
 * (categoria "Contas fixas", date=dueDate, valor certo ou estimativa nas a
 * definir). Idempotência em DUAS camadas:
 *  (a) guard de leitura `fixasFaltandoGerar` (caminho feliz — não tenta duplicar);
 *  (b) índice único (fixedAccountId, dueDate): sob double-tap/retry concorrente,
 *      um insert duplicado falha ATOMICAMENTE (P2002) → fazemos skip da linha.
 * Ação EXPLÍCITA (nunca em render). Devolve quantas linhas foram criadas.
 */
export async function gerarContasDoMesService(
  userId: string,
  month: string
): Promise<{ criadas: number }> {
  if (!monthRegex.test(month)) throw new Error('Formato de mês inválido')
  const { start, end } = monthRange(month)

  const contas = await prisma.fixedAccount.findMany({
    where: { userId },
    orderBy: { dueDay: 'asc' },
  })
  if (contas.length === 0) return { criadas: 0 }

  // fixedAccountId que JÁ têm Transaction no mês (Casa).
  const jaGerados = await prisma.transaction.findMany({
    where: {
      userId,
      empresaId: null,
      fixedAccountId: { not: null },
      date: { gte: start, lte: end },
    },
    select: { fixedAccountId: true },
    distinct: ['fixedAccountId'],
  })
  const idsJaGerados = jaGerados
    .map((t) => t.fixedAccountId)
    .filter((id): id is string => id !== null)

  const faltantes = fixasFaltandoGerar(contas, idsJaGerados)
  if (faltantes.length === 0) return { criadas: 0 }

  const categoria = await getOrCreateContasFixasCategoria(userId)

  let criadas = 0
  // Criação linha-a-linha com try/catch no P2002 (double-tap atômico). Não usamos
  // um único $transaction porque a captura de P2002 por linha exige isolamento:
  // uma colisão numa fixa não deve abortar as demais.
  for (const conta of faltantes) {
    const estimativaCents = conta.isVariableAmount
      ? await getEstimativaMesAnterior(userId, conta.id, month)
      : 0
    const { amountCents, estimatedCents } = valorLinhaGerada({
      amountCents: conta.amountCents,
      isVariableAmount: conta.isVariableAmount,
      estimativaCents,
    })
    const vencimento = dataVencimentoNoMes(month, conta.dueDay)

    try {
      await prisma.transaction.create({
        data: {
          type: 'SAIDA',
          status: 'EM_ABERTO',
          description: conta.name,
          amountCents,
          estimatedCents,
          date: vencimento,
          dueDate: vencimento,
          empresaId: null, // Casa
          categoryId: categoria.id,
          fixedAccountId: conta.id,
          userId,
        },
      })
      criadas += 1
    } catch (error) {
      // P2002 = índice único (fixedAccountId, dueDate): já gerada por outra
      // requisição concorrente → skip (idempotência atômica). Outros erros sobem.
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        continue
      }
      throw error
    }
  }

  return { criadas }
}

/**
 * Marcar pago (C3): flip da MESMA linha para PAGO — nunca cria outra (R-2, sem
 * contagem dupla). Ownership guard findFirst({id,userId}) (IDOR). Quando a linha é
 * "a definir" (fixa isVariableAmount) ou veio `valorCents`, grava amountCents =
 * valorCents (o valor real da luz/água). valorCents validado Int ≥ 0.
 */
export async function markTransacaoPagaService(
  id: string,
  userId: string,
  valorCents?: number
): Promise<void> {
  const record = await prisma.transaction.findFirst({
    where: { id, userId },
    select: {
      id: true,
      fixedAccount: { select: { isVariableAmount: true } },
    },
  })
  if (!record) throw new Error('Lançamento não encontrado.')

  const ehADefinir = record.fixedAccount?.isVariableAmount ?? false

  if (valorCents !== undefined) {
    if (!Number.isInteger(valorCents) || valorCents < 0) {
      throw new Error('Valor inválido.')
    }
  }

  // "A definir" exige o valor real para virar amountCents.
  if (ehADefinir && valorCents === undefined) {
    throw new Error('Informe o valor real para marcar como pago.')
  }

  const data: { status: 'PAGO'; amountCents?: number } = { status: 'PAGO' }
  if (valorCents !== undefined) {
    data.amountCents = valorCents
  }

  await prisma.transaction.update({ where: { id }, data })
}
