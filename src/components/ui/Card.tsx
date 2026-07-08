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
        'bg-white rounded-2xl border border-slate-100 shadow-sm p-6',
        hover && 'transition-all duration-200 hover:shadow-md hover:border-slate-200 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
