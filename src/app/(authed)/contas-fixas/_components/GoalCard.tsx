'use client'
// src/app/(authed)/contas-fixas/_components/GoalCard.tsx
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatBRL } from '@/lib/format'
import { computeGoalMonthly } from '../_lib/service'
import { GoalSheet, type ExistingGoal } from './GoalSheet'
import { DeleteEntityDialog } from './DeleteEntityDialog'

interface GoalCardProps {
  goal: ExistingGoal
}

/** "2027-11" → "novembro de 2027" (pt-BR). */
function deadlineLabel(deadline: string | null): string {
  if (!deadline) return '[mês/ano]'
  const d = parse(deadline, 'yyyy-MM', new Date())
  return format(d, "MMMM 'de' yyyy", { locale: ptBR })
}

export function GoalCard({ goal }: GoalCardProps) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const hasTarget = goal.targetCents > 0
  const monthly = computeGoalMonthly({
    targetCents: goal.targetCents,
    savedCents: goal.savedCents,
    deadline: goal.deadline,
  })
  const completed = hasTarget && goal.savedCents >= goal.targetCents
  const pct = hasTarget
    ? Math.min(100, Math.round((goal.savedCents / goal.targetCents) * 100))
    : 0

  return (
    <>
      <div className="group relative flex min-h-[160px] flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        {/* Header: name + actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-text-primary">{goal.name}</h3>
            {completed && (
              <span className="rounded-full bg-positive/10 px-2 py-0.5 text-xs text-positive">
                Concluída
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              aria-label={`Editar ${goal.name}`}
              onClick={() => setEditing(true)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg"
            >
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Excluir ${goal.name}`}
              onClick={() => setDeleting(true)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-red-600 hover:bg-bg"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Guardado / meta */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">
            Guardado{' '}
            <span className="font-mono text-text-primary">
              {goal.savedCents > 0 ? formatBRL(goal.savedCents) : 'R$ [—]'}
            </span>
          </span>
          <span className="text-text-secondary">
            meta{' '}
            <span className="font-mono text-text-primary">
              {hasTarget ? formatBRL(goal.targetCents) : 'R$ [—]'}
            </span>
          </span>
        </div>

        {/* Progress bar (manual idiom from CategorySpendingBars) */}
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso da meta ${goal.name}`}
          className={`h-2 w-full rounded-full bg-border ${hasTarget ? '' : 'border border-dashed border-border bg-transparent'}`}
        >
          {hasTarget && (
            <div
              className={`h-full rounded-full ${completed ? 'bg-positive' : 'bg-casa'}`}
              style={{ width: `${pct}%` }}
            />
          )}
        </div>

        {/* Guardar por mês */}
        <p className="text-sm text-text-secondary">
          Guardar{' '}
          <span className="font-mono text-text-primary">
            {monthly !== null ? formatBRL(monthly) : 'R$ [—]'}
          </span>{' '}
          por mês para chegar em {deadlineLabel(goal.deadline)}
        </p>
      </div>

      <GoalSheet open={editing} onClose={() => setEditing(false)} goal={goal} />
      <DeleteEntityDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        kind="goal"
        id={goal.id}
        name={goal.name}
      />
    </>
  )
}
