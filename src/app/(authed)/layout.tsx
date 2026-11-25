// src/app/(authed)/layout.tsx
// Server Component — renders shell (sidebar + bottom nav) around all authenticated pages
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getEmpresas } from './empresas/_lib/loader'
import { Sidebar } from './_components/Sidebar'
import { BottomNav } from './_components/BottomNav'
import { ContaSelector } from './_components/ContaSelector'

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // middleware garante usuário; empresas alimentam o seletor global de contexto
  const empresas = user ? await getEmpresas(user.id) : []
  const empresasSelector = empresas.map((e) => ({
    id: e.id,
    nome: e.nome,
    tipo: e.tipo,
    cor: e.cor,
  }))

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar — hidden on mobile (< lg) */}
      <Sidebar />
      {/* Main content — padding-bottom on mobile for bottom nav */}
      <main className="flex-1 pb-16 lg:pb-0">
        {/* Barra superior global com o seletor de conta (desktop e mobile) */}
        <header className="flex min-h-[44px] items-center border-b border-border bg-bg px-4 py-3 lg:px-8">
          <ContaSelector empresas={empresasSelector} />
        </header>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
      {/* Mobile bottom nav — hidden on desktop (>= lg) */}
      <BottomNav />
    </div>
  )
}
