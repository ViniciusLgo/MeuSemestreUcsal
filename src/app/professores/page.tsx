import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllTeachers, type TeacherSummary } from '@/lib/queries/teachers'
import { Avatar } from '@/components/ui/Avatar'
import { StarRating } from '@/components/ui/StarRating'

export const metadata: Metadata = { title: 'Professores — MeuSemestreUCSAL' }

function ratingColor(n: number) {
  if (n >= 7) return 'text-brand-400'
  if (n >= 5) return 'text-amber-400'
  return 'text-red-400'
}

export default async function ProfessoresPage() {
  const teachers = await getAllTeachers()

  const withReviews = teachers.filter((t) => t.review_count > 0)
  const withoutReviews = teachers.filter((t) => t.review_count === 0)

  // Ordenar com avaliações por nota decrescente
  withReviews.sort((a, b) => (b.avg_general ?? 0) - (a.avg_general ?? 0))

  return (
    <div className="container-page py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 text-sm text-fg-subtle">
          <Link href="/" className="hover:text-brand-400 transition-colors">Início</Link>
          <span>/</span>
          <span className="text-fg-muted">Professores</span>
        </div>
        <h1 className="text-3xl font-bold text-fg mb-1">Professores</h1>
        <p className="text-fg-muted text-sm">
          {teachers.length} professores cadastrados · {withReviews.length} com avaliações
        </p>
      </div>

      {/* Com avaliações */}
      {withReviews.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-bold text-fg-subtle uppercase tracking-widest mb-4">
            Com avaliações ({withReviews.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {withReviews.map((t) => (
              <TeacherCard key={t.id} teacher={t} />
            ))}
          </div>
        </section>
      )}

      {/* Sem avaliações */}
      {withoutReviews.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-fg-subtle uppercase tracking-widest mb-4">
            Sem avaliações ainda ({withoutReviews.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {withoutReviews.map((t) => (
              <TeacherCard key={t.id} teacher={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TeacherCard({ teacher: t }: { teacher: TeacherSummary }) {
  return (
    <Link
      href={`/professor/${t.id}`}
      className="flex items-center gap-4 bg-surface border border-edge rounded-2xl px-4 py-4 hover:border-brand-400 hover:shadow-sm transition-all"
    >
      <Avatar name={t.name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-fg text-sm leading-tight truncate">{t.name}</p>

        {t.avg_general !== null ? (
          <div className="flex items-center gap-1.5 mt-1">
            <StarRating value={t.avg_general} max={10} size="sm" />
            <span className={`text-xs font-bold tabular-nums ${ratingColor(t.avg_general)}`}>
              {t.avg_general.toFixed(1)}
            </span>
            <span className="text-xs text-fg-subtle">/ 10</span>
          </div>
        ) : (
          <p className="text-xs text-fg-subtle mt-1">Sem avaliações</p>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          {t.subject_count > 0 && (
            <span className="text-xs text-fg-subtle">
              {t.subject_count} disciplina{t.subject_count !== 1 ? 's' : ''}
            </span>
          )}
          {t.review_count > 0 && (
            <span className="text-xs text-fg-subtle">
              {t.review_count} av.
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
