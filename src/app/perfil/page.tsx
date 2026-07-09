import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getProfile } from '@/lib/queries/profiles'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/layout/SignOutButton'
import { StarRating } from '@/components/ui/StarRating'
import { deleteOwnReview } from '@/lib/actions/student'

export const metadata: Metadata = { title: 'Meu Perfil — MeuSemestreUCSAL' }

type OwnReview = {
  id: string
  rating_general: number
  assessment_style: string | null
  comment: string | null
  created_at: string
  status: string
  teacher: { id: string; name: string } | null
  subject: { id: string; name: string; code: string } | null
}

const diffLabel: Record<number, string> = { 2: 'Fácil', 3: 'Médio', 4: 'Difícil', 5: 'HARDCORE' }
const styleLabel: Record<string, string> = {
  prova: 'Prova', projeto: 'Projeto', trabalho: 'Trabalho', misto: 'Misto',
}

export default async function PerfilPage() {
  const profile = await getProfile()
  if (!profile) redirect('/entrar?redirectTo=/perfil')

  const supabase = await createClient()

  const [courseRes, reviewsRes] = await Promise.all([
    profile.course_id
      ? (supabase as any).from('courses').select('code, name').eq('id', profile.course_id).single()
      : Promise.resolve({ data: null }),
    (supabase as any)
      .from('reviews')
      .select('id, rating_general, assessment_style, comment, created_at, status, teacher:teachers(id, name), subject:subjects(id, name, code)')
      .eq('author_id', profile.id)
      .order('created_at', { ascending: false }),
  ])

  const courseCode = courseRes.data as { code: string; name: string } | null
  const reviews: OwnReview[] = reviewsRes.data ?? []

  return (
    <div className="container-page py-12 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-fg mb-8">Meu perfil</h1>

      {/* ── Dados do perfil ─────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-edge divide-y divide-edge-muted mb-6">
        <div className="px-6 py-5">
          <p className="text-xs text-fg-subtle font-medium uppercase tracking-wide mb-1">Email</p>
          <p className="text-fg font-medium">{profile.email}</p>
        </div>

        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-fg-subtle font-medium uppercase tracking-wide mb-1">Curso</p>
            <p className="text-fg font-medium">
              {courseCode
                ? `${courseCode.code} — ${courseCode.name}`
                : <span className="text-fg-subtle italic">Não configurado</span>}
            </p>
          </div>
          <Link href="/perfil/configurar"
            className="text-xs text-brand-400 hover:underline font-medium">
            Alterar
          </Link>
        </div>

        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-fg-subtle font-medium uppercase tracking-wide mb-1">Turno</p>
            <p className="text-fg font-medium">
              {profile.shift ?? <span className="text-fg-subtle italic">Não configurado</span>}
            </p>
          </div>
        </div>

        {profile.role === 'admin' && (
          <div className="px-6 py-5">
            <Link href="/painel-interno"
              className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-400 text-xs font-semibold px-3 py-1 rounded-full border border-brand-300 hover:bg-brand-200 transition-colors">
              Painel de administração →
            </Link>
          </div>
        )}
      </div>

      <div className="flex justify-end mb-8">
        <SignOutButton className="text-sm font-medium text-red-400 border border-edge px-4 py-2 rounded-xl hover:bg-[#2d0a0a] hover:border-red-700 transition-colors bg-surface" />
      </div>

      {/* ── Minhas avaliações ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-fg">
            Minhas avaliações
            {reviews.length > 0 && (
              <span className="ml-2 text-sm font-normal text-fg-subtle">({reviews.length})</span>
            )}
          </h2>
          <Link href="/avaliar"
            className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors">
            + Nova avaliação
          </Link>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-surface border border-edge rounded-2xl px-6 py-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-fg-muted font-medium mb-2">Você ainda não avaliou nenhum professor.</p>
            <p className="text-fg-subtle text-sm mb-6">Compartilhe sua experiência de forma anônima.</p>
            <Link href="/avaliar"
              className="inline-flex items-center gap-2 bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors">
              Avaliar agora →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="bg-surface border border-edge rounded-2xl overflow-hidden">
                <div className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Professor + Disciplina */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-2">
                      {review.teacher && (
                        <Link href={`/professor/${review.teacher.id}`}
                          className="text-sm font-bold text-brand-400 hover:underline">
                          {review.teacher.name}
                        </Link>
                      )}
                      {review.subject && (
                        <>
                          <span className="text-fg-subtle text-xs">em</span>
                          <Link href={`/disciplina/${review.subject.id}`}
                            className="text-sm font-medium text-fg hover:text-brand-400 transition-colors">
                            {review.subject.name}
                          </Link>
                          <span className="text-xs font-mono text-fg-subtle bg-surface-2 px-1.5 py-0.5 rounded">
                            {review.subject.code}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Nota + badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <StarRating value={review.rating_general} size="sm" />
                      <span className={`text-sm font-bold ${
                        review.rating_general >= 4 ? 'text-brand-400'
                          : review.rating_general >= 3 ? 'text-amber-400' : 'text-red-400'
                      }`}>{review.rating_general}/5</span>
                      {review.assessment_style && (
                        <span className="text-xs bg-surface-2 border border-edge-muted px-2 py-0.5 rounded-full text-fg-muted">
                          {styleLabel[review.assessment_style] ?? review.assessment_style}
                        </span>
                      )}
                      {review.status !== 'publicada' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          review.status === 'em_revisao'
                            ? 'bg-amber-100 text-amber-500 border border-amber-300'
                            : 'bg-surface-2 text-fg-subtle border border-edge'
                        }`}>
                          {review.status === 'em_revisao' ? 'Em revisão' : 'Oculta'}
                        </span>
                      )}
                    </div>

                    {review.comment && (
                      <p className="text-xs text-fg-subtle mt-2 line-clamp-2 italic">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    )}

                    <p className="text-xs text-fg-subtle mt-2">
                      {new Date(review.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Botão remover */}
                  <form action={async () => {
                    'use server'
                    await deleteOwnReview(review.id)
                  }}>
                    <button type="submit"
                      title="Remover avaliação"
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-edge text-fg-subtle hover:border-red-500 hover:text-red-400 hover:bg-[#2d0a0a] transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
