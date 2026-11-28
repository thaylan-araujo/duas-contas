// src/app/(authed)/lancamentos/_components/TetosTabContent.tsx
// Server Component — conteúdo da aba "Tetos & categorias" do hub Lançamentos
// (Fatia 2 / resto do ROADMAP-P11-C5: editar tetos vive em Lançamentos). Compõe
// componentes EXISTENTES (reuso, sem reescrever):
// - CategoriaTetoList INTERATIVO (mantém o InlineCategoriaTetoEditor por linha —
//   definir o teto por categoria).
// - ManageCategoriesButton (gerenciar categorias) — precisa de getCategories.
// Não edita nenhum _lib/.
import { loadAcompanhamentoData } from '../../planejamento/_lib/loader'
import { getCategories } from '../_lib/loader'
import { CategoriaTetoList } from '../../planejamento/_components/CategoriaTetoList'
import { ManageCategoriesButton } from './ManageCategoriesButton'

interface TetosTabContentProps {
  userId: string
  currentMonth: string
}

export async function TetosTabContent({
  userId,
  currentMonth,
}: TetosTabContentProps) {
  const [acompanhamento, categories] = await Promise.all([
    loadAcompanhamentoData(userId, currentMonth),
    getCategories(userId),
  ])

  const { categorias } = acompanhamento

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Tetos &amp; categorias
          </h2>
          <p className="text-sm text-text-secondary">
            Defina um teto de referência por categoria e gerencie suas categorias
          </p>
        </div>
        <ManageCategoriesButton categories={categories} />
      </div>

      {/* Tetos por categoria — INTERATIVO (InlineCategoriaTetoEditor por linha) */}
      <CategoriaTetoList month={currentMonth} categorias={categorias} />
    </div>
  )
}
