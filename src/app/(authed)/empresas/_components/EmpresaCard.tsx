'use client'
// src/app/(authed)/empresas/_components/EmpresaCard.tsx
// Cartão de empresa (UI-SPEC §2): swatch 12px + nome + pill de tipo na cor da
// empresa + ações Pencil/Trash2 (≥44px) + micro-link "Gerenciar categorias".
// Gerencia o EmpresaSheet (edição), o DeleteEmpresaDialog e o Sheet de
// categorias. O conteúdo das categorias é injetado via `categoriasSlot`
// (EmpresaCategoriesSection, criado no Plano 04-03 Task 3) para manter os
// commits atômicos.
import { useState } from 'react'
import { Pencil, Trash2, Settings2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { corDescriptor, EMPRESA_TIPO_LABEL } from '@/lib/empresa-cores'
import { EmpresaSheet, type ExistingEmpresa } from './EmpresaSheet'
import { DeleteEmpresaDialog } from './DeleteEmpresaDialog'

export interface EmpresaCardData extends ExistingEmpresa {
  lancamentoCount: number
}

interface EmpresaCardProps {
  empresa: EmpresaCardData
  /** Conteúdo da gestão de categorias (EmpresaCategoriesSection). */
  categoriasSlot?: React.ReactNode
}

export function EmpresaCard({ empresa, categoriasSlot }: EmpresaCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)

  const cor = corDescriptor(empresa.cor)
  const tipoLabel = EMPRESA_TIPO_LABEL[empresa.tipo] ?? empresa.tipo

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-bg/60">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={['h-3 w-3 rounded-full', cor.bg].join(' ')}
          />
          <span className="text-base font-semibold text-text-primary">{empresa.nome}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px] text-text-secondary hover:text-text-primary"
            onClick={() => setEditOpen(true)}
            aria-label="Editar empresa"
          >
            <Pencil size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px] text-red-600 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
            aria-label="Excluir empresa"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div>
        <span
          className={[
            'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
            cor.bgLight,
            cor.text,
          ].join(' ')}
        >
          {tipoLabel}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setCatOpen(true)}
        className={['inline-flex items-center gap-1 text-sm', cor.text].join(' ')}
      >
        <Settings2 size={14} aria-hidden="true" />
        Gerenciar categorias
      </button>

      {/* Edição */}
      <EmpresaSheet open={editOpen} onClose={() => setEditOpen(false)} empresa={empresa} />

      {/* Exclusão (Caso A/B decidido pela contagem) */}
      <DeleteEmpresaDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        empresa={{ id: empresa.id, nome: empresa.nome, lancamentoCount: empresa.lancamentoCount }}
      />

      {/* Categorias da empresa */}
      <Sheet open={catOpen} onOpenChange={(isOpen) => { if (!isOpen) setCatOpen(false) }}>
        <SheetContent side="bottom" className="lg:hidden max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="mb-6"><SheetTitle>Categorias da empresa</SheetTitle></SheetHeader>
          {categoriasSlot}
        </SheetContent>
        <SheetContent side="right" className="hidden lg:flex flex-col w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6"><SheetTitle>Categorias da empresa</SheetTitle></SheetHeader>
          {categoriasSlot}
        </SheetContent>
      </Sheet>
    </div>
  )
}
