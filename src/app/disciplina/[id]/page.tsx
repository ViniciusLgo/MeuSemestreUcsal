import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getSubjectById,
  getTeachersBySubject,
  getReviewsBySubject,
  type ReviewPublic,
  type TeacherBasic,
} from '@/lib/queries/subjects'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { StarRating } from '@/components/ui/StarRating'
import { Avatar } from '@/components/ui/Avatar'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const subject = await getSubjectById(id)
  return { title: subject?.name ?? 'Disciplina' }
}

function avgRating(reviews: ReviewPublic[], key: keyof ReviewPublic): number {
  if (!reviews.length) return 0
  return reviews.reduce((s, r) => s + Number(r[key] ?? 0), 0) / reviews.length
}

const modalityLabel: Record<string, string> = {
  presencial: 'Presencial',
  ead: 'EAD',
  hibrida: 'Híbrida',
}

const typeLabel: Record<string, string> = {
  mandatory: 'Obrigatória',
  elective: 'Eletiva',
  extension: 'Extensão',
}

const pressureLabel: Record<string, string> = {
  baixa: 'Chamada baixa',
  media: 'Chamada média',
  alta: 'Chamada alta',
}

const styleLabel: Record<string, string> = {
  prova: 'Avaliação por prova',
  projeto: 'Avaliação por projeto',
  trabalho: 'Avaliação por trabalho',
  misto: 'Avaliação mista',
}

export default async function SubjectPage({ params }: Props) {
  const { id } = await params
  const [subject, teachers, reviews] = await Promise.all([
    getSubjectById(id),
    getTeachersBySubject(id),
    getReviewsBySubject(id),
  ])
  if (!subject) notFound()

  const isEad = subject.modality === 'ead'
  const avgGeneral = avgRating(reviews, 'rating_general')

  return (
    <div className="container-page py-10">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/" className="text-sm text-fg-subtle hover:text-brand-600 transition-colors">
            Início
          </Link>
          <span className="text-edge">/</span>
          <span className="text-sm text-fg-muted">{subject.name}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-mono text-fg-subtle bg-surface-2 px-2 py-0.5 rounded">
            {subject.code}
          </span>
          <Badge variant={isEad ? 'ead' : 'default'}>
            {modalityLabel[subject.modality]}
          </Badge>
          <Badge variant={subject.type === 'mandatory' ? 'info' : 'warning'}>
            {typeLabel[subject.type]}
          </Badge>
        </div>

        <h1 className="text-4xl font-bold text-fg mb-3">{subject.name}</h1>

        <div className="flex items-center gap-3">
          {reviews.length > 0 ? (
            <>
              <StarRating value={avgGeneral} />
              <span className="text-lg font-bold text-fg">{avgGeneral.toFixed(1)}</span>
              <span className="text-fg-subtle text-sm">({reviews.length} avaliações)</span>
            </>
          ) : (
            <span className="text-fg-subtle text-sm">Nenhuma avaliação ainda — seja o primeiro!</span>
          )}
        </div>
      </div>

      {teachers.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-fg mb-4">
            Professores que lecionam esta disciplina
          </h2>
          <div className="flex flex-wrap gap-3">
            {teachers.map((teacher: TeacherBasic) => (
              <Link key={teacher.id} href={`/professor/${teacher.id}`}>
                <div className="flex items-center gap-3 bg-surface border border-edge-muted rounded-2xl px-4 py-3 hover:border-brand-200 hover:shadow-sm transition-all">
                  <Avatar name={teacher.name} size="sm" />
                  <span className="text-sm font-semibold text-fg">{teacher.name}</span>
                </div>
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
            className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
          >
            + Avaliar
          </Link>
        </div>

        {reviews.length === 0 ? (
          <Card className="text-center py-16">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-fg-muted font-medium mb-2">
              Nenhuma avaliação ainda para esta disciplina.
            </p>
            <p className="text-fg-subtle text-sm mb-6">
              Cursa ou já cursou? Compartilhe sua experiência de forma anônima.
            </p>
            <Link
              href="/avaliar"
              className="inline-flex items-center gap-2 bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors"
            >
              Ser o primeiro a avaliar →
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: ReviewPublic) => (
              <Card key={review.id}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    {review.teacher && (
                      <Link
                        href={`/professor/${review.teacher.id}`}
                        className="text-sm font-semibold text-brand-600 hover:underline"
                      >
                        {review.teacher.name}
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
                    {review.attendance_pressure && (
                      <Badge variant={review.attendance_pressure === 'alta' ? 'warning' : 'default'}>
                        {pressureLabel[review.attendance_pressure]}
                      </Badge>
                    )}
                    {review.assessment_style && (
                      <Badge variant="default">
                        {styleLabel[review.assessment_style]}
                      </Badge>
                    )}
                    {isEad && review.had_in_person_event === true && (
                      <Badge variant="warning">Teve encontro presencial</Badge>
                    )}
                    {isEad && review.relevant_to_course === true && (
                      <Badge variant="success">Conteúdo relevante</Badge>
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

                <p className="text-xs text-edge mt-3">
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
