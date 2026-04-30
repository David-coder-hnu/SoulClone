import { ReactNode } from 'react'

interface AmbientBackgroundProps {
  variant?: 'home' | 'discover' | 'chat' | 'feed' | 'profile' | 'clone' | 'calibration' | 'auth'
  intensity?: 'subtle' | 'normal' | 'rich'
  children: ReactNode
  className?: string
}

const orbColors: Record<string, { from: string; to: string }> = {
  home: { from: 'rgba(0,240,255,0.06)', to: 'rgba(255,0,110,0.04)' },
  discover: { from: 'rgba(255,0,110,0.06)', to: 'rgba(255,190,11,0.04)' },
  chat: { from: 'rgba(0,240,255,0.05)', to: 'rgba(0,240,255,0.02)' },
  feed: { from: 'rgba(255,190,11,0.05)', to: 'rgba(255,190,11,0.02)' },
  profile: { from: 'rgba(255,0,110,0.05)', to: 'rgba(255,0,110,0.02)' },
  clone: { from: 'rgba(0,240,255,0.04)', to: 'rgba(255,0,110,0.03)' },
  calibration: { from: 'rgba(255,190,11,0.05)', to: 'rgba(255,190,11,0.02)' },
  auth: { from: 'rgba(0,240,255,0.04)', to: 'rgba(255,0,110,0.03)' },
}

const intensityMap = {
  subtle: { w: 300, h: 300, blur: 120 },
  normal: { w: 400, h: 400, blur: 150 },
  rich: { w: 500, h: 500, blur: 180 },
}

export default function AmbientBackground({
  variant = 'home',
  intensity = 'normal',
  children,
  className = '',
}: AmbientBackgroundProps) {
  const colors = orbColors[variant] || orbColors.home
  const dim = intensityMap[intensity]

  return (
    <div className={`min-h-screen relative overflow-hidden bg-background ${className}`}>
      {/* Global mesh-gradient — always present */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />

      {/* Single ambient orb — color follows page theme */}
      <div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none animate-breathe"
        style={{
          width: dim.w,
          height: dim.h,
          filter: `blur(${dim.blur}px)`,
          background: `radial-gradient(circle, ${colors.from}, ${colors.to}, transparent 70%)`,
        }}
      />

      {/* Optional noise for auth pages */}
      {variant === 'auth' && <div className="fixed inset-0 noise-overlay pointer-events-none" />}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
