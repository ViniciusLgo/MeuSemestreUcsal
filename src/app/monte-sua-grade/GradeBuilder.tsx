'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StarRating } from '@/components/ui/StarRating'
import {
  ScheduleGrid, SUBJECT_COLORS, DAYS, ALL_SLOTS, PERIODS,
  type ScheduleMap, type ScheduleSlot,
} from './ScheduleGrid'
import { saveGrade, getSavedGrade } from '@/lib/actions/grade'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TeacherOption = {
  teacher_id: string
  teacher_name: string
  avg_rating: number
  avg_didactics: number
  avg_organization: number
  avg_workload: number
  avg_difficulty: number
  pct_recommend: number
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
type Selections = Record<string, string | null>
type ColorMap = Record<string, number>

type SlotConfig = {
  days: string[]
  slotId: number
  numSlots: number
}
type SlotConfigs = Record<string, SlotConfig>

const COURSES = [
  { code: 'BES', name: 'Eng. de Software', semesters: 8 },
  { code: 'ADS', name: 'ADS', semesters: 5 },
]

// ─── Score ────────────────────────────────────────────────────────────────────

function calcScore(slots: SubjectSlot[], selections: Selections): number | null {
  const rated = slots.filter((s) => {
    const tid = selections[s.subject_id]
    if (!tid) return false
    return s.teachers.find((t) => t.teacher_id === tid && t.review_count > 0)
  })
  if (!rated.length) return null
  return rated.reduce((a, s) => {
    const t = s.teachers.find((t) => t.teacher_id === selections[s.subject_id])!
    return a + t.avg_rating
  }, 0) / rated.length
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

function ratingColor(n: number) {
  if (n >= 4) return 'text-brand-400'
  if (n >= 3) return 'text-amber-400'
  return 'text-red-400'
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchSlotsForSemester(
  supabase: ReturnType<typeof createClient>,
  cvIds: string[],
  semNumber: number
): Promise<SubjectSlot[]> {
  if (!cvIds.length) return []

  const { data: semRows } = await (supabase as any)
    .from('semesters').select('id').in('curriculum_version_id', cvIds).eq('number', semNumber)
  const semIds = (semRows ?? []).map((r: any) => r.id)
  if (!semIds.length) return []

  const { data: csRows } = await (supabase as any)
    .from('curriculum_subjects').select('subject:subjects(id, code, name, type)').in('semester_id', semIds)

  const seenSubjectIds = new Set<string>()
  const subjects = (csRows ?? [])
    .map((r: any) => r.subject)
    .filter((s: any) => {
      if (!s || s.type !== 'mandatory' || seenSubjectIds.has(s.id)) return false
      seenSubjectIds.add(s.id)
      return true
    }) as Array<{ id: string; code: string; name: string }>

  if (!subjects.length) return []
  const subjectIds = subjects.map((s) => s.id)

  const [{ data: tsRows }, { data: revRows }] = await Promise.all([
    (supabase as any)
      .from('teacher_subjects').select('subject_id, teacher:teachers(id, name, active)').in('subject_id', subjectIds),
    (supabase as any)
      .from('reviews')
      .select('teacher_id, subject_id, rating_general, rating_didactics, rating_organization, rating_workload, rating_difficulty, would_recommend')
      .in('subject_id', subjectIds).eq('status', 'publicada'),
  ])

  type RevAgg = { sum: number; sumD: number; sumO: number; sumW: number; sumDiff: number; rec: number; count: number }
  const rMap = new Map<string, RevAgg>()
  for (const r of revRows ?? []) {
    const k = `${r.teacher_id}:${r.subject_id}`
    const cur = rMap.get(k) ?? { sum: 0, sumD: 0, sumO: 0, sumW: 0, sumDiff: 0, rec: 0, count: 0 }
    rMap.set(k, {
      sum: cur.sum + (r.rating_general ?? 0),
      sumD: cur.sumD + (r.rating_didactics ?? 0),
      sumO: cur.sumO + (r.rating_organization ?? 0),
      sumW: cur.sumW + (r.rating_workload ?? 0),
      sumDiff: cur.sumDiff + (r.rating_difficulty ?? 0),
      rec: cur.rec + (r.would_recommend ? 1 : 0),
      count: cur.count + 1,
    })
  }

  const active = (tsRows ?? []).filter((r: any) => r.teacher?.active)

  return subjects.map((subject) => {
    const seenIds = new Set<string>()
    const teachers: TeacherOption[] = active
      .filter((r: any) => {
        if (r.subject_id !== subject.id || !r.teacher?.id || seenIds.has(r.teacher.id)) return false
        seenIds.add(r.teacher.id)
        return true
      })
      .map((r: any) => {
        const e = rMap.get(`${r.teacher.id}:${subject.id}`)
        return {
          teacher_id: r.teacher.id,
          teacher_name: r.teacher.name,
          avg_rating: e ? e.sum / e.count : 0,
          avg_didactics: e ? e.sumD / e.count : 0,
          avg_organization: e ? e.sumO / e.count : 0,
          avg_workload: e ? e.sumW / e.count : 0,
          avg_difficulty: e ? e.sumDiff / e.count : 0,
          pct_recommend: e ? Math.round(e.rec / e.count * 100) : 0,
          review_count: e?.count ?? 0,
        }
      })
      .sort((a: TeacherOption, b: TeacherOption) => b.avg_rating - a.avg_rating)

    return { subject_id: subject.id, subject_name: subject.name, subject_code: subject.code, semester_num: semNumber, teachers }
  })
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function GradeBuilder({ gradeId }: { gradeId?: string }) {
  const [course, setCourse] = useState('BES')
  const [versions, setVersions] = useState<CurriculumVersion[]>([])
  const [activeSemesters, setActiveSemesters] = useState<number[]>([1])
  const [slots, setSlots] = useState<SubjectSlot[]>([])
  const [selections, setSelections] = useState<Selections>({})
  const [colorMap, setColorMap] = useState<ColorMap>({})
  const [slotConfigs, setSlotConfigs] = useState<SlotConfigs>({})
  const [loading, setLoading] = useState(false)
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [showMobileGrade, setShowMobileGrade] = useState(false)
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null) // `${subjectId}:${teacherId}`
  const [saveName, setSaveName] = useState('Minha grade')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [displayCache, setDisplayCache] = useState<Record<string, { subject_name: string; subject_code: string; teacher_name: string; colorIdx: number }>>({})

  const maxSemesters = COURSES.find((c) => c.code === course)?.semesters ?? 8

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: courseRow } = await (supabase as any)
        .from('courses').select('id').eq('code', course).single()
      if (!courseRow) { setVersions([]); return }
      const { data } = await (supabase as any)
        .from('curriculum_versions').select('id, name, shift')
        .eq('course_id', courseRow.id).eq('active', true)
      setVersions(data ?? [])
    }
    load()
    setActiveSemesters([1])
    setSlots([])
    setSelections({})
    setColorMap({})
    setSlotConfigs({})
    setDisplayCache({})
    setExpandedSchedule(null)
  }, [course])

  useEffect(() => {
    if (!versions.length || !activeSemesters.length) return
    const cvIds = versions.map((v) => v.id)
    setLoading(true)
    const supabase = createClient()
    Promise.all(activeSemesters.map((n) => fetchSlotsForSemester(supabase, cvIds, n)))
      .then((results) => {
        const merged = results.flat()
        setSlots(merged)
        setColorMap((prev) => {
          const next = { ...prev }
          let idx = Object.keys(next).length
          for (const s of merged) {
            if (!(s.subject_id in next)) { next[s.subject_id] = idx % SUBJECT_COLORS.length; idx++ }
          }
          return next
        })
      })
      .finally(() => setLoading(false))
  }, [versions, activeSemesters])

  useEffect(() => {
    if (!slots.length) return
    setDisplayCache((prev) => {
      const next = { ...prev }
      let changed = false
      for (const s of slots) {
        const tid = selections[s.subject_id]
        if (tid && !next[s.subject_id]) {
          const teacher = s.teachers.find((t) => t.teacher_id === tid)
          if (teacher) {
            next[s.subject_id] = {
              subject_name: s.subject_name,
              subject_code: s.subject_code,
              teacher_name: teacher.teacher_name,
              colorIdx: colorMap[s.subject_id] ?? 0,
            }
            changed = true
          }
        }
      }
      return changed ? next : prev
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots])

  // ─── Restaurar grade salva ────────────────────────────────────────────────
  useEffect(() => {
    if (!gradeId) return
    getSavedGrade(gradeId).then((saved) => {
      if (!saved) return
      setCourse(saved.course_code)
      setActiveSemesters(saved.semesters)
      setSaveName(saved.name)
      const newSelections: Selections = {}
      const newColorMap: ColorMap = {}
      const newSlotConfigs: SlotConfigs = {}
      const newDisplayCache: Record<string, { subject_name: string; subject_code: string; teacher_name: string; colorIdx: number }> = {}
      for (const item of saved.items) {
        newSelections[item.subject_id] = item.teacher_id
        newColorMap[item.subject_id] = item.colorIdx
        newSlotConfigs[item.subject_id] = { days: item.days, slotId: item.slotId, numSlots: item.numSlots }
        newDisplayCache[item.subject_id] = {
          subject_name: item.subject_name,
          subject_code: item.subject_code,
          teacher_name: item.teacher_name,
          colorIdx: item.colorIdx,
        }
      }
      setSelections(newSelections)
      setColorMap(newColorMap)
      setSlotConfigs(newSlotConfigs)
      setDisplayCache(newDisplayCache)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeId])

  // ─── ScheduleMap ──────────────────────────────────────────────────────────
  const scheduleMap: ScheduleMap = {}
  for (const [subject_id, config] of Object.entries(slotConfigs)) {
    if (!config.days.length) continue
    const cached = displayCache[subject_id]
    if (!cached) continue
    const entry: ScheduleSlot = {
      subject_id,
      subject_name: cached.subject_name,
      subject_code: cached.subject_code,
      teacher_name: cached.teacher_name,
      colorIdx: cached.colorIdx,
    }
    for (const day of config.days) {
      for (let i = 0; i < config.numSlots; i++) {
        const slotIdx = config.slotId + i
        if (slotIdx < ALL_SLOTS.length) scheduleMap[`${day}:${slotIdx}`] = entry
      }
    }
  }

  // ─── Conflito de horários ─────────────────────────────────────────────────
  function getConflict(subjectId: string, days: string[], slotId: number, numSlots: number): string | null {
    for (const [sid, cfg] of Object.entries(slotConfigs)) {
      if (sid === subjectId || !cfg.days.length) continue
      for (const day of days) {
        if (!cfg.days.includes(day)) continue
        for (let i = 0; i < numSlots; i++) {
          for (let j = 0; j < cfg.numSlots; j++) {
            if (slotId + i === cfg.slotId + j) return sid
          }
        }
      }
    }
    return null
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function toggleSemester(n: number) {
    setActiveSemesters((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n].sort((a, b) => a - b))
  }

  function selectTeacher(subject_id: string, teacher_id: string | null) {
    setSelections((p) => ({ ...p, [subject_id]: teacher_id }))
    if (!teacher_id) {
      setSlotConfigs((p) => { const n = { ...p }; delete n[subject_id]; return n })
      setDisplayCache((p) => { const n = { ...p }; delete n[subject_id]; return n })
      if (expandedSchedule === subject_id) setExpandedSchedule(null)
    } else {
      const slot = slots.find((s) => s.subject_id === subject_id)
      const teacher = slot?.teachers.find((t) => t.teacher_id === teacher_id)
      if (slot && teacher) {
        const colorIdx = colorMap[subject_id] ?? 0
        setDisplayCache((p) => ({
          ...p,
          [subject_id]: {
            subject_name: slot.subject_name,
            subject_code: slot.subject_code,
            teacher_name: teacher.teacher_name,
            colorIdx,
          },
        }))
      }
    }
  }

  function updateSlotConfig(subject_id: string, patch: Partial<SlotConfig>) {
    setSlotConfigs((p) => ({
      ...p,
      [subject_id]: { ...({ days: [] as string[], slotId: 0, numSlots: 1 }), ...p[subject_id], ...patch },
    }))
  }

  function toggleDay(subject_id: string, day: string) {
    const cur = slotConfigs[subject_id]?.days ?? []
    const next = cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day]
    updateSlotConfig(subject_id, { days: next })
  }

  function handlePrint() { window.print() }

  async function handleSave() {
    setSaving(true)
    setSavedMsg(null)
    const items = slots
      .filter((s) => selections[s.subject_id] && slotConfigs[s.subject_id]?.days.length > 0)
      .map((s) => {
        const cfg = slotConfigs[s.subject_id]
        const cached = displayCache[s.subject_id]
        return {
          subject_id: s.subject_id,
          teacher_id: selections[s.subject_id]!,
          subject_code: cached?.subject_code ?? s.subject_code,
          subject_name: cached?.subject_name ?? s.subject_name,
          teacher_name: cached?.teacher_name ?? '',
          days: cfg.days,
          slotId: cfg.slotId,
          numSlots: cfg.numSlots,
          colorIdx: cached?.colorIdx ?? 0,
        }
      })
    const result = await saveGrade(saveName, course, activeSemesters, items)
    setSaving(false)
    if ('error' in result) setSavedMsg('Erro ao salvar. Tente novamente.')
    else setSavedMsg('Grade salva! Acesse em /perfil.')
  }

  const score = calcScore(slots, selections)
  const selectedCount = Object.values(selections).filter(Boolean).length
  const sc = score !== null ? scoreStyle(score) : null
  const bySemester = activeSemesters.reduce<Record<number, SubjectSlot[]>>((acc, n) => {
    acc[n] = slots.filter((s) => s.semester_num === n)
    return acc
  }, {})
  const placedCount = Object.keys(slotConfigs).filter((id) => slotConfigs[id].days.length > 0).length

  return (
    <>
      {/* ── Área de impressão ─────────────────────────────────────────────── */}
      <div className="hidden print:block p-6">
        <h1 className="text-xl font-bold mb-1">Minha Grade — {course}</h1>
        <p className="text-sm text-fg-muted mb-4">{activeSemesters.map((n) => `${n}º`).join(', ')} Semestre</p>
        <ScheduleGrid scheduleMap={scheduleMap} onRemove={() => {}} compact />
        <p className="text-[10px] text-fg-subtle text-right mt-4">
          MeuSemestreUCSAL · {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* ── Interface principal ───────────────────────────────────────────── */}
      <div className="print:hidden container-page py-10 max-w-4xl pb-24 lg:pb-10">

        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-fg mb-1">Monte sua grade</h1>
            <p className="text-fg-muted text-sm">Escolha professores e defina os horários das aulas.</p>
          </div>
          {placedCount > 0 && (
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-edge rounded-xl text-sm font-medium text-fg-muted hover:text-fg hover:border-fg-muted transition-all flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir grade
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">

          {/* ── Esquerda: Controles + Disciplinas ── */}
          <div className="min-w-0 space-y-5">

            {/* Controles */}
            <div className="bg-surface border border-edge rounded-2xl p-4 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider mb-2">Curso</p>
                <div className="flex gap-2">
                  {COURSES.map((c) => (
                    <button key={c.code} onClick={() => setCourse(c.code)}
                      className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                        course === c.code ? 'bg-brand-600 border-brand-600 text-white'
                          : 'bg-canvas border-edge text-fg-muted hover:border-brand-400 hover:text-brand-400'
                      }`}>{c.code}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider mb-2">
                  Semestres <span className="font-normal normal-case">(selecione um ou mais)</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => toggleSemester(n)}
                      className={`w-9 h-9 rounded-lg border text-sm font-bold transition-all ${
                        activeSemesters.includes(n) ? 'bg-accent-500 border-accent-500 text-white'
                          : 'bg-canvas border-edge text-fg-muted hover:border-accent-400 hover:text-accent-400'
                      }`}>{n}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Score */}
            {score !== null && sc && (
              <div className={`px-5 py-3.5 rounded-2xl border flex items-center justify-between gap-4 ${sc.badge}`}>
                <div>
                  <span className="text-sm font-bold">{scoreLabel(score)}</span>
                  <span className="text-xs opacity-60 ml-2">
                    {selectedCount} professor{selectedCount !== 1 ? 'es' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
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
              <div className="flex flex-col items-center py-12 gap-3 text-fg-muted">
                <div className="w-8 h-8 border-2 border-edge border-t-brand-400 rounded-full animate-spin" />
                <span className="text-sm">Carregando...</span>
              </div>
            )}

            {/* Disciplinas */}
            {!loading && activeSemesters.map((semNum) => {
              const semSlots = bySemester[semNum] ?? []
              if (!semSlots.length) return null
              return (
                <div key={semNum}>
                  {activeSemesters.length > 1 && (
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{semNum}</span>
                      </div>
                      <h2 className="text-sm font-semibold text-fg">{semNum}º Semestre</h2>
                    </div>
                  )}
                  <div className="space-y-2">
                    {semSlots.map((slot) => {
                      const selTid = selections[slot.subject_id]
                      const selTeacher = slot.teachers.find((t) => t.teacher_id === selTid)
                      const colorIdx = colorMap[slot.subject_id] ?? 0
                      const color = SUBJECT_COLORS[colorIdx]
                      const config = slotConfigs[slot.subject_id]
                      const isExpanded = expandedSchedule === slot.subject_id
                      const isPlaced = config?.days.length > 0

                      const conflictId = isExpanded && config?.days.length
                        ? getConflict(slot.subject_id, config.days, config.slotId ?? 0, config.numSlots ?? 1)
                        : null
                      const conflictCode = conflictId ? (displayCache[conflictId]?.subject_code ?? '?') : null

                      return (
                        <div key={slot.subject_id}
                          className={`bg-surface border rounded-2xl overflow-hidden transition-all ${
                            selTid ? 'border-brand-600' : 'border-edge'
                          }`}>

                          {/* Cabeçalho da disciplina */}
                          <div className="flex items-center gap-3 px-4 py-3 border-b border-edge-muted">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${selTid ? color.bg : 'bg-overlay'}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-mono text-fg-subtle">{slot.subject_code}</p>
                              <p className="text-sm font-semibold text-fg leading-tight truncate">{slot.subject_name}</p>
                            </div>
                            {selTid && (
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isPlaced && !isExpanded && (
                                  <span className="text-xs text-brand-400 font-semibold">
                                    ✓ {config.days.join('/')} {ALL_SLOTS.find(s => s.id === config.slotId)?.label}
                                  </span>
                                )}
                                <button
                                  onClick={() => setExpandedSchedule(isExpanded ? null : slot.subject_id)}
                                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                                    isExpanded ? `${color.bg} text-white`
                                      : isPlaced ? 'bg-brand-100 border border-brand-400 text-brand-400 hover:bg-brand-200'
                                        : 'bg-accent-500 text-white hover:bg-accent-600'
                                  }`}>
                                  {isExpanded ? '✕ Fechar' : isPlaced ? '✏ Editar horário' : '+ Definir horário'}
                                </button>
                                <button onClick={() => selectTeacher(slot.subject_id, null)}
                                  className="text-xs px-2.5 py-1.5 rounded-lg border border-edge text-fg-muted hover:border-red-500 hover:text-red-400 hover:bg-[#2d0a0a] transition-all font-medium">
                                  Limpar
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Lista de professores */}
                          {!slot.teachers.length ? (
                            <p className="px-4 py-3 text-xs text-fg-subtle italic">
                              Nenhum professor vinculado.{' '}
                              <Link href="/buscar" className="text-accent-400 hover:underline not-italic">Ver na busca</Link>
                            </p>
                          ) : (
                            <div className="divide-y divide-edge-muted">
                              {slot.teachers.map((teacher) => {
                                const isSel = selTid === teacher.teacher_id
                                const infoKey = `${slot.subject_id}:${teacher.teacher_id}`
                                const isInfoOpen = expandedTeacher === infoKey
                                return (
                                  <div key={teacher.teacher_id}>
                                    <div className={`flex items-center transition-colors ${isSel ? 'bg-brand-100' : 'hover:bg-surface-2'}`}>
                                      {/* Selecionar professor */}
                                      <button
                                        onClick={() => selectTeacher(slot.subject_id, isSel ? null : teacher.teacher_id)}
                                        className="flex-1 flex items-center justify-between px-4 py-3 text-left min-w-0">
                                        <div className="flex items-center gap-3">
                                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                            isSel ? 'border-brand-400 bg-brand-400' : 'border-edge'
                                          }`}>
                                            {isSel && (
                                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
                                      {/* Botão + info */}
                                      {teacher.review_count > 0 && (
                                        <button
                                          onClick={() => setExpandedTeacher(isInfoOpen ? null : infoKey)}
                                          className={`mr-3 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex-shrink-0 flex items-center gap-1 ${
                                            isInfoOpen
                                              ? 'bg-accent-500 border-accent-500 text-white shadow-sm'
                                              : 'bg-accent-100 border-accent-400 text-accent-400 hover:bg-accent-500 hover:text-white'
                                          }`}>
                                          {isInfoOpen ? '▲ fechar' : 'ℹ info'}
                                        </button>
                                      )}
                                    </div>

                                    {/* Painel + info */}
                                    {isInfoOpen && (
                                      <div className="px-4 pb-3 pt-2 bg-surface-2 border-t border-edge-muted space-y-2">
                                        <div className="grid grid-cols-2 gap-1.5">
                                          {[
                                            { label: 'Didática', value: teacher.avg_didactics },
                                            { label: 'Organização', value: teacher.avg_organization },
                                            { label: 'Carga', value: teacher.avg_workload },
                                            { label: 'Dificuldade', value: teacher.avg_difficulty },
                                          ].map((m) => (
                                            <div key={m.label} className="flex items-center justify-between bg-surface rounded-lg px-2.5 py-1.5">
                                              <span className="text-[11px] text-fg-subtle">{m.label}</span>
                                              <span className={`text-xs font-bold tabular-nums ${ratingColor(m.value)}`}>{m.value.toFixed(1)}</span>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="flex items-center justify-between px-0.5">
                                          <span className={`text-xs font-semibold ${
                                            teacher.pct_recommend >= 70 ? 'text-brand-400'
                                              : teacher.pct_recommend >= 40 ? 'text-amber-400' : 'text-red-400'
                                          }`}>{teacher.pct_recommend}% recomendariam</span>
                                          <Link href={`/professor/${teacher.teacher_id}`}
                                            className="text-xs text-accent-400 hover:underline">
                                            Ver perfil completo →
                                          </Link>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Seletor de horário inline */}
                          {isExpanded && selTeacher && (
                            <div className="px-4 py-4 bg-surface-2 border-t border-edge-muted space-y-3">
                              <p className="text-xs font-semibold text-fg-muted">
                                Horário de <span className="text-fg">{slot.subject_code}</span> com {selTeacher.teacher_name.split(' ')[0]}
                              </p>

                              {/* Aviso de conflito */}
                              {conflictCode && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-[#2d0a0a] border border-red-700 rounded-xl text-xs text-red-400">
                                  ⚠ Conflito com <span className="font-bold ml-1">{conflictCode}</span> — altere os dias ou o horário
                                </div>
                              )}

                              {/* Dias */}
                              <div>
                                <p className="text-[11px] text-fg-subtle mb-1.5">Dias</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {DAYS.map((day) => {
                                    const dayLabels: Record<string, string> = { SEG:'Seg', TER:'Ter', QUA:'Qua', QUI:'Qui', SEX:'Sex', SAB:'Sáb' }
                                    const active = config?.days.includes(day) ?? false
                                    const dayConflict = !active && !!getConflict(
                                      slot.subject_id, [day], config?.slotId ?? 0, config?.numSlots ?? 1
                                    )
                                    return (
                                      <button key={day} onClick={() => toggleDay(slot.subject_id, day)}
                                        title={dayConflict ? 'Conflito de horário' : undefined}
                                        className={`px-2.5 h-8 rounded-lg border text-xs font-bold transition-all ${
                                          active ? `${color.bg} text-white border-transparent`
                                            : dayConflict ? 'border-red-700 text-red-400 bg-[#2d0a0a]'
                                              : 'border-edge text-fg-muted hover:border-fg-muted'
                                        }`}>{dayLabels[day]}{dayConflict ? ' ⚠' : ''}</button>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* Horário de início */}
                              <div>
                                <p className="text-[11px] text-fg-subtle mb-1.5">Horário de início</p>
                                <div className="space-y-2">
                                  {PERIODS.map((period) => (
                                    <div key={period.label}>
                                      <p className="text-[10px] text-fg-subtle mb-1">{period.label}</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {period.slots.map((ts) => {
                                          const active = (config?.slotId ?? -1) === ts.id
                                          const slotConflict = !active && (config?.days.length ?? 0) > 0
                                            ? !!getConflict(slot.subject_id, config!.days, ts.id, config?.numSlots ?? 1)
                                            : false
                                          return (
                                            <button key={ts.id} onClick={() => updateSlotConfig(slot.subject_id, { slotId: ts.id })}
                                              title={slotConflict ? 'Conflito de horário' : undefined}
                                              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                                                active ? `${color.bg} text-white border-transparent`
                                                  : slotConflict ? 'border-red-700 text-red-400 bg-[#2d0a0a]'
                                                    : 'border-edge text-fg-muted hover:border-fg-muted'
                                              }`}>{ts.label}{slotConflict ? ' ⚠' : ''}</button>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Duração */}
                              <div>
                                <p className="text-[11px] text-fg-subtle mb-1.5">Duração por dia</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    { v: 1, label: '1 aula (75 min)' },
                                    { v: 2, label: '2 aulas (2h30)' },
                                    { v: 3, label: '3 aulas (3h45)' },
                                    { v: 4, label: '4 aulas (5h)' },
                                  ].map(({ v, label }) => {
                                    const active = (config?.numSlots ?? 1) === v
                                    return (
                                      <button key={v} onClick={() => updateSlotConfig(slot.subject_id, { numSlots: v })}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                          active ? `${color.bg} text-white border-transparent`
                                            : 'border-edge text-fg-muted hover:border-fg-muted'
                                        }`}>{label}</button>
                                    )
                                  })}
                                </div>
                              </div>

                              <button
                                onClick={() => !conflictCode && setExpandedSchedule(null)}
                                disabled={!!conflictCode}
                                className={`w-full py-2 rounded-xl text-sm font-bold transition-colors mt-1 ${
                                  conflictCode
                                    ? 'bg-[#2d0a0a] border border-red-700 text-red-400 cursor-not-allowed'
                                    : 'bg-brand-600 text-white hover:bg-brand-700'
                                }`}>
                                {conflictCode ? `⚠ Resolva o conflito com ${conflictCode} antes de confirmar` : '✓ Confirmar horário'}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {!loading && slots.length > 0 && slots.every((s) => s.teachers.every((t) => t.review_count === 0)) && (
              <div className="bg-accent-100 border border-accent-300 rounded-2xl px-5 py-4 text-sm text-accent-400">
                Nenhuma avaliação ainda.{' '}
                <Link href="/avaliar" className="font-semibold underline">Seja o primeiro!</Link>
              </div>
            )}
          </div>

          {/* ── Direita: Grade semanal (sticky no desktop) ── */}
          <div className="lg:sticky lg:top-20 h-fit space-y-3">
            <div className="bg-surface border border-edge rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-fg">Grade semanal</h2>
                <span className="text-xs text-fg-subtle">Manhã + Noite</span>
              </div>
              <ScheduleGrid
                scheduleMap={scheduleMap}
                onRemove={(key) => {
                  const cell = scheduleMap[key]
                  if (cell) setSlotConfigs((p) => { const n = { ...p }; delete n[cell.subject_id]; return n })
                }}
              />
              {placedCount === 0 && (
                <p className="text-xs text-fg-subtle text-center mt-3 italic">
                  Selecione um professor e clique em "+ horário"
                </p>
              )}
            </div>

            {selectedCount > 0 && (
              <div className="bg-surface border border-edge rounded-2xl p-4">
                <p className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wide mb-2">Selecionados</p>
                <div className="space-y-1.5">
                  {slots.filter((s) => selections[s.subject_id]).map((s) => {
                    const colorIdx = colorMap[s.subject_id] ?? 0
                    const teacher = s.teachers.find((t) => t.teacher_id === selections[s.subject_id])
                    const cfg = slotConfigs[s.subject_id]
                    return (
                      <div key={s.subject_id} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded flex-shrink-0 ${SUBJECT_COLORS[colorIdx].bg}`} />
                        <span className="text-xs font-mono text-fg-muted">{s.subject_code}</span>
                        <span className="text-xs text-fg-subtle truncate flex-1">{teacher?.teacher_name.split(' ')[0]}</span>
                        {cfg?.days.length > 0 && <span className="text-[10px] text-brand-400">✓</span>}
                        {teacher?.review_count ? (
                          <span className={`text-xs font-bold flex-shrink-0 ${
                            teacher.avg_rating >= 4 ? 'text-brand-400'
                              : teacher.avg_rating >= 3 ? 'text-amber-400' : 'text-red-400'
                          }`}>{teacher.avg_rating.toFixed(1)}</span>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedCount > 0 && (
              <button onClick={() => setShowSummary(true)}
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-accent-500 text-white font-bold text-sm rounded-2xl hover:opacity-90 transition-opacity shadow-lg">
                Ver resumo da grade →
              </button>
            )}
          </div>
        </div>

        {/* ── Modal de Resumo ───────────────────────────────────────────────── */}
        {showSummary && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowSummary(false) }}>
            <div className="bg-canvas border border-edge rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="px-6 pt-6 pb-4 border-b border-edge-muted flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-fg">Resumo da grade</h2>
                  <p className="text-sm text-fg-muted mt-0.5">
                    {course} · {activeSemesters.map((n) => `${n}º`).join(', ')} semestre
                    {score !== null && (
                      <span className={`ml-3 font-bold ${score >= 4 ? 'text-brand-400' : score >= 3 ? 'text-amber-400' : 'text-red-400'}`}>
                        Score médio: {score.toFixed(1)} ★
                      </span>
                    )}
                  </p>
                </div>
                <button onClick={() => setShowSummary(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border border-edge text-fg-muted hover:text-fg hover:border-fg-muted transition-all text-lg">
                  ✕
                </button>
              </div>
              <div className="px-6 py-4 border-b border-edge-muted overflow-x-auto">
                <ScheduleGrid scheduleMap={scheduleMap} onRemove={() => {}} compact />
              </div>
              <div className="px-6 py-4 space-y-3">
                <p className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider">Disciplinas e professores</p>
                {slots.filter((s) => selections[s.subject_id]).map((s) => {
                  const colorIdx = colorMap[s.subject_id] ?? 0
                  const teacher = s.teachers.find((t) => t.teacher_id === selections[s.subject_id])
                  const cfg = slotConfigs[s.subject_id]
                  const slotLabel = cfg?.days.length > 0
                    ? `${cfg.days.join(', ')} · ${ALL_SLOTS.find(sl => sl.id === cfg.slotId)?.range ?? ''}`
                    : 'Horário não definido'
                  return (
                    <div key={s.subject_id} className="flex items-start gap-3 bg-surface border border-edge-muted rounded-2xl p-4">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${SUBJECT_COLORS[colorIdx].bg}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-fg-subtle">{s.subject_code}</span>
                          <span className="text-sm font-semibold text-fg">{s.subject_name}</span>
                        </div>
                        <p className="text-xs text-fg-muted mt-0.5">
                          {teacher ? teacher.teacher_name : <span className="italic text-fg-subtle">Prof. não selecionado</span>}
                          {teacher?.review_count ? (
                            <span className={`ml-2 font-bold ${
                              teacher.avg_rating >= 4 ? 'text-brand-400'
                                : teacher.avg_rating >= 3 ? 'text-amber-400' : 'text-red-400'
                            }`}>{teacher.avg_rating.toFixed(1)} ★</span>
                          ) : null}
                        </p>
                        <p className={`text-xs mt-1 ${cfg?.days.length > 0 ? 'text-brand-400' : 'text-fg-subtle italic'}`}>
                          {slotLabel}{cfg?.numSlots > 1 ? ` (${cfg.numSlots} aulas)` : ''}
                        </p>
                      </div>
                      <Link href={`/professor/${teacher?.teacher_id ?? ''}`}
                        className="text-xs text-accent-400 hover:underline flex-shrink-0 self-center">
                        Ver perfil →
                      </Link>
                    </div>
                  )
                })}
              </div>
              <div className="px-6 pb-6 space-y-3">
                <div className="flex gap-2">
                  <input value={saveName} onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Nome da grade..."
                    className="flex-1 px-3 py-2 bg-canvas border border-edge rounded-xl text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400" />
                  <button onClick={handleSave} disabled={saving}
                    className="px-4 py-2 bg-accent-500 text-white text-sm font-bold rounded-xl hover:bg-accent-600 transition-colors disabled:opacity-50 whitespace-nowrap">
                    {saving ? 'Salvando...' : '💾 Salvar'}
                  </button>
                </div>
                {savedMsg && (
                  <p className={`text-xs px-3 py-2 rounded-lg border ${savedMsg.startsWith('Erro') ? 'bg-[#2d0a0a] border-red-700 text-red-400' : 'bg-brand-100 border-brand-300 text-brand-400'}`}>
                    {savedMsg}
                  </p>
                )}
                <div className="flex gap-3">
                  <button onClick={handlePrint}
                    className="flex-1 py-2.5 bg-surface border border-edge rounded-xl text-sm font-semibold text-fg-muted hover:border-fg-muted hover:text-fg transition-all flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimir
                  </button>
                  <button onClick={() => setShowSummary(false)}
                    className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors">
                    Continuar editando
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile: barra flutuante no bottom ─────────────────────────────────── */}
      <div className={`lg:hidden print:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
        placedCount > 0 ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="bg-canvas/95 backdrop-blur border-t border-edge px-4 py-3 flex items-center justify-between gap-3 shadow-2xl">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex -space-x-1">
              {Object.keys(slotConfigs).filter(id => slotConfigs[id].days.length).slice(0, 5).map((id) => (
                <div key={id} className={`w-3 h-3 rounded-full border border-canvas ${SUBJECT_COLORS[colorMap[id] ?? 0].bg}`} />
              ))}
            </div>
            <span className="text-sm font-semibold text-fg truncate">
              {placedCount} na grade
              {score !== null && sc && <span className={`ml-2 font-bold ${sc.num}`}>· {score.toFixed(1)} ★</span>}
            </span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setShowSummary(true)}
              className="px-3 py-1.5 bg-surface border border-edge text-xs font-semibold text-fg-muted rounded-lg hover:border-fg-muted transition-all">
              Resumo
            </button>
            <button onClick={() => setShowMobileGrade(true)}
              className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-colors">
              Ver grade →
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile: modal da grade ─────────────────────────────────────────────── */}
      {showMobileGrade && (
        <div className="lg:hidden print:hidden fixed inset-0 z-50 bg-canvas flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-edge">
            <div>
              <h2 className="font-bold text-fg text-sm">Grade semanal</h2>
              {score !== null && sc && (
                <span className={`text-xs font-bold ${sc.num}`}>Score: {score.toFixed(1)} ★</span>
              )}
            </div>
            <button onClick={() => setShowMobileGrade(false)}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-edge text-fg-muted hover:text-fg text-lg">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <ScheduleGrid
              scheduleMap={scheduleMap}
              onRemove={(key) => {
                const cell = scheduleMap[key]
                if (cell) setSlotConfigs((p) => { const n = { ...p }; delete n[cell.subject_id]; return n })
              }}
            />
            {placedCount === 0 && (
              <p className="text-xs text-fg-subtle text-center mt-6 italic">
                Nenhuma disciplina com horário definido ainda.
              </p>
            )}
          </div>
          {selectedCount > 0 && (
            <div className="border-t border-edge px-4 py-3 space-y-1.5 max-h-36 overflow-y-auto">
              {slots.filter((s) => selections[s.subject_id]).map((s) => {
                const colorIdx = colorMap[s.subject_id] ?? 0
                const teacher = s.teachers.find((t) => t.teacher_id === selections[s.subject_id])
                const cfg = slotConfigs[s.subject_id]
                return (
                  <div key={s.subject_id} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded flex-shrink-0 ${SUBJECT_COLORS[colorIdx].bg}`} />
                    <span className="text-xs font-mono text-fg-muted">{s.subject_code}</span>
                    <span className="text-xs text-fg-subtle truncate flex-1">{teacher?.teacher_name.split(' ')[0]}</span>
                    {cfg?.days.length > 0 && <span className="text-[10px] text-brand-400">✓</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}
