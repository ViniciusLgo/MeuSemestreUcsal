'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StarRating } from '@/components/ui/StarRating'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TeacherOption = {
  teacher_id: string
  teacher_name: string
  avg_rating: number
  review_count: number
}

type SubjectSlot = {
  subject_id: string
  subject_name: string
  subject_code: string
  teachers: TeacherOption[]
}

type CurriculumVersion = {
  id: string
  name: string
  shift: string | null
}

type Selections = Record<string, string | null> // subject_id → teacher_id | null

const COURSES = [
  { code: 'BES', name: 'Eng. de Software', semesters: 8 },
  { code: 'ADS', name: 'ADS', semesters: 5 },
]

// ─── Utilidades de score ──────────────────────────────────────────────────────

function calcScore(slots: SubjectSlot[], selections: Selections) {
  const withTeacher = slots.filter((s) => {
    const tid = selections[s.subject_id]
    if (!tid) return false
    const t = s.teachers.find((t) => t.teacher_id === tid)
    return t && t.review_count > 0
  })
  if (!withTeacher.length) return null

  const sum = withTeacher.reduce((acc, s) => {
    const t = s.teachers.find((t) => t.teacher_id === selections[s.subject_id])!
    return acc + t.avg_rating
  }, 0)
  return sum / withTeacher.length
}

function scoreLabel(n: number) {
  if (n >= 4.5) return 'Excelente'
  if (n >= 4.0) return 'Muito boa'
  if (n >= 3.0) return 'Razoável'
  return 'Complicado'
}

function scoreClass(n: number) {
  if (n >= 4.0) return { badge: 'bg-brand-100 border-brand-300 text-brand-400', text: 'text-brand-400' }
  if (n >= 3.0) return { badge: 'bg-[#2d1f00] border-amber-700 text-amber-400', text: 'text-amber-400' }
  return { badge: 'bg-[#2d0a0a] border-red-700 text-red-400', text: 'text-red-400' }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function GradeBuilder() {
  const [course, setCourse] = useState('BES')
  const [semester, setSemester] = useState(1)
  const [versions, setVersions] = useState<CurriculumVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [slots, setSlots] = useState<SubjectSlot[]>([])
  const [selections, setSelections] = useState<Selections>({})
  const [loading, setLoading] = useState(false)

  const maxSemesters = COURSES.find((c) => c.code === course)?.semesters ?? 8

  // Carrega versões do currículo quando muda o curso
  useEffect(() => {
    async function loadVersions() {
      const supabase = createClient()
      const { data: courseRow } = await (supabase as any)
        .from('courses')
        .select('id')
        .eq('code', course)
        .single()

      if (!courseRow) { setVersions([]); return }

      const { data } = await (supabase as any)
        .from('curriculum_versions')
        .select('id, name, shift')
        .eq('course_id', courseRow.id)
        .eq('active', true)

      const vList: CurriculumVersion[] = data ?? []
      setVersions(vList)
      setSelectedVersion(vList[0]?.id ?? null)
    }
    loadVersions()
  }, [course])

  // Carrega disciplinas e professores quando muda semestre ou versão
  const fetchSlots = useCallback(async () => {
    if (!selectedVersion) return
    setLoading(true)
    setSelections({})

    const supabase = createClient()

    try {
      // Semestre pelo número dentro da versão
      const { data: semRow } = await (supabase as any)
        .from('semesters')
        .select('id')
        .eq('curriculum_version_id', selectedVersion)
        .eq('number', semester)
        .single()

      if (!semRow) { setSlots([]); return }

      // Disciplinas obrigatórias do semestre
      const { data: csRows } = await (supabase as any)
        .from('curriculum_subjects')
        .select('subject:subjects(id, code, name, type)')
        .eq('curriculum_version_id', selectedVersion)
        .eq('semester_id', semRow.id)

      const subjects: Array<{ id: string; code: string; name: string }> = (csRows ?? [])
        .map((r: any) => r.subject)
        .filter((s: any) => s && s.type === 'mandatory')

      if (!subjects.length) { setSlots([]); return }

      const subjectIds = subjects.map((s) => s.id)

      // Professores vinculados a essas disciplinas
      const { data: tsRows } = await (supabase as any)
        .from('teacher_subjects')
        .select('subject_id, teacher:teachers(id, name, active)')
        .in('subject_id', subjectIds)

      const activeTeachers = (tsRows ?? []).filter((r: any) => r.teacher?.active)

      // Avaliações publicadas dessas disciplinas
      const { data: revRows } = await (supabase as any)
        .from('reviews')
        .select('teacher_id, subject_id, rating_general')
        .in('subject_id', subjectIds)
        .eq('status', 'publicada')

      // Monta mapa de médias: "teacher_id:subject_id" → {sum, count}
      const rMap = new Map<string, { sum: number; count: number }>()
      for (const r of revRows ?? []) {
        const k = `${r.teacher_id}:${r.subject_id}`
        const cur = rMap.get(k) ?? { sum: 0, count: 0 }
        rMap.set(k, { sum: cur.sum + (r.rating_general ?? 0), count: cur.count + 1 })
      }

      // Monta slots com deduplicação de professores por disciplina
      const built: SubjectSlot[] = subjects.map((subject) => {
        const seen = new Set<string>()
        const teachers: TeacherOption[] = activeTeachers
          .filter((r: any) => r.subject_id === subject.id && !seen.has(r.teacher.id))
          .map((r: any) => {
            seen.add(r.teacher.id)
            const entry = rMap.get(`${r.teacher.id}:${subject.id}`)
            return {
              teacher_id: r.teacher.id,
              teacher_name: r.teacher.name,
              avg_rating: entry ? entry.sum / entry.count : 0,
              review_count: entry?.count ?? 0,
            }
          })
          .sort((a: TeacherOption, b: TeacherOption) => b.avg_rating - a.avg_rating)

        return {
          subject_id: subject.id,
          subject_name: subject.name,
          subject_code: subject.code,
          teachers,
        }
      })

      setSlots(built)
    } finally {
      setLoading(false)
    }
  }, [selectedVersion, semester])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  const score = calcScore(slots, selections)
  const selectedCount = Object.values(selections).filter(Boolean).length
  const sc = score !== null ? scoreClass(score) : null

  return (
    <div className="container-page py-10 max-w-3xl">

      {/* Título */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-fg mb-2">Monte sua grade perfeita</h1>
        <p className="text-fg-muted text-sm">
          Selecione os professores de cada disciplina e descubra o score estimado da sua grade.
        </p>
      </div>

      {/* Controles */}
      <div className="bg-surface border border-edge rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-start">
        {/* Curso */}
        <div>
          <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wide mb-2">Curso</p>
          <div className="flex gap-2">
            {COURSES.map((c) => (
              <button
                key={c.code}
                onClick={() => { setCourse(c.code); setSemester(1) }}
                className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  course === c.code
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'bg-canvas border-edge text-fg-muted hover:border-brand-400 hover:text-brand-400'
                }`}
              >
                {c.code}
              </button>
            ))}
          </div>
        </div>

        {/* Turno (só se houver mais de uma versão) */}
        {versions.length > 1 && (
          <div>
            <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wide mb-2">Turno</p>
            <div className="flex gap-2">
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersion(v.id)}
                  className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                    selectedVersion === v.id
                      ? 'bg-accent-500 border-accent-500 text-white'
                      : 'bg-canvas border-edge text-fg-muted hover:border-accent-400 hover:text-accent-400'
                  }`}
                >
                  {v.shift ?? v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Semestre */}
        <div>
          <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wide mb-2">Semestre</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setSemester(n)}
                className={`w-9 h-9 rounded-lg border text-sm font-bold transition-all ${
                  semester === n
                    ? 'bg-accent-500 border-accent-500 text-white'
                    : 'bg-canvas border-edge text-fg-muted hover:border-accent-400 hover:text-accent-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Score bar (sticky) */}
      {score !== null && sc && (
        <div className={`sticky top-20 z-10 mb-5 px-5 py-3.5 rounded-2xl border flex items-center justify-between gap-4 ${sc.badge}`}>
          <div>
            <span className="text-sm font-bold">{scoreLabel(score)}</span>
            <span className="text-xs opacity-60 ml-2">
              {selectedCount} de {slots.length} professor{selectedCount !== 1 ? 'es' : ''} escolhido{selectedCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <StarRating value={score} size="sm" />
            <span className={`text-2xl font-bold tabular-nums ${sc.text}`}>{score.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-3 text-fg-muted">
          <div className="w-8 h-8 border-2 border-edge border-t-brand-400 rounded-full animate-spin" />
          <span className="text-sm">Carregando disciplinas...</span>
        </div>
      )}

      {/* Sem dados */}
      {!loading && slots.length === 0 && (
        <div className="text-center py-16 bg-surface border border-edge rounded-2xl">
          <p className="text-fg-muted text-sm">
            Nenhuma disciplina encontrada para {course} – {semester}º semestre.
          </p>
        </div>
      )}

      {/* Disciplinas */}
      {!loading && slots.length > 0 && (
        <div className="space-y-3">
          {slots.map((slot) => {
            const selTeacherId = selections[slot.subject_id]
            const hasTeachers = slot.teachers.length > 0

            return (
              <div
                key={slot.subject_id}
                className={`bg-surface rounded-2xl border overflow-hidden transition-all ${
                  selTeacherId ? 'border-brand-600' : 'border-edge'
                }`}
              >
                {/* Header da disciplina */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-edge-muted">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${selTeacherId ? 'bg-brand-400' : 'bg-overlay'}`} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono text-fg-subtle">{slot.subject_code}</p>
                      <p className="text-sm font-semibold text-fg leading-tight truncate">{slot.subject_name}</p>
                    </div>
                  </div>
                  {selTeacherId && (
                    <button
                      onClick={() => setSelections((p) => ({ ...p, [slot.subject_id]: null }))}
                      className="text-xs text-fg-subtle hover:text-fg-muted ml-2 flex-shrink-0"
                    >
                      limpar
                    </button>
                  )}
                </div>

                {/* Professores */}
                {!hasTeachers ? (
                  <p className="px-5 py-4 text-sm text-fg-subtle italic">
                    Nenhum professor vinculado.{' '}
                    <Link href="/buscar" className="text-accent-400 hover:underline not-italic">
                      Ver na busca
                    </Link>
                  </p>
                ) : (
                  <div className="divide-y divide-edge-muted">
                    {slot.teachers.map((teacher) => {
                      const isSelected = selTeacherId === teacher.teacher_id
                      return (
                        <button
                          key={teacher.teacher_id}
                          onClick={() =>
                            setSelections((p) => ({
                              ...p,
                              [slot.subject_id]: isSelected ? null : teacher.teacher_id,
                            }))
                          }
                          className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors ${
                            isSelected ? 'bg-brand-100' : 'hover:bg-surface-2'
                          }`}
                        >
                          {/* Nome + radio */}
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected ? 'border-brand-400 bg-brand-400' : 'border-edge'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? 'text-brand-400' : 'text-fg'}`}>
                              {teacher.teacher_name}
                            </span>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {teacher.review_count > 0 ? (
                              <>
                                <StarRating value={teacher.avg_rating} size="sm" />
                                <span className={`text-sm font-bold tabular-nums ${
                                  teacher.avg_rating >= 4 ? 'text-brand-400'
                                  : teacher.avg_rating >= 3 ? 'text-amber-400'
                                  : 'text-red-400'
                                }`}>
                                  {teacher.avg_rating.toFixed(1)}
                                </span>
                                <span className="text-xs text-fg-subtle">({teacher.review_count})</span>
                              </>
                            ) : (
                              <span className="text-xs text-fg-subtle italic">sem avaliações</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* CTA quando não há avaliações */}
          {slots.every((s) => s.teachers.every((t) => t.review_count === 0)) && (
            <div className="mt-2 bg-accent-100 border border-accent-300 rounded-2xl px-5 py-4 text-sm text-accent-400">
              Ainda não há avaliações publicadas para essas disciplinas.{' '}
              <Link href="/avaliar" className="font-semibold underline">
                Seja o primeiro a avaliar!
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
