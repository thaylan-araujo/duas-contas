// src/app/(authed)/canais/page.tsx
// "Canais e caixa" (seção EMPRESA) — P&L da empresa ativa (Fatia 2). Server
// Component que espelha visao-geral/page.tsx: lê searchParams.empresaId + month,
// autentica via auth.getUser() e carrega o P&L da empresa ativa no mês.
// É uma VISÃO derivada dos lançamentos (D-01): nenhum modelo/migração novo.
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { loadPnlData } from './_lib/loader'
import { PnlCards } from './_components/PnlCards'
import { CategoryBreakdownList } from './_components/CategoryBreakdownList'
import { CanaisPlaceholder } from './_components/CanaisPlaceholder'

interface PageProps {
  searchParams: Promise<{ month?: string; empresaId?: string }>
}

export default async function CanaisPage({ searchParams }: PageProps) {
  const { month, empresaId } = await searchParams

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user!.id
  const currentMonth = month ?? new Date().toISOString().slice(0, 7)

  // Contexto ativo do ContaSelector global: Casa (null) ou empresa (id). EMPF-06.
  const empresaIdContexto: string | null = empresaId ?? null

  // Guarda de posse (IDOR — T-04b-01): só carrega P&L se o empresaId pertencer
  // ao usuário autenticado. empresaId null (Casa) ou de outro usuário → placeholder.
  const empresa =
    empresaIdContexto !== null
      ? await prisma.empresa.findFirst({
          where: { id: empresaIdContexto, userId },
          select: { id: true, nome: true },
        })
      : null

  // Ramo Casa / empresa inválida: placeholder (não cards de P&L zerados).
  if (!empresa) {
    return <CanaisPlaceholder />
  }

  const {
    brutoCents,
    liquidoCents,
    lucroCents,
    receitasPorCategoria,
    custosPorCategoria,
  } = await loadPnlData(userId, currentMonth, empresa.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-text-primary">
          Canais e caixa — {empresa.nome}
        </h1>
      </div>

      <PnlCards
        brutoCents={brutoCents}
        liquidoCents={liquidoCents}
        lucroCents={lucroCents}
      />

      <CategoryBreakdownList
        titulo="Receitas por categoria"
        itens={receitasPorCategoria}
        tom="receita"
      />

      <CategoryBreakdownList
        titulo="Custos por categoria"
        itens={custosPorCategoria}
        tom="custo"
      />
    </div>
  )
}
