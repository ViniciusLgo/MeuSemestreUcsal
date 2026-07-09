import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getTeacherById, getReviewsByTeacher, buildSubjectStats,
  type ReviewByTeacher, type SubjectStats,
} from '@/lib/queries/teachers'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { StarRating } from '@/components/ui/StarRating'
import type { Metadata } from 'next'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const teacher = await getTeacherById(id)
  return { title: teacher?.name ?? 'Professor' }
}

function avg(reviews: ReviewByTeacher[], key: keyof ReviewByTeacher): number {
  if (!reviews.length) return 0
  return reviews.reduce((s, r) => s + Number(r[key] ?? 0), 0) / reviews.length
}

function ratingColor(n: number) {
  if (n >= 4) return 'text-brand-400'
  if (n >= 3) return 'text-amber-400'
  return 'text-red-400'
}

const styleLabel: Record<string, string> = {
  prova: 'Prova', projeto: 'Projeto', trabalho: 'Trabalho', misto: 'Misto',
}
const absenceLabel: Record<string, string> = {
  nunca: 'Nunca falta', raramente: 'Raramente falta', frequente: 'Falta bastante',
}
const diffLabel: Record<number, string> = { 2: 'Fácil', 3: 'Médio', 4: 'Difícil', 5: 'HARDCORE' }
const examTypeLabel: Record<string, string> = {
  multipla_escolha: 'Múltipla escolha', dissertativa: 'Dissertativa', pratica: 'Prática', oral: 'Oral',
}

export default async function TeacherPage({ params }: Props) {
  const { id } = await params
  const [teacher, reviews] = await Promise.all([
    getTeacherById(id),
    getReviewsByTeacher(id),
  ])
  if (!teacher) notFound()

  const subjectStats = buildSubjectStats(reviews)
  const avgGeneral = avg(reviews, 'rating_general')
  const pctRecommend = reviews.length
    ? Math.round(reviews.filter((r) => r.would_recommend).length / reviews.length * 100) : 0

  // Contagens de campos novos
  const engagedCount = reviews.filter(r => r.teacher_is_engaging === true).length
  const lazyCount = reviews.filter(r => r.teacher_is_engaging === false).length
  const easyCount = reviews.filter(r => r.is_easy_to_pass === true).length
  const hardCount = reviews.filter(r => r.is_easy_to_pass === false).length
  const absFreq = reviews.filter(r => r.teacher_absence === 'frequente').length

  return (
    <div className="container-page py-10">

      {/* ── Cabeçalho ───────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/" className="text-sm text-fg-subtle hover:text-brand-400 transition-colors">Início</Link>
          <span className="text-edge">/</span>
          <span className="text-sm text-fg-muted">{teacher.name}</span>
        </div>

        <div className="flex items-start gap-5">
          <Avatar name={teacher.name} size="lg" />
          <div>
            <h1 className="text-4xl font-bold text-fg mb-1">{teacher.name}</h1>
            <p className="text-fg-subtle text-sm mb-2">
              {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'} de alunos
            </p>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRating value={avgGeneral} />
                <span className={`font-bold text-xl ${ratingColor(avgGeneral)}`}>{avgGeneral.toFixed(1)}</span>
                <span className="text-fg-subtle text-sm">nota geral</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats globais ─────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Didática',     value: avg(reviews, 'rating_didactics') },
            { label: 'Organização',  value: avg(reviews, 'rating_organization') },
            { label: 'Carga',        value: avg(reviews, 'rating_workload') },
            { label: 'Dificuldade',  value: avg(reviews, 'rating_difficulty') },
          ].map((m) => (
            <Card key={m.label} className="text-center py-4 px-3">
              <div className={`text-2xl font-bold tabular-nums ${ratingColor(m.value)}`}>{m.value.toFixed(1)}</div>
              <div className="text-xs text-fg-subtle mt-1">{m.label}</div>
            </Card>
          ))}
          <Card className="text-center py-4 px-3">
            <div className={`text-2xl font-bold tabular-nums ${pctRecommend >= 70 ? 'text-brand-400' : pctRecommend >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
              {pctRecommend}%
            </div>
            <div className="text-xs text-fg-subtle mt-1">Recomenda</div>
          </Card>
        </div>
      )}

      {/* ── Perfil rápido ─────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {engagedCount > lazyCount && <Badge variant="success">Engajado ({engagedCount}/{reviews.length})</Badge>}
          {lazyCount > engagedCount && <Badge variant="warning">Enrolado/maguado ({lazyCount}/{reviews.length})</Badge>}
          {easyCount > hardCount && <Badge variant="success">Fácil de passar ({easyCount}/{reviews.length})</Badge>}
          {hardCount > easyCount && <Badge variant="warning">Difícil de passar ({hardCount}/{reviews.length})</Badge>}
          {absFreq > reviews.length * 0.3 && <Badge variant="warning">Falta bastante ({absFreq}/{reviews.length})</Badge>}
        </div>
      )}

      {/* ── Por disciplina ────────────────────────────────────────────── */}
      {subjectStats.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-fg mb-4">Notas por disciplina</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {subjectStats.map((s: SubjectStats) => (
              <Link key={s.subject_id} href={`/disciplina/${s.subject_id}`}>
                <div className="bg-surface border border-edge rounded-2xl p-4 hover:border-brand-400 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-fg-subtle">{s.subject_code}</p>
                      <p className="text-sm font-semibold text-fg leading-tight">{s.subject_name}</p>
                      <p className="text-xs text-fg-subtle mt-0.5">{s.review_count} avaliação{s.review_count !== 1 ? 'ões' : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-2xl font-bold tabular-nums ${ratingColor(s.avg_general)}`}>{s.avg_general.toFixed(1)}</p>
                      <StarRating value={s.avg_general} size="sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'Didática', value: s.avg_didactics },
                      { label: 'Organização', value: s.avg_organization },
                      { label: 'Carga', value: s.avg_workload },
                      { label: 'Dificuldade', value: s.avg_difficulty },
                    ].map((m) => (
                      <div key={m.label} className="bg-surface-2 rounded-lg px-2 py-1.5 flex items-center justify-between">
                        <span className="text-[11px] text-fg-subtle">{m.label}</span>
                        <span className={`text-xs font-bold tabular-nums ${ratingColor(m.value)}`}>{m.value.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-edge-muted">
                    <span className={`text-xs font-semibold ${s.would_recommend_pct >= 70 ? 'text-brand-400' : s.would_recommend_pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {s.would_recommend_pct}%
                    </span>
                    <span className="text-xs text-fg-subtle ml-1">recomendariam</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Avaliações ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-fg">
            Avaliações{reviews.length > 0 && <span className="ml-2 text-base font-normal text-fg-subtle">({reviews.length})</span>}
          </h2>
          <Link href="/avaliar"
            className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-500 transition-colors">
            + Avaliar
          </Link>
        </div>

        {reviews.length === 0 ? (
          <Card className="text-center py-16">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-fg-muted font-medium mb-2">Nenhuma avaliação ainda para {teacher.name}.</p>
            <Link href="/avaliar"
              className="inline-flex items-center gap-2 bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-500 transition-colors mt-4">
              Ser o primeiro a avaliar →
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: ReviewByTeacher) => (
              <Card key={review.id}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    {review.subject && (
                      <Link href={`/disciplina/${review.subject.id}`}
                        className="text-sm font-semibold text-accent-400 hover:underline">
                        {review.subject.name}
                        <span className="ml-1.5 text-xs font-mono text-fg-subtle">{review.subject.code}</span>
                      </Link>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating value={review.rating_general} size="sm" />
                      <span className={`text-sm font-bold ${ratingColor(review.rating_general)}`}>{review.rating_general}/5</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {review.would_recommend && <Badge variant="success">✓ Recomenda</Badge>}
                    {review.is_easy_to_pass === true && <Badge variant="success">Fácil de passar</Badge>}
                    {review.is_easy_to_pass === false && <Badge variant="warning">Difícil de passar</Badge>}
                    {review.teacher_is_engaging === false && <Badge variant="warning">Enrolado</Badge>}
                    {review.teacher_absence === 'frequente' && <Badge variant="warning">Falta bastante</Badge>}
                    {review.assessment_style && (
                      <Badge variant="default">{styleLabel[review.assessment_style]}</Badge>
                    )}
                    {review.has_assignments === true && <Badge variant="default">Passa trabalhos</Badge>}
                    {review.has_activities === true && <Badge variant="default">Tem atividades</Badge>}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[
                    { label: 'Didática', value: review.rating_didactics },
                    { label: 'Organização', value: review.rating_organization },
                    { label: 'Carga', value: review.rating_workload },
                    { label: 'Dificuldade', value: review.rating_difficulty, isLabel: true },
                  ].map((m) => (
                    <div key={m.label} className="bg-surface-2 rounded-xl py-2.5 text-center">
                      <div className={`text-base font-bold ${ratingColor(m.value)}`}>
                        {m.isLabel ? (diffLabel[Math.round(m.value)] ?? m.value) : m.value}
                      </div>
                      <div className="text-xs text-fg-subtle mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>

                {review.exam_types && review.exam_types.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-xs text-fg-subtle self-center">Prova:</span>
                    {review.exam_types.map((et) => (
                      <span key={et} className="text-xs bg-surface-2 border border-edge-muted px-2 py-0.5 rounded-full text-fg-muted">
                        {examTypeLabel[et] ?? et}
                      </span>
                    ))}
                  </div>
                )}

                {review.comment && (
                  <p className="text-sm text-fg-muted leading-relaxed border-t border-edge-muted pt-3">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}

                <p className="text-xs text-fg-subtle mt-3">
                  {new Date(review.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
