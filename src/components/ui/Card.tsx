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
        'bg-[#161b22] rounded-2xl border border-[#30363d] p-6',
        hover && 'transition-all duration-200 hover:border-[#8b949e] hover:bg-[#1c2128] cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
