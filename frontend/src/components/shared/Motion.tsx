import { ReactNode } from 'react'
import { motion, Variants } from 'framer-motion'

// ───────── Animation Constants ─────────

export const SPRING = { stiffness: 100, damping: 15 }
export const SPRING_SNAPPY = { stiffness: 200, damping: 20 }
export const DURATION_FAST = 0.25
export const DURATION_NORMAL = 0.4
export const STAGGER = 0.05

// ───────── FadeIn ─────────

interface FadeInProps {
  children: ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  duration?: number
  className?: string
}

const directionOffset = {
  up: { y: 12 },
  down: { y: -12 },
  left: { x: 12 },
  right: { x: -12 },
  none: {},
}

export function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  duration = DURATION_NORMAL,
  className = '',
}: FadeInProps) {
  const offset = directionOffset[direction]

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay, duration, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ───────── StaggerContainer ─────────

interface StaggerContainerProps {
  children: ReactNode
  stagger?: number
  className?: string
}

export function StaggerContainer({
  children,
  stagger = STAGGER,
  className = '',
}: StaggerContainerProps) {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: stagger },
    },
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const item: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: DURATION_NORMAL, ease: [0.16, 1, 0.3, 1] } },
  }

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}

// ───────── ScaleOnHover ─────────

interface ScaleOnHoverProps {
  children: ReactNode
  scale?: number
  y?: number
  className?: string
}

export function ScaleOnHover({
  children,
  scale = 1.01,
  y = -2,
  className = '',
}: ScaleOnHoverProps) {
  return (
    <motion.div
      whileHover={{ scale, y }}
      transition={{ duration: DURATION_FAST, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ───────── GlowPulse ─────────

interface GlowPulseProps {
  children: ReactNode
  color?: 'cyan' | 'magenta' | 'gold'
  className?: string
}

const glowColors = {
  cyan: 'rgba(0,240,255,0.3)',
  magenta: 'rgba(255,0,110,0.3)',
  gold: 'rgba(255,190,11,0.3)',
}

export function GlowPulse({ children, color = 'cyan', className = '' }: GlowPulseProps) {
  return (
    <motion.div
      animate={{
        boxShadow: [
          `0 0 8px ${glowColors[color]}`,
          `0 0 16px ${glowColors[color]}`,
          `0 0 8px ${glowColors[color]}`,
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ───────── CountUpNumber ─────────

import { useEffect, useState } from 'react'

interface CountUpProps {
  target: number
  duration?: number
  suffix?: string
  className?: string
}

export function CountUp({ target, duration = 1.5, suffix = '', className = '' }: CountUpProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = target
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.floor(eased * end)
      setCount(start)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [target, duration])

  return (
    <span className={className}>
      {count}
      {suffix}
    </span>
  )
}
