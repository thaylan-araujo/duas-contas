// src/app/(authed)/empresas/_lib/service.test.ts
// Testes RED (TDD) das FUNÇÕES PURAS da fatia de fundação multi-empresa.
// Sem Prisma — cobrem D-02/D-04 (categorias padrão por tipo), D-03 (empresaSchema),
// D-03/D-08 (canDeleteEmpresa) e D-05 (idempotência do seed).
//
// ⚠️ Estado RED esperado: `./service` e `./schema` AINDA NÃO EXISTEM (os Planos
// 04-02/04-03 vão criá-los). Este arquivo DEVE falhar ao rodar — a falha é o
// critério de sucesso do Plano 04-01 (rede de testes antes do código).
//
// Tipos de empresa usados como strings literais ('AFILIADO', 'JURIDICO_SERVICOS',
// 'INFOPRODUTO', 'GENERICO') para NÃO acoplar ao @prisma/client (que só ganha o
// enum EmpresaTipo no Plano 02).
import { describe, it, expect } from 'vitest'
import {
  categoriasPadrao,
  receitasPorTipo,
  canDeleteEmpresa,
  CUSTOS_PADRAO,
  mensagemBloqueioExclusao,
  buildSeedCategoriaEntries,
} from './service'
import { empresaSchema } from './schema'

// Os 5 custos comuns a todos os tipos (04-RESEARCH / D-04).
const CUSTOS_ESPERADOS = [
  'Imposto',
  'Funcionário',
  'Ferramentas',
  'Anúncios',
  'Investimento',
]

describe('receitasPorTipo (D-02/D-04 — receitas por tipo de empresa)', () => {
  it('AFILIADO → inclui "Comissões"', () => {
    expect(receitasPorTipo('AFILIADO')).toContain('Comissões')
  })

  it('JURIDICO_SERVICOS → inclui "Recorrência" e "Projetos"', () => {
    const r = receitasPorTipo('JURIDICO_SERVICOS')
    expect(r).toContain('Recorrência')
    expect(r).toContain('Projetos')
  })

  it('INFOPRODUTO → inclui "Vendas"', () => {
    expect(receitasPorTipo('INFOPRODUTO')).toContain('Vendas')
  })

  it('GENERICO → inclui "Receita"', () => {
    expect(receitasPorTipo('GENERICO')).toContain('Receita')
  })
})

describe('categoriasPadrao (D-04 — custos comuns + receitas por tipo)', () => {
  it('expõe os 5 custos comuns em CUSTOS_PADRAO', () => {
    expect([...CUSTOS_PADRAO]).toEqual(CUSTOS_ESPERADOS)
  })

  for (const tipo of ['AFILIADO', 'JURIDICO_SERVICOS', 'INFOPRODUTO', 'GENERICO'] as const) {
    it(`${tipo}: todos os 5 custos comuns entram como kind 'CUSTO'`, () => {
      const cats = categoriasPadrao(tipo)
      const custos = cats.filter((c) => c.kind === 'CUSTO').map((c) => c.name)
      for (const custo of CUSTOS_ESPERADOS) {
        expect(custos).toContain(custo)
      }
    })

    it(`${tipo}: as receitas do tipo entram como kind 'RECEITA'`, () => {
      const cats = categoriasPadrao(tipo)
      const receitas = cats.filter((c) => c.kind === 'RECEITA').map((c) => c.name)
      expect(receitas).toEqual(receitasPorTipo(tipo))
    })
  }

  it('AFILIADO: inclui a receita "Comissões" com kind RECEITA', () => {
    const cats = categoriasPadrao('AFILIADO')
    expect(cats).toContainEqual({ name: 'Comissões', kind: 'RECEITA' })
  })
})

describe('canDeleteEmpresa (D-03/D-08 — proteção de exclusão)', () => {
  it('count === 0 → true (pode excluir)', () => {
    expect(canDeleteEmpresa(0)).toBe(true)
  })

  it('count === 1 → false (bloqueia)', () => {
    expect(canDeleteEmpresa(1)).toBe(false)
  })

  it('count > 1 → false (bloqueia)', () => {
    expect(canDeleteEmpresa(7)).toBe(false)
  })
})

describe('seed-idempotente (D-05 — chaves compostas estáveis, sem duplicatas)', () => {
  it('as chaves (name+kind) de um tipo são estáveis entre chamadas', () => {
    const chaves = (tipo: 'AFILIADO') =>
      categoriasPadrao(tipo)
        .map((c) => `${c.name}:${c.kind}`)
        .sort()
    expect(chaves('AFILIADO')).toEqual(chaves('AFILIADO'))
  })

  it('não produz categorias duplicadas (conjunto === lista)', () => {
    const cats = categoriasPadrao('JURIDICO_SERVICOS')
    const chaves = cats.map((c) => `${c.name}:${c.kind}`)
    expect(new Set(chaves).size).toBe(chaves.length)
  })
})

describe('empresaSchema (D-03 — validação zod de nome/tipo/cor)', () => {
  const valido = { nome: 'Achadinhos', tipo: 'AFILIADO', cor: 'laranja' }

  it('aceita um objeto válido', () => {
    expect(empresaSchema.safeParse(valido).success).toBe(true)
  })

  it('rejeita nome vazio com a mensagem exata', () => {
    const r = empresaSchema.safeParse({ ...valido, nome: '' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].message).toBe('O nome é obrigatório.')
    }
  })

  it('rejeita nome com 61 caracteres (máx 60)', () => {
    const r = empresaSchema.safeParse({ ...valido, nome: 'a'.repeat(61) })
    expect(r.success).toBe(false)
  })

  it('rejeita tipo fora do enum com a mensagem exata', () => {
    const r = empresaSchema.safeParse({ ...valido, tipo: 'OUTRO' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].message).toBe('Selecione um tipo.')
    }
  })

  it('rejeita cor fora da paleta das 6', () => {
    const r = empresaSchema.safeParse({ ...valido, cor: 'turquesa' })
    expect(r.success).toBe(false)
  })

  it('aceita cada uma das 6 cores da paleta fixa', () => {
    for (const cor of ['laranja', 'verde', 'roxo', 'rosa', 'ambar', 'cinza-azulado']) {
      expect(empresaSchema.safeParse({ ...valido, cor }).success).toBe(true)
    }
  })
})

describe('mensagemBloqueioExclusao (D-08 — pluralização pt-BR da mensagem)', () => {
  it('count === 1 → "lançamento" (singular) e "vinculado"', () => {
    expect(mensagemBloqueioExclusao(1)).toBe('A empresa tem 1 lançamento vinculado.')
  })

  it('count === 2 → "lançamentos" (plural) e "vinculados"', () => {
    expect(mensagemBloqueioExclusao(2)).toBe('A empresa tem 2 lançamentos vinculados.')
  })

  it('count === 3 → plural', () => {
    expect(mensagemBloqueioExclusao(3)).toBe('A empresa tem 3 lançamentos vinculados.')
  })
})

describe('buildSeedCategoriaEntries (D-04/D-05 — chaves {name, empresaId, userId} sem duplicar)', () => {
  const USER = 'user-1'
  const EMP = 'emp-1'

  it('produz exatamente uma entrada por item de categoriasPadrao(tipo)', () => {
    const entries = buildSeedCategoriaEntries(USER, EMP, 'AFILIADO')
    expect(entries.length).toBe(categoriasPadrao('AFILIADO').length)
  })

  it('cada entrada carrega empresaId e userId do contexto', () => {
    const entries = buildSeedCategoriaEntries(USER, EMP, 'INFOPRODUTO')
    for (const e of entries) {
      expect(e.empresaId).toBe(EMP)
      expect(e.userId).toBe(USER)
    }
  })

  it('preserva name + kind de categoriasPadrao', () => {
    const entries = buildSeedCategoriaEntries(USER, EMP, 'JURIDICO_SERVICOS')
    const esperado = categoriasPadrao('JURIDICO_SERVICOS').map((c) => `${c.name}:${c.kind}`).sort()
    const obtido = entries.map((e) => `${e.name}:${e.kind}`).sort()
    expect(obtido).toEqual(esperado)
  })

  it('as chaves compostas (name+empresaId+userId) são únicas (não duplica)', () => {
    const entries = buildSeedCategoriaEntries(USER, EMP, 'GENERICO')
    const chaves = entries.map((e) => `${e.name}|${e.empresaId}|${e.userId}`)
    expect(new Set(chaves).size).toBe(chaves.length)
  })
})
