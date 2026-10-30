'use client'
// src/app/(authed)/_components/BottomNav.tsx
// Client Component — needs usePathname and Sheet state
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  PlusCircle,
  CalendarDays,
  Briefcase,
  Menu,
  Receipt,
  CreditCard,
  Calendar,
  FileText,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  isEmpresa?: boolean
}

const primaryItems: NavItem[] = [
  { label: 'Visão geral', href: '/visao-geral', icon: LayoutGrid },
  { label: 'Lançamentos', href: '/lancamentos', icon: PlusCircle },
  { label: 'Planejamento', href: '/planejamento', icon: CalendarDays },
  { label: 'Empresa', href: '/canais', icon: Briefcase, isEmpresa: true },
]

const sheetItems: NavItem[] = [
  { label: 'Contas fixas e metas', href: '/contas-fixas', icon: Receipt },
  { label: 'Dívidas', href: '/dividas', icon: CreditCard, isEmpresa: true },
  { label: 'Calendário', href: '/calendario', icon: Calendar },
  { label: 'Relatório mensal', href: '/relatorio', icon: FileText },
]

function isEmpresaRoute(pathname: string): boolean {
  return pathname.startsWith('/canais') || pathname.startsWith('/dividas')
}

export function BottomNav() {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  function getIconColor(href: string, isEmpresa?: boolean): string {
    const isActive = pathname.startsWith(href)
    if (!isActive) return 'text-text-secondary'
    return isEmpresa || isEmpresaRoute(href) ? 'text-empresa' : 'text-casa'
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegação inferior"
    >
      {/* Primary nav items */}
      {primaryItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5"
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon
              size={24}
              className={getIconColor(item.href, item.isEmpresa)}
              aria-hidden="true"
            />
            <span className="text-[11px] text-text-secondary leading-none">{item.label}</span>
          </Link>
        )
      })}

      {/* "Mais" button — opens Sheet */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5"
        aria-label="Mais opções de navegação"
      >
        <Menu size={24} className="text-text-secondary" aria-hidden="true" />
        <span className="text-[11px] text-text-secondary leading-none">Mais</span>
      </button>

      {/* Sheet with remaining nav items */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="bg-card">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold text-text-primary text-left">
              Mais opções
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 mt-4 pb-4" aria-label="Mais opções">
            {sheetItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className={`flex items-center gap-3 min-h-[44px] px-4 rounded-lg transition-colors ${
                    isActive
                      ? item.isEmpresa || isEmpresaRoute(item.href)
                        ? 'bg-empresa-light text-empresa'
                        : 'bg-casa-light text-casa'
                      : 'text-text-primary hover:bg-bg'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon size={20} aria-hidden="true" />
                  <span className="text-base">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
