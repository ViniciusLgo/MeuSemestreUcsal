import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Fórum — MeuSemestreUCSAL' }

type Category = {
  id: string
  name: string
  description: string | null
  icon: string
  slug: string
  thread_count: number | null
}

export default async function ForumPage() {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()

  const { data: rawCategories } = await db
    .from('forum_categories')
    .select('id, name, description, icon, slug')
    .eq('active', true)
    .order('order')

  const categories: Category[] = await Promise.all(
    ((rawCategories as Category[] | null) ?? []).map(async (cat) => {
      if (!user) return { ...cat, thread_count: null }
      const { count } = await db
        .from('forum_threads')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', cat.id)
        .eq('status', 'publicado')
      return { ...cat, thread_count: (count as number | null) ?? 0 }
    })
  )

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-fg">Fórum</h1>
        <p className="text-sm text-fg-muted">
          Espaço anônimo para discussões entre estudantes da UCSAL.
        </p>
      </div>

      {!user && (
        <div className="bg-surface-2 border border-edge rounded-xl p-5 text-center space-y-3">
          <p className="text-sm text-fg-muted">
            Faça login para ler as discussões e participar do fórum.
          </p>
          <Link
            href="/entrar?redirectTo=/forum"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Entrar para participar
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-surface-2 border border-edge rounded-xl overflow-hidden">
            {user ? (
              <Link
                href={`/forum/${cat.slug}`}
                className="flex items-center gap-4 p-4 hover:bg-overlay transition-colors group"
              >
                <span className="text-2xl">{cat.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-fg group-hover:text-brand-400 transition-colors">
                    {cat.name}
                  </p>
                  {cat.description && (
                    <p className="text-xs text-fg-muted mt-0.5">{cat.description}</p>
                  )}
                </div>
                {cat.thread_count !== null && (
                  <span className="text-xs text-fg-subtle">{cat.thread_count} tópicos</span>
                )}
              </Link>
            ) : (
              <div className="flex items-center gap-4 p-4 opacity-60">
                <span className="text-2xl">{cat.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-fg">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-fg-muted mt-0.5">{cat.description}</p>
                  )}
                </div>
                <span className="text-xs text-fg-subtle">🔒</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {user && (
        <div className="flex justify-end">
          <Link
            href="/forum/nova"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            + Novo tópico
          </Link>
        </div>
      )}
    </main>
  )
}
