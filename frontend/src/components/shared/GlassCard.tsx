import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export default function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      className={cn(
        'glass-elevated rounded-3xl p-6 transition-shadow duration-300',
        hover && 'hover:shadow-lg hover:shadow-accent-cyan/10',
        className
      )}
    >
      {children}
    </motion.div>
  )
}
