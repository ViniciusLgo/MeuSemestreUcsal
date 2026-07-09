import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { setReviewStatus } from '@/lib/actions/admin'

export const metadata: Metadata = { title: 'Avaliações — Painel Admin' }

const STATUS_LABEL: Record<string, string> = {
  publicada: 'Publicada',
  oculta: 'Oculta',
  em_revisao: 'Em revisão',
}
const STATUS_COLOR: Record<string, string> = {
  publicada: 'bg-brand-100 text-brand-400 border-brand-300',
  oculta: 'bg-surface-2 text-fg-muted border-edge',
  em_revisao: 'bg-amber-100 text-amber-500 border-amber-300',
}

interface Props { searchParams: Promise<{ status?: string; q?: string }> }

export default async function AvaliacoesPage({ searchParams }: Props) {
  const { status, q } = await searchParams
  const supabase = await createClient()

  let query = (supabase as any)
    .from('reviews')
    .select('id, status, rating_general, comment, created_at, teacher:teachers(id, name), subject:subjects(name, code)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (status && ['publicada', 'oculta', 'em_revisao'].includes(status)) {
    query = query.eq('status', status)
  }

  const { data: reviews } = await query

  // Contagens por status
  const [pub, oculta, revisao] = await Promise.all([
    (supabase as any).from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'publicada'),
    (supabase as any).from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'oculta'),
    (supabase as any).from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'em_revisao'),
  ])

  const filtered = q
    ? (reviews ?? []).filter((r: any) =>
        r.teacher?.name?.toLowerCase().includes(q.toLowerCase()) ||
        r.subject?.code?.toLowerCase().includes(q.toLowerCase()) ||
        r.comment?.toLowerCase().includes(q.toLowerCase())
      )
    : (reviews ?? [])

  const tabs = [
    { label: 'Todas', value: undefined, count: (pub.count ?? 0) + (oculta.count ?? 0) + (revisao.count ?? 0) },
    { label: 'Publicadas', value: 'publicada', count: pub.count ?? 0 },
    { label: 'Em revisão', value: 'em_revisao', count: revisao.count ?? 0 },
    { label: 'Ocultas', value: 'oculta', count: oculta.count ?? 0 },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-fg mb-6">Avaliações</h1>

      {/* Tabs de filtro */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((tab) => {
          const isActive = (status ?? undefined) === tab.value
          const href = tab.value ? `/painel-interno/avaliacoes?status=${tab.value}` : '/painel-interno/avaliacoes'
          return (
            <Link key={tab.label} href={href}
              className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-surface border-edge text-fg-muted hover:border-brand-400 hover:text-brand-400'
              }`}>
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 text-xs ${isActive ? 'text-white/70' : 'text-fg-subtle'}`}>
                  ({tab.count})
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Busca */}
      <form method="GET" className="mb-5">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por professor, código ou comentário..."
          className="w-full px-4 py-2.5 bg-canvas border border-edge rounded-xl text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400"
        />
      </form>

      <div className="bg-surface rounded-2xl border border-edge divide-y divide-edge-muted">
        {filtered.length === 0 && (
          <p className="px-6 py-8 text-center text-fg-subtle text-sm">Nenhuma avaliação encontrada.</p>
        )}
        {filtered.map((r: any) => (
          <div key={r.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  {r.teacher && (
                    <Link href={`/professor/${r.teacher.id}`} target="_blank"
                      className="text-xs font-semibold text-fg hover:text-brand-400 transition-colors">
                      {r.teacher.name}
                    </Link>
                  )}
                  {r.subject && (
                    <span className="text-xs font-mono text-fg-subtle">{r.subject.code}</span>
                  )}
                  <span className={`text-xs font-bold ml-auto flex-shrink-0 ${
                    r.rating_general >= 4 ? 'text-brand-400'
                      : r.rating_general >= 3 ? 'text-amber-400' : 'text-red-400'
                  }`}>★ {r.rating_general}/5</span>
                </div>
                {r.comment && (
                  <p className="text-sm text-fg-muted truncate italic">"{r.comment}"</p>
                )}
                <p className="text-xs text-fg-subtle mt-1">
                  {new Date(r.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {r.status !== 'publicada' && (
                  <form action={setReviewStatus.bind(null, r.id, 'publicada')}>
                    <button type="submit" className="text-xs font-medium px-2.5 py-1 rounded-lg text-brand-400 hover:bg-brand-100 transition-colors border border-transparent hover:border-brand-300">
                      Publicar
                    </button>
                  </form>
                )}
                {r.status !== 'em_revisao' && (
                  <form action={setReviewStatus.bind(null, r.id, 'em_revisao')}>
                    <button type="submit" className="text-xs font-medium px-2.5 py-1 rounded-lg text-amber-500 hover:bg-amber-100 transition-colors border border-transparent hover:border-amber-300">
                      Revisão
                    </button>
                  </form>
                )}
                {r.status !== 'oculta' && (
                  <form action={setReviewStatus.bind(null, r.id, 'oculta')}>
                    <button type="submit" className="text-xs font-medium px-2.5 py-1 rounded-lg text-fg-muted hover:bg-surface-2 transition-colors border border-transparent hover:border-edge">
                      Ocultar
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
