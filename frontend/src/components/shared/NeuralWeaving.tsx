import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger)

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
  const sectionRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        pin: viewportRef.current,
        pinSpacing: false,
      })

      nodesRef.current.forEach((node, i) => {
        if (!node) return
        gsap.fromTo(
          node,
          { y: '120vh', opacity: 0, scale: 0.7, rotateX: 15 },
          {
            y: '0vh',
            opacity: 1,
            scale: 1,
            rotateX: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: `${20 + i * 25}% top`,
              end: `${45 + i * 25}% top`,
              scrub: 1,
            },
          }
        )

        gsap.to(node, {
          y: '-80vh',
          opacity: 0,
          scale: 0.8,
          ease: 'power2.in',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: `${50 + i * 25}% top`,
            end: `${75 + i * 25}% top`,
            scrub: 1,
          },
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className={cn('relative bg-background', className)} style={{ height: '300vh' }}>
      <div
        ref={viewportRef}
        className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden"
      >
        {/* Neural HUD Grid Background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M0 50h100M50 0v100' stroke='%2300f0ff' stroke-width='0.5' opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Ambient radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050508_80%)]" />

        {/* Nodes */}
        <div className="relative z-10 flex flex-col items-center gap-8 px-6">
          {nodes.map((node, i) => (
            <div
              key={node.title}
              ref={(el) => { nodesRef.current[i] = el }}
              className="glass-elevated absolute w-[90vw] max-w-2xl rounded-2xl p-8 md:p-10"
              style={{
                left: '50%',
                top: `${i * 320 + 80}px`,
                transform: 'translateX(-50%)',
                borderColor: `${node.color}20`,
                perspective: '1000px',
              }}
            >
              {/* Glow border accent */}
              <div
                className="absolute inset-0 rounded-2xl opacity-20"
                style={{
                  boxShadow: `inset 0 0 40px ${node.color}20, 0 0 60px ${node.color}10`,
                }}
              />

              <div className="relative z-10">
                <p className="mb-2 font-mono text-xs uppercase tracking-widest" style={{ color: node.color }}>
                  {node.subtitle}
                </p>
                <h3 className="mb-4 font-heading text-3xl text-white md:text-4xl">
                  {node.title}
                </h3>
                <p className="max-w-md text-base leading-relaxed text-white/60">
                  {node.desc}
                </p>
              </div>

              {/* Decorative orb */}
              <div
                className="absolute -right-6 -top-6 h-16 w-16 rounded-full blur-xl"
                style={{ backgroundColor: node.color, opacity: 0.3 }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
