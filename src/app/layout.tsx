// src/app/layout.tsx
import type { Metadata } from 'next'
import { Manrope, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '600'],   // Only weights used in UI-SPEC
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Duas Contas',
  description: 'Controle financeiro pessoal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} ${ibmPlexMono.variable}`}>
      <body className="bg-bg font-sans text-text-primary">
        {children}
      </body>
    </html>
  )
}
