'use client'

import { useState } from 'react'
import { createPost } from '@/lib/actions/forum'

interface Props {
  threadId:  string
  parentId?: string | null
  onSuccess?: () => void
  placeholder?: string
}

export function ForumReplyForm({ threadId, parentId, onSuccess, placeholder }: Props) {
  const [body,    setBody]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const remaining = 2000 - body.length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    setError(null)
    const result = await createPost({ thread_id: threadId, parent_id: parentId, body })
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setBody('')
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder ?? 'Escreva sua resposta…'}
        rows={3}
        maxLength={2000}
        className="w-full text-sm bg-canvas border border-edge rounded-xl px-3 py-2.5 text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent-400 resize-none"
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${remaining < 100 ? 'text-amber-400' : 'text-fg-subtle'}`}>
          {remaining} caracteres restantes
        </span>
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Responder'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 bg-[#2d0a0a] border border-red-700 px-3 py-2 rounded-lg">{error}</p>}
    </form>
  )
}
