import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createTeacher, toggleTeacher } from '@/lib/actions/admin'

export const metadata: Metadata = { title: 'Professores — Painel Admin' }

export default async function ProfessoresPage() {
  const supabase = await createClient()

  const { data: teachers } = await (supabase as any)
    .from('teachers')
    .select(`
      id, name, slug, active, created_at,
      teacher_subjects(id),
      reviews(id, rating_general)
    `)
    .order('name')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#e6edf3]">Professores</h1>
      </div>

      {/* Formulário de cadastro */}
      <form action={createTeacher} className="flex gap-3 mb-8">
        <input
          name="name"
          required
          placeholder="Nome completo do professor"
          className="flex-1 px-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-sm text-[#e6edf3] placeholder:text-[#6e7681] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] transition-colors"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-500 transition-colors"
        >
          Adicionar
        </button>
      </form>

      {/* Lista */}
      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] divide-y divide-[#21262d]">
        {(teachers ?? []).length === 0 && (
          <p className="px-6 py-8 text-center text-[#6e7681] text-sm">Nenhum professor cadastrado ainda.</p>
        )}
        {(teachers ?? []).map((t: any) => {
          const subjectCount: number = t.teacher_subjects?.length ?? 0
          const reviewList: any[] = t.reviews ?? []
          const reviewCount = reviewList.length
          const avgRating = reviewCount
            ? (reviewList.reduce((s: number, r: any) => s + (r.rating_general ?? 0), 0) / reviewCount).toFixed(1)
            : null

          return (
            <div key={t.id} className="flex items-center justify-between px-6 py-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-400 font-bold text-sm">{t.name[0]}</span>
                </div>
                <div className="min-w-0">
                  <p className={`font-medium text-sm truncate ${t.active ? 'text-[#e6edf3]' : 'text-[#6e7681] line-through'}`}>
                    {t.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-[#6e7681]">{subjectCount} disciplina{subjectCount !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-[#6e7681]">{reviewCount} avaliação{reviewCount !== 1 ? 'ões' : ''}</span>
                    {avgRating && (
                      <span className="text-xs font-semibold text-amber-400">★ {avgRating}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <Link
                  href={`/professor/${t.id}`}
                  target="_blank"
                  className="text-xs font-medium text-[#6e7681] hover:text-[#8b949e]"
                >
                  Ver perfil ↗
                </Link>
                <Link
                  href={`/painel-interno/professores/${t.id}`}
                  className="text-xs font-medium text-[#58a6ff] hover:text-accent-300"
                >
                  Disciplinas
                </Link>
                <form action={toggleTeacher.bind(null, t.id, !t.active)}>
                  <button
                    type="submit"
                    className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${
                      t.active
                        ? 'text-red-400 hover:bg-[#2d0a0a]'
                        : 'text-[#3fb950] hover:bg-brand-100'
                    }`}
                  >
                    {t.active ? 'Desativar' : 'Reativar'}
                  </button>
                </form>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
