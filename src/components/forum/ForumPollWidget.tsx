'use client'

import { useState } from 'react'
import { voteOnPoll } from '@/lib/actions/forum'

interface PollOption {
  id:         string
  label:      string
  vote_count: number
}

interface Props {
  poll: {
    id:       string
    question: string
    ends_at:  string | null
    options:  PollOption[]
    total_votes: number
    user_vote_option_id: string | null
  }
}

export function ForumPollWidget({ poll }: Props) {
  const [options,    setOptions]    = useState(poll.options)
  const [total,      setTotal]      = useState(poll.total_votes)
  const [userVote,   setUserVote]   = useState(poll.user_vote_option_id)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const isClosed = poll.ends_at ? new Date(poll.ends_at) < new Date() : false
  const hasVoted = userVote !== null

  async function handleVote(optionId: string) {
    if (hasVoted || isClosed || loading) return
    setLoading(true)
    setError(null)
    const result = await voteOnPoll(poll.id, optionId)
    if (result.error) { setError(result.error); setLoading(false); return }
    setUserVote(optionId)
    setTotal((v) => v + 1)
    setOptions((prev) =>
      prev.map((o) => o.id === optionId ? { ...o, vote_count: o.vote_count + 1 } : o)
    )
    setLoading(false)
  }

  return (
    <div className="bg-surface-2 border border-edge rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-fg">{poll.question}</p>
        {isClosed && (
          <span className="text-xs text-fg-subtle bg-canvas px-2 py-0.5 rounded-full border border-edge flex-shrink-0">
            Encerrada
          </span>
        )}
      </div>

      <div className="space-y-2">
        {options.map((option) => {
          const pct = total > 0 ? Math.round((option.vote_count / total) * 100) : 0
          const isChosen = userVote === option.id

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted || isClosed || loading}
              className="w-full text-left relative overflow-hidden rounded-lg border transition-colors disabled:cursor-default"
              style={{
                borderColor: isChosen ? 'var(--color-brand-400, #58a6ff)' : 'var(--color-edge)',
              }}
            >
              {/* barra de progresso */}
              <div
                className="absolute inset-0 transition-all duration-500"
                style={{
                  width: (hasVoted || isClosed) ? `${pct}%` : '0%',
                  backgroundColor: isChosen ? '#58a6ff22' : '#ffffff08',
                }}
              />
              <div className="relative flex items-center justify-between px-3 py-2">
                <span className="text-sm text-fg">
                  {isChosen && '✓ '}{option.label}
                </span>
                {(hasVoted || isClosed) && (
                  <span className="text-xs text-fg-muted font-medium">{pct}%</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-fg-subtle">
        {total} {total === 1 ? 'voto' : 'votos'}
        {poll.ends_at && !isClosed && (
          <> · encerra em {new Date(poll.ends_at).toLocaleDateString('pt-BR')}</>
        )}
      </p>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
