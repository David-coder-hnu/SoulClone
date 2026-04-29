import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import ParticleBackground from './ParticleBackground'

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.4 })

      tl.fromTo(
        titleRef.current,
        { x: 80, opacity: 0, filter: 'blur(10px)' },
        { x: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' }
      )
      .fromTo(
        subtitleRef.current,
        { x: 60, opacity: 0, filter: 'blur(8px)' },
        { x: 0, opacity: 1, filter: 'blur(0px)', duration: 1.0, ease: 'power3.out' },
        '-=0.7'
      )
      .fromTo(
        ctaRef.current,
        { x: 40, opacity: 0, scale: 0.9 },
        { x: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' },
        '-=0.5'
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] w-full overflow-hidden bg-[#050508]"
    >
      <ParticleBackground />

      {/* Diagonal layout: left 65% particles, right 35% UI */}
      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-7xl flex-col items-end justify-center px-6 md:flex-row md:items-center">
        <div className="hidden md:block md:w-[60%]" />
        <div className="flex w-full flex-col items-start gap-6 md:w-[40%] md:items-start md:pl-8">
          <h1
            ref={titleRef}
            className="font-display text-4xl font-bold leading-tight tracking-wide text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            在深渊中，
            <br />
            <span className="gradient-text">创造另一个你。</span>
          </h1>

          <p
            ref={subtitleRef}
            className="max-w-md text-base leading-relaxed text-white/60 sm:text-lg"
          >
            SoulClone —— 你的 AI 数字孪生。当现实世界的你入眠时，由代码与情感构成的另一个你，正在霓虹交织的社交宇宙中，替你经历心动、交友与无限可能。
          </p>

          <div ref={ctaRef} className="mt-4">
            <Link
              to="/personality"
              className="group relative inline-flex items-center gap-3 rounded-full liquid-glass-strong px-8 py-4 text-base font-semibold text-accent-cyan transition-all duration-500 hover:shadow-glow"
            >
              <span className="relative z-10">启动人格觉醒</span>
              <svg
                className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              {/* Liquid shimmer overlay */}
              <span className="absolute inset-0 overflow-hidden rounded-full">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent-cyan/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Ambient bottom gradient fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050508] to-transparent z-10" />
    </section>
  )
}
