import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function EchoesInTheDark() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const torusRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [rippleActive, setRippleActive] = useState(false)
  const [rippleOrigin, setRippleOrigin] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Torus slow rotation
      gsap.to(torusRef.current, {
        rotation: 360,
        duration: 60,
        repeat: -1,
        ease: 'none',
      })

      // Entrance animation
      gsap.fromTo(
        sectionRef.current?.querySelectorAll('.echo-item') || [],
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const handleButtonClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
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
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#050508] py-24"
    >
      {/* Ambient glow behind torus */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan/5 blur-[120px]" />

      <div className="echo-item relative z-10 mb-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-gold">
          SoulClone
        </p>
      </div>

      {/* Torus knot with video inside */}
      <div className="echo-item relative mx-auto mb-12 h-64 w-64 md:h-80 md:w-80 lg:h-96 lg:w-96">
        <div
          ref={torusRef}
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #00f0ff, #ff006e, #ffbe0b, #00f0ff)',
            opacity: 0.15,
            filter: 'blur(40px)',
          }}
        />

        {/* Glass ring container */}
        <div className="relative h-full w-full overflow-hidden rounded-full liquid-glass-strong">
          {/* Video inside */}
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            src="/personality-awakening.mp4"
            muted
            loop
            autoPlay
            playsInline
          />
          {/* Glass overlay */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-cyan/10 via-transparent to-accent-magenta/10" />
          <div className="absolute inset-0 rounded-full backdrop-blur-sm" />
        </div>

        {/* Floating particles */}
        <div className="pointer-events-none absolute -inset-8">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-accent-cyan"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: 0.4 + Math.random() * 0.4,
                animation: `float ${4 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Brand manifesto */}
      <div className="echo-item relative z-10 mb-4 text-center">
        <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
          你的数字分身，在深渊中长明。
        </h2>
      </div>

      <div className="echo-item relative z-10 mb-12 max-w-lg text-center">
        <p className="animate-pulse-glow text-sm leading-relaxed text-white/40">
          现实是有限的，但由你人格代码编织的梦境，无限辽阔。
        </p>
      </div>

      {/* Navigation buttons */}
      <div className="echo-item relative z-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/personality"
          onClick={handleButtonClick}
          className="rounded-full liquid-glass px-8 py-3 text-sm font-medium text-accent-cyan transition-all duration-300 hover:bg-accent-cyan/10 hover:shadow-glow"
        >
          进入训练舱
        </Link>
        <Link
          to="/features"
          onClick={handleButtonClick}
          className="rounded-full liquid-glass px-8 py-3 text-sm font-medium text-accent-gold transition-all duration-300 hover:bg-accent-gold/10 hover:shadow-glow-gold"
        >
          探索协议矩阵
        </Link>
        <Link
          to="/about"
          onClick={handleButtonClick}
          className="rounded-full liquid-glass px-8 py-3 text-sm font-medium text-accent-magenta transition-all duration-300 hover:bg-accent-magenta/10 hover:shadow-glow-magenta"
        >
          阅读暗物质宣言
        </Link>
      </div>

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

      <style>{`
        @keyframes rippleExpand {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(4); opacity: 0; }
        }
      `}</style>
    </section>
  )
}
