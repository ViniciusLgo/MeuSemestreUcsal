import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createTeacher, toggleTeacher } from '@/lib/actions/admin'

export const metadata: Metadata = { title: 'Professores — Painel Admin' }

interface Props { searchParams: Promise<{ q?: string; status?: string }> }

export default async function ProfessoresPage({ searchParams }: Props) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  const { data: teachers } = await (supabase as any)
    .from('teachers')
    .select(`
      id, name, slug, active, created_at,
      teacher_subjects(subject_id),
      reviews(id, rating_general)
    `)
    .order('name')

  // Filtros
  const filtered = (teachers ?? []).filter((t: any) => {
    if (status === 'active' && !t.active) return false
    if (status === 'inactive' && t.active) return false
    if (q) {
      return t.name.toLowerCase().includes(q.toLowerCase())
    }
    return true
  })

  // Contar disciplinas sem duplicatas
  function uniqueSubjectCount(t: any): number {
    const ids = new Set((t.teacher_subjects ?? []).map((ts: any) => ts.subject_id))
    return ids.size
  }

  const activeCount = (teachers ?? []).filter((t: any) => t.active).length
  const inactiveCount = (teachers ?? []).filter((t: any) => !t.active).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fg">Professores</h1>
        <div className="text-sm text-fg-subtle">
          {activeCount} ativos · {inactiveCount} inativos
        </div>
      </div>

      {/* Formulário de cadastro */}
      <form action={createTeacher} className="flex gap-3 mb-6">
        <input
          name="name"
          required
          placeholder="Nome completo do professor"
          className="flex-1 px-4 py-2.5 bg-canvas border border-edge rounded-xl text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent-400 focus:border-accent-400 transition-colors"
        />
        <button type="submit"
          className="px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-500 transition-colors">
          + Adicionar
        </button>
      </form>

      {/* Filtros + busca */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { label: 'Todos', value: undefined },
          { label: 'Ativos', value: 'active' },
          { label: 'Inativos', value: 'inactive' },
        ].map((tab) => {
          const isActive = (status ?? undefined) === tab.value
          const href = tab.value ? `/painel-interno/professores?status=${tab.value}${q ? `&q=${q}` : ''}` : `/painel-interno/professores${q ? `?q=${q}` : ''}`
          return (
            <Link key={tab.label} href={href}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-surface border-edge text-fg-muted hover:border-brand-400'
              }`}>
              {tab.label}
            </Link>
          )
        })}
        <form method="GET" className="flex-1 min-w-48">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar professor..."
            className="w-full px-3 py-1.5 bg-canvas border border-edge rounded-lg text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </form>
      </div>

      {/* Lista */}
      <div className="bg-surface rounded-2xl border border-edge divide-y divide-edge-muted">
        {filtered.length === 0 && (
          <p className="px-6 py-8 text-center text-fg-subtle text-sm">Nenhum professor encontrado.</p>
        )}
        {filtered.map((t: any) => {
          const subjectCount = uniqueSubjectCount(t)
          const reviewList: any[] = t.reviews ?? []
          const reviewCount = reviewList.length
          const avgRating = reviewCount
            ? (reviewList.reduce((s: number, r: any) => s + (r.rating_general ?? 0), 0) / reviewCount).toFixed(1)
            : null

          return (
            <div key={t.id} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  t.active ? 'bg-brand-100' : 'bg-surface-2'
                }`}>
                  <span className={`font-bold text-sm ${t.active ? 'text-brand-400' : 'text-fg-subtle'}`}>
                    {t.name[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className={`font-medium text-sm truncate ${t.active ? 'text-fg' : 'text-fg-subtle line-through'}`}>
                    {t.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-fg-subtle">{subjectCount} disciplina{subjectCount !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-fg-subtle">{reviewCount} aval.</span>
                    {avgRating && (
                      <span className={`text-xs font-bold ${
                        Number(avgRating) >= 4 ? 'text-brand-400' : Number(avgRating) >= 3 ? 'text-amber-400' : 'text-red-400'
                      }`}>★ {avgRating}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/professor/${t.id}`} target="_blank"
                  className="text-xs font-medium text-fg-subtle hover:text-fg-muted border border-edge px-2.5 py-1 rounded-lg hover:border-fg-muted transition-all">
                  ↗ Perfil
                </Link>
                <Link href={`/painel-interno/professores/${t.id}`}
                  className="text-xs font-medium text-accent-400 border border-accent-300 bg-accent-100 px-2.5 py-1 rounded-lg hover:bg-accent-200 transition-colors">
                  Disciplinas
                </Link>
                <form action={toggleTeacher.bind(null, t.id, !t.active)}>
                  <button type="submit"
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                      t.active
                        ? 'text-red-400 border-transparent hover:bg-[#2d0a0a] hover:border-red-800'
                        : 'text-brand-400 border-transparent hover:bg-brand-100 hover:border-brand-300'
                    }`}>
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
