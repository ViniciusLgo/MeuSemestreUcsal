'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { submitReview } from '@/lib/actions/student'

// ─── Types ────────────────────────────────────────────────────────────────────

type Teacher = { id: string; name: string; slug: string }
type Subject = { id: string; code: string; name: string; modality: 'presencial' | 'ead' | 'hibrida' }
type AssessmentStyleBase = 'prova' | 'projeto' | 'trabalho'
type ExamType = 'multipla_escolha' | 'dissertativa' | 'pratica' | 'oral'

type FormData = {
  teacher_id: string
  subject_id: string
  // Notas (step 2)
  rating_general: number
  rating_didactics: number
  rating_organization: number
  rating_workload: number
  rating_difficulty: number   // 2=Fácil, 3=Médio, 4=Difícil, 5=MARCO CAMARA
  // Sobre o professor (step 3)
  would_recommend: boolean | null
  teacher_absence: 'nunca' | 'raramente' | 'frequente' | null
  teacher_is_engaging: boolean | null
  is_easy_to_pass: 'sim' | 'mais_ou_menos' | 'nao' | null
  // Sobre a disciplina (step 3)
  attendance_pressure: 'baixa' | 'media' | 'alta' | null
  assessment_styles: AssessmentStyleBase[]
  exam_types: ExamType[]
  has_assignments: boolean | null
  has_activities: boolean | null
  comment: string
  // EAD
  had_in_person_event: boolean | null
  relevant_to_course: boolean | null
}

const emptyForm: FormData = {
  teacher_id: '',
  subject_id: '',
  rating_general: 0,
  rating_didactics: 0,
  rating_organization: 0,
  rating_workload: 0,
  rating_difficulty: 0,
  would_recommend: null,
  teacher_absence: null,
  teacher_is_engaging: null,
  is_easy_to_pass: null,
  attendance_pressure: null,
  assessment_styles: [],
  exam_types: [],
  has_assignments: null,
  has_activities: null,
  comment: '',
  had_in_person_event: null,
  relevant_to_course: null,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function starColor(n: number, active: boolean, max: number) {
  if (!active) return 'text-edge'
  if (max === 10) {
    if (n <= 4) return 'text-red-500'
    if (n <= 6) return 'text-amber-400'
    return 'text-brand-400'
  }
  // escala 1-5
  if (n <= 2) return 'text-red-500'
  if (n === 3) return 'text-amber-400'
  return 'text-brand-400'
}

function starLabel10(v: number) {
  if (!v) return ''
  if (v <= 2) return 'Péssimo'
  if (v <= 4) return 'Ruim'
  if (v <= 6) return 'Regular'
  if (v <= 8) return 'Bom'
  return 'Excelente'
}

function starLabel5(v: number) {
  if (!v) return ''
  if (v === 1) return 'Péssimo'
  if (v === 2) return 'Ruim'
  if (v === 3) return 'Regular'
  if (v === 4) return 'Bom'
  return 'Excelente'
}

function StarPicker({ value, onChange, label, max = 5 }: { value: number; onChange: (v: number) => void; label: string; max?: number }) {
  const [hover, setHover] = useState(0)
  const active = hover || value
  const is10 = max === 10

  const labelColor = is10
    ? (active <= 4 ? '#ef4444' : active <= 6 ? '#f59e0b' : '#3fb950')
    : (active <= 2 ? '#ef4444' : active === 3 ? '#f59e0b' : '#3fb950')

  const labelText = is10 ? starLabel10(value) : starLabel5(value)

  return (
    <div>
      <p className="text-sm font-medium text-fg mb-2">{label}</p>
      <div className="flex flex-wrap gap-0.5 items-center">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button"
            onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className={`transition-transform hover:scale-110 ${is10 ? 'text-xl' : 'text-2xl'}`}>
            <span className={starColor(n, active >= n, max)}>★</span>
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm font-semibold self-center" style={{ color: labelColor }}>
            {value}/{max} — {labelText}
          </span>
        )}
      </div>
      {is10 && (
        <p className="text-xs text-fg-subtle mt-1">1–4 negativo · 5–6 regular · 7–10 positivo</p>
      )}
    </div>
  )
}

const DIFFICULTY_OPTIONS = [
  { value: 2, label: 'Fácil', emoji: '😌', color: 'border-brand-400 bg-brand-100 text-brand-400' },
  { value: 3, label: 'Médio', emoji: '😐', color: 'border-amber-400 bg-amber-100 text-amber-500' },
  { value: 4, label: 'Difícil', emoji: '😤', color: 'border-orange-400 bg-orange-100 text-orange-500' },
  { value: 5, label: 'MARCO CAMARA', sublabel: 'modo HARDCORE', emoji: '💀', color: 'border-red-500 bg-red-100 text-red-500' },
] as const

function DifficultyPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="text-sm font-medium text-fg mb-2">Dificuldade da disciplina</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {DIFFICULTY_OPTIONS.map((opt) => {
          const active = value === opt.value
          return (
            <button key={opt.value} type="button" onClick={() => onChange(active ? 0 : opt.value)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 transition-all text-center',
                active ? opt.color : 'border-edge bg-surface text-fg-muted hover:border-fg-muted'
              )}>
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-xs font-bold leading-tight">{opt.label}</span>
              {'sublabel' in opt && opt.sublabel && (
                <span className="text-[9px] opacity-70 leading-tight">{opt.sublabel}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ToggleGroup<T extends string>({
  label, subtitle, value, options, onChange, multi = false,
}: {
  label: string
  subtitle?: string
  value: T | T[] | null
  options: { value: T; label: string; emoji?: string }[]
  onChange: (v: T) => void
  multi?: boolean
}) {
  const isActive = (v: T) => Array.isArray(value) ? value.includes(v) : value === v
  return (
    <div>
      <p className="text-sm font-medium text-fg mb-0.5">{label}</p>
      {subtitle && <p className="text-xs text-fg-subtle mb-2">{subtitle}</p>}
      {!subtitle && <div className="mb-2" />}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5',
              isActive(opt.value)
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-surface text-fg-muted border-edge hover:border-brand-400 hover:text-brand-400'
            )}>
            {opt.emoji && <span>{opt.emoji}</span>}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function BoolPicker({ label, value, onChange, options }: {
  label: string
  value: boolean | null
  onChange: (v: boolean) => void
  options?: [string, string]
}) {
  const [yes, no] = options ?? ['Sim', 'Não']
  return (
    <div>
      <p className="text-sm font-medium text-fg mb-2">{label}</p>
      <div className="flex gap-2">
        {[{ v: true, l: yes }, { v: false, l: no }].map(({ v, l }) => (
          <button key={l} type="button" onClick={() => onChange(v)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
              value === v ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-surface text-fg-muted border-edge hover:border-brand-400 hover:text-brand-400'
            )}>{l}</button>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AvaliarPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [profileVersionId, setProfileVersionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const set = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }))

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/entrar?redirectTo=/avaliar'); return }

      const [profileRes, tsRes] = await Promise.all([
        (supabase.from('profiles') as any).select('curriculum_version_id, course_id').eq('id', user.id).single(),
        (supabase.from('teachers') as any).select('id, name, slug').eq('active', true).order('name'),
      ])

      if (!profileRes.data?.course_id) {
        router.push('/perfil/configurar?redirectTo=/avaliar'); return
      }
      setProfileVersionId(profileRes.data.curriculum_version_id)
      setTeachers(tsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!form.teacher_id) { setSubjects([]); return }
    ;(supabase as any)
      .from('teacher_subjects')
      .select('subject:subjects(id, code, name, modality)')
      .eq('teacher_id', form.teacher_id)
      .eq('active', true)
      .then(({ data }: { data: Array<{ subject: Subject | null }> | null }) => {
        const seen = new Set<string>()
        const list = (data ?? []).map((r) => r.subject).filter((s): s is Subject => {
          if (!s || seen.has(s.id)) return false
          seen.add(s.id); return true
        })
        setSubjects(list)
        set({ subject_id: '' })
      })
  }, [form.teacher_id])

  const selectedSubject = subjects.find((s) => s.id === form.subject_id)
  const isEad = selectedSubject?.modality === 'ead'
  const step1Valid = !!form.teacher_id && !!form.subject_id
  const step2Valid = form.rating_general > 0 && form.rating_didactics > 0 &&
    form.rating_organization > 0 && form.rating_workload > 0 && form.rating_difficulty > 0

  function toggleMulti<T extends string>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
  }

  async function handleSubmit() {
    if (form.would_recommend === null) {
      setError('Informe se você recomendaria este professor.'); return
    }
    setSubmitting(true); setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/entrar'); return }

    const assessmentStyle = form.assessment_styles.length === 0
      ? null
      : form.assessment_styles.length === 1
        ? form.assessment_styles[0]
        : 'misto'

    const result = await submitReview({
      teacher_id: form.teacher_id,
      subject_id: form.subject_id,
      curriculum_version_id: profileVersionId,
      rating_general: form.rating_general,
      rating_didactics: form.rating_didactics,
      rating_organization: form.rating_organization,
      rating_workload: form.rating_workload,
      rating_difficulty: form.rating_difficulty,
      would_recommend: form.would_recommend!,
      teacher_absence: form.teacher_absence,
      teacher_is_engaging: form.teacher_is_engaging,
      is_easy_to_pass: form.is_easy_to_pass,
      attendance_pressure: form.attendance_pressure,
      assessment_style: assessmentStyle,
      exam_types: form.exam_types.length ? form.exam_types : null,
      has_assignments: form.has_assignments,
      has_activities: form.has_activities,
      comment: form.comment.trim() || null,
      had_in_person_event: isEad ? form.had_in_person_event : null,
      relevant_to_course: isEad ? form.relevant_to_course : null,
    })

    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSuccess(true)
  }

  if (success) {
    const teacher = teachers.find((t) => t.id === form.teacher_id)
    return (
      <div className="container-page py-20 text-center max-w-md mx-auto">
        <div className="text-5xl mb-5">🎉</div>
        <h1 className="text-2xl font-bold text-fg mb-3">Avaliação enviada!</h1>
        <p className="text-fg-muted mb-8">Obrigado por contribuir com a comunidade UCSAL.</p>
        <div className="flex flex-col gap-3">
          {teacher && (
            <Link href={`/professor/${teacher.id}`}
              className="inline-flex items-center justify-center bg-brand-600 text-white font-semibold px-5 py-3 rounded-xl hover:bg-brand-500 transition-colors">
              Ver perfil de {teacher.name}
            </Link>
          )}
          <button onClick={() => { setForm(emptyForm); setStep(1); setSuccess(false) }}
            className="text-sm text-fg-subtle hover:text-fg-muted transition-colors">
            Avaliar outro professor
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-canvas">
        <div className="text-fg-muted text-sm">Carregando...</div>
      </div>
    )
  }

  const stepLabels = [
    { n: 1, label: 'Professor' },
    { n: 2, label: 'Notas' },
    { n: 3, label: 'Detalhes' },
  ]

  return (
    <div className="container-page py-10 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-8 text-sm">
        <Link href="/" className="text-fg-subtle hover:text-brand-400 transition-colors">Início</Link>
        <span className="text-edge">/</span>
        <span className="text-fg-muted">Avaliar professor</span>
      </div>

      <h1 className="text-3xl font-bold text-fg mb-2">Avaliar professor</h1>
      <p className="text-fg-muted text-sm mb-8">Sua identidade nunca será revelada. Avalie com honestidade.</p>

      {/* Steps */}
      <div className="flex items-center gap-3 mb-10">
        {stepLabels.map(({ n, label }, i, arr) => (
          <div key={n} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                step >= n ? 'bg-brand-600 text-white' : 'bg-surface-2 text-fg-subtle'
              )}>
                {step > n ? '✓' : n}
              </div>
              <span className={cn('text-sm font-medium hidden sm:block', step === n ? 'text-fg' : 'text-fg-subtle')}>
                {label}
              </span>
            </div>
            {i < arr.length - 1 && (
              <div className={cn('h-px w-8 flex-shrink-0', step > n ? 'bg-brand-600' : 'bg-overlay')} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Professor + Disciplina ─────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-fg mb-2">Professor</label>
            <select value={form.teacher_id} onChange={(e) => set({ teacher_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-canvas border border-edge rounded-xl text-fg focus:outline-none focus:ring-1 focus:ring-accent-400 focus:border-accent-400 text-sm transition-colors">
              <option value="">Selecione o professor...</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {form.teacher_id && (
            <div>
              <label className="block text-sm font-semibold text-fg mb-2">Disciplina</label>
              {subjects.length === 0 ? (
                <p className="text-sm text-fg-muted bg-surface border border-edge px-4 py-3 rounded-xl">
                  Nenhuma disciplina vinculada a este professor.
                </p>
              ) : (
                <div className="grid gap-2">
                  {subjects.map((s) => (
                    <button key={s.id} type="button" onClick={() => set({ subject_id: s.id })}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all',
                        form.subject_id === s.id ? 'border-brand-500 bg-brand-100' : 'border-edge bg-surface hover:border-fg-muted'
                      )}>
                      <div>
                        <span className={cn('text-sm font-semibold', form.subject_id === s.id ? 'text-brand-400' : 'text-fg')}>
                          {s.name}
                        </span>
                        <span className="text-xs text-fg-subtle ml-2 font-mono">{s.code}</span>
                      </div>
                      {s.modality === 'ead' && <Badge variant="ead">EAD</Badge>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button onClick={() => setStep(2)} size="lg" className="w-full" disabled={!step1Valid}>
            Próximo: Notas →
          </Button>
        </div>
      )}

      {/* ── Step 2: Notas ───────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-7">
          <div className="bg-surface border border-edge rounded-xl px-4 py-3 text-sm text-fg-muted">
            Avaliando <strong className="text-fg">{teachers.find((t) => t.id === form.teacher_id)?.name}</strong>
            {' '}em <strong className="text-fg">{selectedSubject?.name}</strong>
          </div>

          <StarPicker label="Nota geral" value={form.rating_general} onChange={(v) => set({ rating_general: v })} max={10} />
          <StarPicker label="Didática" value={form.rating_didactics} onChange={(v) => set({ rating_didactics: v })} />
          <StarPicker label="Organização das aulas" value={form.rating_organization} onChange={(v) => set({ rating_organization: v })} />
          <StarPicker label="Carga de trabalho" value={form.rating_workload} onChange={(v) => set({ rating_workload: v })} />
          <DifficultyPicker value={form.rating_difficulty} onChange={(v) => set({ rating_difficulty: v })} />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setStep(1)} size="lg" className="flex-1">← Voltar</Button>
            <Button onClick={() => setStep(3)} size="lg" className="flex-1" disabled={!step2Valid}>
              Próximo: Detalhes →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Detalhes ────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-7">
          <div className="bg-surface border border-edge rounded-xl px-4 py-3 text-sm text-fg-muted">
            Avaliando <strong className="text-fg">{teachers.find((t) => t.id === form.teacher_id)?.name}</strong>
            {' '}em <strong className="text-fg">{selectedSubject?.name}</strong>
          </div>

          {/* ── Sobre o professor ── */}
          <div className="space-y-5">
            <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">Sobre o professor</p>

            <BoolPicker label="Você recomendaria este professor?" value={form.would_recommend}
              onChange={(v) => set({ would_recommend: v })} options={['Sim, recomendo', 'Não recomendo']} />

            <ToggleGroup
              label="O professor costuma faltar?"
              value={form.teacher_absence}
              options={[
                { value: 'nunca', label: 'Nunca', emoji: '✅' },
                { value: 'raramente', label: 'Raramente', emoji: '🟡' },
                { value: 'frequente', label: 'Bastante', emoji: '🚨' },
              ]}
              onChange={(v) => set({ teacher_absence: form.teacher_absence === v ? null : v })}
            />

            <BoolPicker label="O professor é engajado / presente nas aulas?" value={form.teacher_is_engaging}
              onChange={(v) => set({ teacher_is_engaging: v })} options={['Sim, é engajado', 'Não, é enrolado/maguado']} />
          </div>

          {/* ── Sobre a disciplina ── */}
          <div className="space-y-5 pt-2 border-t border-edge-muted">
            <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider pt-2">Sobre a disciplina</p>

            <ToggleGroup
              label="É fácil de passar?"
              value={form.is_easy_to_pass}
              options={[
                { value: 'sim', label: 'Fácil', emoji: '😌' },
                { value: 'mais_ou_menos', label: 'Mais ou menos', emoji: '😅' },
                { value: 'nao', label: 'Difícil', emoji: '😬' },
              ]}
              onChange={(v) => set({ is_easy_to_pass: form.is_easy_to_pass === v ? null : v as 'sim' | 'mais_ou_menos' | 'nao' })}
            />

            <ToggleGroup
              label="Pressão por presença"
              value={form.attendance_pressure}
              options={[
                { value: 'baixa', label: 'Baixa' },
                { value: 'media', label: 'Média' },
                { value: 'alta', label: 'Alta' },
              ]}
              onChange={(v) => set({ attendance_pressure: form.attendance_pressure === v ? null : v })}
            />

            <div>
              <p className="text-sm font-medium text-fg mb-0.5">Estilo de avaliação</p>
              <p className="text-xs text-fg-subtle mb-2">Pode selecionar mais de um</p>
              <div className="flex flex-wrap gap-2">
                {(['prova', 'projeto', 'trabalho'] as const).map((v) => {
                  const labels = { prova: 'Prova', projeto: 'Projeto', trabalho: 'Trabalho' }
                  const active = form.assessment_styles.includes(v)
                  return (
                    <button key={v} type="button"
                      onClick={() => set({ assessment_styles: toggleMulti(form.assessment_styles, v) })}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                        active ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-surface text-fg-muted border-edge hover:border-brand-400 hover:text-brand-400'
                      )}>
                      {labels[v]}
                    </button>
                  )
                })}
              </div>
              {form.assessment_styles.length > 1 && (
                <p className="text-xs text-fg-subtle mt-1">Será registrado como "Misto"</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-fg mb-0.5">Estilo das provas</p>
              <p className="text-xs text-fg-subtle mb-2">Se tiver prova, como ela costuma ser?</p>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'multipla_escolha', label: 'Múltipla escolha' },
                  { value: 'dissertativa', label: 'Dissertativa' },
                  { value: 'pratica', label: 'Prática' },
                  { value: 'oral', label: 'Oral' },
                ] as const).map((opt) => {
                  const active = form.exam_types.includes(opt.value)
                  return (
                    <button key={opt.value} type="button"
                      onClick={() => set({ exam_types: toggleMulti(form.exam_types, opt.value) })}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                        active ? 'bg-accent-500 text-white border-accent-500'
                          : 'bg-surface text-fg-muted border-edge hover:border-accent-400 hover:text-accent-400'
                      )}>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <BoolPicker label="Passa trabalhos?" value={form.has_assignments}
                onChange={(v) => set({ has_assignments: v })} />
              <BoolPicker label="Tem atividades/listas?" value={form.has_activities}
                onChange={(v) => set({ has_activities: v })} />
            </div>

            {isEad && (
              <>
                <BoolPicker label="Houve evento presencial obrigatório?" value={form.had_in_person_event}
                  onChange={(v) => set({ had_in_person_event: v })} />
                <BoolPicker label="O conteúdo foi relevante para o curso?" value={form.relevant_to_course}
                  onChange={(v) => set({ relevant_to_course: v })} />
              </>
            )}
          </div>

          {/* Comentário */}
          <div>
            <label className="block text-sm font-medium text-fg mb-2">
              Comentário <span className="text-fg-subtle font-normal">(opcional)</span>
            </label>
            <textarea value={form.comment} onChange={(e) => set({ comment: e.target.value })}
              placeholder="Conte mais sobre sua experiência — conteúdo, dinâmica das aulas, dicas..."
              maxLength={1000} rows={4}
              className="w-full px-4 py-3 bg-canvas border border-edge rounded-xl text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent-400 focus:border-accent-400 text-sm resize-none transition-colors" />
            <p className="text-xs text-fg-subtle text-right mt-1">{form.comment.length}/1000</p>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-[#2d0a0a] border border-red-700 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setStep(2)} size="lg" className="flex-1">← Voltar</Button>
            <Button onClick={handleSubmit} size="lg" className="flex-1"
              disabled={submitting || form.would_recommend === null}>
              {submitting ? 'Enviando...' : 'Enviar avaliação'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
