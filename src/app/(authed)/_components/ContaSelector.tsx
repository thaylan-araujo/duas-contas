'use client'
// src/app/(authed)/_components/ContaSelector.tsx
// Seletor global "Casa + empresas" (D-06 / UI-SPEC §1). Dropdown shadcn que troca
// o contexto ativo (store) e sincroniza o searchParam `empresaId` da URL para que
// as páginas (Server Components) filtrem por ele. Recebe a LISTA de empresas como
// prop do shell — o store só guarda o contexto ativo, não a lista.
import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Check, ChevronDown, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useContaStore, empresaIdDoContexto, type ContaAtiva } from '@/store/conta'
import { corDescriptor, EMPRESA_TIPO_LABEL } from '@/lib/empresa-cores'
import { cn } from '@/lib/utils'

export interface ContaSelectorEmpresa {
  id: string
  nome: string
  tipo: string
  cor: string
}

interface ContaSelectorProps {
  empresas: ContaSelectorEmpresa[]
}

export function ContaSelector({ empresas }: ContaSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { contaAtiva, setContaAtiva } = useContaStore()

  // Fallback (UI-SPEC §4 / T-04-12): se o contexto ativo aponta para uma empresa
  // que não existe mais (excluída), volta para Casa automaticamente.
  useEffect(() => {
    if (
      contaAtiva.tipo === 'EMPRESA' &&
      !empresas.some((e) => e.id === contaAtiva.empresaId)
    ) {
      setContaAtiva({ tipo: 'CASA' })
    }
  }, [contaAtiva, empresas, setContaAtiva])

  // Resolve o descritor visual do contexto ativo (Casa ou empresa).
  const empresaAtiva =
    contaAtiva.tipo === 'EMPRESA'
      ? empresas.find((e) => e.id === contaAtiva.empresaId)
      : undefined

  const nomeAtivo = empresaAtiva ? empresaAtiva.nome : 'Casa'
  const swatchAtivo = empresaAtiva
    ? corDescriptor(empresaAtiva.cor).bg
    : 'bg-casa'

  // Troca de contexto: escreve no store E sincroniza o searchParam `empresaId` da
  // URL (padrão herdado do AccountFilterToggle — router.push). Casa = sem param.
  function selecionar(conta: ContaAtiva) {
    setContaAtiva(conta)
    const params = new URLSearchParams(searchParams.toString())
    const empresaId = empresaIdDoContexto(conta)
    if (empresaId) {
      params.set('empresaId', empresaId)
    } else {
      params.delete('empresaId')
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const casaAtiva = contaAtiva.tipo === 'CASA'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Conta ativa: ${nomeAtivo}. Trocar de conta.`}
          className="group flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg/60"
        >
          <span
            aria-hidden="true"
            className={cn('h-3 w-3 shrink-0 rounded-full', swatchAtivo)}
          />
          <span className="truncate">{nomeAtivo}</span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="shrink-0 transition-transform group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-56 rounded-xl border border-border bg-card p-1 shadow-md"
      >
        {/* Item Casa */}
        <DropdownMenuItem
          onSelect={() => selecionar({ tipo: 'CASA' })}
          aria-current={casaAtiva ? 'true' : undefined}
          className={cn(
            'min-h-[44px] gap-2 rounded-lg hover:bg-bg/60',
            casaAtiva && 'bg-casa-light text-casa'
          )}
        >
          <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-casa" />
          <span className="flex-1">Casa</span>
          {casaAtiva && <Check size={16} aria-hidden="true" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Um item por empresa, em ordem de criação */}
        {empresas.length === 0 ? (
          <p className="px-2 py-2 text-sm text-text-secondary">
            Nenhuma empresa ainda. Crie a primeira em Gerenciar empresas.
          </p>
        ) : (
          empresas.map((empresa) => {
            const ativa =
              contaAtiva.tipo === 'EMPRESA' &&
              contaAtiva.empresaId === empresa.id
            const cores = corDescriptor(empresa.cor)
            const tipoLabel = EMPRESA_TIPO_LABEL[empresa.tipo] ?? empresa.tipo
            return (
              <DropdownMenuItem
                key={empresa.id}
                onSelect={() =>
                  selecionar({ tipo: 'EMPRESA', empresaId: empresa.id })
                }
                aria-current={ativa ? 'true' : undefined}
                className={cn(
                  'min-h-[44px] gap-2 rounded-lg hover:bg-bg/60',
                  ativa && cn(cores.bgLight, cores.text)
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn('h-3 w-3 shrink-0 rounded-full', cores.bg)}
                />
                <span className="flex-1 truncate">{empresa.nome}</span>
                <span className="text-xs text-text-secondary">{tipoLabel}</span>
                {ativa && <Check size={16} aria-hidden="true" />}
              </DropdownMenuItem>
            )
          })
        )}

        <DropdownMenuSeparator />

        {/* Ação de rodapé — navega para o CRUD de empresas */}
        <DropdownMenuItem
          onSelect={() => router.push('/empresas')}
          className="min-h-[44px] gap-2 rounded-lg text-text-primary hover:bg-bg/60"
        >
          <Settings size={16} aria-hidden="true" />
          <span>Gerenciar empresas</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
