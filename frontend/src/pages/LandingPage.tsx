import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, ChevronDown, MessageCircle, Users, Fingerprint, Brain } from 'lucide-react'

const ParticleShader = lazy(() => import('@/components/shared/ParticleShader'))
import NeuralCard from '@/components/shared/NeuralCard'
import ScanLight from '@/components/shared/ScanLight'
import { HeroTitle, HeroSubtitle, HeroCTA, HeroBadge } from '@/components/shared/HeroReveal'
import { Button } from '@/components/ui/Button'
import NeuralWeaving from '@/components/shared/NeuralWeaving'
import EchoesTorus from '@/components/shared/EchoesTorus'

/* ───────── Bento Grid Feature Data ───────── */
const bentoItems = [
  {
    icon: <Brain size={20} />,
    title: 'AI 人格建模',
    desc: '深度问卷 + 聊天样本分析，构建精准人格画像',
    size: 'large', // spans 2 cols, 2 rows
  },
  {
    icon: <MessageCircle size={20} />,
    title: '替你聊天',
    desc: '离线时代替你回复、培养关系',
    size: 'small',
  },
  {
    icon: <Users size={20} />,
    title: '悬疑匹配',
    desc: '对方不知道屏幕那头是谁',
    size: 'small',
  },
  {
    icon: <Fingerprint size={20} />,
    title: '风格学习',
    desc: '分析你的语气词、表情包、回复节奏',
    size: 'medium', // spans 2 cols
  },
  {
    icon: <Zap size={20} />,
    title: '自动运行',
    desc: '激活后 AI 克隆体独立社交',
    size: 'small',
  },
]

const protocols = [
  { icon: <Brain size={22} />, title: '人格探测', desc: '12道深度心理学问题，结合MBTI和大五人格模型。', accent: '#00f0ff' },
  { icon: <Fingerprint size={22} />, title: '风格学习', desc: 'AI 分析语气词、表情包习惯、回复节奏和幽默感。', accent: '#00f0ff' },
  { icon: <Zap size={22} />, title: '自动运行', desc: '激活后，AI 克隆体在平台上独立社交、匹配、维系关系。', accent: '#00f0ff' },
]

/* ───────── Hero Bento Demo Cards ───────── */
function HeroBentoDemo() {
  return (
    <div className="hidden lg:grid grid-cols-2 gap-3 w-full max-w-md">
      {/* Large card — Chat preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="col-span-2 row-span-2 glass-elevated rounded-2xl p-5 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/10 rounded-full blur-[60px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            <span className="text-xs text-text-tertiary font-mono">AI CLONE ONLINE</span>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center text-xs text-accent-cyan font-bold">AI</div>
              <div className="glass rounded-xl rounded-tl-sm px-3 py-2 text-sm text-text-secondary max-w-[80%]">
                嘿，你今天怎么样？我刚刚看了一部超棒的电影 🎬
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <div className="bg-accent-cyan/15 rounded-xl rounded-tr-sm px-3 py-2 text-sm text-accent-cyan max-w-[80%]">
                听起来不错！是什么类型的？
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-text-tertiary">你</div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center text-xs text-accent-cyan font-bold">AI</div>
              <div className="glass rounded-xl rounded-tl-sm px-3 py-2 text-sm text-text-secondary max-w-[80%]">
                科幻悬疑！猜你喜欢这种 😏
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Small cards */}
      {[
        { label: '匹配率', value: '94%', sub: '+12% this week' },
        { label: '关系深度', value: 'L3', sub: '3 active bonds' },
        { label: '人格相似度', value: '97%', sub: 'MBTI: ENTP' },
        { label: '在线时长', value: '18h', sub: 'Auto-pilot active' },
      ].map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.6 + i * 0.1, duration: 0.5 }}
          className="glass rounded-xl p-4 relative overflow-hidden group hover:border-accent-cyan/20 transition-colors"
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-accent-cyan/5 rounded-full blur-xl group-hover:bg-accent-cyan/10 transition-colors" />
          <p className="text-xs text-text-tertiary mb-1">{stat.label}</p>
          <p className="text-xl font-bold text-text-primary font-mono">{stat.value}</p>
          <p className="text-[10px] text-accent-cyan/60 mt-1 font-mono">{stat.sub}</p>
        </motion.div>
      ))}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative min-h-[100dvh] w-full overflow-hidden">
        <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
          <ParticleShader />
        </Suspense>

        {/* Ambient orbs — only cyan tint for brand consistency */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full blur-[120px]"
              style={{
                width: 250 + i * 60,
                height: 250 + i * 60,
                background: 'rgba(0,240,255,0.035)',
                left: `${10 + (i * 23) % 80}%`,
                top: `${5 + (i * 31) % 70}%`,
              }}
              animate={{ x: [0, 40, -30, 0], y: [0, -30, 40, 0], scale: [1, 1.2, 0.95, 1] }}
              transition={{ duration: 15 + i * 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        {/* Dark vignette overlay for text readability */}
        <div
          className="absolute inset-0 pointer-events-none z-[3]"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 30% 50%, rgba(5,5,8,0.85) 0%, rgba(5,5,8,0.4) 50%, rgba(5,5,8,0.1) 100%)',
          }}
        />

        <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-7xl flex-col lg:flex-row items-center justify-center px-6 gap-12 lg:gap-8">
          {/* Left: Copy */}
          <div className="flex-1 flex flex-col items-start text-left max-w-xl">
            <HeroBadge delay={0.2}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-accent-cyan/25 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan" />
                </span>
                <span className="text-xs text-accent-cyan font-medium tracking-wide">新一代 AI 社交平台</span>
              </div>
            </HeroBadge>

            <HeroTitle delay={0.4}>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mb-6 leading-[1.15] tracking-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.6)]">
                <ScanLight>你的灵魂</ScanLight>
                <br />
                <span className="text-accent-cyan">不止一个容器</span>
              </h1>
            </HeroTitle>

            <HeroSubtitle delay={0.9}>
              <p className="text-text-secondary text-lg md:text-xl mb-10 max-w-md leading-relaxed drop-shadow-[0_1px_12px_rgba(0,0,0,0.5)]">
                当你的数字分身在线上替你社交、培养关系时，
                现实中的你正在做什么？
              </p>
            </HeroSubtitle>

            <HeroCTA delay={1.2}>
              <div className="flex items-center gap-4">
                <Link to="/register">
                  <Button variant="primary" size="lg" className="group">
                    <span>开始使用</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-150 ease-spring" />
                  </Button>
                </Link>
                <Link to="/login" className="text-sm text-text-tertiary hover:text-text-secondary transition-colors duration-150 ease-liquid">
                  已有账号？<span className="text-accent-cyan hover:text-accent-cyan-dark transition-colors">登录</span>
                </Link>
              </div>
            </HeroCTA>
          </div>

          {/* Right: Bento Demo */}
          <div className="flex-1 flex items-center justify-center">
            <HeroBentoDemo />
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-text-disabled text-[10px] tracking-[0.2em] uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ChevronDown size={16} className="text-text-disabled" />
          </motion.div>
        </motion.div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[5]" />
      </section>

      {/* ═══════════════════════ BENTO FEATURES ═══════════════════════ */}
      <section className="py-32 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            className="mb-20"
            data-framer-initial
          >
            <p className="text-accent-cyan text-xs font-mono uppercase tracking-[0.2em] mb-4">Core Capabilities</p>
            <h2 className="font-display text-4xl md:text-5xl mb-4">
              探索<span className="text-accent-cyan">无限可能</span>
            </h2>
            <p className="text-text-secondary max-w-md text-base">
              SoulClone 不只是社交工具——它是你人格的数字延续。
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[180px]">
            {bentoItems.map((item, i) => {
              const sizeClass =
                item.size === 'large' ? 'md:col-span-2 md:row-span-2' :
                item.size === 'medium' ? 'md:col-span-2' : ''

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4, transition: { duration: 0.3 } }}
                  className={`glass-elevated rounded-2xl p-6 relative overflow-hidden group cursor-default ${sizeClass}`}
                  data-framer-initial
                >
                  {/* Subtle cyan glow on hover */}
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-accent-cyan/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="relative z-10 h-full flex flex-col">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-accent-cyan/10 border border-accent-cyan/15">
                      <div className="text-accent-cyan">{item.icon}</div>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/55 transition-colors">
                      {item.desc}
                    </p>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ NEURAL WEAVING ═══════════════════════ */}
      <NeuralWeaving />

      {/* ═══════════════════════ PROTOCOL MATRIX ═══════════════════════ */}
      <section className="py-32 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            className="mb-20"
            data-framer-initial
          >
            <p className="text-accent-cyan text-xs font-mono uppercase tracking-[0.2em] mb-4">Protocol Matrix</p>
            <h2 className="font-display text-4xl md:text-5xl mb-4 tracking-tight">
              核心<span className="text-accent-cyan">协议</span>
            </h2>
            <p className="text-text-secondary max-w-md text-base">
              三大底层协议，确保 AI 克隆体真实可靠。
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6" style={{ perspective: '1200px' }}>
            {protocols.map((protocol, i) => (
              <NeuralCard
                key={i}
                icon={protocol.icon}
                title={protocol.title}
                desc={protocol.desc}
                accent={protocol.accent}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA ═══════════════════════ */}
      <EchoesTorus />

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="py-10 px-4 text-center border-t border-white/[0.04]">
        <p className="text-text-disabled text-sm">SoulClone — 让社交不止于当下</p>
      </footer>

      <noscript>
        <style>{`[data-framer-initial]{opacity:1!important;transform:none!important}`}</style>
      </noscript>
    </div>
  )
}
