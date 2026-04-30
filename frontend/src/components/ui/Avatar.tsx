import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'away' | 'ai-twin-online' | 'ai-twin-offline' | 'ai-twin-busy'
  ring?: 'none' | 'cyan' | 'magenta' | 'gold' | 'gradient'
  fallback?: React.ReactNode
}

const sizeMap = {
  xs: { diameter: 'w-6 h-6', border: 'border', status: 'w-1.5 h-1.5' },
  sm: { diameter: 'w-8 h-8', border: 'border-[1.5px]', status: 'w-2 h-2' },
  md: { diameter: 'w-11 h-11', border: 'border-2', status: 'w-2.5 h-2.5' },
  lg: { diameter: 'w-14 h-14', border: 'border-[2.5px]', status: 'w-3 h-3' },
  xl: { diameter: 'w-20 h-20', border: 'border-[3px]', status: 'w-3.5 h-3.5' },
}

const ringStyles = {
  none: 'border-white/10',
  cyan: 'border-cyan-400 glow-cyan-sm',
  magenta: 'border-magenta-400 glow-magenta-sm',
  gold: 'border-gold-400 glow-gold-sm',
  gradient: 'border-transparent',
}

const statusStyles = {
  online: 'bg-success',
  offline: 'hidden',
  away: 'bg-warning border-2 border-bg-200',
  'ai-twin-online': 'bg-cyan-400 animate-[breathe_2s_ease-in-out_infinite]',
  'ai-twin-offline': 'bg-gray-500',
  'ai-twin-busy': 'bg-magenta-400 animate-pulse',
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, size = 'md', status, ring = 'none', fallback, ...props }, ref) => {
    const s = sizeMap[size]

    return (
      <div ref={ref} className={cn('relative inline-block', className)} {...props}>
        <div
          className={cn(
            'rounded-full overflow-hidden object-cover',
            s.diameter,
            s.border,
            ring === 'gradient'
              ? 'p-[2px] bg-gradient-to-br from-cyan-400 via-magenta-400 to-gold-400'
              : ringStyles[ring]
          )}
        >
          {src ? (
            <img
              src={src}
              alt={alt}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-bg-600 flex items-center justify-center text-text-secondary text-sm font-bold">
              {fallback || alt?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
        {status && status !== 'offline' && (
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-bg-200',
              s.status,
              statusStyles[status]
            )}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export { Avatar }
