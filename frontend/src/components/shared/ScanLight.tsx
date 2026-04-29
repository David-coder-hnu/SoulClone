import { cn } from '@/lib/utils'

interface ScanLightProps {
  children: React.ReactNode
  className?: string
  speed?: 'slow' | 'normal' | 'fast'
}

export default function ScanLight({ children, className, speed = 'normal' }: ScanLightProps) {
  const duration = speed === 'slow' ? '4s' : speed === 'fast' ? '2s' : '3s'

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {children}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{
          background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.25) 55%, transparent 60%)`,
          backgroundSize: '200% 100%',
          animation: `scanlight ${duration} ease-in-out infinite`,
        }}
      />
      <style>{`
        @keyframes scanlight {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
