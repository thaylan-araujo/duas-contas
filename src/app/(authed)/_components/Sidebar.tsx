'use client'
// src/app/(authed)/_components/Sidebar.tsx
// Client Component — needs usePathname for active link state
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowLeftRight,
  CalendarDays,
  Receipt,
  TrendingUp,
  CreditCard,
  Calendar,
  FileText,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  group: 'ungrouped' | 'Casa' | 'Empresa' | 'Geral'
}

const navItems: NavItem[] = [
  // Ungrouped
  { label: 'Visão geral', href: '/visao-geral', icon: LayoutDashboard, group: 'ungrouped' },
  // Casa
  { label: 'Lançamentos', href: '/lancamentos', icon: ArrowLeftRight, group: 'Casa' },
  { label: 'Planejamento e semanas', href: '/planejamento', icon: CalendarDays, group: 'Casa' },
  { label: 'Contas fixas e metas', href: '/contas-fixas', icon: Receipt, group: 'Casa' },
  // Empresa
  { label: 'Canais e caixa', href: '/canais', icon: TrendingUp, group: 'Empresa' },
  { label: 'Dívidas', href: '/dividas', icon: CreditCard, group: 'Empresa' },
  // Geral
  { label: 'Calendário', href: '/calendario', icon: Calendar, group: 'Geral' },
  { label: 'Relatório mensal', href: '/relatorio', icon: FileText, group: 'Geral' },
]

function isEmpresaRoute(pathname: string): boolean {
  return pathname.startsWith('/canais') || pathname.startsWith('/dividas')
}

export function Sidebar() {
  const pathname = usePathname()

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

  const ungroupedItems = navItems.filter((i) => i.group === 'ungrouped')
  const casaItems = navItems.filter((i) => i.group === 'Casa')
  const empresaItems = navItems.filter((i) => i.group === 'Empresa')
  const geralItems = navItems.filter((i) => i.group === 'Geral')

  function renderItem(item: NavItem) {
    const isActive = pathname.startsWith(item.href)
    return (
      <Link
        key={item.href}
        href={item.href}
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

        {/* Casa group */}
        <div className="mt-3">
          <p className="px-4 py-1 text-xs text-text-secondary uppercase tracking-wide font-medium">
            Casa
          </p>
          {casaItems.map(renderItem)}
        </div>

        {/* Empresa group */}
        <div className="mt-3">
          <p className="px-4 py-1 text-xs text-text-secondary uppercase tracking-wide font-medium">
            Empresa
          </p>
          {empresaItems.map(renderItem)}
        </div>

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
