import { motion } from 'framer-motion'

interface TraitRadarProps {
  traits: { label: string; value: number }[]
  size?: number
}

export default function TraitRadar({ traits, size = 160 }: TraitRadarProps) {
  const center = size / 2
  const radius = size * 0.35
  const angleStep = (Math.PI * 2) / traits.length

  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2
    const r = (value / 100) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  const points = traits.map((t, i) => getPoint(i, t.value))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={traits.map((_, i) => {
            const p = getPoint(i, scale * 100)
            return `${p.x},${p.y}`
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={1}
        />
      ))}

      {/* Data */}
      <motion.path
        d={pathD}
        fill="rgba(0,240,255,0.15)"
        stroke="#00f0ff"
        strokeWidth={2}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* Labels */}
      {traits.map((trait, i) => {
        const angle = i * angleStep - Math.PI / 2
        const labelR = radius + 20
        const x = center + labelR * Math.cos(angle)
        const y = center + labelR * Math.sin(angle)
        return (
          <text
            key={trait.label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-text-secondary text-[8px]"
          >
            {trait.label}
          </text>
        )
      })}
    </svg>
  )
}
