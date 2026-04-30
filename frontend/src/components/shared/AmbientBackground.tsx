import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface AmbientBackgroundProps {
  variant?: 'home' | 'discover' | 'chat' | 'feed' | 'profile' | 'clone' | 'calibration' | 'auth'
  intensity?: 'subtle' | 'normal' | 'rich'
  particles?: boolean
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

// Light-weight floating particles — no three.js, pure Framer Motion
function FloatingParticles({ color }: { color: string }) {
  const particles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    duration: 10 + Math.random() * 20,
    delay: Math.random() * 5,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: color,
          }}
          animate={{
            y: [0, -30, 20, 0],
            x: [0, 15, -10, 0],
            opacity: [0.15, 0.4, 0.2, 0.15],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export default function AmbientBackground({
  variant = 'home',
  intensity = 'normal',
  particles = true,
  children,
  className = '',
}: AmbientBackgroundProps) {
  const colors = orbColors[variant] || orbColors.home
  const dim = intensityMap[intensity]

  return (
    <div className={`min-h-screen relative overflow-hidden bg-background ${className}`}>
      {/* Global mesh-gradient — always present */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />

      {/* Floating particles — landing-page level atmosphere */}
      {particles && <FloatingParticles color="rgba(0,240,255,0.25)" />}

      {/* Multiple ambient orbs — richer than single orb */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full animate-breathe"
          style={{
            width: dim.w,
            height: dim.h,
            filter: `blur(${dim.blur}px)`,
            background: `radial-gradient(circle, ${colors.from}, ${colors.to}, transparent 70%)`,
          }}
        />
        <div
          className="absolute top-2/3 right-1/4 rounded-full animate-breathe"
          style={{
            width: dim.w * 0.6,
            height: dim.h * 0.6,
            filter: `blur(${dim.blur * 0.8}px)`,
            background: `radial-gradient(circle, ${colors.to}, transparent 70%)`,
            animationDelay: '2s',
          }}
        />
      </div>

      {/* Optional noise for auth pages */}
      {variant === 'auth' && <div className="fixed inset-0 noise-overlay pointer-events-none" />}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
