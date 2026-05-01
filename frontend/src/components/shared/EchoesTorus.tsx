import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import ShimmerButton from './ShimmerButton'

export default function EchoesTorus() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const torusRef = useRef<HTMLDivElement>(null)
  const [rippleActive, setRippleActive] = useState(false)
  const [rippleOrigin, setRippleOrigin] = useState({ x: 0, y: 0 })

  useEffect(() => {
    let animId: number
    const rotate = () => {
      if (torusRef.current) {
        const current = parseFloat(torusRef.current.style.transform.replace('rotate(', '').replace('deg)', '') || '0')
        torusRef.current.style.transform = `rotate(${current + 0.1}deg)`
      }
      animId = requestAnimationFrame(rotate)
    }
    animId = requestAnimationFrame(rotate)
    return () => cancelAnimationFrame(animId)
  }, [])

  const handleButtonClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setRippleOrigin({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
    setRippleActive(true)
    setTimeout(() => setRippleActive(false), 1200)
  }

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-background py-24"
    >
      {/* Ambient glow behind torus */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan/5 blur-[120px]" />

      {/* Conic gradient torus */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="relative mx-auto mb-12 h-48 w-48 md:h-64 md:w-64 lg:h-72 lg:w-72"
      >
        <div
          ref={torusRef}
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #00f0ff, #ff006e, #ffbe0b, #00f0ff)',
            opacity: 0.15,
            filter: 'blur(40px)',
            transform: 'rotate(0deg)',
          }}
        />

        {/* Glass ring container */}
        <div className="relative h-full w-full overflow-hidden rounded-full glass-strong">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-cyan/10 via-transparent to-accent-magenta/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-magenta"
            >
              <Sparkles size={28} className="text-white" />
            </motion.div>
          </div>
        </div>

        {/* Floating particles */}
        <div className="pointer-events-none absolute -inset-8">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-accent-cyan"
              style={{
                top: `${15 + (i * 11) % 70}%`,
                left: `${10 + (i * 17) % 80}%`,
                opacity: 0.4 + (i % 3) * 0.15,
                animation: `float ${4 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Brand manifesto */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 mb-4 text-center"
      >
        <h2 className="font-heading text-2xl text-white md:text-3xl">
          准备好遇见<span className="text-accent-cyan">另一个自己</span>了吗？
        </h2>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative z-10 mb-12 max-w-lg text-center"
      >
        <p className="text-sm leading-relaxed text-white/40">
          只需5分钟，开启你的社交之旅。现实是有限的，但由你人格代码编织的梦境，无限辽阔。
        </p>
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="relative z-10 flex flex-wrap items-center justify-center gap-4"
      >
        <ShimmerButton to="/register" variant="gradient" onClick={handleButtonClick}>
          立即开始
        </ShimmerButton>
        <ShimmerButton to="/login" variant="cyan" onClick={handleButtonClick}>
          已有账号？登录
        </ShimmerButton>
      </motion.div>

      {/* Ripple overlay */}
      {rippleActive && (
        <div
          className="pointer-events-none fixed inset-0 z-[100]"
          style={{
            background: `radial-gradient(circle at ${rippleOrigin.x}px ${rippleOrigin.y}px, rgba(0,240,255,0.15) 0%, transparent 60%)`,
            animation: 'rippleExpand 1s ease-out forwards',
          }}
        />
      )}
    </section>
  )
}
