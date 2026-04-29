import { useRef, useEffect, useState, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const protocols = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65" />
      </svg>
    ),
    title: '隐私迷雾协议',
    desc: '端到端加密的情感数据隧道，你的每一次心动都被量子密钥守护。',
    depth: 120,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
      </svg>
    ),
    title: '量子纠缠匹配',
    desc: '基于人格共振频率的超维配对算法，让灵魂在数据洪流中精准相遇。',
    depth: -80,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
      </svg>
    ),
    title: '意识附身引擎',
    desc: '让 AI 数字孪生无缝接管你的社交身份，每一次对话都仿佛出自你本人。',
    depth: 60,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    title: '情感共鸣算法',
    desc: '实时解析对话中的微情绪波动，让回应精准击中对方心底最柔软的部分。',
    depth: -40,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: '记忆回溯系统',
    desc: '将你的聊天记录提炼成结构化记忆图谱，AI 孪生越用越懂你。',
    depth: 100,
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    title: '霓虹剧场',
    desc: '游戏化社交场景引擎，在虚拟与现实的边界上，编织独一无二的情感剧本。',
    depth: -100,
  },
]

export default function ProtocolMatrix() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    mouseRef.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    }

    cardsRef.current.forEach((card) => {
      if (!card) return
      const cardRect = card.getBoundingClientRect()
      const cardX = ((e.clientX - cardRect.left) / cardRect.width - 0.5) * 2
      const cardY = ((e.clientY - cardRect.top) / cardRect.height - 0.5) * 2
      card.style.transform = `perspective(1000px) rotateY(${cardX * 6}deg) rotateX(${-cardY * 6}deg) translateZ(${activeIndex === parseInt(card.dataset.index || '-1') ? 30 : 0}px)`
    })
  }, [activeIndex])

  const handleMouseLeave = useCallback(() => {
    cardsRef.current.forEach((card) => {
      if (!card) return
      card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)'
    })
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        if (!card) return
        gsap.fromTo(
          card,
          { y: 80, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
            delay: i * 0.1,
          }
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#050508] py-24 md:py-32">
      {/* Caustic background */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-screen"
        style={{
          backgroundImage: 'url(/glass-caustic-normal.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-transparent to-[#050508]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent-cyan">
            Protocol Matrix
          </p>
          <h2 className="font-display text-4xl font-bold text-white md:text-5xl">
            孪生协议矩阵
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/50">
            六大核心协议构筑你的数字孪生生态，每一项技术都是通往平行社交宇宙的密钥。
          </p>
        </div>

        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {protocols.map((p, i) => (
            <div
              key={p.title}
              ref={(el) => { cardsRef.current[i] = el }}
              data-index={i}
              className={
                'group relative cursor-pointer rounded-2xl liquid-glass p-8 transition-all duration-500 ' +
                (activeIndex === i ? 'shadow-glow scale-[1.02] border-accent-cyan/30' : '')
              }
              style={{
                transformStyle: 'preserve-3d',
                transition: 'box-shadow 0.5s, border-color 0.5s, transform 0.15s',
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div
                className={
                  'mb-6 inline-flex items-center justify-center rounded-xl p-3 text-accent-cyan transition-all duration-500 ' +
                  (activeIndex === i ? 'bg-accent-cyan/10 scale-110' : 'bg-white/5')
                }
              >
                {p.icon}
              </div>
              <h3 className="mb-3 font-display text-xl font-bold text-white">
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/50 transition-colors duration-300 group-hover:text-white/70">
                {p.desc}
              </p>

              {/* Depth indicator */}
              <div
                className="absolute -right-2 -top-2 h-20 w-20 rounded-full blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-30"
                style={{ backgroundColor: '#00f0ff' }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
