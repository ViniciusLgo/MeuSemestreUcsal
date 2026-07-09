import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-500 focus-visible:ring-brand-400',
  secondary: 'bg-[#21262d] text-[#e6edf3] border border-[#30363d] hover:bg-[#30363d] hover:border-[#8b949e] focus-visible:ring-[#58a6ff]',
  ghost: 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3] focus-visible:ring-[#58a6ff]',
  danger: 'bg-red-700 text-white hover:bg-red-600 focus-visible:ring-red-500',
}

const sizes = {
  sm: 'text-sm px-3 py-1.5 rounded-lg',
  md: 'text-sm px-4 py-2 rounded-xl',
  lg: 'text-sm px-6 py-3 rounded-xl',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117]',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button }
