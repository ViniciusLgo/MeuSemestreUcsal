import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { setUserStatus } from '@/lib/actions/admin'

export const metadata: Metadata = { title: 'Usuários — Painel Admin' }

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: users } = await (supabase as any)
    .from('profiles')
    .select('id, email, role, status, created_at, course:courses(code)')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Usuários</h1>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {(users ?? []).length === 0 && (
          <p className="px-6 py-8 text-center text-slate-400 text-sm">Nenhum usuário ainda.</p>
        )}
        {(users ?? []).map((u: any) => (
          <div key={u.id} className="flex items-center justify-between px-6 py-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900">{u.email}</p>
                {u.role === 'admin' && (
                  <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded-full">admin</span>
                )}
                {u.status === 'banned' && (
                  <span className="text-xs bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-full">banido</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {u.course?.code ?? 'sem curso'} · {new Date(u.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            {u.role !== 'admin' && (
              <form action={setUserStatus.bind(null, u.id, u.status === 'active' ? 'banned' : 'active')}>
                <button
                  type="submit"
                  className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${
                    u.status === 'active'
                      ? 'text-red-500 hover:bg-red-50'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {u.status === 'active' ? 'Banir' : 'Reativar'}
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
