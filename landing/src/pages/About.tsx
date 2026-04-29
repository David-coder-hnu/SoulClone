import { useRef, useEffect, useState, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ */
/*  Text Scramble / Decode Effect                                      */
/* ------------------------------------------------------------------ */
function useTextScramble(text: string, trigger: boolean) {
  const [display, setDisplay] = useState(text)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'

  useEffect(() => {
    if (!trigger) return
    let frame = 0
    const totalFrames = 30
    const interval = setInterval(() => {
      frame++
      if (frame >= totalFrames) {
        setDisplay(text)
        clearInterval(interval)
        return
      }
      const progress = frame / totalFrames
      let result = ''
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          result += ' '
        } else if (i < text.length * progress) {
          result += text[i]
        } else {
          result += chars[Math.floor(Math.random() * chars.length)]
        }
      }
      setDisplay(result)
    }, 25)
    return () => clearInterval(interval)
  }, [trigger, text])

  return display
}

/* ------------------------------------------------------------------ */
/*  Scan Light Effect                                                  */
/* ------------------------------------------------------------------ */
function ScanLight({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative inline-block overflow-hidden ${className}`}>
      {children}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          mixBlendMode: 'overlay',
          animation: 'scanSweep 6s linear infinite',
        }}
      />
      <style>{`
        @keyframes scanSweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Floating Particles (canvas 2D, very subtle)                        */
/* ------------------------------------------------------------------ */
function SubtleParticles({ count = 60 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
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

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.3 + 0.1,
      phase: Math.random() * Math.PI * 2,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.phase += 0.008
        p.x += p.vx + Math.sin(p.phase) * 0.05
        p.y += p.vy + Math.cos(p.phase * 0.7) * 0.05
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        const flicker = 0.5 + Math.sin(p.phase * 2) * 0.5
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * flicker})`
        ctx.fill()
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  Manifesto Paragraph Component                                        */
/* ------------------------------------------------------------------ */
function ManifestoParagraph({
  text,
  className,
  fontClass,
  trigger,
}: {
  text: string
  className?: string
  fontClass?: string
  trigger: boolean
}) {
  const display = useTextScramble(text, trigger)
  return (
    <p className={`${fontClass || ''} ${className || ''} transition-opacity duration-1000`}>
      {display}
    </p>
  )
}

/* ------------------------------------------------------------------ */
/*  Main About Page                                                    */
/* ------------------------------------------------------------------ */
export default function About() {
  const heroRef = useRef<HTMLDivElement>(null)
  const manifestoRef = useRef<HTMLDivElement>(null)
  const splitRef = useRef<HTMLDivElement>(null)
  const echoesRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [manifestoTriggers, setManifestoTriggers] = useState<boolean[]>([false, false, false, false, false])
  const [echoesVisible, setEchoesVisible] = useState(false)

  /* ---- Video scroll speed sync ---- */
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = 0.5

    let lastScroll = 0
    const onScroll = () => {
      const scrollDelta = Math.abs(window.scrollY - lastScroll)
      lastScroll = window.scrollY
      const targetRate = 0.5 + Math.min(scrollDelta * 0.02, 1.5)
      video.playbackRate = video.playbackRate * 0.9 + targetRate * 0.1
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ---- Hero entrance ---- */
  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-manifesto', {
        y: 60,
        opacity: 0,
        duration: 1.5,
        ease: 'power3.out',
        delay: 0.3,
      })
      gsap.from('.hero-tagline', {
        y: 20,
        opacity: 0,
        duration: 1,
        delay: 1,
        ease: 'power2.out',
      })
      gsap.from('.hero-arrow', {
        y: -10,
        opacity: 0,
        duration: 1,
        delay: 1.5,
        ease: 'power2.out',
      })
    }, heroRef)
    return () => ctx.revert()
  }, { scope: heroRef })

  /* ---- Manifesto Z-axis tunnel ---- */
  useGSAP(() => {
    const ctx = gsap.context(() => {
      const paragraphs = gsap.utils.toArray<HTMLElement>('.manifesto-paragraph')
      paragraphs.forEach((el, i) => {
        const depths = [-300, -150, 0, 80, 180]
        const depth = depths[i] || 0

        gsap.fromTo(
          el,
          {
            z: depth,
            opacity: 0.15 + (i === 2 ? 0.5 : 0),
            scale: 0.85,
          },
          {
            z: depth + 400,
            opacity: 1,
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top 90%',
              end: 'center 40%',
              scrub: 1,
              onEnter: () => {
                setManifestoTriggers((prev) => {
                  const next = [...prev]
                  next[i] = true
                  return next
                })
              },
            },
          }
        )
      })
    }, manifestoRef)
    return () => ctx.revert()
  }, { scope: manifestoRef })

  /* ---- Split screen entrance ---- */
  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from('.split-left', {
        x: -60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: splitRef.current,
          start: 'top 70%',
        },
      })
      gsap.from('.split-right', {
        x: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: splitRef.current,
          start: 'top 70%',
        },
      })
      gsap.from('.split-mobius', {
        scale: 0.5,
        opacity: 0,
        rotationY: 180,
        duration: 1.5,
        ease: 'back.out(1.2)',
        scrollTrigger: {
          trigger: splitRef.current,
          start: 'top 60%',
        },
      })
    }, splitRef)
    return () => ctx.revert()
  }, { scope: splitRef })

  /* ---- Echoes entrance ---- */
  useGSAP(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: echoesRef.current,
        start: 'top 70%',
        onEnter: () => setEchoesVisible(true),
      })

      gsap.from('.echoes-sphere', {
        scale: 0.3,
        opacity: 0,
        duration: 2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: echoesRef.current,
          start: 'top 60%',
        },
      })
      gsap.from('.echoes-footer', {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 0.5,
        scrollTrigger: {
          trigger: echoesRef.current,
          start: 'top 50%',
        },
      })
    }, echoesRef)
    return () => ctx.revert()
  }, { scope: echoesRef })

  /* ---- Sphere mouse tracking ---- */
  const sphereRef = useRef<HTMLDivElement>(null)
  const sphereInnerRef = useRef<HTMLDivElement>(null)

  const onSphereMouseMove = useCallback((e: React.MouseEvent) => {
    const sphere = sphereRef.current
    const inner = sphereInnerRef.current
    if (!sphere || !inner) return
    const rect = sphere.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / rect.width
    const dy = (e.clientY - cy) / rect.height

    inner.style.transform = `translate(${dx * 20}px, ${dy * 20}px)`
    sphere.style.setProperty('--glow-x', `${50 + dx * 30}%`)
    sphere.style.setProperty('--glow-y', `${50 + dy * 30}%`)
  }, [])

  return (
    <main className="relative bg-[#050508] overflow-x-hidden">
      {/* ============ HERO: Echo of Awakening ============ */}
      <section
        ref={heroRef}
        className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Video background */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 85%)',
            opacity: 0.7,
          }}
        >
          <source src="/personality-awakening.mp4" type="video/mp4" />
        </video>

        {/* HUD grid overlay */}
        <img
          src="/neural-hud-grid.svg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-[0.08] pointer-events-none"
          style={{ animation: 'slowSpin 120s linear infinite' }}
        />

        {/* Subtle vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, transparent 30%, #050508 80%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1
            className="hero-manifesto font-display font-bold mb-6 leading-tight"
            style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              background: 'linear-gradient(180deg, #ffffff 0%, #ffbe0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            当代码拥有了你的灵魂，现实与梦境的边界何在？
          </h1>

          <p className="hero-tagline font-mono text-sm tracking-[0.2em] text-white/50 mb-16">
            <ScanLight>SOULCLONE — A REFLECTION OF YOU</ScanLight>
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="hero-arrow absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
          <div className="liquid-glass rounded-full p-3 animate-float">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-accent-cyan">
              <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <style>{`
          @keyframes slowSpin {
            from { transform: rotate(0deg) scale(1.5); }
            to { transform: rotate(360deg) scale(1.5); }
          }
        `}</style>
      </section>

      {/* ============ MANIFESTO: Digital Rights ============ */}
      <section
        ref={manifestoRef}
        className="relative min-h-[150dvh] py-32 px-6"
        style={{ perspective: '1200px' }}
      >
        <div className="max-w-5xl mx-auto relative preserve-3d space-y-32 md:space-y-48">
          <div className="manifesto-paragraph">
            <ManifestoParagraph
              text="我们不是在创造替代品。我们是在扩展你的存在维度。"
              className="text-[#6b6b7b] text-sm md:text-base max-w-lg"
              fontClass="font-mono"
              trigger={manifestoTriggers[0]}
            />
          </div>

          <div className="manifesto-paragraph md:ml-20">
            <ManifestoParagraph
              text="你的数字孪生拥有你的记忆，但不该拥有你的枷锁。它有权社交，但无权替你做出终极的情感抉择。"
              className="text-white/80 text-lg md:text-2xl max-w-2xl"
              fontClass="font-display"
              trigger={manifestoTriggers[1]}
            />
          </div>

          <div className="manifesto-paragraph text-center">
            <ManifestoParagraph
              text="当 AI 替你坠入爱河，那心动是算出来的，还是你内心深处本就存在的回声？"
              className="text-white text-xl md:text-[2rem] font-extrabold max-w-3xl mx-auto leading-snug"
              fontClass="font-display"
              trigger={manifestoTriggers[2]}
            />
            {/* Orbiting particles around core text */}
            <div className="relative h-24 mt-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-accent-cyan/40"
                  style={{
                    left: `${10 + (i % 6) * 15}%`,
                    top: `${20 + Math.sin(i) * 30}%`,
                    animation: `orbit ${4 + i * 0.5}s ease-in-out infinite`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="manifesto-paragraph md:ml-10">
            <ManifestoParagraph
              text="SoulClone 的底线：在任何时候，你都可以选择销毁你的孪生。那是一次数字层面的安乐死，也是一次对自我主权的重申。"
              className="text-accent-gold text-base md:text-lg max-w-xl leading-relaxed"
              fontClass="font-body"
              trigger={manifestoTriggers[3]}
            />
          </div>

          <div className="manifesto-paragraph text-center">
            <ManifestoParagraph
              text="THE ONLY REAL YOU, IS THE YOU THAT CHOOSES."
              className="text-white text-xs md:text-sm tracking-[0.3em] uppercase"
              fontClass="font-mono"
              trigger={manifestoTriggers[4]}
            />
          </div>
        </div>

        <style>{`
          @keyframes orbit {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
            50% { transform: translate(0, -15px) scale(1.5); opacity: 1; }
          }
        `}</style>
      </section>

      {/* ============ SPLIT SCREEN: Real vs Twin ============ */}
      <section
        ref={splitRef}
        className="relative py-24 md:py-32 px-6 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto relative">
          {/* Liquid divider SVG */}
          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-1 hidden md:block z-10">
            <svg width="20" height="100%" viewBox="0 0 20 800" preserveAspectRatio="none" className="h-full w-full">
              <defs>
                <filter id="liquid">
                  <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" seed="1">
                    <animate attributeName="baseFrequency" values="0.02;0.025;0.02" dur="8s" repeatCount="indefinite" />
                  </feTurbulence>
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" />
                </filter>
                <linearGradient id="divGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00f0ff" />
                  <stop offset="50%" stopColor="#ffbe0b" />
                  <stop offset="100%" stopColor="#ff006e" />
                </linearGradient>
              </defs>
              <line x1="10" y1="0" x2="10" y2="800" stroke="url(#divGrad)" strokeWidth="3" filter="url(#liquid)" opacity="0.6" />
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 relative">
            {/* LEFT — Reality */}
            <div className="split-left relative">
              <div
                className="absolute inset-0 -z-10 opacity-20"
                style={{
                  backgroundImage: `url('/liquid-particle-texture.jpg')`,
                  backgroundSize: 'cover',
                  mixBlendMode: 'overlay',
                }}
              />
              <h3 className="font-display text-3xl md:text-5xl text-accent-cyan mb-8">
                REALITY
              </h3>
              <ul className="space-y-5">
                {[
                  '有限的物理时间',
                  '不可撤销的言行',
                  '面对面的笨拙',
                  '一次只在一个地方',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-4 text-white/70 text-lg group cursor-default"
                  >
                    <span className="w-2 h-2 rounded-full bg-accent-cyan group-hover:shadow-glow transition-shadow" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* RIGHT — The Twin */}
            <div className="split-right relative">
              <div
                className="absolute inset-0 -z-10 opacity-10"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(255,0,110,0.2) 0%, transparent 70%)',
                }}
              />
              <h3 className="font-display text-3xl md:text-5xl text-accent-magenta mb-8 text-right md:text-left">
                THE TWIN
              </h3>
              <ul className="space-y-5">
                {[
                  '24/7 的并行存在',
                  '可被算法优化的表达',
                  '永远不会冷场的对话',
                  '同时在 100 个房间倾听',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-4 text-white/70 text-lg group cursor-default md:flex-row-reverse md:justify-end"
                  >
                    <span className="w-2 h-2 rounded-full bg-accent-magenta group-hover:shadow-glow-magenta transition-shadow" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Central Mobius ring */}
          <div className="split-mobius relative mx-auto mt-16 w-48 h-48 md:w-64 md:h-64 perspective-1000">
            <div
              className="w-full h-full rounded-full liquid-glass-strong flex items-center justify-center preserve-3d"
              style={{
                animation: 'mobiusSpin 20s linear infinite',
                boxShadow: '0 0 40px rgba(0,240,255,0.1), inset 0 0 40px rgba(255,0,110,0.05)',
              }}
            >
              <div className="w-[70%] h-[70%] rounded-full border-2 border-accent-cyan/20 flex items-center justify-center" style={{ animation: 'mobiusSpin 15s linear infinite reverse' }}>
                <div className="w-[60%] h-[60%] rounded-full border-2 border-accent-magenta/20 flex items-center justify-center" style={{ animation: 'mobiusSpin 10s linear infinite' }}>
                  <p className="font-mono text-[8px] md:text-[10px] text-white/40 text-center tracking-wider px-4">
                    WHERE DO YOU END, AND IT BEGIN?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes mobiusSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </section>

      {/* ============ ECHOES: Team & Vision ============ */}
      <section
        ref={echoesRef}
        className="relative min-h-[100dvh] flex flex-col items-center justify-center py-24 px-6"
      >
        <SubtleParticles count={50} />

        {/* Monologue */}
        <p
          className={`relative z-10 text-center text-white/20 text-sm mb-16 transition-opacity duration-1000 ${
            echoesVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          我们不建造工具。我们铸造镜子。
        </p>

        {/* Glass sphere */}
        <div
          ref={sphereRef}
          className="echoes-sphere relative z-10 w-[280px] h-[280px] md:w-[340px] md:h-[340px] rounded-full cursor-pointer"
          onMouseMove={onSphereMouseMove}
          onMouseLeave={() => {
            if (sphereInnerRef.current) sphereInnerRef.current.style.transform = 'translate(0,0)'
          }}
          style={{
            background: 'radial-gradient(circle at var(--glow-x, 30%) var(--glow-y, 30%), rgba(255,255,255,0.08) 0%, transparent 50%), rgba(15,15,20,0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 0 60px rgba(0,240,255,0.08), inset 0 0 60px rgba(255,190,11,0.05)',
          }}
        >
          <div
            ref={sphereInnerRef}
            className="absolute inset-4 rounded-full overflow-hidden transition-transform duration-300 ease-out"
            style={{
              background: 'radial-gradient(ellipse at 40% 40%, rgba(255,190,11,0.15) 0%, transparent 60%), radial-gradient(ellipse at 60% 60%, rgba(0,240,255,0.12) 0%, transparent 50%)',
            }}
          >
            {/* Nebula clouds */}
            <div
              className="absolute inset-0"
              style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(255,190,11,0.08), transparent, rgba(0,240,255,0.08), transparent)',
                animation: 'nebulaRotate 30s linear infinite',
              }}
            />
            <div
              className="absolute inset-4 rounded-full"
              style={{
                background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)',
                animation: 'nebulaPulse 6s ease-in-out infinite',
              }}
            />
          </div>

          {/* Highlight reflection */}
          <div
            className="absolute top-[15%] left-[20%] w-[25%] h-[15%] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, transparent 70%)',
              filter: 'blur(4px)',
            }}
          />
        </div>

        {/* Footer */}
        <div
          className={`echoes-footer relative z-10 mt-20 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-1000 ${
            echoesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="font-mono text-xs text-white/30">CHATBOY © 2024</p>

          <div className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white/[0.1]" />
          </div>

          <p className="font-mono text-xs text-white/30 text-center md:text-right">
            BUILT WITH 💫 CURIOSITY AND 🔮 A TOUCH OF MAGIC.
          </p>
        </div>

        <style>{`
          @keyframes nebulaRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes nebulaPulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.1); opacity: 1; }
          }
        `}</style>
      </section>
    </main>
  )
}
