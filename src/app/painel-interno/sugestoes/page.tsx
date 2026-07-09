import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { resolveTeacherSuggestion } from '@/lib/actions/admin'

export const metadata: Metadata = { title: 'Sugestões de professores — Admin' }

export default async function SugestoesPage() {
  const supabase = await createClient()

  const { data: suggestions } = await (supabase as any)
    .from('teacher_suggestions')
    .select(`
      id, suggested_name, details, status, admin_note, created_at,
      subject:subjects(id, name, code)
    `)
    .order('created_at', { ascending: false })

  const all = suggestions ?? []
  const pendentes = all.filter((s: any) => s.status === 'pendente')
  const resolvidas = all.filter((s: any) => s.status !== 'pendente')

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-fg">Sugestões de professores</h1>
          <p className="text-sm text-fg-subtle mt-1">Enviadas por alunos via página de disciplinas</p>
        </div>
        {pendentes.length > 0 && (
          <span className="text-xs font-bold bg-amber-900 text-amber-400 border border-amber-700 px-3 py-1.5 rounded-full">
            {pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {pendentes.length === 0 && resolvidas.length === 0 && (
        <div className="text-center py-20 text-fg-subtle">
          <div className="text-4xl mb-3">💡</div>
          <p>Nenhuma sugestão de professor ainda.</p>
        </div>
      )}

      {pendentes.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-fg-subtle uppercase tracking-wide mb-3">Pendentes</h2>
          <div className="space-y-3">
            {pendentes.map((s: any) => (
              <SugestaoCard key={s.id} s={s} />
            ))}
          </div>
        </div>
      )}

      {resolvidas.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-fg-subtle uppercase tracking-wide mb-3">Resolvidas</h2>
          <div className="space-y-3">
            {resolvidas.map((s: any) => (
              <SugestaoCard key={s.id} s={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SugestaoCard({ s }: { s: any }) {
  const statusStyle: Record<string, string> = {
    pendente: 'bg-amber-900 text-amber-400 border-amber-700',
    aprovado: 'bg-brand-100 text-brand-400 border-brand-300',
    rejeitado: 'bg-surface-2 text-fg-subtle border-edge',
  }

  return (
    <div className="bg-surface border border-edge rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-semibold text-fg">{s.suggested_name}</p>
          {s.subject && (
            <p className="text-xs text-fg-subtle mt-0.5">
              <span className="font-mono">{s.subject.code}</span> — {s.subject.name}
            </p>
          )}
          {s.details && (
            <p className="text-sm text-fg-muted mt-2 italic">"{s.details}"</p>
          )}
          <p className="text-xs text-fg-subtle mt-2">
            {new Date(s.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${statusStyle[s.status] ?? ''}`}>
          {s.status}
        </span>
      </div>

      {s.status === 'pendente' && (
        <div className="flex gap-2 pt-3 border-t border-edge-muted">
          <form action={resolveTeacherSuggestion}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="resolution" value="aprovado" />
            <button
              type="submit"
              className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              ✓ Aprovar e criar professor
            </button>
          </form>
          <form action={resolveTeacherSuggestion}>
            <input type="hidden" name="id" value={s.id} />
            <input type="hidden" name="resolution" value="rejeitado" />
            <button
              type="submit"
              className="text-xs font-semibold bg-surface-2 hover:bg-edge text-fg-muted px-3 py-1.5 rounded-lg transition-colors"
            >
              ✕ Rejeitar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
