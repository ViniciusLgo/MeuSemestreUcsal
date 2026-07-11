import { cn } from '@/lib/utils'

interface Props {
  nickname: string
  color:    string
  size?:    'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
}

export function ForumNicknameAvatar({ nickname, color, size = 'md', className }: Props) {
  const initial = nickname.charAt(0).toUpperCase()
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold flex-shrink-0',
        sizes[size],
        className
      )}
      style={{ backgroundColor: color + '22', color }}
      title={nickname}
    >
      {initial}
    </div>
  )
}
