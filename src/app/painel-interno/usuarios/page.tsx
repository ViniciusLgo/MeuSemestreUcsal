import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { setUserStatus } from '@/lib/actions/admin'

export const metadata: Metadata = { title: 'Usuários — Painel Admin' }

interface Props { searchParams: Promise<{ q?: string; role?: string }> }

export default async function UsuariosPage({ searchParams }: Props) {
  const { q, role } = await searchParams
  const supabase = await createClient()

  const { data: users } = await (supabase as any)
    .from('profiles')
    .select('id, email, role, status, shift, created_at, course:courses(code)')
    .order('created_at', { ascending: false })
    .limit(500)

  const filtered = (users ?? []).filter((u: any) => {
    if (role === 'admin' && u.role !== 'admin') return false
    if (role === 'banned' && u.status !== 'banned') return false
    if (q) return u.email?.toLowerCase().includes(q.toLowerCase())
    return true
  })

  const adminCount = (users ?? []).filter((u: any) => u.role === 'admin').length
  const bannedCount = (users ?? []).filter((u: any) => u.status === 'banned').length
  const totalCount = (users ?? []).length

  const tabs = [
    { label: 'Todos', value: undefined, count: totalCount },
    { label: 'Admins', value: 'admin', count: adminCount },
    { label: 'Banidos', value: 'banned', count: bannedCount },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fg">Usuários</h1>
        <div className="text-sm text-fg-subtle">{totalCount} cadastrados</div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((tab) => {
          const isActive = (role ?? undefined) === tab.value
          const href = tab.value
            ? `/painel-interno/usuarios?role=${tab.value}${q ? `&q=${q}` : ''}`
            : `/painel-interno/usuarios${q ? `?q=${q}` : ''}`
          return (
            <Link key={tab.label} href={href}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-surface border-edge text-fg-muted hover:border-brand-400'
              }`}>
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1 ${isActive ? 'text-white/70' : 'text-fg-subtle'}`}>({tab.count})</span>
              )}
            </Link>
          )
        })}
        <form method="GET" className="flex-1 min-w-48">
          {role && <input type="hidden" name="role" value={role} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por email..."
            className="w-full px-3 py-1.5 bg-canvas border border-edge rounded-lg text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </form>
      </div>

      <div className="bg-surface rounded-2xl border border-edge divide-y divide-edge-muted">
        {filtered.length === 0 && (
          <p className="px-6 py-8 text-center text-fg-subtle text-sm">Nenhum usuário encontrado.</p>
        )}
        {filtered.map((u: any) => (
          <div key={u.id} className="flex items-center justify-between px-5 py-4 gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-fg truncate">{u.email}</p>
                {u.role === 'admin' && (
                  <span className="text-xs bg-brand-100 text-brand-400 font-semibold px-2 py-0.5 rounded-full border border-brand-300">admin</span>
                )}
                {u.status === 'banned' && (
                  <span className="text-xs bg-[#2d0a0a] text-red-400 font-semibold px-2 py-0.5 rounded-full border border-red-800">banido</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-fg-subtle">{u.course?.code ?? 'sem curso'}</span>
                {u.shift && <span className="text-xs text-fg-subtle">{u.shift}</span>}
                <span className="text-xs text-fg-subtle">
                  {new Date(u.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            {u.role !== 'admin' && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/painel-interno/avaliacoes?q=${encodeURIComponent(u.email ?? '')}`}
                  className="text-xs text-fg-subtle hover:text-fg-muted border border-edge px-2.5 py-1 rounded-lg transition-all">
                  Ver aval.
                </Link>
                <form action={setUserStatus.bind(null, u.id, u.status === 'active' ? 'banned' : 'active')}>
                  <button type="submit"
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                      u.status === 'active'
                        ? 'text-red-400 border-transparent hover:bg-[#2d0a0a] hover:border-red-800'
                        : 'text-brand-400 border-transparent hover:bg-brand-100 hover:border-brand-300'
                    }`}>
                    {u.status === 'active' ? 'Banir' : 'Reativar'}
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
