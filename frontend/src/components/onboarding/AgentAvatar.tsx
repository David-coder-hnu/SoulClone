import { motion } from 'framer-motion'

export default function AgentAvatar({ name, color = 'cyan' }: { name: string; color?: 'cyan' | 'magenta' }) {
  const colorClass = color === 'cyan' ? 'from-accent-cyan to-accent-cyan/30' : 'from-accent-magenta to-accent-magenta/30'

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className={`absolute w-20 h-20 rounded-full bg-gradient-to-br ${colorClass} blur-xl`}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center`}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-white font-display text-lg">{name[0]}</span>
      </motion.div>
    </div>
  )
}
