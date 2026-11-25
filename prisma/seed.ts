// prisma/seed.ts
// Re-executável via: npx prisma db seed
// Requer SEED_USER_ID no .env.local (UUID do usuário criado no Supabase Auth)
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// Normaliza DATABASE_URL caso o .env.local tenha sido criado com chave duplicada
// (ex: DATABASE_URL=DATABASE_URL="postgresql://..." em vez de DATABASE_URL=postgresql://...)
function normalizeEnvUrl(key: string): void {
  const raw = process.env[key]
  if (!raw) return
  // Caso: KEY="VALUE" — remove aspas externas
  let clean = raw.replace(/^"(.*)"$/, '$1')
  // Caso: KEY=VALUE — remove prefixo "KEY=" se a URL começa com o nome da variável
  if (clean.startsWith(key + '=')) {
    clean = clean.slice(key.length + 1)
    clean = clean.replace(/^"(.*)"$/, '$1')
  }
  process.env[key] = clean
}

normalizeEnvUrl('DATABASE_URL')
normalizeEnvUrl('DIRECT_URL')

// O seed é um comando CLI — usa a conexão direta (DIRECT_URL, porta 5432)
// em vez do pooler (DATABASE_URL, porta 6543), igual ao prisma db push
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const SUPABASE_USER_ID = process.env.SEED_USER_ID
  if (!SUPABASE_USER_ID) {
    throw new Error(
      'SEED_USER_ID não definido. Defina o UUID do usuário Supabase no .env.local antes de rodar o seed.'
    )
  }

  // 1. Espelhar o usuário Supabase Auth no Prisma
  await prisma.user.upsert({
    where: { id: SUPABASE_USER_ID },
    update: {},
    create: { id: SUPABASE_USER_ID },
  })
  console.log(`Usuário criado/atualizado: ${SUPABASE_USER_ID}`)

  // 2. Categorias padrão — Casa (empresaId: null). As categorias por empresa
  //    são semeadas por empresa no Plano 04-03 (não aqui).
  const casaCategories = [
    'Alimentação',
    'Combustível',
    'Lazer',
    'Contas fixas',
    'Outros',
  ]
  for (const name of casaCategories) {
    // empresaId NULL (Casa): o where composto do Prisma não aceita null diretamente,
    // então usamos findFirst + create (idempotente — o índice NULLS NOT DISTINCT no
    // banco garante que não haja duplicata sob concorrência).
    const existing = await prisma.category.findFirst({
      where: { name, empresaId: null, userId: SUPABASE_USER_ID },
    })
    if (!existing) {
      await prisma.category.create({
        data: { name, empresaId: null, userId: SUPABASE_USER_ID, isDefault: true },
      })
    }
    console.log(`Categoria Casa criada/atualizada: ${name}`)
  }

  // 3. Empresas iniciais (D-05) — idempotentes por @@unique([nome, userId]).
  //    Cada empresa nasce com suas categorias padrão por tipo (D-04), semeadas
  //    por chave composta name_empresaId_userId (upsert) para não duplicar ao
  //    rodar o seed 2x. Cores: UI-SPEC §Color regra 1 (Elite Juris cinza-azulado,
  //    Achadinhos laranja, Infoproduto roxo).
  const CUSTOS_PADRAO = ['Imposto', 'Funcionário', 'Ferramentas', 'Anúncios', 'Investimento']

  function receitasPorTipo(tipo: string): string[] {
    switch (tipo) {
      case 'AFILIADO':
        return ['Comissões']
      case 'JURIDICO_SERVICOS':
        return ['Recorrência', 'Projetos']
      case 'INFOPRODUTO':
        return ['Vendas']
      default:
        return ['Receita']
    }
  }

  function categoriasPadrao(tipo: string): { name: string; kind: 'RECEITA' | 'CUSTO' }[] {
    return [
      ...receitasPorTipo(tipo).map((name) => ({ name, kind: 'RECEITA' as const })),
      ...CUSTOS_PADRAO.map((name) => ({ name, kind: 'CUSTO' as const })),
    ]
  }

  const empresasSeed = [
    { nome: 'Elite Juris', tipo: 'JURIDICO_SERVICOS' as const, cor: 'cinza-azulado' },
    { nome: 'Achadinhos', tipo: 'AFILIADO' as const, cor: 'laranja' },
    { nome: 'Infoproduto', tipo: 'INFOPRODUTO' as const, cor: 'roxo' },
  ]

  for (const e of empresasSeed) {
    const empresa = await prisma.empresa.upsert({
      where: { nome_userId: { nome: e.nome, userId: SUPABASE_USER_ID } },
      update: { tipo: e.tipo, cor: e.cor },
      create: { nome: e.nome, tipo: e.tipo, cor: e.cor, userId: SUPABASE_USER_ID },
    })

    // Categorias padrão do tipo (idempotente por name_empresaId_userId).
    for (const cat of categoriasPadrao(e.tipo)) {
      await prisma.category.upsert({
        where: {
          name_empresaId_userId: {
            name: cat.name,
            empresaId: empresa.id,
            userId: SUPABASE_USER_ID,
          },
        },
        update: {},
        create: {
          name: cat.name,
          empresaId: empresa.id,
          userId: SUPABASE_USER_ID,
          kind: cat.kind,
          isDefault: true,
        },
      })
    }
    console.log(`Empresa criada/atualizada: ${e.nome} (${e.tipo}, ${e.cor})`)
  }

  console.log(
    '\nSeed concluído: 1 usuário + 5 categorias da Casa (empresaId null) + 3 empresas com categorias por tipo'
  )
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
