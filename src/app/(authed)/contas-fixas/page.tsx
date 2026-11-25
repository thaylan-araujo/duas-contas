// src/app/(authed)/contas-fixas/page.tsx
// Server Component — no 'use client'. Three stacked cards:
// Contas fixas e assinaturas (FIXA-01), Gastos do ano divididos em 12 (FIXA-02),
// Metas e reserva (META-01/META-02 — with the two seed goals).
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { loadContasFixasData } from './_lib/loader'
import { FixedAccountTable } from './_components/FixedAccountTable'
import { AnnualExpenseTable } from './_components/AnnualExpenseTable'
import { GoalCard } from './_components/GoalCard'
import {
  NewFixedAccountButton,
  NewAnnualExpenseButton,
  NewGoalAddCard,
} from './_components/NewEntityButtons'

export default async function ContasFixasPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user!.id

  const { fixedAccounts, annualExpenses, goals } =
    await loadContasFixasData(userId)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          CASA
        </p>
        <h1 className="text-xl font-semibold text-text-primary">
          Contas fixas, gastos do ano e metas
        </h1>
      </div>

      {/* 3.1 Contas fixas e assinaturas */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Contas fixas e assinaturas
            </h2>
            <p className="text-sm text-text-secondary">
              Entram sozinhas no planejamento todo mês
            </p>
          </div>
          <NewFixedAccountButton />
        </div>
        <FixedAccountTable accounts={fixedAccounts} />
      </section>

      {/* 3.2 Gastos do ano, divididos em 12 */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Gastos do ano, divididos em 12
            </h2>
            <p className="text-sm text-text-secondary">
              Guarde um pouco por mês e não leve susto quando vencer
            </p>
          </div>
          <NewAnnualExpenseButton />
        </div>
        <AnnualExpenseTable expenses={annualExpenses} />
      </section>

      {/* 3.3 Metas e reserva */}
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
