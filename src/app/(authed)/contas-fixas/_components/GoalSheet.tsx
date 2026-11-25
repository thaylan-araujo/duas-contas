'use client'
// src/app/(authed)/contas-fixas/_components/GoalSheet.tsx
import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatBRL } from '@/lib/format'
import { parseBRLInput } from '../_lib/money'
import { goalSchema, type GoalFormData } from '../_lib/schema'
import { createGoalAction, updateGoalAction } from '../_lib/actions'

export interface ExistingGoal {
  id: string
  name: string
  targetCents: number
  savedCents: number
  deadline: string | null
}

interface GoalSheetProps {
  open: boolean
  onClose: () => void
  goal?: ExistingGoal
}

export function GoalSheet({ open, onClose, goal }: GoalSheetProps) {
  const isEditing = !!goal
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: { name: '', targetCents: 0, savedCents: 0, deadline: undefined },
  })

  useEffect(() => {
    if (open) {
      if (goal) {
        reset({
          name: goal.name,
          targetCents: goal.targetCents,
          savedCents: goal.savedCents,
          deadline: goal.deadline ?? undefined,
        })
      } else {
        reset({ name: '', targetCents: 0, savedCents: 0, deadline: undefined })
      }
    }
  }, [open, goal, reset])

  const watchedTarget = watch('targetCents')
  const watchedSaved = watch('savedCents')
  const targetPreview = watchedTarget > 0 ? formatBRL(watchedTarget) : null
  const savedPreview = watchedSaved > 0 ? formatBRL(watchedSaved) : null

  function onSubmit(data: GoalFormData) {
    // Normalize empty deadline to undefined (schema treats it as optional).
    const payload: GoalFormData = {
      ...data,
      deadline: data.deadline && data.deadline.length > 0 ? data.deadline : undefined,
    }
    startTransition(async () => {
      const result = isEditing
        ? await updateGoalAction(null, { ...payload, id: goal!.id })
        : await createGoalAction(null, payload)
      if (result.success) {
        onClose()
        reset()
      } else {
        setError('root', { message: result.error ?? 'Erro desconhecido.' })
      }
    })
  }

  const title = isEditing ? 'Editar meta' : 'Nova meta'

  const formBody = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-6" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="goal-name" className="text-sm font-medium text-text-primary">
          Nome
        </Label>
        <Input id="goal-name" type="text" className="min-h-[44px]" {...register('name')} />
        {errors.name && (
          <p className="text-sm text-destructive" role="alert">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goal-target" className="text-sm font-medium text-text-primary">
          Valor da meta
        </Label>
        <Input
          id="goal-target"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          className="min-h-[44px] font-mono"
          onChange={(e) =>
            setValue('targetCents', parseBRLInput(e.target.value), { shouldValidate: true })
          }
          defaultValue={goal && goal.targetCents > 0 ? (goal.targetCents / 100).toFixed(2).replace('.', ',') : ''}
        />
        {targetPreview && (
          <p className="text-sm font-mono text-text-secondary">{targetPreview}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goal-saved" className="text-sm font-medium text-text-primary">
          Valor guardado
        </Label>
        <Input
          id="goal-saved"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          className="min-h-[44px] font-mono"
          onChange={(e) =>
            setValue('savedCents', parseBRLInput(e.target.value), { shouldValidate: true })
          }
          defaultValue={goal && goal.savedCents > 0 ? (goal.savedCents / 100).toFixed(2).replace('.', ',') : ''}
        />
        {savedPreview && (
          <p className="text-sm font-mono text-text-secondary">{savedPreview}</p>
        )}
        {errors.savedCents && (
          <p className="text-sm text-destructive" role="alert">{errors.savedCents.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goal-deadline" className="text-sm font-medium text-text-primary">
          Prazo
        </Label>
        <Input
          id="goal-deadline"
          type="month"
          className="min-h-[44px] font-mono"
          {...register('deadline')}
        />
        {errors.deadline && (
          <p className="text-sm text-destructive" role="alert">{errors.deadline.message}</p>
        )}
      </div>

      {errors.root && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" disabled={isPending} aria-busy={isPending} className="w-full min-h-[44px]">
        {isPending ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Salvar'}
      </Button>
    </form>
  )

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen && !isPending) onClose() }}>
      <SheetContent side="bottom" className="lg:hidden max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="mb-6"><SheetTitle>{title}</SheetTitle></SheetHeader>
        {formBody}
      </SheetContent>
      <SheetContent side="right" className="hidden lg:flex flex-col w-[420px] overflow-y-auto">
        <SheetHeader className="mb-6"><SheetTitle>{title}</SheetTitle></SheetHeader>
        {formBody}
      </SheetContent>
    </Sheet>
  )
}
