// src/lib/whatsapp/resolve.ts
// Funções puras da regra de ouro Casa × Empresa (D-03/D-04). Resolvem o destino
// e a categoria ditos pelo usuário contra os dados reais, com match tolerante
// (sem acento/caixa) e, acima de tudo: NA DÚVIDA, PERGUNTA — nunca adivinha
// (anti-objetivo nº 1). SEM Prisma, SEM servidor. `normalizarNome` espelha pnl.ts.

/** Casa é destino de 1ª classe: empresaId null. Distinto de "faltou" (não dito). */
export type DestinoResult =
  | { empresaId: string | null }
  | { ambiguo: true }
  | { faltou: true }

export type CategoriaResult =
  | { categoryId: string }
  | { ambiguo: true }
  | { faltou: true }

// W2: a Empresa expõe o nome em `nome` (NÃO `name`); só a Category usa `name`.
export interface EmpresaRef {
  id: string
  nome: string
}

export interface CategoriaRef {
  id: string
  name: string
  empresaId: string | null // null = Casa
}

/** trim + lowercase + NFD + descarte de diacríticos (mesmo algoritmo do pnl.ts). */
function normalizarNome(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/**
 * Resolve o destino dito ("Casa", "Achadinhos", "elite"...) contra as empresas do
 * usuário. Vazio → faltou (pede esclarecimento). "casa" → Casa (empresaId null).
 * Match exato único por nome → aquela empresa; senão substring única → aquela
 * empresa; zero ou múltiplos → ambiguo (pergunta). D-03: nunca adivinha.
 */
export function resolveDestino(
  falado: string | null | undefined,
  empresas: EmpresaRef[]
): DestinoResult {
  if (!falado || !falado.trim()) return { faltou: true }
  const alvo = normalizarNome(falado)
  if (alvo === 'casa') return { empresaId: null }

  const exatos = empresas.filter((e) => normalizarNome(e.nome) === alvo)
  if (exatos.length === 1) return { empresaId: exatos[0].id }
  if (exatos.length > 1) return { ambiguo: true }

  const porSubstring = empresas.filter((e) => {
    const nome = normalizarNome(e.nome)
    return nome.includes(alvo) || alvo.includes(nome)
  })
  if (porSubstring.length === 1) return { empresaId: porSubstring[0].id }

  return { ambiguo: true } // zero ou múltiplos
}

/**
 * Resolve a categoria dita contra as categorias DO DESTINO já resolvido
 * (categorias são por-empresa; Casa = empresaId null). Vazio → faltou. Match
 * exato único → aquela; senão substring única → aquela; zero/múltiplos →
 * ambiguo. NUNCA cria categoria nova (D-04).
 */
export function resolveCategoria(
  falado: string | null | undefined,
  categorias: CategoriaRef[],
  empresaId: string | null
): CategoriaResult {
  if (!falado || !falado.trim()) return { faltou: true }
  const pool = categorias.filter((c) => c.empresaId === empresaId)
  const alvo = normalizarNome(falado)

  const exatos = pool.filter((c) => normalizarNome(c.name) === alvo)
  if (exatos.length === 1) return { categoryId: exatos[0].id }
  if (exatos.length > 1) return { ambiguo: true }

  const porSubstring = pool.filter((c) => {
    const nome = normalizarNome(c.name)
    return nome.includes(alvo) || alvo.includes(nome)
  })
  if (porSubstring.length === 1) return { categoryId: porSubstring[0].id }

  return { ambiguo: true }
}
