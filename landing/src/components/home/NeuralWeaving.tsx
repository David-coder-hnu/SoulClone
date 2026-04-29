import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const nodes = [
  {
    title: '语言解构',
    subtitle: 'Linguistic Deconstruction',
    desc: '拆解你的语序，捕捉每一个 emoji 背后的情绪波动。我们不存储文字，我们蒸馏语气。',
    color: '#00f0ff',
  },
  {
    title: '情感拓扑',
    subtitle: 'Emotional Topology',
    desc: '绘制你的情感等高线。从冷漠到狂热，从戏谑到温柔，构建独一无二的情感地貌。',
    color: '#ff006e',
  },
  {
    title: '记忆晶体',
    subtitle: 'Memory Crystals',
    desc: '将碎片化的记忆，凝结成 AI 的直觉。你过去的每一次共鸣，都将成为它未来每一次回应的基石。',
    color: '#ffbe0b',
  },
]

export default function NeuralWeaving() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pin the viewport
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

        // Exit animation
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
    <section ref={sectionRef} className="relative bg-[#050508]" style={{ height: '300vh' }}>
      <div
        ref={viewportRef}
        className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden"
      >
        {/* Neural HUD Grid Background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url(/neural-hud-grid.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
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
              className="liquid-glass-strong absolute mx-auto max-w-xl rounded-2xl p-8 md:p-10 perspective-1000"
              style={{ borderColor: `${node.color}20` }}
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
                <h3 className="mb-4 font-display text-3xl font-bold text-white md:text-4xl">
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
