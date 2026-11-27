'use client'
// src/app/(authed)/lancamentos/_components/TransactionSheet.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select'
import { formatBRL } from '@/lib/format'
import {
  transactionSchema,
  type TransactionFormData,
  type TransactionFormInput,
  type ProLaboreFormData,
} from '../_lib/schema'
import {
  createTransactionAction,
  updateTransactionAction,
  createProLaboreAction,
  deleteProLaboreAction,
  createCategoryAction,
} from '../_lib/actions'
import { cn } from '@/lib/utils'
import type { Category } from '@prisma/client'

interface ExistingTransaction {
  id: string
  date: Date
  description: string
  amountCents: number
  type: 'ENTRADA' | 'SAIDA'
  empresaId: string | null // null = Casa
  categoryId: string
  notes?: string | null
  pairId: string | null
}

interface TransactionSheetProps {
  open: boolean
  onClose: () => void
  transaction?: ExistingTransaction
  categories: Category[]
  // empresaId do contexto ativo (null = Casa). Nesta fatia (04-02) o default é a
  // Casa; o Plano 04-04 liga o contexto real de empresa selecionada.
  empresaIdContexto?: string | null
}

function formatDateInput(date: Date): string {
  const d = new Date(date)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function parseBRLInput(raw: string): number {
  const cleaned = raw
    .replace(/[^\d,\.]/g, '')
    .replace(/\.(?=\d{3})/g, '')
    .replace(',', '.')
  const value = parseFloat(cleaned)
  if (isNaN(value) || value <= 0) return 0
  return Math.round(value * 100)
}

// Sentinel value used in the Tipo Select to trigger pró-labore mode
const PRO_LABORE_SENTINEL = 'PRO_LABORE'
// Sentinel value for inline category creation
const NEW_CATEGORY_SENTINEL = '__new_category__'

export function TransactionSheet({
  open,
  onClose,
  transaction,
  categories: initialCategories,
  empresaIdContexto = null,
}: TransactionSheetProps) {
  const isEditing = !!transaction
  const isPaired = transaction?.pairId !== null && transaction?.pairId !== undefined

  const [isPending, startTransition] = useTransition()

  // Local categories state — grows when user creates inline categories
  const [categories, setCategories] = useState<Category[]>(initialCategories)

  // Sync categories when prop changes (e.g. page re-renders after revalidatePath)
  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  // Pró-labore mode: when tipo Select = PRO_LABORE_SENTINEL
  const [isProLabore, setIsProLabore] = useState(false)

  // Inline category creation state
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
  } = useForm<TransactionFormInput, unknown, TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      description: '',
      amountCents: 0,
      type: 'SAIDA',
      empresaId: empresaIdContexto,
      categoryId: '',
      notes: '',
      status: 'PAGO',
      dueDate: '',
    },
  })

  // Pre-fill form when editing
  useEffect(() => {
    if (open) {
      setIsProLabore(false)
      setShowNewCategoryInput(false)
      setNewCategoryName('')
      setNewCategoryError('')

      if (transaction) {
        reset({
          date: formatDateInput(transaction.date),
          description: transaction.description,
          amountCents: transaction.amountCents,
          type: transaction.type,
          empresaId: transaction.empresaId,
          categoryId: transaction.categoryId,
          notes: transaction.notes ?? '',
        })
      } else {
        reset({
          date: new Date().toISOString().slice(0, 10),
          description: '',
          amountCents: 0,
          type: 'SAIDA',
          empresaId: empresaIdContexto,
          categoryId: '',
          notes: '',
        })
      }
    }
  }, [open, transaction, reset, empresaIdContexto])

  const watchedType = watch('type')
  const watchedAmountCents = watch('amountCents')
  const watchedCategoryId = watch('categoryId')

  // Filter categories by the active context (empresaId null = Casa).
  const filteredCategories = categories.filter(
    (c) => c.empresaId === empresaIdContexto
  )

  // Format amount display for preview
  const amountPreview =
    watchedAmountCents > 0 ? formatBRL(watchedAmountCents) : null

  // Pró-labore multi-empresa (04c-02): habilitado quando o contexto ativo é uma
  // empresa (empresaIdContexto != null) — a empresa de origem É o contexto ativo.
  // No contexto Casa não há empresa de origem, então a opção fica desabilitada.
  function handleTipoChange(value: string) {
    if (value === PRO_LABORE_SENTINEL) {
      if (empresaIdContexto === null) {
        // Casa: sem empresa de origem — opção desabilitada, no-op defensivo.
        return
      }
      setIsProLabore(true)
      // Os campos Descrição e Categoria ficam ocultos no modo pró-labore, mas o
      // resolver (transactionSchema) os exige. Preenche valores sentinela para o
      // handleSubmit(onSubmit) disparar — o service ignora ambos no pró-labore
      // (descrição fixa "Pró-labore" + categoria resolvida via getOrCreate).
      setValue('description', 'Pró-labore', { shouldValidate: true })
      setValue('categoryId', '__pro_labore__', { shouldValidate: true })
      clearErrors(['description', 'categoryId'])
      return
    }
    setIsProLabore(false)
    setValue('type', value as 'ENTRADA' | 'SAIDA', { shouldValidate: false })
  }

  function handleCategoryChange(value: string) {
    if (value === NEW_CATEGORY_SENTINEL) {
      setShowNewCategoryInput(true)
      // Don't change categoryId — keep existing selection
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

    // Para empresa (empresaId != null) a categoria nasce com kind derivado do tipo
    // do lançamento: ENTRADA → RECEITA, SAIDA → CUSTO. Casa continua com kind null.
    const kind: 'RECEITA' | 'CUSTO' | null =
      empresaIdContexto === null
        ? null
        : watchedType === 'ENTRADA'
        ? 'RECEITA'
        : 'CUSTO'

    startCategoryTransition(async () => {
      const result = await createCategoryAction(null, {
        name: newCategoryName.trim(),
        empresaId: empresaIdContexto,
        kind,
      })

      if (result.success && result.categoryId) {
        const newCat: Category = {
          id: result.categoryId,
          name: newCategoryName.trim(),
          empresaId: empresaIdContexto,
          kind,
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

  function onSubmit(data: TransactionFormData) {
    if (isProLabore) {
      // A empresa de origem = o contexto ativo (garantido != null: a opção só é
      // selecionável no contexto de empresa). A categoria "Pró-labore" é resolvida
      // no service via getOrCreate, por isso não vai no payload.
      const proLaboreData: ProLaboreFormData = {
        date: data.date,
        amountCents: data.amountCents,
        origemEmpresaId: empresaIdContexto ?? '',
      }

      startTransition(async () => {
        const result = await createProLaboreAction(null, proLaboreData)
        if (result.success) {
          onClose()
          reset()
          setIsProLabore(false)
        } else {
          setError('root', { message: result.error ?? 'Erro desconhecido.' })
        }
      })
      return
    }

    startTransition(async () => {
      let result
      if (isEditing && transaction) {
        result = await updateTransactionAction(null, { ...data, id: transaction.id })
      } else {
        result = await createTransactionAction(null, data)
      }

      if (result.success) {
        onClose()
        reset()
      } else {
        setError('root', { message: result.error ?? 'Erro desconhecido.' })
      }
    })
  }

  // Read-only mode for paired (pró-labore) transactions
  if (isPaired && transaction) {
    function handleDeletePair() {
      if (!transaction?.pairId) return
      startTransition(async () => {
        await deleteProLaboreAction(transaction.pairId!)
        onClose()
      })
    }

    return (
      <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
        <SheetContent
          side="right"
          className="w-full lg:w-[420px] overflow-y-auto"
        >
          <SheetHeader className="mb-6">
            <SheetTitle>Editar lançamento</SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-bg border border-border p-4">
              <p className="text-sm text-text-secondary">
                Este lançamento faz parte de um pró-labore.
              </p>
            </div>

            <Button
              variant="destructive"
              className="w-full min-h-[44px]"
              onClick={handleDeletePair}
              disabled={isPending}
              aria-busy={isPending}
              type="button"
            >
              {isPending ? 'Excluindo…' : 'Excluir pró-labore'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // The displayed tipo value: when pró-labore is active, show PRO_LABORE_SENTINEL
  // otherwise show the actual type from the form
  const displayTipoValue = isProLabore ? PRO_LABORE_SENTINEL : watchedType

  const sharedFormProps = {
    isEditing,
    isProLabore,
    empresaIdContexto,
    isPending,
    handleSubmit,
    onSubmit,
    control,
    register,
    errors,
    watchedCategoryId,
    filteredCategories,
    amountPreview,
    setValue,
    clearErrors,
    onClose,
    displayTipoValue,
    handleTipoChange,
    handleCategoryChange,
    showNewCategoryInput,
    newCategoryName,
    setNewCategoryName,
    newCategoryError,
    isCreatingCategory,
    handleAddCategory,
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen && !isPending) onClose() }}>
      <SheetContent
        side="bottom"
        className="lg:hidden max-h-[90vh] overflow-y-auto rounded-t-2xl"
      >
        <SheetHeader className="mb-6">
          <SheetTitle>
            {isEditing ? 'Editar lançamento' : 'Novo lançamento'}
          </SheetTitle>
        </SheetHeader>
        <SheetFormContent {...sharedFormProps} />
      </SheetContent>

      {/* Desktop: side="right" */}
      <SheetContent
        side="right"
        className="hidden lg:flex flex-col w-[420px] overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle>
            {isEditing ? 'Editar lançamento' : 'Novo lançamento'}
          </SheetTitle>
        </SheetHeader>
        <SheetFormContent {...sharedFormProps} />
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Extracted form content (shared between mobile and desktop sides)
// ---------------------------------------------------------------------------
interface SheetFormContentProps {
  isEditing: boolean
  isProLabore: boolean
  empresaIdContexto: string | null
  isPending: boolean
  handleSubmit: ReturnType<
    typeof useForm<TransactionFormInput, unknown, TransactionFormData>
  >['handleSubmit']
  onSubmit: (data: TransactionFormData) => void
  control: ReturnType<
    typeof useForm<TransactionFormInput, unknown, TransactionFormData>
  >['control']
  register: ReturnType<
    typeof useForm<TransactionFormInput, unknown, TransactionFormData>
  >['register']
  errors: ReturnType<
    typeof useForm<TransactionFormInput, unknown, TransactionFormData>
  >['formState']['errors']
  watchedCategoryId: string
  filteredCategories: Category[]
  amountPreview: string | null
  setValue: ReturnType<
    typeof useForm<TransactionFormInput, unknown, TransactionFormData>
  >['setValue']
  clearErrors: ReturnType<
    typeof useForm<TransactionFormInput, unknown, TransactionFormData>
  >['clearErrors']
  onClose: () => void
  displayTipoValue: string
  handleTipoChange: (value: string) => void
  handleCategoryChange: (value: string) => void
  showNewCategoryInput: boolean
  newCategoryName: string
  setNewCategoryName: (name: string) => void
  newCategoryError: string
  isCreatingCategory: boolean
  handleAddCategory: () => void
}

function SheetFormContent({
  isEditing,
  isProLabore,
  empresaIdContexto,
  isPending,
  handleSubmit,
  onSubmit,
  control,
  register,
  errors,
  watchedCategoryId,
  filteredCategories,
  amountPreview,
  setValue,
  clearErrors,
  displayTipoValue,
  handleTipoChange,
  handleCategoryChange,
  showNewCategoryInput,
  newCategoryName,
  setNewCategoryName,
  newCategoryError,
  isCreatingCategory,
  handleAddCategory,
}: SheetFormContentProps) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-6" noValidate>

      {/* O contexto (Casa/empresa) vem do seletor global, não é escolhido aqui.
          O toggle Casa/Empresa foi removido nesta fatia (04-02). */}

      {/* Tipo — a opção Pró-labore é habilitada no contexto de empresa (04c-02) */}
      <div className="space-y-1.5">
        <Label htmlFor="type" className="text-sm font-medium text-text-primary">
          Tipo
        </Label>
        <Select
          value={displayTipoValue}
          onValueChange={handleTipoChange}
        >
          <SelectTrigger id="type" className="min-h-[44px]">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ENTRADA">Entrada</SelectItem>
            <SelectItem value="SAIDA">Saída</SelectItem>
            {/* Pró-labore: habilitado só no contexto de empresa (a origem é a
                empresa ativa). Na Casa não há empresa de origem → desabilitado. */}
            <SelectItem
              value={PRO_LABORE_SENTINEL}
              disabled={empresaIdContexto === null}
            >
              {empresaIdContexto === null
                ? 'Pró-labore (selecione uma empresa)'
                : 'Pró-labore (saída → Casa)'}
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-destructive" role="alert">{errors.type.message}</p>
        )}
      </div>

      {/* Data */}
      <div className="space-y-1.5">
        <Label htmlFor="date" className="text-sm font-medium text-text-primary">
          Data
        </Label>
        <Input
          id="date"
          type="date"
          className="min-h-[44px]"
          {...register('date')}
        />
        {errors.date && (
          <p className="text-sm text-destructive" role="alert">{errors.date.message}</p>
        )}
      </div>

      {/* Descrição — hidden in pró-labore mode (description is fixed "Pró-labore") */}
      {!isProLabore && (
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-sm font-medium text-text-primary">
            Descrição
          </Label>
          <Input
            id="description"
            type="text"
            placeholder="Ex.: Mercado"
            maxLength={120}
            className="min-h-[44px]"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-destructive" role="alert">{errors.description.message}</p>
          )}
        </div>
      )}

      {/* Valor */}
      <div className="space-y-1.5">
        <Label htmlFor="amountInput" className="text-sm font-medium text-text-primary">
          Valor
        </Label>
        <Input
          id="amountInput"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          className="min-h-[44px] font-mono"
          onChange={(e) => {
            const cents = parseBRLInput(e.target.value)
            setValue('amountCents', cents, { shouldValidate: true })
          }}
          defaultValue=""
        />
        {amountPreview && (
          <p className="text-sm font-mono text-text-secondary">{amountPreview}</p>
        )}
        {/* Helper text — pró-labore only */}
        {isProLabore && (
          <p className="text-xs text-text-secondary">
            Uma única operação cria os dois lançamentos atomicamente.
          </p>
        )}
        {errors.amountCents && (
          <p className="text-sm text-destructive" role="alert">{errors.amountCents.message}</p>
        )}
      </div>

      {/* Categoria — oculta no modo pró-labore (categoria fixa "Pró-labore",
          resolvida no service via getOrCreate; PL-02) */}
      {!isProLabore && (
      <div className="space-y-1.5">
        <Label htmlFor="categoryId" className="text-sm font-medium text-text-primary">
          Categoria
        </Label>
        <Select
          value={watchedCategoryId || undefined}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger id="categoryId" className="min-h-[44px]">
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.length === 0 ? (
              <SelectItem value="_empty" disabled>
                Nenhuma categoria para esta conta
              </SelectItem>
            ) : (
              filteredCategories.map((cat) => (
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

        {/* Inline new category input */}
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
              <p className="text-sm text-destructive" role="alert">{newCategoryError}</p>
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
          <p className="text-sm text-destructive" role="alert">{errors.categoryId.message}</p>
        )}
      </div>
      )}

      {/* Observação — hidden in pró-labore mode */}
      {!isProLabore && (
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-sm font-medium text-text-primary">
            Observação (opcional)
          </Label>
          <Input
            id="notes"
            type="text"
            placeholder="Opcional"
            maxLength={200}
            className="min-h-[44px]"
            {...register('notes')}
          />
          {errors.notes && (
            <p className="text-sm text-destructive" role="alert">{errors.notes.message}</p>
          )}
        </div>
      )}

      {/* Root error (server action error) */}
      {errors.root && (
        <p
          role="alert"
          aria-live="polite"
          className="text-sm text-destructive"
        >
          {errors.root.message}
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="w-full min-h-[44px]"
      >
        {isPending
          ? 'Salvando…'
          : isProLabore
          ? 'Registrar Pró-labore'
          : isEditing
          ? 'Salvar alterações'
          : 'Salvar lançamento'}
      </Button>
    </form>
  )
}
