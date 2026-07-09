import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Painel Admin — MeuSemestreUCSAL' }

export default async function PainelPage() {
  const supabase = await createClient()

  const [teachersRes, reviewsRes, usersRes, subjectsRes, pendingReviewsRes, coursesRes] = await Promise.all([
    (supabase as any).from('teachers').select('id', { count: 'exact', head: true }).eq('active', true),
    (supabase as any).from('reviews').select('id', { count: 'exact', head: true }),
    (supabase as any).from('profiles').select('id', { count: 'exact', head: true }),
    (supabase as any).from('subjects').select('id', { count: 'exact', head: true }).eq('active', true).eq('type', 'mandatory'),
    (supabase as any).from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'em_revisao'),
    (supabase as any).from('courses').select('id', { count: 'exact', head: true }).eq('active', true),
  ])

  // Disciplinas sem professor ativo
  const { data: allMandatorySubjects } = await (supabase as any)
    .from('subjects')
    .select('id, code, name, alert_status, teacher_subjects(teacher:teachers(active))')
    .eq('active', true)
    .eq('type', 'mandatory')

  const withoutTeacher = (allMandatorySubjects ?? []).filter((s: any) => {
    const active = (s.teacher_subjects ?? []).filter((ts: any) => ts.teacher?.active)
    return active.length === 0
  })
  const semProfCount = withoutTeacher.length
  const pendenteCount = withoutTeacher.filter((s: any) => s.alert_status === 'pendente').length
  const totalMandatory = subjectsRes.count ?? 0
  const coverage = totalMandatory > 0
    ? Math.round(((totalMandatory - semProfCount) / totalMandatory) * 100)
    : 0

  // Avaliações recentes
  const { data: recentReviews } = await (supabase as any)
    .from('reviews')
    .select('id, status, rating_general, created_at, teacher:teachers(id, name), subject:subjects(code)')
    .order('created_at', { ascending: false })
    .limit(6)

  // Professores com mais avaliações
  const { data: topTeachersRaw } = await (supabase as any)
    .from('teachers')
    .select('id, name, reviews(id, rating_general)')
    .eq('active', true)

  const rankedTeachers = (topTeachersRaw ?? [])
    .map((t: any) => ({
      id: t.id, name: t.name,
      count: t.reviews?.length ?? 0,
      avg: t.reviews?.length
        ? (t.reviews.reduce((s: number, r: any) => s + (r.rating_general ?? 0), 0) / t.reviews.length).toFixed(1)
        : null,
    }))
    .filter((t: any) => t.count > 0)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5)

  // Disciplinas pendentes recentes
  const pendenteDisciplinas = withoutTeacher
    .filter((s: any) => s.alert_status === 'pendente')
    .slice(0, 5)

  const pendingReviewsCount = pendingReviewsRes.count ?? 0

  const STATUS_COLOR: Record<string, string> = {
    publicada: 'text-brand-400', oculta: 'text-fg-subtle', em_revisao: 'text-amber-400',
  }
  const STATUS_ICON: Record<string, string> = {
    publicada: '✓', oculta: '○', em_revisao: '⚠',
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg">Dashboard</h1>
        <p className="text-xs text-fg-subtle">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Alertas urgentes ─────────────────────────────────────────────── */}
      {(pendingReviewsCount > 0 || pendenteCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {pendingReviewsCount > 0 && (
            <Link href="/painel-interno/avaliacoes?status=em_revisao"
              className="flex items-center gap-2.5 bg-amber-100 border border-amber-300 text-amber-600 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-amber-200 transition-colors">
              <span className="text-base">⚠</span>
              {pendingReviewsCount} avaliação{pendingReviewsCount !== 1 ? 'ões' : ''} em revisão
              <span className="text-amber-400 text-xs">→</span>
            </Link>
          )}
          {pendenteCount > 0 && (
            <Link href="/painel-interno/sem-professor?status=pendente"
              className="flex items-center gap-2.5 bg-[#2d1200] border border-orange-700 text-orange-400 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#3d1800] transition-colors">
              <span className="text-base">📚</span>
              {pendenteCount} disciplina{pendenteCount !== 1 ? 's' : ''} pendente{pendenteCount !== 1 ? 's' : ''} de professor
              <span className="text-orange-600 text-xs">→</span>
            </Link>
          )}
        </div>
      )}

      {/* ── Stats cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {[
          { label: 'Professores ativos', value: teachersRes.count ?? 0, href: '/painel-interno/professores', color: 'text-brand-400' },
          { label: 'Avaliações', value: reviewsRes.count ?? 0, href: '/painel-interno/avaliacoes', color: 'text-accent-400' },
          { label: 'Usuários', value: usersRes.count ?? 0, href: '/painel-interno/usuarios', color: 'text-purple-400' },
          { label: 'Cursos ativos', value: coursesRes.count ?? 0, href: '/painel-interno/matrizes', color: 'text-teal-400' },
        ].map((s) => (
          <Link key={s.label} href={s.href}
            className="bg-surface rounded-2xl border border-edge p-5 hover:border-brand-400 transition-all group">
            <p className={`text-3xl font-bold tabular-nums mb-1 ${s.color}`}>{s.value}</p>
            <p className="text-sm text-fg-muted group-hover:text-fg transition-colors">{s.label}</p>
          </Link>
        ))}

        {/* Cobertura de professores */}
        <Link href="/painel-interno/sem-professor"
          className={`bg-surface rounded-2xl border p-5 hover:shadow-sm transition-all group col-span-2 ${
            semProfCount > 0 ? 'border-orange-700' : 'border-edge hover:border-brand-400'
          }`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className={`text-3xl font-bold tabular-nums ${
                semProfCount === 0 ? 'text-brand-400' : semProfCount > 10 ? 'text-red-400' : 'text-amber-400'
              }`}>{coverage}%</p>
              <p className="text-sm text-fg-muted group-hover:text-fg transition-colors">Cobertura de professores</p>
            </div>
            {semProfCount > 0 && (
              <div className="text-right">
                <p className="text-xl font-bold text-orange-400">{semProfCount}</p>
                <p className="text-xs text-fg-subtle">sem professor</p>
              </div>
            )}
          </div>
          {/* Barra de progresso */}
          <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                coverage >= 90 ? 'bg-brand-500' : coverage >= 60 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${coverage}%` }}
            />
          </div>
          <p className="text-xs text-fg-subtle mt-2">
            {totalMandatory - semProfCount} de {totalMandatory} disciplinas obrigatórias cobertas
          </p>
        </Link>

        {/* Em revisão */}
        <Link href="/painel-interno/avaliacoes?status=em_revisao"
          className={`bg-surface rounded-2xl border p-5 transition-all group ${
            pendingReviewsCount > 0 ? 'border-amber-500' : 'border-edge hover:border-brand-400'
          }`}>
          <p className={`text-3xl font-bold tabular-nums mb-1 ${
            pendingReviewsCount > 0 ? 'text-amber-400' : 'text-fg-subtle'
          }`}>{pendingReviewsCount}</p>
          <p className="text-sm text-fg-muted group-hover:text-fg transition-colors">Em revisão</p>
        </Link>
      </div>

      {/* ── Conteúdo principal ───────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Avaliações recentes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-fg-muted uppercase tracking-wide">Avaliações recentes</h2>
            <Link href="/painel-interno/avaliacoes" className="text-xs text-brand-400 hover:underline">Ver todas →</Link>
          </div>
          <div className="bg-surface rounded-2xl border border-edge divide-y divide-edge-muted">
            {(recentReviews ?? []).length === 0 && (
              <p className="px-5 py-6 text-sm text-fg-subtle text-center">Nenhuma avaliação ainda.</p>
            )}
            {(recentReviews ?? []).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-fg truncate">
                    {r.teacher?.name}
                    {r.subject?.code && (
                      <span className="ml-1.5 text-xs font-mono text-fg-subtle">{r.subject.code}</span>
                    )}
                  </p>
                  <p className="text-xs text-fg-subtle">
                    ★ {r.rating_general}/5 · {new Date(r.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-sm font-bold ${STATUS_COLOR[r.status]}`}>
                    {STATUS_ICON[r.status]}
                  </span>
                  {r.status === 'em_revisao' && (
                    <span className="text-xs text-amber-500 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                      revisar
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Col direita */}
        <div className="space-y-6">

          {/* Disciplinas pendentes */}
          {withoutTeacher.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-fg-muted uppercase tracking-wide">Sem professor</h2>
                <Link href="/painel-interno/sem-professor" className="text-xs text-orange-400 hover:underline">
                  Ver todas ({semProfCount}) →
                </Link>
              </div>
              <div className="bg-surface rounded-2xl border border-edge divide-y divide-edge-muted">
                {withoutTeacher.slice(0, 5).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-fg truncate">{s.name}</p>
                      <p className="text-xs font-mono text-fg-subtle">{s.code}</p>
                    </div>
                    {s.alert_status === 'pendente' && (
                      <span className="text-xs text-amber-500 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded flex-shrink-0">
                        pendente
                      </span>
                    )}
                    <Link href="/painel-interno/sem-professor"
                      className="text-xs text-accent-400 hover:underline flex-shrink-0">
                      Ver
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Professores mais avaliados */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-fg-muted uppercase tracking-wide">Mais avaliados</h2>
              <Link href="/painel-interno/professores" className="text-xs text-brand-400 hover:underline">Ver todos →</Link>
            </div>
            <div className="bg-surface rounded-2xl border border-edge divide-y divide-edge-muted">
              {rankedTeachers.length === 0 && (
                <p className="px-5 py-6 text-sm text-fg-subtle text-center">Nenhuma avaliação ainda.</p>
              )}
              {rankedTeachers.map((t: any, i: number) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs text-fg-subtle w-4 flex-shrink-0 font-mono">#{i + 1}</span>
                  <Link href={`/professor/${t.id}`} target="_blank"
                    className="text-sm text-fg hover:text-brand-400 transition-colors flex-1 truncate">
                    {t.name}
                  </Link>
                  <span className="text-xs text-fg-subtle">{t.count}×</span>
                  {t.avg && (
                    <span className={`text-xs font-bold ${
                      Number(t.avg) >= 4 ? 'text-brand-400' : Number(t.avg) >= 3 ? 'text-amber-400' : 'text-red-400'
                    }`}>★ {t.avg}</span>
                  )}
                  <Link href={`/painel-interno/professores/${t.id}`}
                    className="text-xs text-accent-400 hover:underline flex-shrink-0">
                    Editar
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Ações rápidas ────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-fg-muted uppercase tracking-wide mb-3">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/painel-interno/professores"
            className="px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors">
            + Cadastrar professor
          </Link>
          <Link href="/painel-interno/sem-professor"
            className="px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors">
            📚 Disciplinas sem professor {semProfCount > 0 && `(${semProfCount})`}
          </Link>
          {pendingReviewsCount > 0 && (
            <Link href="/painel-interno/avaliacoes?status=em_revisao"
              className="px-4 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors">
              ⚠ Revisar avaliações ({pendingReviewsCount})
            </Link>
          )}
          <Link href="/painel-interno/matrizes"
            className="px-4 py-2.5 bg-surface border border-edge text-fg-muted text-sm font-semibold rounded-xl hover:border-fg-muted hover:text-fg transition-colors">
            Ver matrizes
          </Link>
        </div>
      </div>
    </div>
  )
}
