// src/app/(authed)/empresas/_lib/service.ts
// Fatia de fundação multi-empresa (D-02/D-03/D-04/D-08).
// Funções PURAS (categoriasPadrao/receitasPorTipo/canDeleteEmpresa/
// mensagemBloqueioExclusao/buildSeedCategoriaEntries) — testáveis sem Prisma.
// Camada Prisma (CRUD + getOrSeedCategorias) — padrão "funções finas", não unit.
import { prisma } from '@/lib/prisma'
import type { EmpresaFormData } from './schema'

type EmpresaTipo = EmpresaFormData['tipo']

// Os 5 custos comuns a todos os tipos de empresa (D-04 / 04-RESEARCH).
export const CUSTOS_PADRAO = [
  'Imposto',
  'Funcionário',
  'Ferramentas',
  'Anúncios',
  'Investimento',
] as const

/**
 * Receitas padrão por tipo de empresa (D-02/D-04).
 */
export function receitasPorTipo(tipo: EmpresaTipo): string[] {
  switch (tipo) {
    case 'AFILIADO':
      return ['Comissões']
    case 'JURIDICO_SERVICOS':
      return ['Recorrência', 'Projetos']
    case 'INFOPRODUTO':
      return ['Vendas']
    default:
      return ['Receita'] // GENERICO
  }
}

/**
 * Categorias padrão de uma empresa (nome + kind RECEITA/CUSTO) — PURA, testável
 * sem Prisma. Receitas conforme o tipo + os 5 custos comuns (D-04).
 */
export function categoriasPadrao(
  tipo: EmpresaTipo
): { name: string; kind: 'RECEITA' | 'CUSTO' }[] {
  return [
    ...receitasPorTipo(tipo).map((name) => ({ name, kind: 'RECEITA' as const })),
    ...CUSTOS_PADRAO.map((name) => ({ name, kind: 'CUSTO' as const })),
  ]
}

/**
 * Decisão PURA de exclusão (D-03/D-08): uma empresa só pode ser excluída quando
 * não há lançamentos vinculados (count === 0).
 */
export function canDeleteEmpresa(count: number): boolean {
  return count === 0
}

/**
 * Mensagem PURA de bloqueio da exclusão (D-08). Pluralização correta em pt-BR:
 * 1 -> "lançamento"; 0 ou >1 -> "lançamentos".
 * Ex.: mensagemBloqueioExclusao(1) === "A empresa tem 1 lançamento vinculado."
 *      mensagemBloqueioExclusao(3) === "A empresa tem 3 lançamentos vinculados."
 */
export function mensagemBloqueioExclusao(count: number): string {
  const substantivo = count === 1 ? 'lançamento' : 'lançamentos'
  const adjetivo = count === 1 ? 'vinculado' : 'vinculados'
  return `A empresa tem ${count} ${substantivo} ${adjetivo}.`
}

/**
 * Monta PURAMENTE as entradas {name, kind, empresaId, userId} a semear para uma
 * empresa (D-04/D-05). As chaves são estáveis entre chamadas (idempotência do
 * seed quando combinadas com o índice único name_empresaId_userId).
 */
export function buildSeedCategoriaEntries(
  userId: string,
  empresaId: string,
  tipo: EmpresaTipo
): { name: string; kind: 'RECEITA' | 'CUSTO'; empresaId: string; userId: string }[] {
  return categoriasPadrao(tipo).map((c) => ({
    name: c.name,
    kind: c.kind,
    empresaId,
    userId,
  }))
}

// ---------------------------------------------------------------------------
// Camada Prisma — CRUD de empresa + seed de categorias por tipo
// Ownership-guarded: toda query inclui where: { userId } (ASVS V4 / T-04-06).
// ---------------------------------------------------------------------------

/**
 * Semeia (idempotente) as categorias padrão do tipo para a empresa, via upsert
 * na chave composta name_empresaId_userId. Rodar duas vezes NÃO duplica
 * (04-RESEARCH §Code Examples). isDefault: true (categorias semeadas).
 */
export async function getOrSeedCategorias(
  userId: string,
  empresaId: string,
  tipo: EmpresaTipo
) {
  const entries = buildSeedCategoriaEntries(userId, empresaId, tipo)
  await prisma.$transaction(
    entries.map((e) =>
      prisma.category.upsert({
        where: {
          name_empresaId_userId: {
            name: e.name,
            empresaId: e.empresaId,
            userId: e.userId,
          },
        },
        update: {}, // já existe → não duplica, não sobrescreve edições do usuário
        create: {
          name: e.name,
          empresaId: e.empresaId,
          userId: e.userId,
          kind: e.kind,
          isDefault: true,
        },
      })
    )
  )
  return prisma.category.findMany({ where: { userId, empresaId } })
}

/**
 * Cria a empresa e, em seguida, semeia suas categorias padrão do tipo (D-03/D-04).
 * userId SEMPRE da sessão (nunca do form — T-04-09).
 */
export async function createEmpresaService(data: {
  nome: string
  tipo: EmpresaTipo
  cor: string
  userId: string
}) {
  const empresa = await prisma.empresa.create({
    data: {
      nome: data.nome,
      tipo: data.tipo,
      cor: data.cor,
      userId: data.userId,
    },
  })
  await getOrSeedCategorias(data.userId, empresa.id, data.tipo)
  return empresa
}

/**
 * Atualiza a empresa com ownership check (IDOR: T-04-06). Mudar o tipo NÃO
 * re-semeia categorias (as categorias já existentes da empresa são preservadas).
 */
export async function updateEmpresaService(
  id: string,
  userId: string,
  data: { nome: string; tipo: EmpresaTipo; cor: string }
) {
  const record = await prisma.empresa.findFirst({ where: { id, userId } })
  if (!record) throw new Error('Empresa não encontrada.')
  return prisma.empresa.update({
    where: { id },
    data: { nome: data.nome, tipo: data.tipo, cor: data.cor },
  })
}

/**
 * Exclui a empresa com proteção D-08: bloqueia se houver lançamentos vinculados
 * (lança mensagemBloqueioExclusao). Caso contrário, apaga categorias + empresa
 * atomicamente (prisma.$transaction). Ownership check (T-04-06).
 */
export async function deleteEmpresaService(id: string, userId: string) {
  const record = await prisma.empresa.findFirst({ where: { id, userId } })
  if (!record) throw new Error('Empresa não encontrada.')

  const count = await prisma.transaction.count({
    where: { empresaId: id, userId },
  })
  if (!canDeleteEmpresa(count)) {
    throw new Error(mensagemBloqueioExclusao(count))
  }

  return prisma.$transaction([
    prisma.category.deleteMany({ where: { empresaId: id, userId } }),
    prisma.empresa.delete({ where: { id } }),
  ])
}
