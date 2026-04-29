import { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

interface NeuralCardProps {
  icon: React.ReactNode
  title: string
  desc: string
  accent: string
  index: number
  className?: string
}

export default function NeuralCard({ icon, title, desc, accent, index, className }: NeuralCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setHovered(false)
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: index * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={cn(
        'group relative cursor-default rounded-3xl p-8 overflow-hidden',
        'bg-surface/60 backdrop-blur-xl border border-white/[0.06]',
        'hover:border-white/[0.12] transition-colors duration-500',
        className
      )}
    >
      {/* Hover glow */}
      <div
        className="absolute -right-2 -top-2 h-24 w-24 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700"
        style={{ backgroundColor: accent }}
      />

      {/* Icon */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.4 }}
        className="mb-6 inline-flex items-center justify-center rounded-2xl p-3.5 relative z-10"
        style={{
          backgroundColor: `${accent}15`,
          border: `1px solid ${accent}25`,
          boxShadow: hovered ? `0 0 20px ${accent}30` : 'none',
          transition: 'box-shadow 0.5s',
        }}
      >
        <div style={{ color: accent }}>{icon}</div>
      </motion.div>

      {/* Title */}
      <h3 className="font-display text-xl font-bold mb-3 relative z-10 text-white">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm leading-relaxed text-white/50 group-hover:text-white/70 transition-colors duration-300 relative z-10">
        {desc}
      </p>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        }}
      />
    </motion.div>
  )
}
