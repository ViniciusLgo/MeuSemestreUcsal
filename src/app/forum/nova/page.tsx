import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ForumCreateForm } from '@/components/forum/ForumCreateForm'

export const metadata: Metadata = { title: 'Novo tópico — Fórum — MeuSemestreUCSAL' }

interface Props {
  searchParams: Promise<{ categoria?: string }>
}

type Category = { id: string; name: string; icon: string; slug: string }

export default async function ForumNovaPage({ searchParams: _ }: Props) {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/entrar?redirectTo=/forum/nova')

  const { data: rawCategories } = await db
    .from('forum_categories')
    .select('id, name, icon, slug')
    .eq('active', true)
    .order('order')

  const categories = (rawCategories as Category[] | null) ?? []

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-fg">Novo tópico</h1>
        <p className="text-sm text-fg-muted">
          Você aparecerá com um apelido aleatório. Nenhuma informação pessoal será exibida.
        </p>
      </div>

      <ForumCreateForm categories={categories} />
    </main>
  )
}
