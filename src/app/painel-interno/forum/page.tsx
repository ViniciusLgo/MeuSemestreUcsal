import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  setForumThreadStatus,
  setForumPostStatus,
  deleteForumThread,
  deleteForumPost,
} from '@/lib/actions/admin'

export const metadata: Metadata = { title: 'Fórum — Painel Admin' }

const STATUS_LABEL: Record<string, string> = {
  publicado: 'Publicado',
  oculto: 'Oculto',
  em_revisao: 'Em revisão',
}
const STATUS_COLOR: Record<string, string> = {
  publicado: 'bg-brand-100 text-brand-400 border-brand-300',
  oculto: 'bg-surface-2 text-fg-muted border-edge',
  em_revisao: 'bg-amber-100 text-amber-500 border-amber-300',
}

interface Props { searchParams: Promise<{ tab?: string; status?: string }> }

export default async function ForumAdminPage({ searchParams }: Props) {
  const { tab = 'threads', status } = await searchParams
  const supabase = await createClient()
  const db = supabase as any

  // ── Contagens de pendências ─────────────────────────────────────────────────
  const [threadRevisao, postRevisao] = await Promise.all([
    db.from('forum_threads').select('id', { count: 'exact', head: true }).eq('status', 'em_revisao'),
    db.from('forum_posts').select('id', { count: 'exact', head: true }).eq('status', 'em_revisao'),
  ])
  const pendencias = (threadRevisao.count ?? 0) + (postRevisao.count ?? 0)

  // ── Threads ─────────────────────────────────────────────────────────────────
  let threads: any[] = []
  let posts: any[] = []

  if (tab === 'threads') {
    let q = db
      .from('forum_threads')
      .select('id, title, body, status, created_at, views, category:forum_categories(name, icon)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (status && ['publicado', 'oculto', 'em_revisao'].includes(status)) {
      q = q.eq('status', status)
    }
    const { data } = await q
    threads = data ?? []
  } else {
    let q = db
      .from('forum_posts')
      .select('id, body, status, created_at, thread:forum_threads(id, title)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (status && ['publicado', 'oculto', 'em_revisao'].includes(status)) {
      q = q.eq('status', status)
    }
    const { data } = await q
    posts = data ?? []
  }

  function tabHref(t: string, s?: string) {
    const params = new URLSearchParams({ tab: t })
    if (s) params.set('status', s)
    return `/painel-interno/forum?${params}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fg">
          Moderação do Fórum
          {pendencias > 0 && (
            <span className="ml-2 text-sm font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full">
              {pendencias} pendente{pendencias !== 1 ? 's' : ''}
            </span>
          )}
        </h1>
        <Link href="/forum" target="_blank" className="text-sm text-fg-subtle hover:text-brand-400 transition-colors">
          Ver fórum →
        </Link>
      </div>

      {/* Tabs: Threads / Respostas */}
      <div className="flex gap-2 mb-4">
        {[
          { label: 'Threads', value: 'threads', count: threadRevisao.count },
          { label: 'Respostas', value: 'posts', count: postRevisao.count },
        ].map((t) => (
          <Link
            key={t.value}
            href={tabHref(t.value)}
            className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
              tab === t.value
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-surface border-edge text-fg-muted hover:border-brand-400 hover:text-brand-400'
            }`}
          >
            {t.label}
            {(t.count ?? 0) > 0 && (
              <span className={`ml-1.5 text-xs ${tab === t.value ? 'text-white/70' : 'text-amber-500'}`}>
                ({t.count} em revisão)
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Filtros de status */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { label: 'Todos', value: undefined },
          { label: 'Em revisão', value: 'em_revisao' },
          { label: 'Publicados', value: 'publicado' },
          { label: 'Ocultos', value: 'oculto' },
        ].map((f) => {
          const isActive = (status ?? undefined) === f.value
          return (
            <Link
              key={f.label}
              href={tabHref(tab, f.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-surface-2 border-fg-muted text-fg'
                  : 'bg-surface border-edge text-fg-muted hover:border-fg-muted'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Lista de threads */}
      {tab === 'threads' && (
        <div className="bg-surface rounded-2xl border border-edge divide-y divide-edge-muted">
          {threads.length === 0 && (
            <p className="px-6 py-8 text-center text-fg-subtle text-sm">Nenhuma thread encontrada.</p>
          )}
          {threads.map((t: any) => (
            <div key={t.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                    {t.category && (
                      <span className="text-xs text-fg-subtle">
                        {t.category.icon} {t.category.name}
                      </span>
                    )}
                    <span className="text-xs text-fg-subtle ml-auto">{t.views ?? 0} views</span>
                  </div>
                  <Link
                    href={`/forum/thread/${t.id}`}
                    target="_blank"
                    className="text-sm font-semibold text-fg hover:text-brand-400 transition-colors line-clamp-1"
                  >
                    {t.title}
                  </Link>
                  {t.body && (
                    <p className="text-xs text-fg-muted mt-0.5 line-clamp-1 italic">"{t.body}"</p>
                  )}
                  <p className="text-xs text-fg-subtle mt-1">
                    {new Date(t.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                  {t.status !== 'publicado' && (
                    <form action={setForumThreadStatus.bind(null, t.id, 'publicado')}>
                      <button type="submit" className="text-xs font-medium px-2.5 py-1 rounded-lg text-brand-400 hover:bg-brand-100 transition-colors border border-transparent hover:border-brand-300">
                        Publicar
                      </button>
                    </form>
                  )}
                  {t.status !== 'em_revisao' && (
                    <form action={setForumThreadStatus.bind(null, t.id, 'em_revisao')}>
                      <button type="submit" className="text-xs font-medium px-2.5 py-1 rounded-lg text-amber-500 hover:bg-amber-100 transition-colors border border-transparent hover:border-amber-300">
                        Revisão
                      </button>
                    </form>
                  )}
                  {t.status !== 'oculto' && (
                    <form action={setForumThreadStatus.bind(null, t.id, 'oculto')}>
                      <button type="submit" className="text-xs font-medium px-2.5 py-1 rounded-lg text-fg-muted hover:bg-surface-2 transition-colors border border-transparent hover:border-edge">
                        Ocultar
                      </button>
                    </form>
                  )}
                  <form action={deleteForumThread.bind(null, t.id)}>
                    <button
                      type="submit"
                      onClick={(e) => { if (!confirm('Deletar esta thread e todos os seus posts?')) e.preventDefault() }}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg text-red-400 hover:bg-red-100 transition-colors border border-transparent hover:border-red-300"
                    >
                      Deletar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista de posts */}
      {tab === 'posts' && (
        <div className="bg-surface rounded-2xl border border-edge divide-y divide-edge-muted">
          {posts.length === 0 && (
            <p className="px-6 py-8 text-center text-fg-subtle text-sm">Nenhuma resposta encontrada.</p>
          )}
          {posts.map((p: any) => (
            <div key={p.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                    {p.thread && (
                      <Link
                        href={`/forum/thread/${p.thread.id}`}
                        target="_blank"
                        className="text-xs text-fg-subtle hover:text-brand-400 transition-colors truncate max-w-xs"
                      >
                        → {p.thread.title}
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-fg-muted line-clamp-2 italic">"{p.body}"</p>
                  <p className="text-xs text-fg-subtle mt-1">
                    {new Date(p.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                  {p.status !== 'publicado' && (
                    <form action={setForumPostStatus.bind(null, p.id, 'publicado')}>
                      <button type="submit" className="text-xs font-medium px-2.5 py-1 rounded-lg text-brand-400 hover:bg-brand-100 transition-colors border border-transparent hover:border-brand-300">
                        Publicar
                      </button>
                    </form>
                  )}
                  {p.status !== 'em_revisao' && (
                    <form action={setForumPostStatus.bind(null, p.id, 'em_revisao')}>
                      <button type="submit" className="text-xs font-medium px-2.5 py-1 rounded-lg text-amber-500 hover:bg-amber-100 transition-colors border border-transparent hover:border-amber-300">
                        Revisão
                      </button>
                    </form>
                  )}
                  {p.status !== 'oculto' && (
                    <form action={setForumPostStatus.bind(null, p.id, 'oculto')}>
                      <button type="submit" className="text-xs font-medium px-2.5 py-1 rounded-lg text-fg-muted hover:bg-surface-2 transition-colors border border-transparent hover:border-edge">
                        Ocultar
                      </button>
                    </form>
                  )}
                  <form action={deleteForumPost.bind(null, p.id)}>
                    <button
                      type="submit"
                      onClick={(e) => { if (!confirm('Deletar esta resposta?')) e.preventDefault() }}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg text-red-400 hover:bg-red-100 transition-colors border border-transparent hover:border-red-300"
                    >
                      Deletar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
