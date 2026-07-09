import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #0f2918 50%, #0d1117 100%)' }}>
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #30363d 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)',
        }}
      />

      {/* Green glow blob */}
      <div className="absolute -top-32 left-1/4 w-[32rem] h-[32rem] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(63,185,80,0.07) 0%, transparent 70%)' }}
      />
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(88,166,255,0.06) 0%, transparent 70%)' }}
      />

      <div className="container-page relative py-20 md:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#161b22] backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-8 border border-[#30363d]">
            <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />
            <span className="text-[#8b949e]">Avaliações anônimas · UCSAL Pituaçu</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight text-[#e6edf3]">
            Escolha o professor<br />
            <span className="text-[#3fb950]">certo para você</span>
          </h1>

          <p className="text-lg md:text-xl text-[#8b949e] leading-relaxed mb-10 max-w-2xl">
            Veja avaliações reais de alunos da UCSAL, compare professores por disciplina
            e monte sua grade ideal — tudo com base em dados, não em rumores.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/buscar"
              className="inline-flex items-center justify-center gap-2.5 bg-[#238636] text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-[#2ea043] transition-colors text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar disciplina ou professor
            </Link>
            <Link
              href="/monte-sua-grade"
              className="inline-flex items-center justify-center gap-2 bg-[#21262d] text-[#e6edf3] font-semibold px-6 py-3.5 rounded-xl hover:bg-[#30363d] border border-[#30363d] hover:border-[#8b949e] transition-colors text-base"
            >
              Monte sua grade perfeita
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-[#21262d]">
          {[
            { label: 'Disciplinas mapeadas', value: '60+' },
            { label: 'Cursos disponíveis', value: '2' },
            { label: 'Eletivas EAD', value: '20+' },
            { label: 'Avaliações publicadas', value: '0' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-[#e6edf3] tabular-nums">{stat.value}</div>
              <div className="text-sm text-[#6e7681] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
