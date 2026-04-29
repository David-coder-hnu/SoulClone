import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Zap, Shield, Heart, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import AnimatedBackground from '@/components/shared/AnimatedBackground'
import CursorTrail from '@/components/shared/CursorTrail'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const features = [
  {
    icon: Zap,
    title: '深度个性延续',
    desc: '通过深度问卷和聊天样本，平台精确理解你的 personality、聊天风格和情感模式。',
    color: 'text-accent-cyan',
    glow: 'shadow-accent-cyan/20',
    gradient: 'from-accent-cyan/20 to-transparent',
    accent: '#00f0ff',
  },
  {
    icon: Heart,
    title: '替你培养感情',
    desc: '你的在线状态会在你离线时继续聊天、匹配、培养关系，时机成熟时邀请你批准约会。',
    color: 'text-accent-magenta',
    glow: 'shadow-accent-magenta/20',
    gradient: 'from-accent-magenta/20 to-transparent',
    accent: '#ff006e',
  },
  {
    icon: Shield,
    title: '悬疑社交体验',
    desc: '对方永远不知道屏幕那头是真人还是在线状态。只有双方都同意时，真实身份才会揭晓。',
    color: 'text-accent-gold',
    glow: 'shadow-accent-gold/20',
    gradient: 'from-accent-gold/20 to-transparent',
    accent: '#ffbe0b',
  },
]

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <CursorTrail />
      <AnimatedBackground />

      {/* Floating ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-[100px]"
            style={{
              width: 200 + i * 50,
              height: 200 + i * 50,
              background: ['rgba(0,240,255,0.04)', 'rgba(255,0,110,0.03)', 'rgba(255,190,11,0.03)'][i % 3],
              left: `${15 + (i * 11) % 70}%`,
              top: `${10 + (i * 17) % 80}%`,
            }}
            animate={{
              x: [0, 30, -20, 0],
              y: [0, -20, 30, 0],
              scale: [1, 1.15, 0.95, 1],
            }}
            transition={{
              duration: 12 + i * 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-3xl"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-accent-cyan/30 mb-8 hover:border-accent-cyan/50 transition-colors cursor-default group">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles size={16} className="text-accent-cyan" />
              </motion.div>
              <span className="text-sm text-accent-cyan">新一代社交平台</span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              你的灵魂
              <br />
              <span className="text-gradient">不止一个容器</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-text-secondary text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
              在这里，你的在线状态会延续你的 personality，替你维系关系、发现共鸣。
              当你离线时，另一个你在平台上继续生活。
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-accent-cyan to-accent-magenta text-white font-semibold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-xl hover:shadow-accent-cyan/20"
              >
                <span className="relative z-10">开始使用</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-accent-magenta to-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: 'inset 0 0 30px rgba(255,255,255,0.1)' }} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl glass text-text-primary font-semibold text-lg transition-all hover:bg-white/10 hover:border-white/20 border border-transparent hover:shadow-lg"
              >
                已有账号？登录
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-text-ghost text-xs tracking-widest uppercase">探索更多</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronDown size={20} className="text-text-ghost" />
            </motion.div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="py-24 px-4 relative">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 mb-6"
              >
                <Sparkles size={14} className="text-accent-cyan" />
                <span className="text-xs text-accent-cyan">核心能力</span>
              </motion.div>
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
                探索<span className="text-gradient">无限可能</span>
              </h2>
              <p className="text-text-secondary max-w-md mx-auto">
                三大核心体验，重新定义社交方式
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className={cn(
                    'glass-elevated rounded-3xl p-8 h-full relative overflow-hidden group cursor-default',
                    'hover:border-white/10 transition-all duration-300',
                    `hover:shadow-xl ${feature.glow}`
                  )}
                >
                  <div className={cn('absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl opacity-20 rounded-bl-full transition-opacity group-hover:opacity-40', feature.gradient)} />
                  <div className={cn('absolute -bottom-4 -left-4 w-24 h-24 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity', feature.gradient)} />

                  <motion.div
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative z-10 border border-white/5', feature.glow.replace('shadow-', 'bg-').replace('/20', '/10'))}
                    style={{ boxShadow: `0 0 20px ${feature.accent}20` }}
                  >
                    <feature.icon size={26} className={feature.color} />
                  </motion.div>

                  <h3 className="font-display text-xl font-bold mb-3 relative z-10">{feature.title}</h3>
                  <p className="text-text-secondary leading-relaxed relative z-10">{feature.desc}</p>

                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 px-4 relative">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                三步开启<span className="text-gradient">第二人生</span>
              </h2>
            </motion.div>

            <div className="space-y-12">
              {[
                { step: '01', title: '人格探测', desc: '回答12道深度问题，描绘你的人格画像' },
                { step: '02', title: '风格学习', desc: '提供聊天样本，让系统学习你的表达习惯' },
                { step: '03', title: '自动运行', desc: '激活自动模式，另一个你开始替你社交' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6 }}
                  className="flex items-center gap-6 md:gap-10"
                >
                  <div className={cn(
                    'w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center shrink-0 font-display text-2xl md:text-3xl font-bold',
                    i === 0 ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20' :
                    i === 1 ? 'bg-accent-magenta/10 text-accent-magenta border border-accent-magenta/20' :
                    'bg-accent-gold/10 text-accent-gold border border-accent-gold/20'
                  )}>
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl md:text-2xl font-bold mb-2">{item.title}</h3>
                    <p className="text-text-secondary">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            className="max-w-2xl mx-auto text-center glass-elevated rounded-3xl p-12 relative overflow-hidden border border-white/5"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent-cyan/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent-magenta/8 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-magenta mb-6"
              >
                <Sparkles size={28} className="text-white" />
              </motion.div>

              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                准备好遇见<span className="text-gradient">另一个自己</span>了吗？
              </h2>
              <p className="text-text-secondary mb-8">只需5分钟，开启你的社交之旅。</p>
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-accent-cyan to-accent-magenta text-white font-semibold transition-all hover:scale-105 hover:shadow-xl hover:shadow-accent-cyan/20 relative overflow-hidden"
              >
                <span className="relative z-10">立即开始</span>
                <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-accent-magenta to-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 text-center text-text-ghost text-sm border-t border-white/5">
          <p>SoulClone — 让社交不止于当下</p>
        </footer>
      </div>
    </div>
  )
}
