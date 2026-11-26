// src/app/(authed)/empresas/page.tsx
// Server Component — lista de empresas (grade de cartões + add-card tracejado)
// e, por empresa, a seção de categorias (Receitas/Custos). Estrutura copiada de
// contas-fixas/page.tsx (eyebrow + título + CTA). UI-SPEC §2/§3.
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { loadEmpresasData } from './_lib/loader'
import { EmpresaCard } from './_components/EmpresaCard'
import { NewEmpresaButton, NewEmpresaAddCard } from './_components/NewEmpresaButton'
import { EmpresaCategoriesSection } from './_components/EmpresaCategoriesSection'

export default async function EmpresasPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user!.id

  const { empresas } = await loadEmpresasData(userId)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            EMPRESA
          </p>
          <h1 className="text-xl font-semibold text-text-primary">Empresas</h1>
        </div>
        <NewEmpresaButton />
      </div>

      {empresas.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-base font-semibold text-text-primary">
            Nenhuma empresa cadastrada
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Crie sua primeira empresa para começar a lançar receitas e custos nela.
          </p>
          <div className="mt-4 flex justify-center">
            <NewEmpresaButton />
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {empresas.map((empresa) => (
            <EmpresaCard
              key={empresa.id}
              empresa={{
                id: empresa.id,
                nome: empresa.nome,
                tipo: empresa.tipo,
                cor: empresa.cor,
                // Decimal? do Prisma → number | null para o form (D-03).
                aliquotaDasPercent:
                  empresa.aliquotaDasPercent != null
                    ? Number(empresa.aliquotaDasPercent)
                    : null,
                lancamentoCount: empresa.lancamentoCount,
              }}
              categoriasSlot={
                <EmpresaCategoriesSection
                  empresaId={empresa.id}
                  cor={empresa.cor}
                  categorias={empresa.categorias.map((c) => ({
                    id: c.id,
                    name: c.name,
                    kind: c.kind,
                    isDefault: c.isDefault,
                  }))}
                />
              }
            />
          ))}
          <NewEmpresaAddCard />
        </div>
      )}
    </div>
  )
}
