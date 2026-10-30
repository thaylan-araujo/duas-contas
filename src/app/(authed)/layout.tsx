// src/app/(authed)/layout.tsx
// Server Component — renders shell (sidebar + bottom nav) around all authenticated pages
import { Sidebar } from './_components/Sidebar'
import { BottomNav } from './_components/BottomNav'

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar — hidden on mobile (< lg) */}
      <Sidebar />
      {/* Main content — padding-bottom on mobile for bottom nav */}
      <main className="flex-1 pb-16 lg:pb-0 p-4 lg:p-8">
        {children}
      </main>
      {/* Mobile bottom nav — hidden on desktop (>= lg) */}
      <BottomNav />
    </div>
  )
}
