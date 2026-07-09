import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
}

const colorPalette = [
  'bg-brand-200 text-brand-400',
  'bg-[#143d23] text-[#3fb950]',
  'bg-[#2d1f00] text-amber-400',
  'bg-[#2d0a0a] text-red-400',
  'bg-[#1a0533] text-purple-400',
  'bg-[#051d4d] text-[#58a6ff]',
]

function pickColor(name: string) {
  return colorPalette[name.charCodeAt(0) % colorPalette.length]
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
        sizes[size],
        pickColor(name),
        className
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
