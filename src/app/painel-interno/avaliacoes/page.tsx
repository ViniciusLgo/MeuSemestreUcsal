import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { setReviewStatus } from '@/lib/actions/admin'

export const metadata: Metadata = { title: 'Avaliações — Painel Admin' }

const STATUS_LABEL: Record<string, string> = {
  publicada: 'Publicada',
  oculta: 'Oculta',
  em_revisao: 'Em revisão',
}

const STATUS_COLOR: Record<string, string> = {
  publicada: 'bg-emerald-50 text-emerald-700',
  oculta: 'bg-slate-100 text-slate-500',
  em_revisao: 'bg-amber-50 text-amber-700',
}

export default async function AvaliacoesPage() {
  const supabase = await createClient()
  const { data: reviews } = await (supabase as any)
    .from('reviews')
    .select('id, status, rating_general, comment, created_at, teacher:teachers(name), subject:subjects(name, code)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Avaliações</h1>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {(reviews ?? []).length === 0 && (
          <p className="px-6 py-8 text-center text-slate-400 text-sm">Nenhuma avaliação ainda.</p>
        )}
        {(reviews ?? []).map((r: any) => (
          <div key={r.id} className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                  <span className="text-xs text-slate-400">
                    {r.teacher?.name} · {r.subject?.code}
                  </span>
                  <span className="text-xs text-slate-400">★ {r.rating_general}/5</span>
                </div>
                {r.comment && (
                  <p className="text-sm text-slate-600 truncate">{r.comment}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {r.status !== 'publicada' && (
                  <form action={setReviewStatus.bind(null, r.id, 'publicada')}>
                    <button type="submit" className="text-xs font-medium px-3 py-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                      Publicar
                    </button>
                  </form>
                )}
                {r.status !== 'oculta' && (
                  <form action={setReviewStatus.bind(null, r.id, 'oculta')}>
                    <button type="submit" className="text-xs font-medium px-3 py-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                      Ocultar
                    </button>
                  </form>
                )}
                {r.status !== 'em_revisao' && (
                  <form action={setReviewStatus.bind(null, r.id, 'em_revisao')}>
                    <button type="submit" className="text-xs font-medium px-3 py-1 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors">
                      Revisão
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
