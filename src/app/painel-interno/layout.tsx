import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getProfile } from '@/lib/queries/profiles'

const NAV = [
  { href: '/painel-interno', label: 'Dashboard' },
  { href: '/painel-interno/professores', label: 'Professores' },
  { href: '/painel-interno/matrizes', label: 'Matrizes' },
  { href: '/painel-interno/avaliacoes', label: 'Avaliações' },
  { href: '/painel-interno/usuarios', label: 'Usuários' },
]

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') redirect('/')

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      <aside className="w-52 flex-shrink-0 border-r border-[#21262d] bg-[#161b22] py-6 px-3">
        <p className="text-xs font-semibold text-[#6e7681] uppercase tracking-widest px-3 mb-3">Painel Admin</p>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg text-sm font-medium text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 py-8 px-8 overflow-auto bg-[#0d1117]">{children}</main>
    </div>
  )
}
