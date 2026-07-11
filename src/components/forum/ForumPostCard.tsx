'use client'

import { useState } from 'react'
import { ForumNicknameAvatar } from './ForumNicknameAvatar'
import { ForumReplyForm } from './ForumReplyForm'
import { deleteOwnPost, toggleReaction, reportForumContent } from '@/lib/actions/forum'

interface Identity {
  nickname: string
  color:    string
}

interface PostData {
  id:         string
  body:       string
  created_at: string
  is_own:     boolean
  identity:   Identity
  like_count: number
  user_liked: boolean
  replies?:   PostData[]
  thread_id:  string
  parent_id?: string | null
}

interface Props {
  post:        PostData
  isReply?:    boolean
  threadId:    string
}

export function ForumPostCard({ post, isReply = false, threadId }: Props) {
  const [showReply, setShowReply]   = useState(false)
  const [likes,     setLikes]       = useState(post.like_count)
  const [liked,     setLiked]       = useState(post.user_liked)
  const [deleted,   setDeleted]     = useState(false)
  const [reported,  setReported]    = useState(false)
  const [loading,   setLoading]     = useState(false)

  const ago = formatRelativeTime(post.created_at)

  async function handleLike() {
    setLiked((v) => !v)
    setLikes((v) => v + (liked ? -1 : 1))
    await toggleReaction({ post_id: post.id })
  }

  async function handleDelete() {
    if (!confirm('Deletar esta resposta?')) return
    setLoading(true)
    await deleteOwnPost(post.id, threadId)
    setDeleted(true)
    setLoading(false)
  }

  async function handleReport() {
    await reportForumContent({ post_id: post.id }, 'conteudo_ofensivo')
    setReported(true)
  }

  if (deleted) {
    return (
      <div className={`py-3 ${isReply ? 'pl-4 border-l border-edge ml-10' : ''}`}>
        <p className="text-xs text-fg-subtle italic">Resposta removida.</p>
      </div>
    )
  }

  return (
    <div className={isReply ? 'pl-4 border-l-2 border-edge ml-10 mt-3' : 'mt-4'}>
      <div className="flex items-start gap-3">
        <ForumNicknameAvatar
          nickname={post.identity.nickname}
          color={post.identity.color}
          size="sm"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold" style={{ color: post.identity.color }}>
              {post.identity.nickname}
            </span>
            <span className="text-xs text-fg-subtle">{ago}</span>
          </div>

          <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">{post.body}</p>

          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleLike}
              className={`text-xs transition-colors ${liked ? 'text-brand-400' : 'text-fg-subtle hover:text-fg-muted'}`}
            >
              ♥ {likes > 0 ? likes : ''}
            </button>

            {!isReply && (
              <button
                onClick={() => setShowReply((v) => !v)}
                className="text-xs text-fg-subtle hover:text-fg-muted transition-colors"
              >
                ↩ Responder
              </button>
            )}

            {post.is_own ? (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="text-xs text-fg-subtle hover:text-red-400 transition-colors disabled:opacity-50"
              >
                Deletar
              </button>
            ) : reported ? (
              <span className="text-xs text-fg-subtle">✓ Reportado</span>
            ) : (
              <button
                onClick={handleReport}
                className="text-xs text-fg-subtle hover:text-fg-muted transition-colors"
              >
                ⚑ Reportar
              </button>
            )}
          </div>

          {showReply && (
            <div className="mt-3">
              <ForumReplyForm
                threadId={threadId}
                parentId={post.id}
                onSuccess={() => setShowReply(false)}
              />
            </div>
          )}
        </div>
      </div>

      {post.replies?.map((reply) => (
        <ForumPostCard key={reply.id} post={reply} isReply threadId={threadId} />
      ))}
    </div>
  )
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)  return 'agora'
  if (min < 60) return `${min}m atrás`
  const h = Math.floor(min / 60)
  if (h < 24)  return `${h}h atrás`
  const d = Math.floor(h / 24)
  if (d < 30)  return `${d}d atrás`
  return new Date(iso).toLocaleDateString('pt-BR')
}
