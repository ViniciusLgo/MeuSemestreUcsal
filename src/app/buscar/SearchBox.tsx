'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useTransition } from 'react'
import { cn } from '@/lib/utils'

const CURSOS = [
  { value: '', label: 'Todos os cursos' },
  { value: 'BES', label: 'BES' },
  { value: 'ADS', label: 'ADS' },
]

const TIPOS = [
  { value: '', label: 'Tudo' },
  { value: 'professor', label: 'Professores' },
  { value: 'disciplina', label: 'Disciplinas' },
]

export function SearchBox() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const currentQ = searchParams.get('q') ?? ''
  const currentCurso = searchParams.get('curso') ?? ''
  const currentTipo = searchParams.get('tipo') ?? ''

  function push(q: string, curso: string, tipo: string) {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (curso) params.set('curso', curso)
    if (tipo) params.set('tipo', tipo)
    startTransition(() => {
      router.push(`/buscar${params.size ? `?${params}` : ''}`)
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    push(inputRef.current?.value ?? '', currentCurso, currentTipo)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-fg-subtle pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          defaultValue={currentQ}
          placeholder="Buscar professor ou disciplina..."
          className="w-full pl-12 pr-4 py-4 bg-canvas border border-edge rounded-2xl text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent-400 focus:border-accent-400 text-base transition-colors"
          autoFocus
        />
        {pending && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {/* Filtro por tipo */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-fg-subtle font-medium">Mostrar:</span>
          {TIPOS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => push(inputRef.current?.value ?? currentQ, currentCurso, t.value)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                currentTipo === t.value
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-surface text-fg-muted border-edge hover:border-brand-400 hover:text-brand-400'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtro por curso */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-fg-subtle font-medium">Curso:</span>
          {CURSOS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => push(inputRef.current?.value ?? currentQ, c.value, currentTipo)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold border transition-all',
                currentCurso === c.value
                  ? 'bg-surface-2 text-fg border-fg-muted'
                  : 'bg-surface text-fg-muted border-edge hover:border-fg-muted hover:text-fg'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  )
}
