'use client'
// src/app/(authed)/contas-fixas/_components/FixedAccountSheet.tsx
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
import { Switch } from '@/components/ui/switch'
import { formatBRL } from '@/lib/format'
import { parseBRLInput } from '../_lib/money'
import { fixedAccountSchema, type FixedAccountFormData } from '../_lib/schema'
import {
  createFixedAccountAction,
  updateFixedAccountAction,
} from '../_lib/actions'

export interface ExistingFixedAccount {
  id: string
  name: string
  dueDay: number
  amountCents: number
  autoDebit: boolean
  isVariableAmount: boolean
}

interface FixedAccountSheetProps {
  open: boolean
  onClose: () => void
  account?: ExistingFixedAccount
}

export function FixedAccountSheet({
  open,
  onClose,
  account,
}: FixedAccountSheetProps) {
  const isEditing = !!account
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
  } = useForm<FixedAccountFormData>({
    resolver: zodResolver(fixedAccountSchema),
    defaultValues: {
      name: '',
      dueDay: 1,
      amountCents: 0,
      autoDebit: false,
      isVariableAmount: false,
    },
  })

  useEffect(() => {
    if (open) {
      if (account) {
        reset({
          name: account.name,
          dueDay: account.dueDay,
          amountCents: account.amountCents,
          autoDebit: account.autoDebit,
          isVariableAmount: account.isVariableAmount,
        })
      } else {
        reset({
          name: '',
          dueDay: 1,
          amountCents: 0,
          autoDebit: false,
          isVariableAmount: false,
        })
      }
    }
  }, [open, account, reset])

  const watchedAmount = watch('amountCents')
  const watchIsVariable = watch('isVariableAmount')
  const amountPreview = watchedAmount > 0 ? formatBRL(watchedAmount) : null

  function onSubmit(data: FixedAccountFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateFixedAccountAction(null, { ...data, id: account!.id })
        : await createFixedAccountAction(null, data)
      if (result.success) {
        onClose()
        reset()
      } else {
        setError('root', { message: result.error ?? 'Erro desconhecido.' })
      }
    })
  }

  const title = isEditing ? 'Editar conta fixa' : 'Nova conta fixa'

  const formBody = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-6" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="fa-name" className="text-sm font-medium text-text-primary">
          Nome
        </Label>
        <Input id="fa-name" type="text" className="min-h-[44px]" {...register('name')} />
        {errors.name && (
          <p className="text-sm text-destructive" role="alert">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fa-dueDay" className="text-sm font-medium text-text-primary">
          Dia de vencimento
        </Label>
        <Input
          id="fa-dueDay"
          type="number"
          min={1}
          max={31}
          className="min-h-[44px] font-mono"
          {...register('dueDay', { valueAsNumber: true })}
        />
        {errors.dueDay && (
          <p className="text-sm text-destructive" role="alert">{errors.dueDay.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fa-amount" className="text-sm font-medium text-text-primary">
          Valor
        </Label>
        <Input
          id="fa-amount"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          className="min-h-[44px] font-mono"
          onChange={(e) =>
            setValue('amountCents', parseBRLInput(e.target.value), {
              shouldValidate: true,
            })
          }
          defaultValue={account ? (account.amountCents / 100).toFixed(2).replace('.', ',') : ''}
        />
        {amountPreview && (
          <p className="text-sm font-mono text-text-secondary">{amountPreview}</p>
        )}
        {watchIsVariable && (
          <p className="text-sm text-text-secondary">
            Luz/água: o valor é definido ao marcar pago.
          </p>
        )}
        {errors.amountCents && (
          <p className="text-sm text-destructive" role="alert">{errors.amountCents.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between min-h-[44px]">
        <Label htmlFor="fa-isVariable" className="text-sm font-medium text-text-primary">
          Valor variável (a definir)
        </Label>
        <Controller
          name="isVariableAmount"
          control={control}
          render={({ field }) => (
            <span className="inline-flex min-h-[44px] items-center">
              <Switch
                id="fa-isVariable"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </span>
          )}
        />
      </div>

      <div className="flex items-center justify-between min-h-[44px]">
        <Label htmlFor="fa-autoDebit" className="text-sm font-medium text-text-primary">
          Débito automático
        </Label>
        <Controller
          name="autoDebit"
          control={control}
          render={({ field }) => (
            <span className="inline-flex min-h-[44px] items-center">
              <Switch
                id="fa-autoDebit"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </span>
          )}
        />
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
