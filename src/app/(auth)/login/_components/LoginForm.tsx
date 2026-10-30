'use client'
// src/app/(auth)/login/_components/LoginForm.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().min(1, 'Preencha o e-mail e a senha para continuar.').email('E-mail inválido'),
  password: z.string().min(1, 'Preencha o e-mail e a senha para continuar.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)

    const supabase = createSupabaseBrowserClient()

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        // T-02-02: Generic error — does NOT reveal if email exists (ASVS V2.2)
        // Supabase returns status 400 for invalid credentials
        if (error.status === 400 || error.message?.toLowerCase().includes('invalid')) {
          setServerError('E-mail ou senha incorretos. Tente novamente.')
        } else {
          setServerError('Não foi possível conectar. Verifique sua conexão e tente novamente.')
        }
        return
      }

      router.push('/visao-geral')
    } catch {
      // Network error — connection refused or similar
      setServerError('Não foi possível conectar. Verifique sua conexão e tente novamente.')
    }
  }

  // Determine if there are empty field errors
  const emptyFieldError =
    errors.email?.message === 'Preencha o e-mail e a senha para continuar.' ||
    errors.password?.message === 'Preencha o e-mail e a senha para continuar.'

  const displayError = emptyFieldError
    ? 'Preencha o e-mail e a senha para continuar.'
    : errors.email?.message && errors.email.message !== 'E-mail inválido'
    ? errors.email.message
    : errors.email?.message === 'E-mail inválido'
    ? 'E-mail inválido'
    : errors.password?.message
    ? errors.password.message
    : serverError

  return (
    <div className="bg-card rounded-2xl px-8 py-12 max-w-sm w-full shadow-sm">
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-text-primary leading-tight">
          Duas Contas
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Controle financeiro pessoal
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email field */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-text-primary">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            className="min-h-[44px]"
            {...register('email')}
          />
        </div>

        {/* Password field */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-text-primary">
            Senha
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="•••••••••"
              autoComplete="current-password"
              className="min-h-[44px] pr-10"
              {...register('password')}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
            >
              {showPassword ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {displayError && (
          <p
            role="alert"
            className="text-sm text-destructive"
          >
            {displayError}
          </p>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="w-full min-h-[44px] bg-casa text-white font-semibold hover:bg-casa/90"
        >
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
