'use client'
// src/app/(authed)/empresas/_components/EmpresaSheet.tsx
// Sheet criar/editar empresa — copia a estrutura de FixedAccountSheet
// (useForm+zodResolver+useTransition, isEditing, reset no open, duplo
// SheetContent bottom/right w-[420px]). Campos: Nome, Tipo (Select), Cor
// (ColorPicker via Controller). SEM CNPJ (D-03).
import { useEffect, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { empresaSchema, type EmpresaFormData } from '../_lib/schema'
import { createEmpresaAction, updateEmpresaAction } from '../_lib/actions'
import { EMPRESA_TIPO_OPTIONS, type EmpresaCorKey } from '@/lib/empresa-cores'
import { ColorPicker } from './ColorPicker'

export interface ExistingEmpresa {
  id: string
  nome: string
  tipo: EmpresaFormData['tipo']
  cor: string
}

interface EmpresaSheetProps {
  open: boolean
  onClose: () => void
  empresa?: ExistingEmpresa
}

export function EmpresaSheet({ open, onClose, empresa }: EmpresaSheetProps) {
  const isEditing = !!empresa
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    setError,
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: { nome: '', tipo: 'GENERICO', cor: 'laranja' },
  })

  useEffect(() => {
    if (open) {
      if (empresa) {
        reset({
          nome: empresa.nome,
          tipo: empresa.tipo,
          cor: empresa.cor as EmpresaFormData['cor'],
        })
      } else {
        reset({ nome: '', tipo: 'GENERICO', cor: 'laranja' })
      }
    }
  }, [open, empresa, reset])

  function onSubmit(data: EmpresaFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateEmpresaAction(null, { ...data, id: empresa!.id })
        : await createEmpresaAction(null, data)
      if (result.success) {
        onClose()
        reset()
      } else {
        setError('root', { message: result.error ?? 'Erro desconhecido.' })
      }
    })
  }

  const title = isEditing ? 'Editar empresa' : 'Nova empresa'

  const formBody = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-6" noValidate>
      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="emp-nome" className="text-sm font-medium text-text-primary">
          Nome
        </Label>
        <Input
          id="emp-nome"
          type="text"
          placeholder="Ex.: Achadinhos"
          maxLength={60}
          className="min-h-[44px]"
          {...register('nome')}
        />
        {errors.nome && (
          <p className="text-sm text-destructive" role="alert">{errors.nome.message}</p>
        )}
      </div>

      {/* Tipo */}
      <div className="space-y-1.5">
        <Label htmlFor="emp-tipo" className="text-sm font-medium text-text-primary">
          Tipo
        </Label>
        <Controller
          name="tipo"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="emp-tipo" className="min-h-[44px]">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {EMPRESA_TIPO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p className="text-sm text-text-secondary">
          O tipo define as categorias iniciais da empresa.
        </p>
        {errors.tipo && (
          <p className="text-sm text-destructive" role="alert">{errors.tipo.message}</p>
        )}
      </div>

      {/* Cor */}
      <div className="space-y-1.5">
        <Label id="empresa-cor-label" className="text-sm font-medium text-text-primary">
          Cor
        </Label>
        <Controller
          name="cor"
          control={control}
          render={({ field }) => (
            <ColorPicker
              value={field.value as EmpresaCorKey}
              onChange={field.onChange}
            />
          )}
        />
        {errors.cor && (
          <p className="text-sm text-destructive" role="alert">{errors.cor.message}</p>
        )}
      </div>

      {errors.root && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" disabled={isPending} aria-busy={isPending} className="w-full min-h-[44px]">
        {isPending ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Salvar empresa'}
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
