import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ForumPostCard } from '@/components/forum/ForumPostCard'
import { ForumReplyForm } from '@/components/forum/ForumReplyForm'
import { ForumPollWidget } from '@/components/forum/ForumPollWidget'
import { ForumNicknameAvatar } from '@/components/forum/ForumNicknameAvatar'
import { ForumAttachmentPreview } from '@/components/forum/ForumAttachmentPreview'
import { incrementThreadViews } from '@/lib/actions/forum'

interface Props {
  params: Promise<{ id: string }>
}

type Thread = {
  id: string; title: string; body: string; status: string
  created_at: string; views: number
  category_id: string | null; subject_id: string | null; author_id: string
}
type RawPost = {
  id: string; body: string; created_at: string
  author_id: string; parent_id: string | null
}
type Identity = { nickname: string; color: string }
type PollOption = { id: string; label: string; order: number; vote_count: number }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('forum_threads')
    .select('title')
    .eq('id', id)
    .single()
  return { title: (data as { title: string } | null)?.title ?? 'Tópico — Fórum' }
}

export default async function ForumThreadPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/entrar?redirectTo=/forum/thread/${id}`)

  const { data: rawThread } = await db
    .from('forum_threads')
    .select('id, title, body, status, created_at, views, category_id, subject_id, author_id')
    .eq('id', id)
    .eq('status', 'publicado')
    .single()

  if (!rawThread) notFound()
  const thread = rawThread as Thread

  incrementThreadViews(id).catch(() => {})

  const [
    { data: rawAuthorIdentity },
    { data: rawPosts },
    { data: rawAttachments },
    { data: rawPoll },
    { data: rawCategory },
    { data: rawSubject },
  ] = await Promise.all([
    db.from('forum_thread_identities').select('nickname, color')
      .eq('thread_id', id).eq('user_id', thread.author_id).maybeSingle(),
    db.from('forum_posts').select('id, body, created_at, author_id, parent_id')
      .eq('thread_id', id).eq('status', 'publicado').order('created_at'),
    db.from('forum_attachments').select('id, storage_path, mime_type, size_bytes')
      .eq('thread_id', id),
    db.from('forum_polls')
      .select('id, question, ends_at, forum_poll_options(id, label, order)')
      .eq('thread_id', id).maybeSingle(),
    thread.category_id
      ? db.from('forum_categories').select('name, icon, slug').eq('id', thread.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
    thread.subject_id
      ? db.from('subjects').select('name, code').eq('id', thread.subject_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const authorIdentity = rawAuthorIdentity as Identity | null
  const posts          = (rawPosts as RawPost[] | null) ?? []
  const attachments    = (rawAttachments as { id: string; storage_path: string; mime_type: string; size_bytes: number }[] | null) ?? []
  const category       = rawCategory as { name: string; icon: string; slug: string } | null
  const subject        = rawSubject as { name: string; code: string } | null
  const poll           = rawPoll as { id: string; question: string; ends_at: string | null; forum_poll_options: { id: string; label: string; order: number }[] } | null

  const rootPosts = posts.filter((p) => !p.parent_id)
  const replyMap  = new Map<string, RawPost[]>()
  posts.filter((p) => p.parent_id).forEach((p) => {
    const list = replyMap.get(p.parent_id!) ?? []
    list.push(p)
    replyMap.set(p.parent_id!, list)
  })

  type EnrichedPost = {
    id: string; body: string; created_at: string; is_own: boolean
    identity: Identity; like_count: number; user_liked: boolean
    thread_id: string; parent_id: string | null; replies: EnrichedPost[]
  }

  async function enrichPost(p: RawPost): Promise<EnrichedPost> {
    const [{ data: ident }, { count: like_count }, { data: userLike }] = await Promise.all([
      db.from('forum_thread_identities').select('nickname, color')
        .eq('thread_id', id).eq('user_id', p.author_id).maybeSingle(),
      db.from('forum_reactions').select('id', { count: 'exact', head: true }).eq('post_id', p.id),
      db.from('forum_reactions').select('id').eq('post_id', p.id).eq('user_id', user!.id).maybeSingle(),
    ])
    const replies = await Promise.all((replyMap.get(p.id) ?? []).map(enrichPost))
    return {
      id:         p.id,
      body:       p.body,
      created_at: p.created_at,
      is_own:     p.author_id === user!.id,
      identity:   (ident as Identity | null) ?? { nickname: 'Anônimo', color: '#888' },
      like_count: (like_count as number | null) ?? 0,
      user_liked: !!userLike,
      thread_id:  id,
      parent_id:  p.parent_id,
      replies,
    }
  }

  const enrichedPosts = await Promise.all(rootPosts.map(enrichPost))

  // Enquete
  let pollData = null
  if (poll) {
    const options = [...poll.forum_poll_options].sort((a, b) => a.order - b.order)
    const voteCounts: PollOption[] = await Promise.all(
      options.map(async (opt) => {
        const { count } = await db
          .from('forum_poll_votes').select('id', { count: 'exact', head: true }).eq('option_id', opt.id)
        return { ...opt, vote_count: (count as number | null) ?? 0 }
      })
    )
    const { data: userVoteRaw } = await db
      .from('forum_poll_votes').select('option_id').eq('poll_id', poll.id).eq('user_id', user!.id).maybeSingle()
    pollData = {
      id:       poll.id,
      question: poll.question,
      ends_at:  poll.ends_at,
      options:  voteCounts,
      total_votes: voteCounts.reduce((s, o) => s + o.vote_count, 0),
      user_vote_option_id: (userVoteRaw as { option_id: string } | null)?.option_id ?? null,
    }
  }

  const { count: threadLikeCount } = await db
    .from('forum_reactions').select('id', { count: 'exact', head: true }).eq('thread_id', id)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-fg-subtle">
        <Link href="/forum" className="hover:text-fg-muted transition-colors">Fórum</Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/forum/${category.slug}`} className="hover:text-fg-muted transition-colors">
              {category.icon} {category.name}
            </Link>
          </>
        )}
        {subject && (
          <>
            <span>/</span>
            <Link href={`/disciplina/${thread.subject_id}`} className="hover:text-fg-muted transition-colors">
              {subject.code}
            </Link>
          </>
        )}
      </nav>

      {/* Thread principal */}
      <article className="bg-surface-2 border border-edge rounded-xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <ForumNicknameAvatar
            nickname={authorIdentity?.nickname ?? '?'}
            color={authorIdentity?.color ?? '#888'}
            size="lg"
          />
          <div className="flex-1">
            <h1 className="text-lg font-bold text-fg leading-snug">{thread.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-fg-subtle">
              <span style={{ color: authorIdentity?.color }}>{authorIdentity?.nickname ?? 'Anônimo'}</span>
              <span>·</span>
              <span>{new Date(thread.created_at).toLocaleDateString('pt-BR')}</span>
              <span>·</span>
              <span>{thread.views} views</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">{thread.body}</p>

        {attachments.length > 0 && (
          <ForumAttachmentPreview attachments={attachments} supabaseUrl={supabaseUrl} />
        )}

        {pollData && <ForumPollWidget poll={pollData} />}

        <div className="flex items-center gap-3 pt-1 border-t border-edge">
          <span className="text-xs text-fg-subtle">
            ♥ {(threadLikeCount as number | null) ?? 0} curtidas
          </span>
          <span className="text-xs text-fg-subtle">
            {enrichedPosts.length} {enrichedPosts.length === 1 ? 'resposta' : 'respostas'}
          </span>
        </div>
      </article>

      {/* Posts */}
      {enrichedPosts.length > 0 && (
        <section className="space-y-1 divide-y divide-edge">
          {enrichedPosts.map((post) => (
            <ForumPostCard key={post.id} post={post} threadId={id} />
          ))}
        </section>
      )}

      {/* Formulário de resposta */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-fg">Sua resposta</h2>
        <ForumReplyForm threadId={id} placeholder="Escreva sua resposta…" />
        <p className="text-xs text-fg-subtle">
          🔒 Você aparecerá com um apelido anônimo neste tópico.
        </p>
      </section>
    </main>
  )
}
