import Link from 'next/link'
import { ForumNicknameAvatar } from './ForumNicknameAvatar'

interface Props {
  thread: {
    id:         string
    title:      string
    body:       string
    created_at: string
    views:      number
    post_count?: number
    category?: { name: string; icon: string; slug: string } | null
    identity?: { nickname: string; color: string } | null
  }
}

export function ForumThreadCard({ thread }: Props) {
  const preview = thread.body.length > 120
    ? thread.body.slice(0, 120) + '…'
    : thread.body

  const ago = formatRelativeTime(thread.created_at)

  return (
    <Link
      href={`/forum/thread/${thread.id}`}
      className="block p-4 bg-surface-2 border border-edge rounded-xl hover:border-fg-muted transition-colors group"
    >
      <div className="flex items-start gap-3">
        <ForumNicknameAvatar
          nickname={thread.identity?.nickname ?? '?'}
          color={thread.identity?.color ?? '#888'}
          size="md"
        />
        <div className="flex-1 min-w-0">
          {thread.category && (
            <span className="text-xs text-fg-subtle mb-1 inline-block">
              {thread.category.icon} {thread.category.name}
            </span>
          )}
          <h3 className="text-sm font-semibold text-fg group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
            {thread.title}
          </h3>
          <p className="text-xs text-fg-muted mt-1 line-clamp-2">{preview}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-fg-subtle">
            <span>{thread.identity?.nickname ?? 'Anônimo'}</span>
            <span>·</span>
            <span>{ago}</span>
            <span>·</span>
            <span>{thread.views} views</span>
            {thread.post_count !== undefined && (
              <>
                <span>·</span>
                <span>{thread.post_count} respostas</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
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
