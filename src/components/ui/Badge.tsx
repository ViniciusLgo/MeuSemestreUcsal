import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'info' | 'ead' | 'danger'
  className?: string
}

const variants = {
  default: 'bg-surface-2 text-fg-muted border border-edge',
  success: 'bg-brand-100 text-brand-400 border border-brand-300',
  warning: 'bg-[#2d1f00] text-amber-400 border border-amber-700',
  info: 'bg-accent-100 text-accent-400 border border-accent-300',
  ead: 'bg-[#1a0533] text-purple-400 border border-purple-700',
  danger: 'bg-[#2d0a0a] text-red-400 border border-red-700',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
