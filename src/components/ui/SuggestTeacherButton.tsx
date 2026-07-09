'use client'

import { useState } from 'react'
import { suggestTeacher } from '@/lib/actions/student'

interface Props {
  subjectId: string
  subjectName: string
}

export function SuggestTeacherButton({ subjectId, subjectName }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Digite o nome do professor.'); return }
    setLoading(true)
    setError(null)
    const result = await suggestTeacher(subjectId, name, details || undefined)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="bg-brand-100 border border-brand-300 rounded-xl px-4 py-3 text-sm text-brand-400">
        ✓ Sugestão enviada! O admin será notificado para revisar.
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-fg-subtle hover:text-fg-muted transition-colors underline underline-offset-2"
      >
        Conhece um professor para {subjectName}? Sugerir →
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-edge rounded-2xl p-5 space-y-3">
      <div>
        <p className="text-sm font-semibold text-fg mb-0.5">Sugerir professor</p>
        <p className="text-xs text-fg-subtle">para <span className="font-medium">{subjectName}</span></p>
      </div>
      <div>
        <label className="block text-xs font-medium text-fg-muted mb-1">Nome do professor *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null) }}
          placeholder="Ex: Prof. João Silva"
          className="w-full text-sm bg-canvas border border-edge rounded-xl px-3 py-2 text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-fg-muted mb-1">Informações adicionais (opcional)</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Ex: ministra a disciplina no período noturno, contrato temporário..."
          rows={2}
          className="w-full text-sm bg-canvas border border-edge rounded-xl px-3 py-2 text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent-400 resize-none"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Enviar sugestão'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-fg-subtle hover:text-fg-muted px-3 py-2 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
