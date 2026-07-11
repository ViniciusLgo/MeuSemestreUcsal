import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ForumThreadCard } from '@/components/forum/ForumThreadCard'

interface Props {
  params: Promise<{ slug: string }>
}

type RawThread = {
  id: string
  title: string
  body: string
  created_at: string
  views: number
  is_pinned: boolean
}

type RawCategory = {
  id: string
  name: string
  icon: string
  description: string | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: `${slug} — Fórum — MeuSemestreUCSAL` }
}

export default async function ForumCategoryPage({ params }: Props) {
  const { slug } = await params

  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/entrar?redirectTo=/forum/${slug}`)

  const { data: rawCat } = await db
    .from('forum_categories')
    .select('id, name, icon, description')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!rawCat) notFound()
  const category = rawCat as RawCategory

  const { data: rawThreads } = await db
    .from('forum_threads')
    .select('id, title, body, created_at, views, is_pinned')
    .eq('category_id', category.id)
    .eq('status', 'publicado')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  const threads = (rawThreads as RawThread[] | null) ?? []

  const enriched = await Promise.all(
    threads.map(async (t) => {
      const [{ data: identity }, { count: post_count }] = await Promise.all([
        db
          .from('forum_thread_identities')
          .select('nickname, color')
          .eq('thread_id', t.id)
          .order('created_at')
          .limit(1)
          .maybeSingle(),
        db
          .from('forum_posts')
          .select('id', { count: 'exact', head: true })
          .eq('thread_id', t.id)
          .eq('status', 'publicado'),
      ])
      return {
        ...t,
        post_count: (post_count as number | null) ?? 0,
        identity: (identity as { nickname: string; color: string } | null) ?? null,
        category: { name: category.name, icon: category.icon, slug },
      }
    })
  )

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-fg-subtle">
            <Link href="/forum" className="hover:text-fg-muted transition-colors">Fórum</Link>
            <span>/</span>
            <span>{category.name}</span>
          </div>
          <h1 className="text-xl font-bold text-fg">
            {category.icon} {category.name}
          </h1>
          {category.description && (
            <p className="text-sm text-fg-muted">{category.description}</p>
          )}
        </div>
        <Link
          href={`/forum/nova?categoria=${category.id}`}
          className="flex-shrink-0 text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl transition-colors"
        >
          + Novo tópico
        </Link>
      </div>

      {enriched.length === 0 ? (
        <div className="text-center py-16 text-fg-muted space-y-2">
          <p className="text-4xl">💬</p>
          <p className="text-sm">Nenhum tópico ainda. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enriched.map((t) => (
            <ForumThreadCard key={t.id} thread={t} />
          ))}
        </div>
      )}
    </main>
  )
}
