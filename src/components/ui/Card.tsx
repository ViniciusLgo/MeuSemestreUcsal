import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-2xl border border-edge p-6',
        hover && 'transition-all duration-200 hover:border-fg-muted hover:bg-surface-hover cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
