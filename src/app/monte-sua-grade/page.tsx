import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Monte sua grade — MeuSemestreUCSAL' }

export default function MonteGradePage() {
  return (
    <div className="container-page py-20 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-surface border border-edge flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-fg mb-3">Monte sua grade perfeita</h1>
      <p className="text-fg-muted mb-8">
        Em breve você poderá montar sua grade ideal comparando professores por disciplina,
        turno e avaliação — tudo em um só lugar.
      </p>
      <Link
        href="/buscar"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-400 transition-colors"
      >
        Buscar disciplinas agora
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  )
}
