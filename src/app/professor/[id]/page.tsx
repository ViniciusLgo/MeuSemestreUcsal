import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getTeacherById,
  getSubjectsByTeacher,
  getReviewsByTeacher,
  type SubjectBasic,
  type ReviewByTeacher,
} from '@/lib/queries/teachers'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { StarRating } from '@/components/ui/StarRating'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const teacher = await getTeacherById(id)
  return { title: teacher?.name ?? 'Professor' }
}

function avgOf(reviews: ReviewByTeacher[], key: keyof ReviewByTeacher): number {
  if (!reviews.length) return 0
  return reviews.reduce((s, r) => s + Number(r[key] ?? 0), 0) / reviews.length
}

const styleLabel: Record<string, string> = {
  prova: 'Prova',
  projeto: 'Projeto',
  trabalho: 'Trabalho',
  misto: 'Misto',
}

export default async function TeacherPage({ params }: Props) {
  const { id } = await params
  const [teacher, subjects, reviews] = await Promise.all([
    getTeacherById(id),
    getSubjectsByTeacher(id),
    getReviewsByTeacher(id),
  ])
  if (!teacher) notFound()

  const pctRecommend = reviews.length
    ? Math.round(reviews.filter((r) => r.would_recommend).length / reviews.length * 100)
    : 0

  const stats = [
    { label: 'Didática', value: avgOf(reviews, 'rating_didactics') },
    { label: 'Organização', value: avgOf(reviews, 'rating_organization') },
    { label: 'Carga', value: avgOf(reviews, 'rating_workload') },
    { label: 'Dificuldade', value: avgOf(reviews, 'rating_difficulty') },
  ]

  return (
    <div className="container-page py-10">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/" className="text-sm text-fg-subtle hover:text-brand-400 transition-colors">
            Início
          </Link>
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
                <StarRating value={avgOf(reviews, 'rating_general')} />
                <span className="font-bold text-fg">
                  {avgOf(reviews, 'rating_general').toFixed(1)}
                </span>
                <span className="text-fg-subtle text-sm">nota geral</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
          {stats.map((m) => (
            <Card key={m.label} className="text-center py-4 px-3">
              <div className="text-2xl font-bold text-fg tabular-nums">
                {m.value.toFixed(1)}
              </div>
              <div className="text-xs text-fg-subtle mt-1">{m.label}</div>
            </Card>
          ))}
          <Card className="text-center py-4 px-3">
            <div className="text-2xl font-bold text-brand-400 tabular-nums">
              {pctRecommend}%
            </div>
            <div className="text-xs text-fg-subtle mt-1">Recomenda</div>
          </Card>
        </div>
      )}

      {subjects.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-fg mb-4">Disciplinas lecionadas</h2>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s: SubjectBasic) => (
              <Link key={s.id} href={`/disciplina/${s.id}`}>
                <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-400 text-sm font-medium px-3 py-1.5 rounded-full hover:bg-brand-200 transition-colors cursor-pointer border border-brand-300">
                  {s.name}
                  {s.modality === 'ead' && (
                    <span className="text-xs text-brand-300">· EAD</span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-fg">
            Avaliações
            {reviews.length > 0 && (
              <span className="ml-2 text-base font-normal text-fg-subtle">
                ({reviews.length})
              </span>
            )}
          </h2>
          <Link
            href="/avaliar"
            className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-500 transition-colors"
          >
            + Avaliar
          </Link>
        </div>

        {reviews.length === 0 ? (
          <Card className="text-center py-16">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-fg-muted font-medium mb-2">
              Nenhuma avaliação ainda para {teacher.name}.
            </p>
            <Link
              href="/avaliar"
              className="inline-flex items-center gap-2 bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-500 transition-colors mt-4"
            >
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
                      <Link
                        href={`/disciplina/${review.subject.id}`}
                        className="text-sm font-semibold text-accent-400 hover:underline"
                      >
                        {review.subject.name}
                      </Link>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating value={review.rating_general} size="sm" />
                      <span className="text-sm font-bold text-fg">
                        {review.rating_general}/5
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {review.would_recommend && (
                      <Badge variant="success">✓ Recomenda</Badge>
                    )}
                    {review.assessment_style && (
                      <Badge variant="default">
                        {styleLabel[review.assessment_style] ?? review.assessment_style}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'Didática', value: review.rating_didactics },
                    { label: 'Organização', value: review.rating_organization },
                    { label: 'Carga', value: review.rating_workload },
                    { label: 'Dificuldade', value: review.rating_difficulty },
                  ].map((m) => (
                    <div key={m.label} className="bg-surface-2 rounded-xl py-2.5 text-center">
                      <div className="text-base font-bold text-fg">{m.value}</div>
                      <div className="text-xs text-fg-subtle mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>

                {review.comment && (
                  <p className="text-sm text-fg-muted leading-relaxed border-t border-edge-muted pt-3">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}

                <p className="text-xs text-fg-subtle mt-3">
                  {new Date(review.created_at).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
