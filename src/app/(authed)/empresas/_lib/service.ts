// src/app/(authed)/empresas/_lib/service.ts
// Funções PURAS da fatia de fundação multi-empresa (D-02/D-04/D-08).
// Sem Prisma — o acesso ao banco (getOrSeedCategorias, CRUD) entra no Plano 04-03.
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
