import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { setSubjectAlertStatus, createTeacherForSubject } from '@/lib/actions/admin'

export const metadata: Metadata = { title: 'Sem Professor — Painel Admin' }

interface Props { searchParams: Promise<{ status?: string; curso?: string }> }

export default async function SemProfessorPage({ searchParams }: Props) {
  const { status, curso } = await searchParams
  const supabase = await createClient()

  // Buscar disciplinas obrigatórias sem nenhum professor ativo vinculado
  const { data: allSubjects } = await (supabase as any)
    .from('subjects')
    .select(`
      id, code, name, type, modality, alert_status,
      curriculum_subjects(
        is_required,
        semester:semesters(number),
        curriculum_version:curriculum_versions(
          id, name, shift,
          course:courses(id, code, name)
        )
      ),
      teacher_subjects(
        teacher:teachers(id, name, active)
      )
    `)
    .eq('active', true)
    .eq('type', 'mandatory')
    .order('name')

  // Filtrar: sem professor ATIVO
  const withoutTeacher = (allSubjects ?? []).filter((s: any) => {
    const activeTeachers = (s.teacher_subjects ?? []).filter((ts: any) => ts.teacher?.active)
    return activeTeachers.length === 0
  })

  // Aplicar filtros de UI
  const filtered = withoutTeacher.filter((s: any) => {
    if (status === 'pendente' && s.alert_status !== 'pendente') return false
    if (status === 'ignorado' && s.alert_status !== 'ignorado') return false
    if (status === 'sem_tratativa' && s.alert_status !== null) return false
    if (curso) {
      const courses = new Set(
        (s.curriculum_subjects ?? []).map((cs: any) => cs.curriculum_version?.course?.code).filter(Boolean)
      )
      if (!courses.has(curso)) return false
    }
    return true
  })

  // Contagens
  const pendente = withoutTeacher.filter((s: any) => s.alert_status === 'pendente').length
  const ignorado = withoutTeacher.filter((s: any) => s.alert_status === 'ignorado').length
  const semTratativa = withoutTeacher.filter((s: any) => s.alert_status === null).length

  // Cursos disponíveis nos resultados
  const cursosSet = new Set<string>()
  for (const s of withoutTeacher) {
    for (const cs of s.curriculum_subjects ?? []) {
      const code = cs.curriculum_version?.course?.code
      if (code) cursosSet.add(code)
    }
  }
  const cursos = Array.from(cursosSet).sort()

  // Helper para extrair info do semestre/curso
  function getSubjectMeta(s: any): { semestres: number[]; cursos: string[] } {
    const semestres = new Set<number>()
    const cursosCodes = new Set<string>()
    for (const cs of s.curriculum_subjects ?? []) {
      if (cs.semester?.number) semestres.add(cs.semester.number)
      if (cs.curriculum_version?.course?.code) cursosCodes.add(cs.curriculum_version.course.code)
    }
    return { semestres: Array.from(semestres).sort(), cursos: Array.from(cursosCodes).sort() }
  }

  const tabs = [
    { label: 'Todas', value: undefined, count: withoutTeacher.length },
    { label: 'Pendente', value: 'pendente', count: pendente },
    { label: 'Sem tratativa', value: 'sem_tratativa', count: semTratativa },
    { label: 'Ignoradas', value: 'ignorado', count: ignorado },
  ]

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-fg">Disciplinas sem professor</h1>
          <p className="text-sm text-fg-subtle mt-1">
            {withoutTeacher.length} disciplinas obrigatórias sem professor ativo vinculado
          </p>
        </div>
        {semTratativa > 0 && (
          <div className="flex-shrink-0 flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-500 text-sm font-semibold px-4 py-2.5 rounded-xl">
            <span className="text-lg">⚠</span>
            {semTratativa} sem tratativa
          </div>
        )}
      </div>

      {/* Filtros por status */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((tab) => {
          const isActive = (status ?? undefined) === tab.value
          const params = new URLSearchParams()
          if (tab.value) params.set('status', tab.value)
          if (curso) params.set('curso', curso)
          const href = `/painel-interno/sem-professor${params.toString() ? `?${params}` : ''}`
          return (
            <Link key={tab.label} href={href}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-surface border-edge text-fg-muted hover:border-brand-400'
              }`}>
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 ${isActive ? 'text-white/70' : 'text-fg-subtle'}`}>
                  ({tab.count})
                </span>
              )}
            </Link>
          )
        })}

        {/* Filtro por curso */}
        {cursos.length > 1 && (
          <div className="flex gap-1 ml-auto">
            {cursos.map((c) => {
              const params = new URLSearchParams()
              if (status) params.set('status', status)
              if (c !== curso) params.set('curso', c)
              const href = `/painel-interno/sem-professor${params.toString() ? `?${params}` : ''}`
              const isActive = curso === c
              return (
                <Link key={c} href={href}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-accent-500 border-accent-500 text-white'
                      : 'bg-surface border-edge text-fg-muted hover:border-accent-400'
                  }`}>
                  {c}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="bg-surface border border-edge rounded-2xl px-6 py-16 text-center">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-fg font-semibold mb-1">Nenhuma disciplina nesta categoria</p>
          <p className="text-fg-subtle text-sm">
            {withoutTeacher.length === 0
              ? 'Todas as disciplinas obrigatórias têm professor vinculado!'
              : 'Altere o filtro para ver outras categorias.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((s: any) => {
          const meta = getSubjectMeta(s)
          const alertStatus: string | null = s.alert_status

          return (
            <div key={s.id}
              className={`bg-surface border rounded-2xl transition-all ${
                alertStatus === 'pendente'
                  ? 'border-amber-400'
                  : alertStatus === 'ignorado'
                    ? 'border-edge opacity-60'
                    : 'border-edge'
              }`}>

              {/* ── Linha principal ─────────────────────────── */}
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs text-fg-subtle">{s.code}</span>
                    {meta.cursos.map((c: string) => (
                      <span key={c} className="text-xs font-semibold bg-brand-100 text-brand-400 border border-brand-300 px-1.5 py-0.5 rounded">
                        {c}
                      </span>
                    ))}
                    {meta.semestres.length > 0 && (
                      <span className="text-xs text-fg-subtle">
                        {meta.semestres.map((n: number) => `${n}º`).join(', ')} sem.
                      </span>
                    )}
                    {alertStatus === 'pendente' && (
                      <span className="text-xs font-semibold bg-amber-100 text-amber-500 border border-amber-300 px-2 py-0.5 rounded-full">
                        ⚠ Pendente
                      </span>
                    )}
                    {alertStatus === 'ignorado' && (
                      <span className="text-xs text-fg-subtle bg-surface-2 border border-edge px-2 py-0.5 rounded-full">
                        Ignorada
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-fg">{s.name}</p>
                </div>

                {/* Ações */}
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/painel-interno/professores"
                    className="text-xs font-medium text-fg-subtle border border-edge px-2.5 py-1.5 rounded-lg hover:border-fg-muted hover:text-fg transition-all">
                    Vincular existente
                  </Link>
                  {alertStatus !== 'pendente' && (
                    <form action={setSubjectAlertStatus.bind(null, s.id, 'pendente')}>
                      <button type="submit"
                        className="text-xs font-medium text-amber-500 border border-amber-300 bg-amber-100 px-2.5 py-1.5 rounded-lg hover:bg-amber-200 transition-colors">
                        ⚠ Pendente
                      </button>
                    </form>
                  )}
                  {alertStatus !== 'ignorado' && (
                    <form action={setSubjectAlertStatus.bind(null, s.id, 'ignorado')}>
                      <button type="submit"
                        className="text-xs font-medium text-fg-subtle border border-edge px-2.5 py-1.5 rounded-lg hover:bg-surface-2 transition-colors">
                        Ignorar
                      </button>
                    </form>
                  )}
                  {alertStatus !== null && (
                    <form action={setSubjectAlertStatus.bind(null, s.id, null)}>
                      <button type="submit"
                        className="text-xs font-medium text-fg-subtle px-2 py-1.5 rounded-lg hover:text-fg transition-colors">
                        ✕
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* ── Form inline: Novo professor ─────────────── */}
              <details className="border-t border-edge-muted group">
                <summary className="px-5 py-2.5 list-none cursor-pointer flex items-center gap-2 text-xs font-semibold text-brand-400 hover:bg-surface-2 transition-colors select-none">
                  <span className="group-open:hidden">+ Criar novo professor e vincular</span>
                  <span className="hidden group-open:inline">▲ Cancelar</span>
                </summary>
                <div className="px-5 pb-4 pt-3">
                  <form action={createTeacherForSubject} className="flex flex-col sm:flex-row gap-2">
                    <input type="hidden" name="subject_id" value={s.id} />
                    <input
                      name="name"
                      required
                      placeholder="Nome completo do professor"
                      className="flex-1 px-3 py-2 bg-canvas border border-edge rounded-xl text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-brand-400"
                    />
                    <button type="submit"
                      className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition-colors whitespace-nowrap">
                      Criar e vincular
                    </button>
                  </form>
                </div>
              </details>
            </div>
          )
        })}
      </div>
    </div>
  )
}
