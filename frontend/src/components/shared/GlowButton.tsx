import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlowButtonProps {
  children: React.ReactNode
  variant?: 'cyan' | 'magenta' | 'gold'
  className?: string
  onClick?: () => void
}

const glowMap = {
  cyan: 'from-accent-cyan to-accent-cyan/80 shadow-accent-cyan/30',
  magenta: 'from-accent-magenta to-accent-magenta/80 shadow-accent-magenta/30',
  gold: 'from-accent-gold to-accent-gold/80 shadow-accent-gold/30',
}

export default function GlowButton({ children, variant = 'cyan', className, onClick }: GlowButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'px-6 py-3 rounded-xl bg-gradient-to-r text-white font-semibold shadow-lg transition-all',
        glowMap[variant],
        className
      )}
    >
      {children}
    </motion.button>
  )
}
