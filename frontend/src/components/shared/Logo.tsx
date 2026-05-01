import { motion } from 'framer-motion'

interface LogoProps {
  size?: number
  variant?: 'color' | 'mono'
  className?: string
  animate?: 'breathe' | 'pulse' | 'sleep' | 'none'
}

export default function Logo({
  size = 32,
  variant = 'color',
  className = '',
  animate = 'none',
}: LogoProps) {
  const isColor = variant === 'color'

  const animations = {
    breathe: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.85, 1],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
    pulse: {
      scale: [1, 1.08, 1],
      opacity: [1, 0.7, 1],
      transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
    },
    sleep: {
      scale: [1, 1.02, 1],
      opacity: [1, 0.6, 1],
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
    },
    none: {},
  }

  const glowFilter = isColor ? (
    <defs>
      <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  ) : null

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      width={size}
      height={size}
      className={className}
      animate={animate !== 'none' ? animations[animate] : undefined}
    >
      {glowFilter}

      {/* Left drop: the "you" */}
      <path
        d="M 38 18 C 24 22, 18 38, 20 52 C 22 68, 34 76, 44 70 C 50 66, 52 56, 48 46 C 44 34, 44 22, 38 18 Z"
        stroke={isColor ? '#00f0ff' : 'currentColor'}
        strokeWidth={isColor ? 2.2 : 4}
        strokeLinejoin="round"
        fill={isColor ? 'rgba(0,240,255,0.06)' : 'none'}
        filter={isColor ? 'url(#logo-glow)' : undefined}
      />

      {/* Right drop: the "twin" */}
      <path
        d="M 62 30 C 52 32, 48 46, 50 58 C 52 72, 62 76, 70 70 C 78 64, 78 54, 74 46 C 70 38, 68 28, 62 30 Z"
        stroke={isColor ? '#ff006e' : 'currentColor'}
        strokeWidth={isColor ? 2 : 4}
        strokeLinejoin="round"
        fill={isColor ? 'rgba(255,0,110,0.06)' : 'none'}
        filter={isColor ? 'url(#logo-glow)' : undefined}
      />

      {/* Convergence core: shared soul */}
      <ellipse
        cx="50"
        cy="60"
        rx="5.5"
        ry="4.5"
        fill={isColor ? '#ffbe0b' : 'currentColor'}
        filter={isColor ? 'url(#logo-glow)' : undefined}
      />

      {/* Inner seed */}
      {isColor && (
        <ellipse cx="50" cy="60" rx="2" ry="1.6" fill="#ffffff" />
      )}
    </motion.svg>
  )
}
