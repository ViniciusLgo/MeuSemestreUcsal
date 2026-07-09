'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import type { Metadata } from 'next'

const ADMIN_EMAIL = 'vinicruzlago@gmail.com'

function isValidEmail(email: string) {
  return email.trim().endsWith('@ucsal.edu.br') || email.trim() === ADMIN_EMAIL
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/'

  const supabase = createClient()

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!isValidEmail(trimmed)) {
      setError('Use seu email institucional @ucsal.edu.br para entrar.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (err) {
      setError(`Erro ${err.status ?? ''}: ${err.message || JSON.stringify(err)}`)
      return
    }
    setStep('otp')
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = otp.trim()
    if (trimmed.length < 6) {
      setError('Digite o código completo.')
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: trimmed,
      type: 'email',
    })
    if (err || !data.user) {
      setLoading(false)
      setError('Código inválido ou expirado. Solicite um novo código.')
      return
    }
    // Verifica se o perfil tem curso configurado
    const profileRes = await (supabase as any)
      .from('profiles')
      .select('course_id')
      .eq('id', data.user.id)
      .single() as { data: { course_id: string | null } | null }
    const profile = profileRes.data

    setLoading(false)
    router.refresh()

    if (!profile?.course_id) {
      router.push(`/perfil/configurar?redirectTo=${encodeURIComponent(redirectTo)}`)
    } else {
      router.push(redirectTo)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-canvas">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-edge flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="8" y1="14" x2="28" y2="14" stroke="#238636" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="19" x2="28" y2="19" stroke="#238636" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
              <line x1="8" y1="24" x2="22" y2="24" stroke="#238636" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35" />
              <rect x="8" y="9" width="6" height="3" rx="1.5" fill="#3fb950" />
              <circle cx="26" cy="24" r="3" fill="#3fb950" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-fg">
            {step === 'email' ? 'Entrar na plataforma' : 'Verificar código'}
          </h1>
          <p className="text-fg-muted text-sm mt-2">
            {step === 'email'
              ? 'Use seu email institucional UCSAL'
              : `Enviamos um código para ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">
                Email institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                placeholder="nome@ucsal.edu.br"
                autoComplete="email"
                required
                className="w-full px-4 py-2.5 bg-canvas border border-edge rounded-xl text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent-400 focus:border-accent-400 text-sm transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-[#2d0a0a] border border-red-700 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Receber código por email'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fg mb-1.5">
                Código de acesso
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(null) }}
                placeholder="00000000"
                autoComplete="one-time-code"
                autoFocus
                className="w-full px-4 py-2.5 bg-canvas border border-edge rounded-xl text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent-400 focus:border-accent-400 text-sm text-center text-lg tracking-widest font-mono transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-[#2d0a0a] border border-red-700 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Verificando...' : 'Confirmar código'}
            </Button>

            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(null) }}
              className="w-full text-sm text-fg-subtle hover:text-fg-muted transition-colors"
            >
              Usar outro email
            </button>
          </form>
        )}

        <p className="text-center text-xs text-fg-subtle mt-8">
          Ao entrar, você concorda com os{' '}
          <Link href="/termos" className="text-accent-400 hover:text-accent-300 underline">termos de uso</Link>
          {' '}e nossa{' '}
          <Link href="/privacidade" className="text-accent-400 hover:text-accent-300 underline">política de privacidade</Link>.
        </p>
      </div>
    </div>
  )
}

export default function EntrarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <LoginForm />
    </Suspense>
  )
}
