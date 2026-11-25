'use client'
// src/app/(authed)/empresas/_components/EmpresaCategoriesSection.tsx
// Gestão de categorias por empresa (UI-SPEC §3). Reaproveita o padrão
// renderCategoryRow do ManageCategoriesSheet (edição inline Enter/Escape,
// Pencil/Trash2 >=44px, badge "Padrão" para isDefault, erro inline role=alert).
// Em vez de Casa/Empresa, mostra DOIS grupos — "Receitas" e "Custos" — filtrando
// por kind, com "+ Nova categoria" por grupo (passa empresaId + kind ao criar).
import { useState, useTransition } from 'react'
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '../../lancamentos/_lib/actions'
import { corDescriptor } from '@/lib/empresa-cores'

type Kind = 'RECEITA' | 'CUSTO'

export interface EmpresaCategoria {
  id: string
  name: string
  kind: Kind | null
  isDefault: boolean
}

interface EmpresaCategoriesSectionProps {
  empresaId: string
  cor: string
  categorias: EmpresaCategoria[]
}

export function EmpresaCategoriesSection({
  empresaId,
  cor,
  categorias,
}: EmpresaCategoriesSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Estado de criação por grupo (kind).
  const [addingKind, setAddingKind] = useState<Kind | null>(null)
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState('')

  const accent = corDescriptor(cor)

  const receitas = categorias.filter((c) => c.kind === 'RECEITA')
  const custos = categorias.filter((c) => c.kind === 'CUSTO')

  function startEdit(cat: EmpresaCategoria) {
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

  function startAdd(kind: Kind) {
    setAddingKind(kind)
    setNewName('')
    setAddError('')
  }

  function confirmAdd(kind: Kind) {
    if (!newName.trim()) {
      setAddError('Nome não pode ser vazio.')
      return
    }
    startTransition(async () => {
      const result = await createCategoryAction(null, {
        name: newName.trim(),
        empresaId,
        kind,
      })
      if (result.success) {
        setAddingKind(null)
        setNewName('')
        setAddError('')
      } else {
        setAddError(result.error ?? 'Erro ao criar.')
      }
    })
  }

  function renderCategoryRow(cat: EmpresaCategoria) {
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
                className={['min-h-[44px] min-w-[44px]', accent.text].join(' ')}
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
                <span className="rounded-full border border-border bg-bg px-2 py-0.5 text-xs text-text-secondary">
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
        {error && (
          <p className="text-xs text-destructive" role="alert">{error}</p>
        )}
      </div>
    )
  }

  function renderGroup(title: string, kind: Kind, items: EmpresaCategoria[]) {
    const isAddingThis = addingKind === kind
    return (
      <div className="space-y-1">
        <h3 className="border-b border-border pb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {title}
        </h3>
        {items.length === 0 && !isAddingThis ? (
          <p className="py-2 text-sm text-text-secondary">Nenhuma categoria aqui ainda.</p>
        ) : (
          <div className="divide-y divide-border">{items.map(renderCategoryRow)}</div>
        )}

        {isAddingThis ? (
          <div className="space-y-1 pt-2">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); confirmAdd(kind) }
                  if (e.key === 'Escape') { setAddingKind(null); setNewName(''); setAddError('') }
                }}
                placeholder="Nome da categoria"
                className="flex-1 min-h-[44px] text-sm"
                maxLength={50}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={['min-h-[44px] min-w-[44px]', accent.text].join(' ')}
                onClick={() => confirmAdd(kind)}
                disabled={isPending}
                aria-label="Confirmar nova categoria"
              >
                <Check size={16} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px] text-text-secondary"
                onClick={() => { setAddingKind(null); setNewName(''); setAddError('') }}
                aria-label="Cancelar nova categoria"
              >
                <X size={16} />
              </Button>
            </div>
            {addError && (
              <p className="text-xs text-destructive" role="alert">{addError}</p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => startAdd(kind)}
            className={['inline-flex min-h-[44px] items-center gap-1 text-sm', accent.text].join(' ')}
          >
            <Plus size={14} aria-hidden="true" />
            + Nova categoria
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      <p className="text-sm text-text-secondary">
        Receitas e custos usados nos lançamentos desta empresa.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {renderGroup('Receitas', 'RECEITA', receitas)}
        {renderGroup('Custos', 'CUSTO', custos)}
      </div>
    </div>
  )
}
