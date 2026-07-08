import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-[32rem] h-[32rem] bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container-page relative py-20 md:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-8 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Avaliações anônimas · UCSAL Pituaçu
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            Escolha o professor<br />
            <span className="text-accent-400">certo para você</span>
          </h1>

          <p className="text-lg md:text-xl text-brand-100 leading-relaxed mb-10 max-w-2xl">
            Veja avaliações reais de alunos da UCSAL, compare professores por disciplina
            e monte sua grade ideal — tudo com base em dados, não em rumores.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/buscar"
              className="inline-flex items-center justify-center gap-2.5 bg-white text-brand-700 font-semibold px-6 py-3.5 rounded-xl hover:bg-brand-50 transition-colors text-base shadow-lg shadow-brand-900/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar disciplina ou professor
            </Link>
            <Link
              href="/monte-sua-grade"
              className="inline-flex items-center justify-center gap-2 bg-accent-500 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-accent-600 transition-colors text-base"
            >
              Monte sua grade perfeita
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-white/10">
          {[
            { label: 'Disciplinas mapeadas', value: '60+' },
            { label: 'Cursos disponíveis', value: '2' },
            { label: 'Eletivas EAD', value: '20+' },
            { label: 'Avaliações publicadas', value: '0' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-white tabular-nums">{stat.value}</div>
              <div className="text-sm text-brand-200 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
