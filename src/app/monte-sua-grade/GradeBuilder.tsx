'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StarRating } from '@/components/ui/StarRating'
import {
  ScheduleGrid, SUBJECT_COLORS, DAYS, MORNING_SLOTS, NIGHT_SLOTS,
  type ScheduleMap, type ScheduleSlot, type Day,
} from './ScheduleGrid'

// ─── Tipos internos ───────────────────────────────────────────────────────────

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
  semester_num: number
  teachers: TeacherOption[]
}

type CurriculumVersion = { id: string; name: string; shift: string | null }
type Selections = Record<string, string | null> // subject_id → teacher_id
type ColorMap = Record<string, number>           // subject_id → colorIdx

const COURSES = [
  { code: 'BES', name: 'Eng. de Software', semesters: 8 },
  { code: 'ADS', name: 'ADS', semesters: 5 },
]

// ─── Score ────────────────────────────────────────────────────────────────────

function calcScore(slots: SubjectSlot[], selections: Selections): number | null {
  const rated = slots.filter((s) => {
    const tid = selections[s.subject_id]
    if (!tid) return false
    const t = s.teachers.find((t) => t.teacher_id === tid)
    return t && t.review_count > 0
  })
  if (!rated.length) return null
  const sum = rated.reduce((a, s) => {
    const t = s.teachers.find((t) => t.teacher_id === selections[s.subject_id])!
    return a + t.avg_rating
  }, 0)
  return sum / rated.length
}

function scoreLabel(n: number) {
  if (n >= 4.5) return 'Excelente'
  if (n >= 4.0) return 'Muito boa'
  if (n >= 3.0) return 'Razoável'
  return 'Atenção'
}

function scoreStyle(n: number) {
  if (n >= 4.0) return { badge: 'bg-brand-100 border-brand-300 text-brand-400', num: 'text-brand-400' }
  if (n >= 3.0) return { badge: 'bg-[#2d1f00] border-amber-700 text-amber-400', num: 'text-amber-400' }
  return { badge: 'bg-[#2d0a0a] border-red-700 text-red-400', num: 'text-red-400' }
}

// ─── Busca no banco ───────────────────────────────────────────────────────────

async function fetchSlotsForSemester(
  supabase: ReturnType<typeof createClient>,
  cvId: string,
  semNumber: number
): Promise<SubjectSlot[]> {
  const { data: semRow } = await (supabase as any)
    .from('semesters')
    .select('id')
    .eq('curriculum_version_id', cvId)
    .eq('number', semNumber)
    .single()

  if (!semRow) return []

  const { data: csRows } = await (supabase as any)
    .from('curriculum_subjects')
    .select('subject:subjects(id, code, name, type)')
    .eq('curriculum_version_id', cvId)
    .eq('semester_id', semRow.id)

  const subjects: Array<{ id: string; code: string; name: string }> = (csRows ?? [])
    .map((r: any) => r.subject)
    .filter((s: any) => s && s.type === 'mandatory')

  if (!subjects.length) return []

  const subjectIds = subjects.map((s) => s.id)

  const [{ data: tsRows }, { data: revRows }] = await Promise.all([
    (supabase as any)
      .from('teacher_subjects')
      .select('subject_id, teacher:teachers(id, name, active)')
      .in('subject_id', subjectIds),
    (supabase as any)
      .from('reviews')
      .select('teacher_id, subject_id, rating_general')
      .in('subject_id', subjectIds)
      .eq('status', 'publicada'),
  ])

  // Média de avaliações por teacher+subject
  const rMap = new Map<string, { sum: number; count: number }>()
  for (const r of revRows ?? []) {
    const k = `${r.teacher_id}:${r.subject_id}`
    const cur = rMap.get(k) ?? { sum: 0, count: 0 }
    rMap.set(k, { sum: cur.sum + (r.rating_general ?? 0), count: cur.count + 1 })
  }

  // Filtra apenas professores ativos vinculados às disciplinas
  const active = (tsRows ?? []).filter((r: any) => r.teacher?.active)

  return subjects.map((subject) => {
    // Deduplica professores: usa Set DENTRO do filter
    const seenIds = new Set<string>()
    const teachers: TeacherOption[] = active
      .filter((r: any) => {
        if (r.subject_id !== subject.id) return false
        if (!r.teacher?.id || seenIds.has(r.teacher.id)) return false
        seenIds.add(r.teacher.id)
        return true
      })
      .map((r: any) => {
        const entry = rMap.get(`${r.teacher.id}:${subject.id}`)
        return {
          teacher_id: r.teacher.id,
          teacher_name: r.teacher.name,
          avg_rating: entry ? entry.sum / entry.count : 0,
          review_count: entry?.count ?? 0,
        }
      })
      .sort((a: TeacherOption, b: TeacherOption) => b.avg_rating - a.avg_rating)

    return { subject_id: subject.id, subject_name: subject.name, subject_code: subject.code, semester_num: semNumber, teachers }
  })
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function GradeBuilder() {
  const [course, setCourse] = useState('BES')
  const [versions, setVersions] = useState<CurriculumVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [activeSemesters, setActiveSemesters] = useState<number[]>([1])
  const [slots, setSlots] = useState<SubjectSlot[]>([])
  const [selections, setSelections] = useState<Selections>({})
  const [colorMap, setColorMap] = useState<ColorMap>({})
  const [scheduleMap, setScheduleMap] = useState<ScheduleMap>({})
  const [activeForSchedule, setActiveForSchedule] = useState<ScheduleSlot | null>(null)
  const [loading, setLoading] = useState(false)
  const [view, setPrintView] = useState<'build' | 'print'>('build')
  const printRef = useRef<HTMLDivElement>(null)

  const maxSemesters = COURSES.find((c) => c.code === course)?.semesters ?? 8

  // Carrega versões quando muda o curso
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: courseRow } = await (supabase as any)
        .from('courses').select('id').eq('code', course).single()
      if (!courseRow) { setVersions([]); return }
      const { data } = await (supabase as any)
        .from('curriculum_versions').select('id, name, shift')
        .eq('course_id', courseRow.id).eq('active', true)
      const vList: CurriculumVersion[] = data ?? []
      setVersions(vList)
      setSelectedVersionId(vList[0]?.id ?? null)
    }
    load()
    setActiveSemesters([1])
    setSlots([])
    setSelections({})
    setColorMap({})
    setScheduleMap({})
    setActiveForSchedule(null)
  }, [course])

  // Carrega disciplinas quando muda versão ou semestres ativos
  useEffect(() => {
    if (!selectedVersionId || !activeSemesters.length) return
    setLoading(true)

    const supabase = createClient()
    Promise.all(activeSemesters.map((n) => fetchSlotsForSemester(supabase, selectedVersionId, n)))
      .then((results) => {
        const merged = results.flat()
        setSlots(merged)
        // Atribui cor nova apenas para disciplinas novas
        setColorMap((prev) => {
          const next = { ...prev }
          let idx = Object.keys(next).length % SUBJECT_COLORS.length
          for (const s of merged) {
            if (!(s.subject_id in next)) {
              next[s.subject_id] = idx % SUBJECT_COLORS.length
              idx++
            }
          }
          return next
        })
      })
      .finally(() => setLoading(false))
  }, [selectedVersionId, activeSemesters])

  function toggleSemester(n: number) {
    setActiveSemesters((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b)
    )
  }

  function selectTeacher(subject_id: string, teacher_id: string | null) {
    setSelections((p) => ({ ...p, [subject_id]: teacher_id }))
    // Se limpar, remove da grade de horários
    if (!teacher_id) {
      setScheduleMap((p) => {
        const next = { ...p }
        for (const key of Object.keys(next)) {
          if (next[key]?.subject_id === subject_id) delete next[key]
        }
        return next
      })
      if (activeForSchedule?.subject_id === subject_id) setActiveForSchedule(null)
    }
  }

  function activateForSchedule(slot: SubjectSlot, teacher: TeacherOption) {
    const colorIdx = colorMap[slot.subject_id] ?? 0
    const entry: ScheduleSlot = {
      subject_id: slot.subject_id,
      subject_name: slot.subject_name,
      subject_code: slot.subject_code,
      teacher_name: teacher.teacher_name,
      colorIdx,
    }
    setActiveForSchedule((prev) => (prev?.subject_id === slot.subject_id ? null : entry))
  }

  function handleCellClick(key: string) {
    if (!activeForSchedule) return
    setScheduleMap((p) => ({ ...p, [key]: activeForSchedule }))
  }

  function handleCellRemove(key: string) {
    setScheduleMap((p) => { const n = { ...p }; delete n[key]; return n })
  }

  function handlePrint() {
    window.print()
  }

  const score = calcScore(slots, selections)
  const selectedCount = Object.values(selections).filter(Boolean).length
  const sc = score !== null ? scoreStyle(score) : null
  const selectedVersion = versions.find((v) => v.id === selectedVersionId)
  const shift = selectedVersion?.shift ?? null
  const timeSlots = shift?.toLowerCase() === 'noturno' ? NIGHT_SLOTS : MORNING_SLOTS

  // Agrupa slots por semestre para exibição
  const bySemester = activeSemesters.reduce<Record<number, SubjectSlot[]>>((acc, n) => {
    acc[n] = slots.filter((s) => s.semester_num === n)
    return acc
  }, {})

  return (
    <div ref={printRef} className="container-page py-10 max-w-4xl">

      {/* Título + botões de ação */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-fg mb-1">Monte sua grade</h1>
          <p className="text-fg-muted text-sm">Selecione disciplinas e professores, depois arranje os horários.</p>
        </div>
        <div className="flex gap-2 flex-shrink-0 print:hidden">
          {selectedCount > 0 && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-edge rounded-xl text-sm font-medium text-fg-muted hover:text-fg hover:border-fg-muted transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">

        {/* ── Coluna esquerda: controles + disciplinas ── */}
        <div className="min-w-0">

          {/* Controles */}
          <div className="bg-surface border border-edge rounded-2xl p-4 mb-5 space-y-4 print:hidden">
            {/* Curso */}
            <div>
              <p className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider mb-2">Curso</p>
              <div className="flex gap-2">
                {COURSES.map((c) => (
                  <button key={c.code} onClick={() => setCourse(c.code)}
                    className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                      course === c.code ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-canvas border-edge text-fg-muted hover:border-brand-400 hover:text-brand-400'
                    }`}>
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Turno */}
            {versions.length > 1 && (
              <div>
                <p className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider mb-2">Turno</p>
                <div className="flex gap-2">
                  {versions.map((v) => (
                    <button key={v.id} onClick={() => setSelectedVersionId(v.id)}
                      className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                        selectedVersionId === v.id ? 'bg-accent-500 border-accent-500 text-white'
                          : 'bg-canvas border-edge text-fg-muted hover:border-accent-400 hover:text-accent-400'
                      }`}>
                      {v.shift ?? v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Semestres (multi-select) */}
            <div>
              <p className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider mb-2">
                Semestres <span className="text-fg-subtle font-normal normal-case">(selecione um ou mais)</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((n) => {
                  const active = activeSemesters.includes(n)
                  return (
                    <button key={n} onClick={() => toggleSemester(n)}
                      className={`w-9 h-9 rounded-lg border text-sm font-bold transition-all ${
                        active ? 'bg-accent-500 border-accent-500 text-white'
                          : 'bg-canvas border-edge text-fg-muted hover:border-accent-400 hover:text-accent-400'
                      }`}>
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Score */}
          {score !== null && sc && (
            <div className={`mb-5 px-5 py-3.5 rounded-2xl border flex items-center justify-between gap-4 print:hidden ${sc.badge}`}>
              <div>
                <span className="text-sm font-bold">{scoreLabel(score)}</span>
                <span className="text-xs opacity-60 ml-2">
                  {selectedCount} professor{selectedCount !== 1 ? 'es' : ''} escolhido{selectedCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <StarRating value={score} size="sm" />
                <span className={`text-2xl font-bold tabular-nums ${sc.num}`}>{score.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center py-12 gap-3 text-fg-muted print:hidden">
              <div className="w-8 h-8 border-2 border-edge border-t-brand-400 rounded-full animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          )}

          {/* Sem dados */}
          {!loading && slots.length === 0 && (
            <div className="text-center py-12 bg-surface border border-edge rounded-2xl text-fg-muted text-sm">
              Nenhuma disciplina encontrada para os semestres selecionados.
            </div>
          )}

          {/* Disciplinas agrupadas por semestre */}
          {!loading && activeSemesters.map((semNum) => {
            const semSlots = bySemester[semNum] ?? []
            if (!semSlots.length) return null
            return (
              <div key={semNum} className="mb-6">
                {activeSemesters.length > 1 && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{semNum}</span>
                    </div>
                    <h2 className="text-sm font-semibold text-fg">{semNum}º Semestre</h2>
                  </div>
                )}

                <div className="space-y-2.5">
                  {semSlots.map((slot) => {
                    const selTid = selections[slot.subject_id]
                    const selTeacher = selTid ? slot.teachers.find((t) => t.teacher_id === selTid) : null
                    const colorIdx = colorMap[slot.subject_id] ?? 0
                    const color = SUBJECT_COLORS[colorIdx]
                    const isPlacingThisSubject = activeForSchedule?.subject_id === slot.subject_id

                    return (
                      <div key={slot.subject_id}
                        className={`bg-surface border rounded-2xl overflow-hidden transition-all ${
                          selTid ? 'border-brand-600' : 'border-edge'
                        }`}>

                        {/* Header disciplina */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-edge-muted">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${color.bg}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-mono text-fg-subtle">{slot.subject_code}</p>
                            <p className="text-sm font-semibold text-fg leading-tight truncate">{slot.subject_name}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Botão "colocar na grade" */}
                            {selTid && selTeacher && (
                              <button
                                onClick={() => activateForSchedule(slot, selTeacher)}
                                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                                  isPlacingThisSubject
                                    ? `${color.bg} text-white border-transparent`
                                    : 'border-edge text-fg-muted hover:border-brand-400 hover:text-brand-400'
                                }`}
                              >
                                {isPlacingThisSubject ? '↑ posicionando' : 'na grade →'}
                              </button>
                            )}
                            {selTid && (
                              <button onClick={() => selectTeacher(slot.subject_id, null)}
                                className="text-xs text-fg-subtle hover:text-fg-muted">
                                limpar
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Professores */}
                        {!slot.teachers.length ? (
                          <p className="px-4 py-3 text-xs text-fg-subtle italic">
                            Nenhum professor vinculado.{' '}
                            <Link href="/buscar" className="text-accent-400 hover:underline not-italic">Ver na busca</Link>
                          </p>
                        ) : (
                          <div className="divide-y divide-edge-muted">
                            {slot.teachers.map((teacher) => {
                              const isSel = selTid === teacher.teacher_id
                              return (
                                <button key={teacher.teacher_id}
                                  onClick={() => selectTeacher(slot.subject_id, isSel ? null : teacher.teacher_id)}
                                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                                    isSel ? 'bg-brand-100' : 'hover:bg-surface-2'
                                  }`}>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                      isSel ? 'border-brand-400 bg-brand-400' : 'border-edge'
                                    }`}>
                                      {isSel && (
                                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                      )}
                                    </div>
                                    <span className={`text-sm font-medium ${isSel ? 'text-brand-400' : 'text-fg'}`}>
                                      {teacher.teacher_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {teacher.review_count > 0 ? (
                                      <>
                                        <StarRating value={teacher.avg_rating} size="sm" />
                                        <span className={`text-sm font-bold tabular-nums ${
                                          teacher.avg_rating >= 4 ? 'text-brand-400'
                                            : teacher.avg_rating >= 3 ? 'text-amber-400' : 'text-red-400'
                                        }`}>{teacher.avg_rating.toFixed(1)}</span>
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
                </div>
              </div>
            )
          })}

          {/* CTA sem avaliações */}
          {!loading && slots.length > 0 && slots.every((s) => s.teachers.every((t) => t.review_count === 0)) && (
            <div className="mt-2 bg-accent-100 border border-accent-300 rounded-2xl px-5 py-4 text-sm text-accent-400">
              Nenhuma avaliação publicada ainda.{' '}
              <Link href="/avaliar" className="font-semibold underline">Seja o primeiro!</Link>
            </div>
          )}
        </div>

        {/* ── Coluna direita: grade de horários ── */}
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="bg-surface border border-edge rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-fg">Grade semanal</h2>
              <span className="text-xs text-fg-subtle">
                {shift ? (shift.charAt(0).toUpperCase() + shift.slice(1).toLowerCase()) : 'Matutino'}
              </span>
            </div>

            <ScheduleGrid
              scheduleMap={scheduleMap}
              shift={shift}
              activeSubject={activeForSchedule}
              onCellClick={handleCellClick}
              onCellRemove={handleCellRemove}
            />

            {/* Legenda */}
            {selectedCount > 0 && (
              <div className="mt-4 pt-3 border-t border-edge-muted space-y-1.5">
                <p className="text-[10px] font-semibold text-fg-subtle uppercase tracking-wide mb-2">Disciplinas</p>
                {slots
                  .filter((s) => selections[s.subject_id])
                  .map((s) => {
                    const colorIdx = colorMap[s.subject_id] ?? 0
                    const color = SUBJECT_COLORS[colorIdx]
                    const teacher = s.teachers.find((t) => t.teacher_id === selections[s.subject_id])
                    return (
                      <div key={s.subject_id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded flex-shrink-0 ${color.bg}`} />
                        <span className="text-xs text-fg truncate">{s.subject_code}</span>
                        <span className="text-xs text-fg-subtle truncate flex-1">{teacher?.teacher_name}</span>
                      </div>
                    )
                  })}
              </div>
            )}

            {selectedCount === 0 && (
              <p className="text-xs text-fg-subtle text-center mt-3">
                Selecione professores para montar a grade →
              </p>
            )}
          </div>

          {/* Resumo de horários preenchidos */}
          {Object.keys(scheduleMap).length > 0 && (
            <div className="mt-3 bg-surface border border-edge rounded-2xl p-4">
              <p className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wide mb-3">Resumo</p>
              <div className="space-y-1">
                {DAYS.map((day) => {
                  const dayCells = timeSlots
                    .map((slot) => ({ slot, cell: scheduleMap[`${day}:${slot.id}`] }))
                    .filter(({ cell }) => cell)
                  if (!dayCells.length) return null
                  return (
                    <div key={day} className="text-xs">
                      <span className="font-semibold text-fg-muted w-8 inline-block">{day}</span>
                      <span className="text-fg-subtle">
                        {dayCells.map(({ slot, cell }) =>
                          `${slot.label} ${cell!.subject_code}`
                        ).join(' · ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Área de impressão (só aparece ao imprimir) ── */}
      <div className="hidden print:block mt-8">
        <h2 className="text-xl font-bold mb-4">Grade — {course} {new Date().getFullYear()}</h2>

        {/* Tabela de horários */}
        {Object.keys(scheduleMap).length > 0 && (
          <table className="w-full border text-xs mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 text-left">Horário</th>
                {DAYS.map((d) => <th key={d} className="border px-2 py-1">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot.id}>
                  <td className="border px-2 py-1 whitespace-nowrap text-gray-600">{slot.range}</td>
                  {DAYS.map((day) => {
                    const cell = scheduleMap[`${day}:${slot.id}`]
                    return (
                      <td key={day} className="border px-2 py-1 text-center">
                        {cell ? (
                          <div>
                            <div className="font-bold">{cell.subject_code}</div>
                            <div className="text-gray-500 text-[10px]">{cell.teacher_name.split(' ')[0]}</div>
                          </div>
                        ) : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Lista de disciplinas */}
        <table className="w-full border text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-left">Código</th>
              <th className="border px-2 py-1 text-left">Disciplina</th>
              <th className="border px-2 py-1 text-left">Professor</th>
              <th className="border px-2 py-1 text-center">Nota</th>
            </tr>
          </thead>
          <tbody>
            {slots
              .filter((s) => selections[s.subject_id])
              .map((s) => {
                const teacher = s.teachers.find((t) => t.teacher_id === selections[s.subject_id])
                return (
                  <tr key={s.subject_id}>
                    <td className="border px-2 py-1 font-mono">{s.subject_code}</td>
                    <td className="border px-2 py-1">{s.subject_name}</td>
                    <td className="border px-2 py-1">{teacher?.teacher_name ?? '—'}</td>
                    <td className="border px-2 py-1 text-center">
                      {teacher?.review_count ? teacher.avg_rating.toFixed(1) : 'S/A'}
                    </td>
                  </tr>
                )
              })}
            {score !== null && (
              <tr className="bg-gray-50 font-bold">
                <td className="border px-2 py-1" colSpan={3}>Score médio da grade</td>
                <td className="border px-2 py-1 text-center">{score.toFixed(1)}</td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="text-gray-400 text-[10px] mt-4 text-right">MeuSemestreUCSAL · {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

    </div>
  )
}
