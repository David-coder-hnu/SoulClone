import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const quotes = [
  '在这里，心动不是化学反应，而是一场精心编排的霓虹风暴。',
  '你的数字孪生，正在替你在数据洪流中打捞灵魂碎片。',
  '当真实与虚拟的边界溶解，唯一的真实，就是此刻的共鸣。',
]

export default function NeonTheater() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!trackRef.current || !sectionRef.current) return

      const scrollWidth = trackRef.current.scrollWidth - window.innerWidth

      gsap.to(trackRef.current, {
        x: -scrollWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${scrollWidth}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#050508]"
      style={{ height: '100dvh' }}
    >
      {/* Background illustration */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'url(/dating-scene-illustration.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-transparent to-[#050508]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-transparent to-[#050508]" />

      <div
        ref={trackRef}
        className="relative flex h-full w-max items-center gap-16 px-[20vw]"
      >
        <div className="flex-shrink-0">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent-magenta">
            Neon Theater
          </p>
          <h2 className="font-display text-5xl font-bold text-white md:text-6xl lg:text-7xl">
            霓虹剧场
          </h2>
        </div>

        {quotes.map((quote, i) => (
          <div
            key={i}
            className="relative flex-shrink-0 max-w-xl rounded-3xl liquid-glass-strong p-10 md:p-14"
          >
            {/* Melting bubble effect visual */}
            <div
              className="absolute -inset-1 rounded-[2rem] opacity-20 blur-sm"
              style={{
                background: `linear-gradient(135deg, #00f0ff20, #ff006e20, #ffbe0b20)`,
              }}
            />
            <p className="relative z-10 font-display text-2xl font-medium leading-relaxed text-white md:text-3xl">
              &ldquo;{quote}&rdquo;
            </p>
            <div className="relative z-10 mt-6 flex items-center gap-3">
              <span className="h-[1px] w-8 bg-accent-cyan" />
              <span className="font-mono text-xs text-accent-cyan">SoulClone Narrative</span>
            </div>
          </div>
        ))}

        <div className="flex-shrink-0">
          <div className="rounded-2xl liquid-glass p-8 text-center">
            <p className="mb-4 font-mono text-sm text-white/50">Ready to enter?</p>
            <a
              href="#/dating"
              className="inline-block rounded-full bg-accent-magenta px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-glow-magenta"
            >
              进入霓虹剧场
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
