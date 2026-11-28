// src/app/(authed)/metas/page.tsx
// Server Component — no 'use client'. Bloco "Metas e reserva" (META-01/META-02),
// movido de /contas-fixas para a rota própria /metas (Fatia 1 — reorganização da Casa).
// Reaproveita loadContasFixasData (usa só goals) + GoalCard + NewGoalAddCard — zero _lib novo.
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { loadContasFixasData } from '../contas-fixas/_lib/loader'
import { GoalCard } from '../contas-fixas/_components/GoalCard'
import { NewGoalAddCard } from '../contas-fixas/_components/NewEntityButtons'

export default async function MetasPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user!.id

  // Reusa o loader existente; desta tela só interessa goals.
  const { goals } = await loadContasFixasData(userId)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          CASA
        </p>
        <h1 className="text-xl font-semibold text-text-primary">Metas</h1>
      </div>

      {/* Metas e reserva */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-xl font-semibold text-text-primary">Metas e reserva</h2>
          <p className="text-sm text-text-secondary">
            Caixinhas separadas do dinheiro do dia a dia
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={{
                id: goal.id,
                name: goal.name,
                targetCents: goal.targetCents,
                savedCents: goal.savedCents,
                deadline: goal.deadline,
              }}
            />
          ))}
          <NewGoalAddCard />
        </div>
      </section>
    </div>
  )
}
