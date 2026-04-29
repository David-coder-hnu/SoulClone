import { cn } from '@/lib/utils'

interface ShimmerTextProps {
  children: React.ReactNode
  className?: string
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p'
}

export default function ShimmerText({ children, className, as: Tag = 'span' }: ShimmerTextProps) {
  return (
    <Tag
      className={cn(
        'bg-gradient-to-r from-text-primary via-accent-cyan to-accent-magenta bg-[length:200%_auto] bg-clip-text text-transparent',
        'animate-shimmer',
        className
      )}
    >
      {children}
    </Tag>
  )
}
