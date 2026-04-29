import { motion } from 'framer-motion'

export default function ConfettiEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            background: ['#00f0ff', '#ff006e', '#ffbe0b', '#a855f7', '#22c55e'][i % 5],
            left: `${50 + (Math.random() - 0.5) * 60}%`,
            top: '50%',
          }}
          initial={{ opacity: 1, scale: 1, y: 0, x: 0, rotate: 0 }}
          animate={{
            opacity: 0,
            scale: 0,
            y: (Math.random() - 0.5) * 400,
            x: (Math.random() - 0.5) * 400,
            rotate: Math.random() * 720,
          }}
          transition={{ duration: 1.5, delay: Math.random() * 0.3 }}
        />
      ))}
    </div>
  )
}
