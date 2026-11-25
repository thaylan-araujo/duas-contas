'use client'
// src/app/(authed)/contas-fixas/_components/AnnualExpenseSheet.tsx
import { useEffect, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatBRL } from '@/lib/format'
import { parseBRLInput } from '../_lib/money'
import { annualExpenseSchema, type AnnualExpenseFormData } from '../_lib/schema'
import {
  createAnnualExpenseAction,
  updateAnnualExpenseAction,
} from '../_lib/actions'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export interface ExistingAnnualExpense {
  id: string
  name: string
  yearlyCents: number
  dueMonth: number
}

interface AnnualExpenseSheetProps {
  open: boolean
  onClose: () => void
  expense?: ExistingAnnualExpense
}

export function AnnualExpenseSheet({
  open,
  onClose,
  expense,
}: AnnualExpenseSheetProps) {
  const isEditing = !!expense
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm<AnnualExpenseFormData>({
    resolver: zodResolver(annualExpenseSchema),
    defaultValues: { name: '', yearlyCents: 0, dueMonth: 1 },
  })

  useEffect(() => {
    if (open) {
      if (expense) {
        reset({
          name: expense.name,
          yearlyCents: expense.yearlyCents,
          dueMonth: expense.dueMonth,
        })
      } else {
        reset({ name: '', yearlyCents: 0, dueMonth: 1 })
      }
    }
  }, [open, expense, reset])

  const watchedYearly = watch('yearlyCents')
  const yearlyPreview = watchedYearly > 0 ? formatBRL(watchedYearly) : null

  function onSubmit(data: AnnualExpenseFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateAnnualExpenseAction(null, { ...data, id: expense!.id })
        : await createAnnualExpenseAction(null, data)
      if (result.success) {
        onClose()
        reset()
      } else {
        setError('root', { message: result.error ?? 'Erro desconhecido.' })
      }
    })
  }

  const title = isEditing ? 'Editar gasto anual' : 'Novo gasto anual'

  const formBody = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-6" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="ae-name" className="text-sm font-medium text-text-primary">
          Nome
        </Label>
        <Input id="ae-name" type="text" className="min-h-[44px]" {...register('name')} />
        {errors.name && (
          <p className="text-sm text-destructive" role="alert">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ae-yearly" className="text-sm font-medium text-text-primary">
          Valor no ano
        </Label>
        <Input
          id="ae-yearly"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          className="min-h-[44px] font-mono"
          onChange={(e) =>
            setValue('yearlyCents', parseBRLInput(e.target.value), {
              shouldValidate: true,
            })
          }
          defaultValue={expense ? (expense.yearlyCents / 100).toFixed(2).replace('.', ',') : ''}
        />
        {yearlyPreview && (
          <p className="text-sm font-mono text-text-secondary">{yearlyPreview}</p>
        )}
        {errors.yearlyCents && (
          <p className="text-sm text-destructive" role="alert">{errors.yearlyCents.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ae-dueMonth" className="text-sm font-medium text-text-primary">
          Mês de vencimento
        </Label>
        <Controller
          name="dueMonth"
          control={control}
          render={({ field }) => (
            <Select
              value={String(field.value)}
              onValueChange={(v) => field.onChange(Number(v))}
            >
              <SelectTrigger id="ae-dueMonth" className="min-h-[44px]">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.dueMonth && (
          <p className="text-sm text-destructive" role="alert">{errors.dueMonth.message}</p>
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
