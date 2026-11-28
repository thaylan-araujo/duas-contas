'use client'
// src/app/(authed)/_components/Sidebar.tsx
// Client Component — needs usePathname for active link state
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useContaStore, empresaIdDoContexto } from '@/store/conta'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  TrendingUp,
  CreditCard,
  Layers,
  Calendar,
  FileText,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  group: 'ungrouped' | 'Casa' | 'Empresa' | 'Geral'
  // 'shared' aparece sempre; 'casa'/'empresa' só no contexto correspondente.
  context: 'shared' | 'casa' | 'empresa'
}

const navItems: NavItem[] = [
  // Ungrouped — servem aos dois contextos
  { label: 'Visão geral', href: '/visao-geral', icon: LayoutDashboard, group: 'ungrouped', context: 'shared' },
  { label: 'Lançamentos', href: '/lancamentos', icon: ArrowLeftRight, group: 'ungrouped', context: 'shared' },
  // Casa (só no contexto Casa)
  { label: 'Metas', href: '/metas', icon: Target, group: 'Casa', context: 'casa' },
  // Empresa (só no contexto de uma empresa)
  { label: 'Canais e caixa', href: '/canais', icon: TrendingUp, group: 'Empresa', context: 'empresa' },
  { label: 'Consolidado', href: '/consolidado', icon: Layers, group: 'Empresa', context: 'empresa' },
  { label: 'Dívidas', href: '/dividas', icon: CreditCard, group: 'Empresa', context: 'empresa' },
  // Geral — servem aos dois
  { label: 'Calendário', href: '/calendario', icon: Calendar, group: 'Geral', context: 'shared' },
  { label: 'Relatório mensal', href: '/relatorio', icon: FileText, group: 'Geral', context: 'shared' },
]

function isEmpresaRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/canais') ||
    pathname.startsWith('/consolidado') ||
    pathname.startsWith('/dividas')
  )
}

export function Sidebar() {
  const pathname = usePathname()
  // Propaga o empresaId da empresa ativa para os links do menu, para o contexto
  // não se perder ao navegar (Casa = sem param).
  const contaAtiva = useContaStore((s) => s.contaAtiva)
  const empresaId = empresaIdDoContexto(contaAtiva)
  const hrefWith = (href: string) =>
    empresaId ? `${href}?empresaId=${empresaId}` : href
  // Mostra um item conforme o contexto ativo: 'shared' sempre; 'casa' só na Casa;
  // 'empresa' só quando uma empresa está selecionada.
  const showInContext = (item: NavItem) =>
    item.context === 'shared' ||
    (item.context === 'casa' && !empresaId) ||
    (item.context === 'empresa' && !!empresaId)

  function getItemClasses(href: string): string {
    const isActive = pathname.startsWith(href)
    if (!isActive) {
      return 'flex items-center gap-3 min-h-[44px] px-4 rounded-lg text-text-primary hover:bg-bg transition-colors'
    }
    if (isEmpresaRoute(href)) {
      return 'flex items-center gap-3 min-h-[44px] px-4 rounded-lg bg-empresa-light text-empresa transition-colors'
    }
    return 'flex items-center gap-3 min-h-[44px] px-4 rounded-lg bg-casa-light text-casa transition-colors'
  }

  const ungroupedItems = navItems.filter((i) => i.group === 'ungrouped' && showInContext(i))
  const casaItems = navItems.filter((i) => i.group === 'Casa' && showInContext(i))
  const empresaItems = navItems.filter((i) => i.group === 'Empresa' && showInContext(i))
  const geralItems = navItems.filter((i) => i.group === 'Geral' && showInContext(i))

  function renderItem(item: NavItem) {
    const isActive = pathname.startsWith(item.href)
    return (
      <Link
        key={item.href}
        href={hrefWith(item.href)}
        className={getItemClasses(item.href)}
        aria-current={isActive ? 'page' : undefined}
      >
        <item.icon size={20} aria-hidden="true" />
        <span className="text-base">{item.label}</span>
      </Link>
    )
  }

  return (
    <nav
      className="hidden lg:flex flex-col w-60 bg-card border-r border-border h-screen sticky top-0 overflow-y-auto shrink-0"
      aria-label="Navegação principal"
    >
      {/* App name */}
      <div className="px-4 py-5 border-b border-border">
        <span className="text-base font-semibold text-text-primary">Duas Contas</span>
      </div>

      <div className="flex flex-col gap-1 p-2 flex-1">
        {/* Ungrouped — Visão geral */}
        {ungroupedItems.map(renderItem)}

        {/* Casa group — só no contexto Casa */}
        {casaItems.length > 0 && (
          <div className="mt-3">
            <p className="px-4 py-1 text-xs text-text-secondary uppercase tracking-wide font-medium">
              Casa
            </p>
            {casaItems.map(renderItem)}
          </div>
        )}

        {/* Empresa group — só no contexto de uma empresa */}
        {empresaItems.length > 0 && (
          <div className="mt-3">
            <p className="px-4 py-1 text-xs text-text-secondary uppercase tracking-wide font-medium">
              Empresa
            </p>
            {empresaItems.map(renderItem)}
          </div>
        )}

        {/* Geral group */}
        <div className="mt-3">
          <p className="px-4 py-1 text-xs text-text-secondary uppercase tracking-wide font-medium">
            Geral
          </p>
          {geralItems.map(renderItem)}
        </div>
      </div>
    </nav>
  )
}
