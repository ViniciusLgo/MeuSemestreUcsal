import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getSubjectById,
  getTeachersBySubject,
  getReviewsBySubject,
  type ReviewPublic,
  type TeacherWithRatings,
} from '@/lib/queries/subjects'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { StarRating } from '@/components/ui/StarRating'
import { Avatar } from '@/components/ui/Avatar'
import { SuggestTeacherButton } from '@/components/ui/SuggestTeacherButton'
import { ReportButton } from '@/components/ui/ReportButton'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const subject = await getSubjectById(id)
  return { title: subject?.name ?? 'Disciplina' }
}

function avg(reviews: ReviewPublic[], key: keyof ReviewPublic): number {
  if (!reviews.length) return 0
  return reviews.reduce((s, r) => s + Number(r[key] ?? 0), 0) / reviews.length
}

const modalityLabel: Record<string, string> = {
  presencial: 'Presencial', ead: 'EAD', hibrida: 'Híbrida',
}
const typeLabel: Record<string, string> = {
  mandatory: 'Obrigatória', elective: 'Eletiva', extension: 'Extensão',
}
const pressureLabel: Record<string, string> = {
  baixa: 'Chamada baixa', media: 'Chamada média', alta: 'Chamada alta',
}
const styleLabel: Record<string, string> = {
  prova: 'Prova', projeto: 'Projeto', trabalho: 'Trabalho', misto: 'Misto',
}
const absenceLabel: Record<string, string> = {
  nunca: 'Nunca falta', raramente: 'Raramente falta', frequente: 'Falta bastante',
}
const diffLabel: Record<number, string> = {
  1: 'Fácil', 2: 'Fácil', 3: 'Médio', 4: 'Difícil', 5: 'HARDCORE',
}
const examTypeLabel: Record<string, string> = {
  multipla_escolha: 'Múltipla escolha',
  dissertativa: 'Dissertativa',
  pratica: 'Prática',
  oral: 'Oral',
}

function ratingColor(n: number, max = 5) {
  const t = max === 10 ? [7, 5] : [4, 3]
  if (n >= t[0]) return 'text-brand-400'
  if (n >= t[1]) return 'text-amber-400'
  return 'text-red-400'
}

export default async function SubjectPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [subject, teachers, reviews, threadsResult] = await Promise.all([
    getSubjectById(id),
    getTeachersBySubject(id),
    getReviewsBySubject(id),
    (supabase as any)
      .from('forum_threads')
      .select('id, title, created_at, views')
      .eq('subject_id', id)
      .eq('status', 'publicado')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const subjectThreads: { id: string; title: string; created_at: string; views: number }[] =
    threadsResult.data ?? []
  if (!subject) notFound()

  const isEad = subject.modality === 'ead'
  const avgGeneral = avg(reviews, 'rating_general')

  return (
    <div className="container-page py-10">

      {/* ── Cabeçalho ────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/" className="text-sm text-fg-subtle hover:text-brand-400 transition-colors">Início</Link>
          <span className="text-edge">/</span>
          <span className="text-sm text-fg-muted">{subject.name}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-mono text-fg-subtle bg-surface-2 px-2 py-0.5 rounded">{subject.code}</span>
          <Badge variant={isEad ? 'ead' : 'default'}>{modalityLabel[subject.modality]}</Badge>
          <Badge variant={subject.type === 'mandatory' ? 'info' : 'warning'}>{typeLabel[subject.type]}</Badge>
        </div>

        <h1 className="text-4xl font-bold text-fg mb-3">{subject.name}</h1>

        <div className="flex items-center gap-3">
          {reviews.length > 0 ? (
            <>
              <StarRating value={avgGeneral} max={10} />
              <span className={`text-lg font-bold ${ratingColor(avgGeneral, 10)}`}>{avgGeneral.toFixed(1)}</span>
              <span className="text-fg-subtle text-sm">/ 10 ({reviews.length} avaliações)</span>
            </>
          ) : (
            <span className="text-fg-subtle text-sm">Nenhuma avaliação ainda — seja o primeiro!</span>
          )}
        </div>
      </div>

      {/* ── Professores com notas individuais ───────────────────────── */}
      {teachers.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-fg mb-4">Professores</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teachers.map((t: TeacherWithRatings) => (
              <Link key={t.id} href={`/professor/${t.id}`}>
                <div className="bg-surface border border-edge rounded-2xl p-4 hover:border-brand-400 hover:shadow-sm transition-all group h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={t.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-fg group-hover:text-brand-400 transition-colors truncate">{t.name}</p>
                      {t.review_count > 0 ? (
                        <p className="text-xs text-fg-subtle">{t.review_count} avaliação{t.review_count !== 1 ? 'ões' : ''}</p>
                      ) : (
                        <p className="text-xs text-fg-subtle italic">sem avaliações</p>
                      )}
                    </div>
                    {t.review_count > 0 && (
                      <div className="ml-auto flex-shrink-0 text-right">
                        <p className={`text-xl font-bold tabular-nums ${ratingColor(t.avg_general)}`}>
                          {t.avg_general.toFixed(1)}
                        </p>
                        <StarRating value={t.avg_general} size="sm" />
                      </div>
                    )}
                  </div>

                  {t.review_count > 0 && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: 'Didática', value: t.avg_didactics },
                        { label: 'Organização', value: t.avg_organization },
                        { label: 'Carga', value: t.avg_workload },
                        { label: 'Dificuldade', value: t.avg_difficulty },
                      ].map((m) => (
                        <div key={m.label} className="bg-surface-2 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-1">
                          <span className="text-[11px] text-fg-subtle">{m.label}</span>
                          <span className={`text-xs font-bold tabular-nums ${ratingColor(m.value)}`}>
                            {m.value.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {t.review_count > 0 && t.would_recommend_pct !== null && (
                    <div className="mt-2.5 pt-2.5 border-t border-edge-muted flex items-center gap-1.5">
                      <span className={`text-xs font-semibold ${t.would_recommend_pct >= 70 ? 'text-brand-400' : t.would_recommend_pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                        {t.would_recommend_pct}%
                      </span>
                      <span className="text-xs text-fg-subtle">recomendaria</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Sugerir professor ────────────────────────────────────────── */}
      <div className="mb-10">
        <SuggestTeacherButton subjectId={subject.id} subjectName={subject.name} />
      </div>

      {/* ── Discussões do Fórum ──────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-fg">
            Discussões
            {subjectThreads.length > 0 && (
              <span className="ml-2 text-base font-normal text-fg-subtle">({subjectThreads.length})</span>
            )}
          </h2>
          {user ? (
            <Link
              href={`/forum/nova?subject_id=${subject.id}`}
              className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
            >
              + Nova discussão
            </Link>
          ) : (
            <Link
              href={`/entrar?redirectTo=/forum/nova?subject_id=${subject.id}`}
              className="text-sm font-medium text-fg-muted hover:text-brand-400 transition-colors"
            >
              Entre para participar →
            </Link>
          )}
        </div>

        {subjectThreads.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-fg-muted font-medium mb-1">Nenhuma discussão ainda.</p>
            <p className="text-fg-subtle text-sm">Tem dúvidas ou experiências sobre esta disciplina? Compartilhe no fórum.</p>
          </Card>
        ) : (
          <div className="bg-surface border border-edge rounded-2xl divide-y divide-edge-muted">
            {subjectThreads.map((t) => (
              <Link
                key={t.id}
                href={user ? `/forum/thread/${t.id}` : `/entrar?redirectTo=/forum/thread/${t.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-surface-2 transition-colors group"
              >
                <p className="text-sm font-medium text-fg group-hover:text-brand-400 transition-colors line-clamp-1">
                  {t.title}
                </p>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs text-fg-subtle">
                  <span>{t.views ?? 0} views</span>
                  <span>{new Date(t.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Avaliações ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-fg">
            Avaliações{reviews.length > 0 && <span className="ml-2 text-base font-normal text-fg-subtle">({reviews.length})</span>}
          </h2>
          <Link href="/avaliar"
            className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors">
            + Avaliar
          </Link>
        </div>

        {reviews.length === 0 ? (
          <Card className="text-center py-16">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-fg-muted font-medium mb-2">Nenhuma avaliação ainda.</p>
            <p className="text-fg-subtle text-sm mb-6">Cursa ou já cursou? Compartilhe sua experiência de forma anônima.</p>
            <Link href="/avaliar"
              className="inline-flex items-center gap-2 bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors">
              Ser o primeiro →
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: ReviewPublic) => (
              <Card key={review.id}>
                {/* Cabeçalho do review */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    {review.teacher && (
                      <Link href={`/professor/${review.teacher.id}`}
                        className="text-sm font-semibold text-brand-400 hover:underline">
                        {review.teacher.name}
                      </Link>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating value={review.rating_general} max={10} size="sm" />
                      <span className={`text-sm font-bold ${ratingColor(review.rating_general, 10)}`}>
                        {review.rating_general}/10
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {review.would_recommend && <Badge variant="success">✓ Recomenda</Badge>}
                    {review.is_easy_to_pass === true && <Badge variant="success">Fácil de passar</Badge>}
                    {review.is_easy_to_pass === false && <Badge variant="warning">Difícil de passar</Badge>}
                    {review.teacher_is_engaging === true && <Badge variant="info">Professor engajado</Badge>}
                    {review.teacher_is_engaging === false && <Badge variant="warning">Professor enrolado</Badge>}
                    {review.attendance_pressure && (
                      <Badge variant={review.attendance_pressure === 'alta' ? 'warning' : 'default'}>
                        {pressureLabel[review.attendance_pressure]}
                      </Badge>
                    )}
                    {review.teacher_absence && (
                      <Badge variant={review.teacher_absence === 'frequente' ? 'warning' : 'default'}>
                        {absenceLabel[review.teacher_absence]}
                      </Badge>
                    )}
                    {review.assessment_style && (
                      <Badge variant="default">{styleLabel[review.assessment_style]}</Badge>
                    )}
                    {review.has_assignments === true && <Badge variant="default">Passa trabalhos</Badge>}
                    {review.has_activities === true && <Badge variant="default">Tem atividades</Badge>}
                    {isEad && review.had_in_person_event === true && <Badge variant="warning">Teve encontro presencial</Badge>}
                    {isEad && review.relevant_to_course === true && <Badge variant="success">Conteúdo relevante</Badge>}
                  </div>
                </div>

                {/* Notas detalhadas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'Didática', value: review.rating_didactics },
                    { label: 'Organização', value: review.rating_organization },
                    { label: 'Carga', value: review.rating_workload },
                    { label: 'Dificuldade', value: review.rating_difficulty, isRaw: true },
                  ].map((m) => (
                    <div key={m.label} className="bg-surface-2 rounded-xl py-2.5 text-center">
                      <div className={`text-base font-bold ${ratingColor(m.value)}`}>
                        {m.isRaw ? (diffLabel[Math.round(m.value)] ?? m.value) : m.value}
                      </div>
                      <div className="text-xs text-fg-subtle mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Estilo de prova */}
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

                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-fg-subtle">
                    {new Date(review.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                  <ReportButton reviewId={review.id} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
