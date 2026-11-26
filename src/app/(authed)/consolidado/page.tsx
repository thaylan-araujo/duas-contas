// src/app/(authed)/consolidado/page.tsx
// "Consolidado" (seção EMPRESA) — visão SOMADA de todas as empresas do usuário
// no mês (Fatia 4 — CONS-01/D-02). Server Component que espelha canais/page.tsx:
// lê searchParams.month, autentica via supabase.auth.getUser() e usa
// userId = user!.id (nunca de searchParams — T-04d-08). NÃO precisa de empresaId:
// o consolidado é a soma de TODAS as empresas do usuário, não de uma só. É uma
// VISÃO derivada dos lançamentos — nenhum modelo/migração novo.
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { loadConsolidadoData, loadProjecaoData } from './_lib/loader'
import { ConsolidadoCards } from './_components/ConsolidadoCards'
import { ConsolidadoTable } from './_components/ConsolidadoTable'
import { ProjecaoTable } from './_components/ProjecaoTable'

interface PageProps {
  searchParams: Promise<{ month?: string; empresaId?: string }>
}

export default async function ConsolidadoPage({ searchParams }: PageProps) {
  const { month } = await searchParams

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user!.id
  const currentMonth = month ?? new Date().toISOString().slice(0, 7)

  const [{ linhas, totais }, { projecaoFamilia, projecaoPorEmpresa }] =
    await Promise.all([
      loadConsolidadoData(userId, currentMonth),
      loadProjecaoData(userId, currentMonth),
    ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Consolidado</h1>
      </div>

      {linhas.length === 0 ? (
        <p className="text-text-secondary">
          Você ainda não tem empresas cadastradas. Cadastre uma empresa para ver
          o consolidado.
        </p>
      ) : (
        <>
          <ConsolidadoCards totais={totais} />
          <ConsolidadoTable linhas={linhas} totais={totais} />

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Projeção — próximos meses
            </h2>
            <ProjecaoTable titulo="Família" meses={projecaoFamilia} />
            {projecaoPorEmpresa.map((empresa) => (
              <ProjecaoTable
                key={empresa.empresaId}
                titulo={empresa.nome}
                meses={empresa.meses}
              />
            ))}
          </section>
        </>
      )}
    </div>
  )
}
