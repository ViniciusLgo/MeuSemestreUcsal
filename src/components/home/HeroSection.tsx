import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-canvas">
      {/* Gradiente verde sutil */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 40%, rgba(63,185,80,0.06) 0%, transparent 70%)' }}
      />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 70% 60%, rgba(88,166,255,0.05) 0%, transparent 70%)' }}
      />
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--edge) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)',
        }}
      />

      <div className="container-page relative py-20 md:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-surface backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-8 border border-edge">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-fg-muted">Avaliações anônimas · UCSAL Pituaçu</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight text-fg">
            Escolha o professor<br />
            <span className="text-brand-400">certo para você</span>
          </h1>

          <p className="text-lg md:text-xl text-fg-muted leading-relaxed mb-10 max-w-2xl">
            Veja avaliações reais de alunos da UCSAL, compare professores por disciplina
            e monte sua grade ideal — tudo com base em dados, não em rumores.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/buscar"
              className="inline-flex items-center justify-center gap-2.5 bg-brand-600 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-brand-500 transition-colors text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar disciplina ou professor
            </Link>
            <Link
              href="/monte-sua-grade"
              className="inline-flex items-center justify-center gap-2 bg-surface-2 text-fg font-semibold px-6 py-3.5 rounded-xl hover:bg-overlay border border-edge hover:border-fg-muted transition-colors text-base"
            >
              Monte sua grade perfeita
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-edge-muted grid sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface border border-edge">
            <div className="w-9 h-9 rounded-xl bg-brand-600/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-fg">Avaliações reais</p>
              <p className="text-xs text-fg-subtle mt-0.5 leading-relaxed">Notas de alunos que já cursaram — didática, carga, dificuldade e mais.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface border border-edge">
            <div className="w-9 h-9 rounded-xl bg-accent-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-fg">100% anônimo</p>
              <p className="text-xs text-fg-subtle mt-0.5 leading-relaxed">Só alunos @ucsal.edu.br. Sua identidade nunca é revelada.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface border border-edge">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-fg">Monte sua grade</p>
              <p className="text-xs text-fg-subtle mt-0.5 leading-relaxed">Visualize semana a semana com horários reais e compare professores.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
