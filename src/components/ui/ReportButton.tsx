'use client'

import { useState } from 'react'
import { reportReview } from '@/lib/actions/student'
import { REPORT_REASONS } from '@/lib/review-constants'

interface Props {
  reviewId: string
}

export function ReportButton({ reviewId }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('offensive')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await reportReview(reviewId, reason, details || undefined)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setDone(true)
  }

  if (done) {
    return (
      <span className="text-xs text-fg-subtle">
        ✓ Reportado
      </span>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-fg-subtle hover:text-fg-muted transition-colors"
        title="Reportar avaliação"
      >
        ⚑ Reportar
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 p-3 bg-surface-2 border border-edge-muted rounded-xl space-y-2">
      <p className="text-xs font-semibold text-fg-muted">Motivo do reporte</p>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full text-xs bg-canvas border border-edge rounded-lg px-2 py-1.5 text-fg focus:outline-none focus:ring-1 focus:ring-accent-400"
      >
        {Object.entries(REPORT_REASONS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Detalhes opcionais..."
        rows={2}
        className="w-full text-xs bg-canvas border border-edge rounded-lg px-2 py-1.5 text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent-400 resize-none"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="text-xs font-semibold bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Confirmar reporte'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-fg-subtle hover:text-fg-muted px-2 py-1.5 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
