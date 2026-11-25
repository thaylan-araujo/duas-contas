'use client'
// src/app/(authed)/planejamento/_components/PlanItemSheet.tsx
// Create/edit Sheet for a plan item: Nome, Grupo (Casa categories Select with
// "+ Nova categoria…"), Valor por vez, and 4 week Checkboxes (D-01).
import { useEffect, useState, useTransition } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import { planItemSchema, type PlanItemFormData } from '../_lib/schema'
import { createPlanItemAction, updatePlanItemAction } from '../_lib/actions'
import { createCategoryAction } from '../../lancamentos/_lib/actions'
import type { Category } from '@prisma/client'

export interface ExistingPlanItem {
  id: string
  name: string
  categoryId: string
  valuePerCents: number
  week1: boolean
  week2: boolean
  week3: boolean
  week4: boolean
}

interface PlanItemSheetProps {
  open: boolean
  onClose: () => void
  month: string
  categories: Category[]
  item?: ExistingPlanItem
}

function parseBRLInput(raw: string): number {
  const cleaned = raw
    .replace(/[^\d,.]/g, '')
    .replace(/\.(?=\d{3})/g, '')
    .replace(',', '.')
  const value = parseFloat(cleaned)
  if (isNaN(value) || value <= 0) return 0
  return Math.round(value * 100)
}

const NEW_CATEGORY_SENTINEL = '__new_category__'

const WEEK_FIELDS = ['week1', 'week2', 'week3', 'week4'] as const

export function PlanItemSheet({
  open,
  onClose,
  month,
  categories: initialCategories,
  item,
}: PlanItemSheetProps) {
  const isEditing = !!item
  const [isPending, startTransition] = useTransition()

  const [categories, setCategories] = useState<Category[]>(initialCategories)
  useEffect(() => setCategories(initialCategories), [initialCategories])

  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryError, setNewCategoryError] = useState('')
  const [isCreatingCategory, startCategoryTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<PlanItemFormData>({
    resolver: zodResolver(planItemSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      valuePerCents: 0,
      week1: false,
      week2: false,
      week3: false,
      week4: false,
    },
  })

  useEffect(() => {
    if (open) {
      setShowNewCategoryInput(false)
      setNewCategoryName('')
      setNewCategoryError('')
      if (item) {
        reset({
          name: item.name,
          categoryId: item.categoryId,
          valuePerCents: item.valuePerCents,
          week1: item.week1,
          week2: item.week2,
          week3: item.week3,
          week4: item.week4,
        })
      } else {
        reset({
          name: '',
          categoryId: '',
          valuePerCents: 0,
          week1: false,
          week2: false,
          week3: false,
          week4: false,
        })
      }
    }
  }, [open, item, reset])

  const watchedCategoryId = watch('categoryId')
  const watchedValue = watch('valuePerCents')
  const valuePreview = watchedValue > 0 ? formatBRL(watchedValue) : null

  function handleCategoryChange(value: string) {
    if (value === NEW_CATEGORY_SENTINEL) {
      setShowNewCategoryInput(true)
      return
    }
    setShowNewCategoryInput(false)
    setValue('categoryId', value, { shouldValidate: true })
    clearErrors('categoryId')
  }

  function handleAddCategory() {
    if (!newCategoryName.trim()) {
      setNewCategoryError('Digite um nome para a categoria.')
      return
    }
    setNewCategoryError('')
    startCategoryTransition(async () => {
      const result = await createCategoryAction(null, {
        name: newCategoryName.trim(),
        empresaId: null, // Casa
        kind: null,
      })
      if (result.success && result.categoryId) {
        const newCat: Category = {
          id: result.categoryId,
          name: newCategoryName.trim(),
          empresaId: null,
          kind: null,
          userId: '',
          isDefault: false,
          createdAt: new Date(),
        }
        setCategories((prev) => [...prev, newCat])
        setValue('categoryId', result.categoryId, { shouldValidate: true })
        clearErrors('categoryId')
        setShowNewCategoryInput(false)
        setNewCategoryName('')
      } else {
        setNewCategoryError(result.error ?? 'Erro ao criar categoria.')
      }
    })
  }

  function onSubmit(data: PlanItemFormData) {
    startTransition(async () => {
      const result =
        isEditing && item
          ? await updatePlanItemAction({ ...data, id: item.id })
          : await createPlanItemAction(data, month)

      if (result.success) {
        onClose()
        reset()
      } else {
        setError('root', { message: result.error ?? 'Erro desconhecido.' })
      }
    })
  }

  const formBody = (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 pb-6"
      noValidate
    >
      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-sm font-medium text-text-primary">
          Nome
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Ex.: Mercado semanal"
          maxLength={120}
          className="min-h-[44px]"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Grupo */}
      <div className="space-y-1.5">
        <Label
          htmlFor="categoryId"
          className="text-sm font-medium text-text-primary"
        >
          Grupo
        </Label>
        <Select
          value={watchedCategoryId || undefined}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger id="categoryId" className="min-h-[44px]">
            <SelectValue placeholder="Selecione um grupo" />
          </SelectTrigger>
          <SelectContent>
            {categories.length === 0 ? (
              <SelectItem value="_empty" disabled>
                Nenhum grupo disponível
              </SelectItem>
            ) : (
              categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))
            )}
            <SelectSeparator />
            <SelectItem value={NEW_CATEGORY_SENTINEL}>
              + Nova categoria…
            </SelectItem>
          </SelectContent>
        </Select>

        {showNewCategoryInput && (
          <div className="mt-2 space-y-2">
            <Input
              type="text"
              placeholder="Nome da nova categoria"
              maxLength={50}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCategory()
                }
              }}
              className="min-h-[44px]"
              autoFocus
            />
            {newCategoryError && (
              <p className="text-sm text-destructive" role="alert">
                {newCategoryError}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] w-full"
              onClick={handleAddCategory}
              disabled={isCreatingCategory}
              aria-busy={isCreatingCategory}
            >
              {isCreatingCategory ? 'Adicionando…' : 'Adicionar'}
            </Button>
          </div>
        )}

        {errors.categoryId && (
          <p className="text-sm text-destructive" role="alert">
            {errors.categoryId.message}
          </p>
        )}
      </div>

      {/* Valor por vez */}
      <div className="space-y-1.5">
        <Label
          htmlFor="valueInput"
          className="text-sm font-medium text-text-primary"
        >
          Valor por vez
        </Label>
        <Input
          id="valueInput"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          className="min-h-[44px] font-mono"
          defaultValue=""
          onChange={(e) => {
            const cents = parseBRLInput(e.target.value)
            setValue('valuePerCents', cents, { shouldValidate: true })
          }}
        />
        {valuePreview && (
          <p className="text-sm font-mono text-text-secondary">{valuePreview}</p>
        )}
        {errors.valuePerCents && (
          <p className="text-sm text-destructive" role="alert">
            {errors.valuePerCents.message}
          </p>
        )}
      </div>

      {/* Em quais semanas? (4 week checkboxes — D-01) */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-text-primary mb-1">
          Em quais semanas?
        </legend>
        <div className="flex gap-2">
          {WEEK_FIELDS.map((field, idx) => (
            <Controller
              key={field}
              name={field}
              control={control}
              render={({ field: f }) => (
                <label
                  className={cn(
                    'flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors',
                    f.value
                      ? 'bg-casa-light text-casa border-casa'
                      : 'bg-card text-text-secondary border-border hover:bg-bg'
                  )}
                >
                  <Checkbox
                    checked={f.value}
                    onCheckedChange={(c) => {
                      f.onChange(c === true)
                      clearErrors('week1')
                    }}
                    aria-label={`Semana ${idx + 1}`}
                  />
                  {idx + 1}
                </label>
              )}
            />
          ))}
        </div>
        {errors.week1 && (
          <p className="text-sm text-destructive" role="alert">
            {errors.week1.message}
          </p>
        )}
      </fieldset>

      {errors.root && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="w-full min-h-[44px]"
      >
        {isPending ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Salvar'}
      </Button>
    </form>
  )

  const title = isEditing ? 'Editar item do plano' : 'Novo item do plano'

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isPending) onClose()
      }}
    >
      {/* Mobile: bottom */}
      <SheetContent
        side="bottom"
        className="lg:hidden max-h-[90vh] overflow-y-auto rounded-t-2xl"
      >
        <SheetHeader className="mb-6">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {formBody}
      </SheetContent>

      {/* Desktop: right */}
      <SheetContent
        side="right"
        className="hidden lg:flex flex-col w-[420px] overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {formBody}
      </SheetContent>
    </Sheet>
  )
}
