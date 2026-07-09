import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function getStats() {
  const supabase = await createClient()
  const [disciplinasRes, cursosRes, eletivasRes, avaliacoesRes] = await Promise.all([
    (supabase as any).from('subjects').select('id', { count: 'exact', head: true }).eq('active', true),
    (supabase as any).from('courses').select('id', { count: 'exact', head: true }).eq('active', true),
    (supabase as any).from('subjects').select('id', { count: 'exact', head: true }).eq('active', true).eq('type', 'elective').eq('modality', 'ead'),
    (supabase as any).from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'publicada'),
  ])
  return {
    disciplinas: disciplinasRes.count ?? 0,
    cursos: cursosRes.count ?? 0,
    eletivas: eletivasRes.count ?? 0,
    avaliacoes: avaliacoesRes.count ?? 0,
  }
}

export async function HeroSection() {
  const stats = await getStats()

  const statItems = [
    { label: 'Disciplinas mapeadas', value: stats.disciplinas > 0 ? `${stats.disciplinas}+` : '—' },
    { label: 'Cursos disponíveis', value: String(stats.cursos) },
    { label: 'Eletivas EAD', value: stats.eletivas > 0 ? `${stats.eletivas}+` : '—' },
    { label: 'Avaliações publicadas', value: String(stats.avaliacoes) },
  ]

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

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-edge-muted">
          {statItems.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-fg tabular-nums">{stat.value}</div>
              <div className="text-sm text-fg-subtle mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
