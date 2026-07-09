import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Painel Admin — MeuSemestreUCSAL' }

export default async function PainelPage() {
  const supabase = await createClient()

  const [teachers, reviews, users] = await Promise.all([
    (supabase as any).from('teachers').select('id', { count: 'exact', head: true }),
    (supabase as any).from('reviews').select('id', { count: 'exact', head: true }),
    (supabase as any).from('profiles').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Professores', value: teachers.count ?? 0, href: '/painel-interno/professores' },
    { label: 'Avaliações', value: reviews.count ?? 0, href: '/painel-interno/avaliacoes' },
    { label: 'Usuários', value: users.count ?? 0, href: '/painel-interno/usuarios' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#e6edf3] mb-8">Dashboard</h1>
      <div className="grid grid-cols-3 gap-5">
        {stats.map((s) => (
          <a
            key={s.label}
            href={s.href}
            className="bg-[#161b22] rounded-2xl border border-[#30363d] p-6 hover:border-[#3fb950] transition-all"
          >
            <p className="text-3xl font-bold text-[#e6edf3] tabular-nums">{s.value}</p>
            <p className="text-sm text-[#8b949e] mt-1">{s.label}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
