// src/app/(auth)/login/page.tsx
// Server Component shell — Client Component boundary lives in LoginForm
import { LoginForm } from './_components/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg">
      <LoginForm />
    </main>
  )
}
