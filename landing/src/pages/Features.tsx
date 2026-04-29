import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import {
  MessageSquare,
  Heart,
  Calendar,
  Users,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Zap,
  ArrowRight,
  Dna,
  Funnel,
  MousePointerClick,
  Eye,
  EyeOff,
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ */
/*  Particle Canvas — Canvas 2D hero background                        */
/* ------------------------------------------------------------------ */
function ParticleCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = window.innerWidth
    let h = window.innerHeight
    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w
      canvas.height = h
    }
    resize()
    window.addEventListener('resize', resize)

    const COUNT = 1800
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      baseX: Math.random() * w,
      baseY: Math.random() * h,
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.4 + 0.1,
    }))

    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      for (let i = 0; i < COUNT; i++) {
        const p = particles[i]
        p.angle += p.speed * 0.01
        p.baseX += Math.cos(p.angle) * 0.15
        p.baseY += Math.sin(p.angle * 0.7) * 0.15

        let dx = p.baseX - mx
        let dy = p.baseY - my
        let dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150
          p.baseX += (dx / dist) * force * 3
          p.baseY += (dy / dist) * force * 3
        }

        p.x += (p.baseX - p.x) * 0.05
        p.y += (p.baseY - p.y) * 0.05

        const cx = w / 2
        const cy = h / 2
        const dCenter = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)
        const maxD = Math.sqrt(cx * cx + cy * cy)
        const t = Math.min(dCenter / maxD, 1)

        const r = Math.round(0 + (255 - 0) * (1 - t))
        const g = Math.round(240 + (0 - 240) * t)
        const b = Math.round(255 + (110 - 255) * t)
        const a = 0.4 + (1 - t) * 0.4

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`
        ctx.fill()
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  Feature Icons                                                        */
/* ------------------------------------------------------------------ */
const featureList = [
  {
    icon: MessageSquare,
    title: 'Autonomous Chat',
    desc: 'Maintains natural conversations across multiple platforms. Your twin remembers details, asks follow-ups, and never ghosts.',
    color: '#00f0ff',
  },
  {
    icon: Heart,
    title: 'Emotion Recognition',
    desc: 'Reads sentiment in real-time. Knows when to be playful, when to be supportive, and when to escalate to you.',
    color: '#ff006e',
  },
  {
    icon: Calendar,
    title: 'Date Scheduling',
    desc: 'Identifies promising connections and schedules real-world meetups during your actual free time.',
    color: '#00f0ff',
  },
  {
    icon: Users,
    title: 'Social Maintenance',
    desc: 'Keeps friendships warm with check-ins, birthday wishes, and shared interest discussions — all in your voice.',
    color: '#ff006e',
  },
  {
    icon: ShieldCheck,
    title: 'Conflict De-escalation',
    desc: 'Handles awkward situations, miscommunications, and soft rejections with grace and emotional intelligence.',
    color: '#00f0ff',
  },
  {
    icon: Sparkles,
    title: 'Privacy Shield',
    desc: 'Your twin operates behind an abstraction layer. Raw data never leaves your encrypted vault.',
    color: '#ff006e',
  },
]

/* ------------------------------------------------------------------ */
/*  Timeline Data                                                        */
/* ------------------------------------------------------------------ */
const timelineSteps = [
  { num: '01', title: 'Personality Distillation', icon: Dna, desc: 'We analyze your communication patterns, humor, empathy, and conversational rhythm to build a precise digital replica.' },
  { num: '02', title: 'Autonomous Socializing', icon: MessageSquare, desc: 'Your twin takes the wheel — starting conversations, responding naturally, and maintaining presence across platforms.' },
  { num: '03', title: 'Smart Filtering', icon: Funnel, desc: 'Every interaction is scored for emotional significance. Only the moments that matter reach your inbox.' },
  { num: '04', title: 'You Take Over', icon: MousePointerClick, desc: 'When genuine connection sparks, you receive a curated briefing and seamlessly step into the conversation.' },
]

/* ------------------------------------------------------------------ */
/*  Chat Demo — Suspense Dating                                         */
/* ------------------------------------------------------------------ */
const chatMessages = [
  { side: 'left' as const, text: 'You seem different from most people on here...', delay: 800 },
  { side: 'right' as const, text: "Different how? I'm just being myself 😊", twin: true, delay: 1200 },
  { side: 'left' as const, text: "That's exactly it. Nobody's 'just themselves' online.", delay: 1500 },
  { side: 'system' as const, text: '💫 A genuine human moment detected. Reveal identity?', delay: 2000 },
]

function ChatDemo() {
  const [visible, setVisible] = useState(0)
  const [showButtons, setShowButtons] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let idx = 0
    const timeouts: number[] = []
    const run = () => {
      if (idx >= chatMessages.length) {
        timeouts.push(window.setTimeout(() => setShowButtons(true), 600))
        return
      }
      setVisible(idx + 1)
      idx++
      if (idx < chatMessages.length) {
        timeouts.push(window.setTimeout(run, chatMessages[idx].delay))
      } else {
        timeouts.push(window.setTimeout(() => setShowButtons(true), chatMessages[chatMessages.length - 1].delay))
      }
    }
    timeouts.push(window.setTimeout(run, 500))
    return () => timeouts.forEach(clearTimeout)
  }, [])

  return (
    <div ref={containerRef} className="liquid-glass rounded-2xl p-5 md:p-6 w-full max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-5 border-b border-white/[0.06] pb-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-accent-magenta/20 flex items-center justify-center text-accent-magenta text-sm font-bold">
            J
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-magenta text-[8px] flex items-center justify-center text-white font-bold animate-pulse">
            T
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-white">Jordan</p>
          <p className="text-xs text-white/40">Online now</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 min-h-[200px]">
        {chatMessages.slice(0, visible).map((msg, i) =>
          msg.side === 'system' ? (
            <div
              key={i}
              className="self-center liquid-glass-strong rounded-xl px-4 py-3 text-center max-w-[90%]"
            >
              <p className="text-sm text-accent-gold">{msg.text}</p>
            </div>
          ) : (
            <div
              key={i}
              className={`flex ${msg.side === 'right' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.side === 'right'
                    ? 'bg-accent-magenta/20 text-white rounded-br-sm'
                    : 'bg-white/[0.06] text-white/90 rounded-bl-sm'
                }`}
                style={{
                  animation: 'chatIn 0.4s ease-out',
                }}
              >
                {msg.text}
              </div>
            </div>
          )
        )}
        {visible < chatMessages.length && (
          <div className="flex gap-1 self-start ml-2 mt-1">
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                className="w-1.5 h-1.5 rounded-full bg-white/30"
                style={{ animation: `bounceDot 0.6s ${d * 0.15}s infinite` }}
              />
            ))}
          </div>
        )}
      </div>

      {showButtons && (
        <div className="flex gap-3 mt-5 pt-3 border-t border-white/[0.06]">
          <button className="flex-1 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 px-4 py-2 text-sm text-accent-cyan hover:bg-accent-cyan/20 transition-colors">
            <Eye className="inline w-3.5 h-3.5 mr-1.5" />
            Reveal
          </button>
          <button className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.08] px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
            <EyeOff className="inline w-3.5 h-3.5 mr-1.5" />
            Keep mystery
          </button>
        </div>
      )}

      <style>{`
        @keyframes chatIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounceDot {
          0%, 100% { transform: scale(0.5); opacity: 0.4; }
          50% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                     */
/* ------------------------------------------------------------------ */
function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const numeric = parseFloat(target.replace(/[^0-9.]/g, ''))
  const prefix = target.replace(/[0-9.,]/g, '')

  useGSAP(() => {
    if (!ref.current) return
    const obj = { val: 0 }
    gsap.to(obj, {
      val: numeric,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 85%',
        once: true,
      },
      onUpdate: () => {
        if (ref.current) {
          const isInt = Number.isInteger(numeric)
          ref.current.textContent =
            prefix +
            (isInt ? Math.round(obj.val).toLocaleString() : obj.val.toFixed(1)) +
            suffix
        }
      },
    })
  }, { scope: ref })

  return <span ref={ref}>{prefix}0{suffix}</span>
}

/* ------------------------------------------------------------------ */
/*  Main Features Page                                                   */
/* ------------------------------------------------------------------ */
export default function Features() {
  const heroRef = useRef<HTMLDivElement>(null)
  const conceptRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const featureSectionRef = useRef<HTMLDivElement>(null)
  const featureTrackRef = useRef<HTMLDivElement>(null)
  const metricsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  /* ---- Hero entrance ---- */
  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-title-char', {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.05,
        ease: 'power3.out',
        delay: 0.2,
      })
      gsap.from('.hero-sub', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.8,
        ease: 'power2.out',
      })
      gsap.from('.hero-cta', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 1.1,
        ease: 'power2.out',
      })
      gsap.from('.hero-badge', {
        scale: 0.5,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        delay: 1.3,
        ease: 'back.out(1.7)',
      })
    }, heroRef)
    return () => ctx.revert()
  }, { scope: heroRef })

  /* ---- Concept timeline ---- */
  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from('.timeline-card', {
        rotateY: -90,
        opacity: 0,
        duration: 0.7,
        stagger: 0.2,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: timelineRef.current,
          start: 'top 80%',
        },
      })
      gsap.from('.concept-paragraph', {
        opacity: 0.3,
        y: 20,
        stagger: 0.2,
        scrollTrigger: {
          trigger: conceptRef.current,
          start: 'top 60%',
          end: 'bottom 40%',
          scrub: 1,
        },
      })
    }, conceptRef)
    return () => ctx.revert()
  }, { scope: conceptRef })

  /* ---- Horizontal scroll for feature cards ---- */
  useGSAP(() => {
    const ctx = gsap.context(() => {
      const track = featureTrackRef.current
      const section = featureSectionRef.current
      if (!track || !section) return

      const totalScroll = track.scrollWidth - window.innerWidth + 100

      gsap.to(track, {
        x: -totalScroll,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${totalScroll + window.innerHeight}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
    }, featureSectionRef)
    return () => ctx.revert()
  }, { scope: featureSectionRef })

  /* ---- Metrics entrance ---- */
  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from('.metric-item', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: metricsRef.current,
          start: 'top 75%',
        },
      })
      gsap.from('.testimonial-card', {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.testimonials-grid',
          start: 'top 80%',
        },
      })
    }, metricsRef)
    return () => ctx.revert()
  }, { scope: metricsRef })

  /* ---- CTA entrance ---- */
  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from('.cta-content', {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top 70%',
        },
      })
    }, ctaRef)
    return () => ctx.revert()
  }, { scope: ctaRef })

  const titleChars = 'SoulClone'.split('')

  return (
    <main className="relative bg-[#050508] overflow-x-hidden">
      {/* ============ HERO ============ */}
      <section
        ref={heroRef}
        className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6"
      >
        <ParticleCanvas />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1 className="font-display font-bold tracking-wider mb-6">
            {titleChars.map((ch, i) => (
              <span
                key={i}
                className="hero-title-char inline-block gradient-text"
                style={{ fontSize: 'clamp(4rem, 10vw, 8rem)' }}
              >
                {ch}
              </span>
            ))}
          </h1>

          <p className="hero-sub text-lg md:text-xl text-white/70 max-w-xl mx-auto mb-10 leading-relaxed">
            Your AI twin. Living, loving, and socializing while you rest.
          </p>

          <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/personality"
              className="group relative overflow-hidden rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]"
              style={{
                background: 'linear-gradient(135deg, #00f0ff 0%, #ff006e 100%)',
              }}
            >
              <span className="relative z-10">Create Your Twin</span>
            </Link>
            <a
              href="#concept"
              className="group flex items-center gap-2 text-sm text-white/60 hover:text-accent-cyan transition-colors"
            >
              See how it works
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              { text: '87% personality match accuracy', delay: 0 },
              { text: '24/7 active presence', delay: 0.15 },
              { text: 'End-to-end encrypted', delay: 0.3 },
            ].map((badge, i) => (
              <div
                key={i}
                className="hero-badge liquid-glass rounded-full px-4 py-2 text-xs font-medium text-white/80 flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-accent-cyan" />
                {badge.text}
              </div>
            ))}
          </div>
        </div>

        {/* Avatar preview card */}
        <div className="hidden lg:block absolute right-[8%] top-1/2 -translate-y-1/2 z-10 perspective-1000">
          <div className="relative w-56 h-72 liquid-glass-strong rounded-2xl overflow-hidden preserve-3d rotate-y-12 hover:rotate-y-0 transition-transform duration-700">
            <div className="absolute inset-0 bg-gradient-to-b from-accent-cyan/5 to-accent-magenta/5" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/10 via-transparent to-accent-magenta/10" />
                <span className="text-4xl">👤</span>
                <div
                  className="absolute top-0 left-0 w-1 h-full bg-accent-cyan/60"
                  style={{ animation: 'scanLine 2.5s linear infinite' }}
                />
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-magenta"
                  style={{ width: '67%', animation: 'pulseGlow 2s ease-in-out infinite' }}
                />
              </div>
              <p className="text-[10px] text-white/40 mt-2 text-center font-mono">
                Scanning personality matrix...
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes scanLine {
            0% { left: 0; }
            100% { left: 100%; transform: translateX(-100%); }
          }
          @keyframes pulseGlow {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
      </section>

      {/* ============ THE CONCEPT ============ */}
      <section
        id="concept"
        ref={conceptRef}
        className="relative py-24 md:py-32 px-6"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left — sticky text */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="font-mono text-sm text-accent-gold uppercase tracking-[0.1em] mb-4">
              THE CONCEPT
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-white mb-8">
              You sleep. Your twin doesn't.
            </h2>
            <div className="space-y-6">
              {[
                'ChatBoy creates a digital replica of your personality — your humor, your empathy, your conversational rhythm.',
                'While you focus on real life, your twin maintains friendships, explores connections, and keeps your social presence alive.',
                'When something meaningful happens — a real spark, a genuine connection — you wake up to a curated briefing, ready to step in.',
              ].map((p, i) => (
                <p
                  key={i}
                  className="concept-paragraph text-white/60 leading-relaxed transition-colors duration-500"
                >
                  {p}
                </p>
              ))}
            </div>
          </div>

          {/* Right — timeline */}
          <div ref={timelineRef} className="relative pl-8 lg:pl-12">
            {/* Neon vertical line */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full"
              style={{
                background: 'linear-gradient(180deg, #00f0ff 0%, #ffbe0b 50%, #ff006e 100%)',
                boxShadow: '0 0 10px rgba(0,240,255,0.4), 0 0 20px rgba(255,0,110,0.2)',
              }}
            />

            <div className="space-y-10">
              {timelineSteps.map((step, i) => {
                const Icon = step.icon
                return (
                  <div
                    key={i}
                    className="timeline-card liquid-glass rounded-xl p-5 relative group"
                    style={{ perspective: '1000px' }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center text-accent-cyan group-hover:bg-accent-cyan/10 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-mono text-xs text-white/30 block mb-1">
                          {step.num}
                        </span>
                        <h3 className="font-display text-lg text-white mb-1">
                          {step.title}
                        </h3>
                        <p className="text-sm text-white/50 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURE SHOWCASE ============ */}
      <section className="py-20 px-6">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-accent-gold uppercase tracking-[0.1em] mb-3">
            EVERYTHING YOUR TWIN HANDLES
          </p>
          <p className="text-white/60 text-lg">
            Your social life, automated and authentic.
          </p>
        </div>
      </section>

      <section ref={featureSectionRef} className="relative">
        <div
          ref={featureTrackRef}
          className="flex gap-8 px-6 md:px-12 will-change-transform"
          style={{ width: 'max-content' }}
        >
          {featureList.map((feat, i) => {
            const Icon = feat.icon
            const isHovered = hoveredCard === i
            return (
              <div
                key={i}
                className="relative flex-shrink-0 w-[340px] md:w-[400px] h-[480px] md:h-[520px] rounded-2xl liquid-glass p-6 md:p-8 flex flex-col group cursor-pointer transition-transform duration-300"
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  borderColor: isHovered
                    ? `rgba(${i % 2 === 0 ? '0,240,255' : '255,0,110'}, 0.3)`
                    : undefined,
                }}
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300"
                  style={{
                    background: `rgba(${i % 2 === 0 ? '0,240,255' : '255,0,110'}, 0.08)`,
                    boxShadow: isHovered
                      ? `0 0 20px rgba(${i % 2 === 0 ? '0,240,255' : '255,0,110'}, 0.2)`
                      : 'none',
                  }}
                >
                  <Icon
                    className="w-7 h-7 transition-transform duration-500"
                    style={{
                      color: feat.color,
                      animation: isHovered
                        ? 'spinSlow 3s linear infinite'
                        : 'pulse 4s ease-in-out infinite',
                    }}
                  />
                </div>

                <h3 className="font-display text-xl text-white mb-3">
                  {feat.title}
                </h3>
                <p className="text-[0.95rem] text-white/50 leading-relaxed flex-grow">
                  {feat.desc}
                </p>

                <div className="mt-auto pt-6 flex items-center gap-2 text-sm text-white/40 group-hover:text-accent-cyan transition-colors">
                  Learn more
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Progress indicator for this card */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(90deg, ${feat.color}, transparent)`,
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Horizontal scroll progress */}
        <div className="mt-10 mx-auto max-w-xs h-[2px] rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #00f0ff, #ff006e)',
              width: '0%',
            }}
            ref={(el) => {
              if (!el) return
              gsap.to(el, {
                width: '100%',
                ease: 'none',
                scrollTrigger: {
                  trigger: featureSectionRef.current,
                  start: 'top top',
                  end: 'bottom bottom',
                  scrub: 1,
                },
              })
            }}
          />
        </div>
      </section>

      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ============ SUSPENSE DATING ============ */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3">
            <p className="font-mono text-sm text-accent-magenta uppercase tracking-[0.1em] mb-4">
              SUSPENSE DATING
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-white mb-6">
              Is it them? Or their twin?
            </h2>
            <p className="text-white/60 leading-relaxed mb-8 max-w-lg">
              Every conversation starts as a mystery. Both parties could be AI, human, or a seamless handoff. The thrill is in not knowing — until you choose to reveal.
            </p>
            <ChatDemo />
          </div>

          <div className="lg:col-span-2 space-y-6">
            {[
              { icon: '🎭', title: 'Both twins can carry full conversations' },
              { icon: '🔀', title: 'Humans can seamlessly take over mid-chat' },
              { icon: '💫', title: 'Reveal happens only when both agree' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 liquid-glass rounded-xl px-5 py-4"
              >
                <span className="text-xl">{item.icon}</span>
                <p className="text-sm text-white/70">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SOCIAL PROOF & METRICS ============ */}
      <section
        ref={metricsRef}
        className="relative py-24 md:py-32 px-6"
        style={{ background: 'linear-gradient(180deg, #050508 0%, #0a0a10 50%, #050508 100%)' }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {[
              { value: '12847', label: 'Digital twins created' },
              { value: '4.2', suffix: 'M', label: 'Autonomous messages sent' },
              { value: '89', suffix: '%', label: 'User satisfaction rate' },
              { value: '3291', label: 'Real-world dates arranged' },
            ].map((m, i) => (
              <div key={i} className="metric-item text-center">
                <p className="font-mono text-3xl md:text-5xl font-bold gradient-text mb-2">
                  <AnimatedCounter target={m.value} suffix={m.suffix || ''} />
                </p>
                <p className="text-sm text-white/50">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="testimonials-grid grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: 'I wake up to genuine connections my twin has cultivated. It\'s like having a social superpower.',
                name: 'Maya',
                age: '24',
              },
              {
                quote: 'The suspense dating is addictive. Never knowing if I\'m talking to an AI or a person — it\'s thrilling.',
                name: 'Kai',
                age: '29',
              },
              {
                quote: 'My twin handles all the small talk and scheduling. I only step in for the conversations that actually matter.',
                name: 'Elena',
                age: '31',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="testimonial-card relative liquid-glass rounded-2xl p-6 md:p-8 group hover:-translate-y-2 transition-transform duration-300"
              >
                <span className="absolute top-4 left-4 font-display text-[120px] leading-none text-accent-gold opacity-[0.06] select-none pointer-events-none">
                  "
                </span>
                <p className="relative z-10 text-white/70 leading-relaxed mb-6 text-sm md:text-base">
                  {t.quote}
                </p>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-magenta flex items-center justify-center text-xs font-bold text-white">
                    {t.name[0]}
                  </div>
                  <p className="text-sm text-white/60">
                    {t.name}, {t.age}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section
        ref={ctaRef}
        className="relative min-h-[100dvh] flex items-center justify-center px-6"
      >
        <ParticleCanvas />

        <div className="cta-content relative z-10 text-center max-w-2xl mx-auto">
          <h2
            className="font-display font-bold text-white mb-6"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
          >
            Your twin is one click away.
          </h2>
          <p className="text-white/60 text-lg mb-10">
            Free personality analysis. No credit card required. Your twin starts living in under 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              to="/personality"
              className="rounded-full px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,240,255,0.5)]"
              style={{
                background: 'linear-gradient(135deg, #00f0ff 0%, #ff006e 100%)',
                animation: 'breathe 3s ease-in-out infinite',
              }}
            >
              Create My Twin
            </Link>
            <button className="rounded-full liquid-glass px-8 py-4 text-sm font-medium text-white/80 hover:text-white transition-colors flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Watch Demo
            </button>
          </div>

          {/* Compatibility preview widget */}
          <div className="liquid-glass rounded-2xl p-6 max-w-sm mx-auto inline-block">
            <div className="flex items-center gap-4">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="url(#ctaGrad)"
                  strokeWidth="3"
                  strokeDasharray="94, 100"
                  strokeLinecap="round"
                  className="animate-[dashIn_2s_ease-out_forwards]"
                />
                <defs>
                  <linearGradient id="ctaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="50%" stopColor="#ffbe0b" />
                    <stop offset="100%" stopColor="#ff006e" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="text-left">
                <p className="text-xs text-white/40 mb-1">Your personality type</p>
                <p className="text-sm font-medium text-white">
                  Explorer-Builder Hybrid
                </p>
                <p className="text-xs text-accent-cyan mt-0.5">
                  94% twin compatibility
                </p>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          @keyframes dashIn {
            from { stroke-dasharray: 0, 100; }
            to { stroke-dasharray: 94, 100; }
          }
        `}</style>
      </section>
    </main>
  )
}
