import { motion } from 'framer-motion'

interface BigFiveRadarProps {
  traits: Record<string, number>
  size?: number
  className?: string
}

export default function BigFiveRadar({ traits, size = 180, className = '' }: BigFiveRadarProps) {
  const keys = Object.keys(traits)
  if (keys.length === 0) return null

  const center = size / 2
  const radius = size * 0.38
  const angleStep = (Math.PI * 2) / keys.length

  const points = keys.map((key, i) => {
    const angle = i * angleStep - Math.PI / 2
    const r = radius * (traits[key] || 0.5)
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)]
  })

  const polyPoints = points.map((p) => p.join(',')).join(' ')

  // Generate axis end points for labels
  const labelPoints = keys.map((key, i) => {
    const angle = i * angleStep - Math.PI / 2
    const r = radius + size * 0.12
    return {
      key,
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      value: Math.round((traits[key] || 0.5) * 100),
    }
  })

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map((s) => (
          <circle
            key={s}
            cx={center}
            cy={center}
            r={radius * s}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {keys.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2
          const x2 = center + radius * Math.cos(angle)
          const y2 = center + radius * Math.sin(angle)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          )
        })}

        {/* Data polygon */}
        <motion.polygon
          points={polyPoints}
          fill="url(#radarGradient)"
          stroke="rgba(0,240,255,0.5)"
          strokeWidth={1.5}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Vertex dots */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={3}
            fill="#00f0ff"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 200 }}
          />
        ))}

        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,240,255,0.2)" />
            <stop offset="50%" stopColor="rgba(255,0,110,0.15)" />
            <stop offset="100%" stopColor="rgba(255,190,11,0.1)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Labels below radar */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
        {labelPoints.map((lp) => (
          <div key={lp.key} className="flex items-center gap-1">
            <span className="text-[10px] text-text-tertiary">{lp.key}</span>
            <span className="text-[10px] font-mono text-text-secondary">{lp.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
