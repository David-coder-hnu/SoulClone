import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Zap, Shield, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import AuroraBackground from '@/components/shared/AuroraBackground'
import TiltCard from '@/components/shared/TiltCard'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuroraBackground />

      {/* Animated floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-[80px]"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              background: ['rgba(0,240,255,0.06)', 'rgba(255,0,110,0.05)', 'rgba(255,190,11,0.04)'][i % 3],
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-accent-cyan/30 mb-8 hover:border-accent-cyan/50 transition-colors"
            >
              <Sparkles size={16} className="text-accent-cyan" />
              <span className="text-sm text-accent-cyan">新一代社交平台</span>
            </motion.div>

            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
              你的灵魂
              <br />
              <span className="text-gradient">不止一个容器</span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-text-secondary text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed"
            >
              在这里，你的在线状态会延续你的 personality，替你维系关系、发现共鸣。
              当你离线时，另一个你在平台上继续生活。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-accent-cyan to-accent-magenta text-white font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent-cyan/25 relative overflow-hidden"
              >
                <span className="relative z-10">开始使用</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-accent-magenta to-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl glass text-text-primary font-semibold text-lg transition-all hover:bg-white/10 hover:border-white/20 border border-transparent"
              >
                已有账号？登录
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5"
            >
              <motion.div className="w-1 h-2 rounded-full bg-accent-cyan" />
            </motion.div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="py-24 px-4 relative">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                探索<span className="text-gradient">无限可能</span>
              </h2>
              <p className="text-text-secondary max-w-md mx-auto">
                三大核心体验，重新定义社交方式
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: '深度个性延续',
                  desc: '通过深度问卷和聊天样本，平台精确理解你的 personality、聊天风格和情感模式。',
                  color: 'text-accent-cyan',
                  glow: 'glow-cyan',
                  gradient: 'from-accent-cyan/20 to-transparent',
                },
                {
                  icon: Heart,
                  title: '替你培养感情',
                  desc: '你的在线状态会在你离线时继续聊天、匹配、培养关系，时机成熟时邀请你批准约会。',
                  color: 'text-accent-magenta',
                  glow: 'glow-magenta',
                  gradient: 'from-accent-magenta/20 to-transparent',
                },
                {
                  icon: Shield,
                  title: '悬疑社交体验',
                  desc: '对方永远不知道屏幕那头是真人还是在线状态。只有双方都同意时，真实身份才会揭晓。',
                  color: 'text-accent-gold',
                  glow: 'glow-gold',
                  gradient: 'from-accent-gold/20 to-transparent',
                },
              ].map((feature, i) => (
                <TiltCard key={i} tiltAmount={6} glowColor={feature.color.replace('text-', 'rgba(').replace('accent-cyan', '0,240,255,0.15').replace('accent-magenta', '255,0,110,0.15').replace('accent-gold', '255,190,11,0.15') + ')'}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                    className="glass-elevated rounded-3xl p-8 h-full relative overflow-hidden group hover:border-white/10 transition-colors"
                  >
                    <div className={cn('absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl opacity-20 rounded-bl-full', feature.gradient)} />
                    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-6 relative z-10', feature.glow)}>
                      <feature.icon size={24} className={feature.color} />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-3 relative z-10">{feature.title}</h3>
                    <p className="text-text-secondary leading-relaxed relative z-10">{feature.desc}</p>
                  </motion.div>
                </TiltCard>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center liquid-border p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent-cyan/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                准备好遇见<span className="text-gradient">另一个自己</span>了吗？
              </h2>
              <p className="text-text-secondary mb-8">只需5分钟，开启你的社交之旅。</p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-accent-cyan to-accent-magenta text-white font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent-cyan/25"
              >
                立即开始
                <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
