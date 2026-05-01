import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const nodes = [
  {
    title: '深度个性延续',
    subtitle: 'Personality Continuation',
    desc: '通过深度问卷和聊天样本，平台精确理解你的 personality、聊天风格和情感模式，让 AI 的你无缝延续真实的你。',
    color: '#00f0ff',
  },
  {
    title: '替你培养感情',
    subtitle: 'Emotional Cultivation',
    desc: '你的在线状态会在你离线时继续聊天、匹配、培养关系。时机成熟时，它会邀请你批准下一步行动。',
    color: '#ff006e',
  },
  {
    title: '悬疑社交体验',
    subtitle: 'Mystery Social',
    desc: '对方永远不知道屏幕那头是真人还是在线状态。只有双方都同意时，真实身份才会揭晓。',
    color: '#ffbe0b',
  },
]

export default function NeuralWeaving({ className }: { className?: string }) {
  return (
    <section className={cn('relative bg-background py-24 md:py-32 overflow-hidden', className)}>
      {/* Background HUD Grid */}
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M0 50h100M50 0v100' stroke='%2300f0ff' stroke-width='0.5' opacity='0.4'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-20"
        >
          <p className="text-accent-cyan text-xs font-mono uppercase tracking-[0.2em] mb-4">
            Neural Weaving
          </p>
          <h2 className="font-display text-3xl md:text-5xl mb-4">
            神经<span className="text-accent-cyan">编织</span>
          </h2>
          <p className="text-text-secondary max-w-md text-base">
            三大底层协议，让 AI 克隆体不只是模仿，而是成为你。
          </p>
        </motion.div>

        {/* Cards — stacked, each animates in on scroll */}
        <div className="flex flex-col gap-6 md:gap-8">
          {nodes.map((node, i) => (
            <motion.div
              key={node.title}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
              className="glass-elevated rounded-2xl p-6 md:p-8 relative overflow-hidden group cursor-default"
              style={{ borderColor: `${node.color}15` }}
            >
              {/* Glow border accent */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                  boxShadow: `inset 0 0 40px ${node.color}15, 0 0 60px ${node.color}08`,
                }}
              />

              <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                {/* Left: Icon circle */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${node.color}12`, border: `1px solid ${node.color}20` }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: node.color, boxShadow: `0 0 12px ${node.color}60` }}
                  />
                </div>

                {/* Right: Content */}
                <div className="flex-1">
                  <p className="font-mono text-xs uppercase tracking-widest mb-1.5" style={{ color: node.color }}>
                    {node.subtitle}
                  </p>
                  <h3 className="font-heading text-2xl md:text-3xl text-white mb-3">
                    {node.title}
                  </h3>
                  <p className="text-base leading-relaxed text-white/55 group-hover:text-white/70 transition-colors">
                    {node.desc}
                  </p>
                </div>
              </div>

              {/* Decorative orb */}
              <div
                className="absolute -right-4 -top-4 h-14 w-14 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                style={{ backgroundColor: node.color }}
              />

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `linear-gradient(90deg, transparent, ${node.color}40, transparent)`,
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
