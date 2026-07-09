'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type Teacher = { id: string; name: string; slug: string }
type Subject = { id: string; code: string; name: string; modality: 'presencial' | 'ead' | 'hibrida' }

type AssessmentStyleBase = 'prova' | 'projeto' | 'trabalho'

type FormData = {
  teacher_id: string
  subject_id: string
  rating_general: number
  rating_didactics: number
  rating_organization: number
  rating_workload: number
  rating_difficulty: number
  would_recommend: boolean | null
  attendance_pressure: 'baixa' | 'media' | 'alta' | null
  assessment_styles: AssessmentStyleBase[]  // multi-select, mapeado p/ 'misto' se > 1
  comment: string
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
  attendance_pressure: null,
  assessment_styles: [],
  comment: '',
  had_in_person_event: null,
  relevant_to_course: null,
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const [hover, setHover] = useState(0)

  return (
    <div>
      <p className="text-sm font-medium text-fg mb-2">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="text-2xl transition-transform hover:scale-110"
          >
            <span className={(hover || value) >= n ? 'text-amber-400' : 'text-edge'}>
              ★
            </span>
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-fg-muted self-center">{value}/5</span>
        )}
      </div>
    </div>
  )
}

function OptionPicker<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T | null
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <p className="text-sm font-medium text-fg mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
              value === opt.value
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-surface text-fg-muted border-edge hover:border-brand-400 hover:text-brand-400'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function BoolPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div>
      <p className="text-sm font-medium text-fg mb-2">{label}</p>
      <div className="flex gap-2">
        {[
          { v: true, l: 'Sim' },
          { v: false, l: 'Não' },
        ].map(({ v, l }) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
              value === v
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-surface text-fg-muted border-edge hover:border-brand-400 hover:text-brand-400'
            )}
          >
            {l}
          </button>
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

  // ── Load initial data ──────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/entrar?redirectTo=/avaliar'); return }

      type ProfileRow = { course_id: string | null; curriculum_version_id: string | null }
      type TeacherRow = { id: string; name: string; slug: string }

      const [profileRes, tsRes] = await Promise.all([
        (supabase.from('profiles') as any).select('curriculum_version_id, course_id').eq('id', user.id).single() as Promise<{ data: ProfileRow | null }>,
        (supabase.from('teachers') as any).select('id, name, slug').eq('active', true).order('name') as Promise<{ data: TeacherRow[] | null }>,
      ])

      const profile = profileRes.data
      const ts = tsRes.data

      if (!profile?.course_id) {
        router.push('/perfil/configurar?redirectTo=/avaliar')
        return
      }

      setProfileVersionId(profile.curriculum_version_id)
      setTeachers((ts ?? []) as Teacher[])
      setLoading(false)
    }
    load()
  }, [])

  // ── Load subjects when teacher changes ─────────────────────────────────────

  useEffect(() => {
    if (!form.teacher_id) { setSubjects([]); return }
    ;(supabase as any)
      .from('teacher_subjects')
      .select('subject:subjects(id, code, name, modality)')
      .eq('teacher_id', form.teacher_id)
      .eq('active', true)
      .then(({ data }: { data: Array<{ subject: Subject | null }> | null }) => {
        const seen = new Set<string>()
        const list = (data ?? [])
          .map((r) => r.subject)
          .filter((s): s is Subject => {
            if (!s || seen.has(s.id)) return false
            seen.add(s.id)
            return true
          })
        setSubjects(list)
        set({ subject_id: '' })
      })
  }, [form.teacher_id])

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedSubject = subjects.find((s) => s.id === form.subject_id)
  const isEad = selectedSubject?.modality === 'ead'

  const step1Valid = !!form.teacher_id && !!form.subject_id
  const step2Valid =
    form.rating_general > 0 &&
    form.rating_didactics > 0 &&
    form.rating_organization > 0 &&
    form.rating_workload > 0 &&
    form.rating_difficulty > 0

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (form.would_recommend === null) {
      setError('Informe se você recomendaria este professor.')
      return
    }
    setSubmitting(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/entrar'); return }

    const payload = {
      author_id: user.id,
      teacher_id: form.teacher_id,
      subject_id: form.subject_id,
      curriculum_version_id: profileVersionId,
      rating_general: form.rating_general,
      rating_didactics: form.rating_didactics,
      rating_organization: form.rating_organization,
      rating_workload: form.rating_workload,
      rating_difficulty: form.rating_difficulty,
      would_recommend: form.would_recommend,
      attendance_pressure: form.attendance_pressure,
      assessment_style: form.assessment_styles.length === 0
        ? null
        : form.assessment_styles.length === 1
          ? form.assessment_styles[0]
          : 'misto',
      comment: form.comment.trim() || null,
      had_in_person_event: isEad ? form.had_in_person_event : null,
      relevant_to_course: isEad ? form.relevant_to_course : null,
    }

    const { error: err } = await (supabase as any).from('reviews').insert(payload)
    setSubmitting(false)

    if (err) {
      if (err.code === '23505') {
        setError('Você já avaliou este professor nesta disciplina.')
      } else {
        setError('Erro ao enviar avaliação. Tente novamente.')
      }
      return
    }

    setSuccess(true)
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (success) {
    const teacher = teachers.find((t) => t.id === form.teacher_id)
    return (
      <div className="container-page py-20 text-center max-w-md mx-auto">
        <div className="text-5xl mb-5">🎉</div>
        <h1 className="text-2xl font-bold text-fg mb-3">Avaliação enviada!</h1>
        <p className="text-fg-muted mb-8">
          Obrigado por contribuir com a comunidade UCSAL. Sua avaliação ajuda outros alunos.
        </p>
        <div className="flex flex-col gap-3">
          {teacher && (
            <Link
              href={`/professor/${teacher.id}`}
              className="inline-flex items-center justify-center bg-brand-600 text-white font-semibold px-5 py-3 rounded-xl hover:bg-brand-500 transition-colors"
            >
              Ver perfil de {teacher.name}
            </Link>
          )}
          <button
            onClick={() => { setForm(emptyForm); setStep(1); setSuccess(false) }}
            className="text-sm text-fg-subtle hover:text-fg-muted transition-colors"
          >
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

  // ── Render steps ──────────────────────────────────────────────────────────

  return (
    <div className="container-page py-10 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        <Link href="/" className="text-fg-subtle hover:text-brand-400 transition-colors">Início</Link>
        <span className="text-edge">/</span>
        <span className="text-fg-muted">Avaliar professor</span>
      </div>

      <h1 className="text-3xl font-bold text-fg mb-2">Avaliar professor</h1>
      <p className="text-fg-muted text-sm mb-8">
        Sua identidade nunca será revelada. Avalie com honestidade.
      </p>

      {/* Steps indicator */}
      <div className="flex items-center gap-3 mb-10">
        {[
          { n: 1, label: 'Professor e disciplina' },
          { n: 2, label: 'Notas' },
          { n: 3, label: 'Detalhes' },
        ].map(({ n, label }, i, arr) => (
          <div key={n} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                step > n
                  ? 'bg-brand-600 text-white'
                  : step === n
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-2 text-fg-subtle'
              )}>
                {step > n ? '✓' : n}
              </div>
              <span className={cn(
                'text-sm font-medium hidden sm:block',
                step === n ? 'text-fg' : 'text-fg-subtle'
              )}>
                {label}
              </span>
            </div>
            {i < arr.length - 1 && (
              <div className={cn(
                'h-px w-8 flex-shrink-0',
                step > n ? 'bg-brand-600' : 'bg-overlay'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Professor + Disciplina ─────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-fg mb-2">
              Professor
            </label>
            {teachers.length === 0 ? (
              <p className="text-sm text-fg-muted bg-surface border border-edge px-4 py-3 rounded-xl">
                Nenhum professor cadastrado ainda.
              </p>
            ) : (
              <select
                value={form.teacher_id}
                onChange={(e) => set({ teacher_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-canvas border border-edge rounded-xl text-fg focus:outline-none focus:ring-1 focus:ring-accent-400 focus:border-accent-400 text-sm transition-colors"
              >
                <option value="">Selecione o professor...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>

          {form.teacher_id && (
            <div>
              <label className="block text-sm font-semibold text-fg mb-2">
                Disciplina
              </label>
              {subjects.length === 0 ? (
                <p className="text-sm text-fg-muted bg-surface border border-edge px-4 py-3 rounded-xl">
                  Nenhuma disciplina vinculada a este professor.
                </p>
              ) : (
                <div className="grid gap-2">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => set({ subject_id: s.id })}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all',
                        form.subject_id === s.id
                          ? 'border-brand-500 bg-brand-100'
                          : 'border-edge bg-surface hover:border-fg-muted'
                      )}
                    >
                      <div>
                        <span className={cn(
                          'text-sm font-semibold',
                          form.subject_id === s.id ? 'text-brand-400' : 'text-fg'
                        )}>
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

          <div className="pt-2">
            <Button
              onClick={() => setStep(2)}
              size="lg"
              className="w-full"
              disabled={!step1Valid}
            >
              Próximo: Notas →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Notas ───────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-7">
          <div className="bg-surface border border-edge rounded-xl px-4 py-3 text-sm text-fg-muted">
            Avaliando <strong className="text-fg">{teachers.find((t) => t.id === form.teacher_id)?.name}</strong>
            {' '}em <strong className="text-fg">{selectedSubject?.name}</strong>
          </div>

          <StarPicker
            label="Nota geral"
            value={form.rating_general}
            onChange={(v) => set({ rating_general: v })}
          />
          <StarPicker
            label="Didática"
            value={form.rating_didactics}
            onChange={(v) => set({ rating_didactics: v })}
          />
          <StarPicker
            label="Organização das aulas"
            value={form.rating_organization}
            onChange={(v) => set({ rating_organization: v })}
          />
          <StarPicker
            label="Carga de trabalho"
            value={form.rating_workload}
            onChange={(v) => set({ rating_workload: v })}
          />
          <StarPicker
            label="Dificuldade da disciplina"
            value={form.rating_difficulty}
            onChange={(v) => set({ rating_difficulty: v })}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setStep(1)} size="lg" className="flex-1">
              ← Voltar
            </Button>
            <Button onClick={() => setStep(3)} size="lg" className="flex-1" disabled={!step2Valid}>
              Próximo: Detalhes →
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Detalhes + Envio ─────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-7">
          <div className="bg-surface border border-edge rounded-xl px-4 py-3 text-sm text-fg-muted">
            Avaliando <strong className="text-fg">{teachers.find((t) => t.id === form.teacher_id)?.name}</strong>
            {' '}em <strong className="text-fg">{selectedSubject?.name}</strong>
          </div>

          <BoolPicker
            label="Você recomendaria este professor?"
            value={form.would_recommend}
            onChange={(v) => set({ would_recommend: v })}
          />

          <OptionPicker
            label="Pressão por presença"
            value={form.attendance_pressure}
            options={[
              { value: 'baixa', label: 'Baixa' },
              { value: 'media', label: 'Média' },
              { value: 'alta', label: 'Alta' },
            ]}
            onChange={(v) => set({ attendance_pressure: v })}
          />

          <div>
            <p className="text-sm font-medium text-fg mb-2">
              Estilo de avaliação{' '}
              <span className="text-xs font-normal text-fg-subtle">(pode selecionar mais de um)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {(['prova', 'projeto', 'trabalho'] as const).map((v) => {
                const labels = { prova: 'Prova', projeto: 'Projeto', trabalho: 'Trabalho' }
                const active = form.assessment_styles.includes(v)
                return (
                  <button key={v} type="button"
                    onClick={() => {
                      const next = active
                        ? form.assessment_styles.filter((x) => x !== v)
                        : [...form.assessment_styles, v]
                      set({ assessment_styles: next })
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                      active
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-surface text-fg-muted border-edge hover:border-brand-400 hover:text-brand-400'
                    )}>
                    {labels[v]}
                  </button>
                )
              })}
            </div>
            {form.assessment_styles.length > 1 && (
              <p className="text-xs text-fg-subtle mt-1.5">Será registrado como "Misto"</p>
            )}
          </div>

          {/* Campos extras apenas para EAD */}
          {isEad && (
            <>
              <BoolPicker
                label="Houve algum evento presencial obrigatório?"
                value={form.had_in_person_event}
                onChange={(v) => set({ had_in_person_event: v })}
              />
              <BoolPicker
                label="O conteúdo foi relevante para o curso?"
                value={form.relevant_to_course}
                onChange={(v) => set({ relevant_to_course: v })}
              />
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-fg mb-2">
              Comentário <span className="text-fg-subtle font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.comment}
              onChange={(e) => set({ comment: e.target.value })}
              placeholder="Conte mais sobre sua experiência com este professor..."
              maxLength={1000}
              rows={4}
              className="w-full px-4 py-3 bg-canvas border border-edge rounded-xl text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent-400 focus:border-accent-400 text-sm resize-none transition-colors"
            />
            <p className="text-xs text-fg-subtle text-right mt-1">
              {form.comment.length}/1000
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-[#2d0a0a] border border-red-700 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setStep(2)} size="lg" className="flex-1">
              ← Voltar
            </Button>
            <Button
              onClick={handleSubmit}
              size="lg"
              className="flex-1"
              disabled={submitting || form.would_recommend === null}
            >
              {submitting ? 'Enviando...' : 'Enviar avaliação'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
