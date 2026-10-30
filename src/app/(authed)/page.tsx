// src/app/(authed)/page.tsx
// Server Component — redirects / to /visao-geral
import { redirect } from 'next/navigation'

export default function AuthedRootPage() {
  redirect('/visao-geral')
}
