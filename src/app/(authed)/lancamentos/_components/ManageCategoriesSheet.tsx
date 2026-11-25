'use client'
// src/app/(authed)/lancamentos/_components/ManageCategoriesSheet.tsx
import { useState, useTransition } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateCategoryAction, deleteCategoryAction } from '../_lib/actions'
import type { Category } from '@prisma/client'

interface ManageCategoriesSheetProps {
  categories: Category[]
  open: boolean
  onClose: () => void
}

export function ManageCategoriesSheet({
  categories,
  open,
  onClose,
}: ManageCategoriesSheetProps) {
  // Track which category is being edited inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  // Inline error messages per category id
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const casaCategories = categories.filter((c) => c.empresaId === null)
  const empresaCategories = categories.filter((c) => c.empresaId !== null)

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setErrors((prev) => ({ ...prev, [cat.id]: '' }))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
  }

  function confirmEdit(id: string) {
    if (!editName.trim()) {
      setErrors((prev) => ({ ...prev, [id]: 'Nome não pode ser vazio.' }))
      return
    }

    startTransition(async () => {
      const result = await updateCategoryAction(null, { id, name: editName.trim() })
      if (result.success) {
        setEditingId(null)
        setEditName('')
        setErrors((prev) => ({ ...prev, [id]: '' }))
      } else {
        setErrors((prev) => ({ ...prev, [id]: result.error ?? 'Erro ao atualizar.' }))
      }
    })
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    setErrors((prev) => ({ ...prev, [id]: '' }))

    startTransition(async () => {
      const result = await deleteCategoryAction(id)
      setDeletingId(null)
      if (!result.success) {
        setErrors((prev) => ({ ...prev, [id]: result.error ?? 'Erro ao excluir.' }))
      }
    })
  }

  function renderCategoryRow(cat: Category) {
    const isEditingThis = editingId === cat.id
    const isDeletingThis = deletingId === cat.id
    const error = errors[cat.id]

    return (
      <div key={cat.id} className="space-y-1">
        <div className="flex items-center gap-2 py-2">
          {isEditingThis ? (
            <>
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); confirmEdit(cat.id) }
                  if (e.key === 'Escape') cancelEdit()
                }}
                className="flex-1 min-h-[44px] text-sm"
                maxLength={50}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px] text-positive"
                onClick={() => confirmEdit(cat.id)}
                disabled={isPending}
                aria-label="Confirmar edição"
              >
                <Check size={16} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px] text-text-secondary"
                onClick={cancelEdit}
                aria-label="Cancelar edição"
              >
                <X size={16} />
              </Button>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm text-text-primary">{cat.name}</span>
              {cat.isDefault ? (
                <span className="text-xs bg-bg text-text-secondary px-2 py-0.5 rounded-full border border-border">
                  Padrão
                </span>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="min-h-[44px] min-w-[44px] text-text-secondary hover:text-text-primary"
                    onClick={() => startEdit(cat)}
                    disabled={isPending || isDeletingThis}
                    aria-label={`Editar ${cat.name}`}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                    onClick={() => handleDelete(cat.id)}
                    disabled={isPending || isDeletingThis}
                    aria-label={`Excluir ${cat.name}`}
                    aria-busy={isDeletingThis}
                  >
                    <Trash2 size={16} className={isDeletingThis ? 'opacity-50' : ''} />
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Inline error — shown below the row (D-08: no Dialog, error inline) */}
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  const content = (
    <div className="space-y-6 pb-6">
      {/* Casa */}
      <div className="space-y-1">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide pb-1 border-b border-border">
          Casa
        </h2>
        {casaCategories.length === 0 ? (
          <p className="text-sm text-text-secondary py-2">
            Nenhuma categoria para Casa.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {casaCategories.map(renderCategoryRow)}
          </div>
        )}
      </div>

      {/* Empresa */}
      <div className="space-y-1">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide pb-1 border-b border-border">
          Empresa
        </h2>
        {empresaCategories.length === 0 ? (
          <p className="text-sm text-text-secondary py-2">
            Nenhuma categoria para Empresa.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {empresaCategories.map(renderCategoryRow)}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      {/* Mobile: bottom sheet */}
      <SheetContent
        side="bottom"
        className="lg:hidden max-h-[90vh] overflow-y-auto rounded-t-2xl"
      >
        <SheetHeader className="mb-6">
          <SheetTitle>Gerenciar categorias</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>

      {/* Desktop: right sheet */}
      <SheetContent
        side="right"
        className="hidden lg:flex flex-col w-[420px] overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle>Gerenciar categorias</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  )
}
