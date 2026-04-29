import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Sliders, Activity, MessageSquare, Brain, FlaskConical, ArrowRight, Power, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'

export default function ClonePage() {
  const navigate = useNavigate()
  const [autonomy, setAutonomy] = useState(7)
  const [active, setActive] = useState(false)

  const traits = [
    { label: '开放性', value: 85 },
    { label: '尽责性', value: 70 },
    { label: '外向性', value: 60 },
    { label: '宜人性', value: 90 },
    { label: '情绪稳定', value: 65 },
  ]

  const stats = [
    { icon: MessageSquare, label: '总消息数', value: '156', color: 'text-accent-cyan' },
    { icon: Activity, label: '匹配成功', value: '12', color: 'text-accent-magenta' },
    { icon: Sparkles, label: '约会邀请', value: '2', color: 'text-accent-gold' },
  ]

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-2xl mx-auto relative">
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-accent-cyan/3 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold">自动管理</h1>
              <p className="text-text-ghost text-sm mt-0.5">配置你的在线状态行为</p>
            </div>
          </div>

          {/* Clone Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-elevated rounded-3xl p-6 md:p-8 mb-6 relative overflow-hidden border border-white/5"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-cyan/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-accent-magenta/5 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={active ? {
                      boxShadow: ['0 0 20px rgba(0,240,255,0.2)', '0 0 40px rgba(0,240,255,0.4)', '0 0 20px rgba(0,240,255,0.2)']
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                      active ? 'bg-gradient-to-br from-accent-cyan to-accent-magenta' : 'bg-surface border border-white/10'
                    }`}
                  >
                    <Sparkles size={28} className={active ? 'text-white' : 'text-text-ghost'} />
                  </motion.div>
                  <div>
                    <h2 className="font-display text-xl font-bold">自动模式</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <motion.div
                        animate={active ? { scale: [1, 1.4, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className={`w-2 h-2 rounded-full ${active ? 'bg-accent-cyan' : 'bg-text-ghost'}`}
                      />
                      <p className="text-text-secondary text-sm">
                        {active ? '正在自动运行中' : '当前处于手动状态'}
                      </p>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActive(!active)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all border flex items-center gap-2 ${
                    active
                      ? 'bg-accent-magenta/15 text-accent-magenta border-accent-magenta/30 hover:bg-accent-magenta/25 hover:shadow-lg hover:shadow-accent-magenta/10'
                      : 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30 hover:bg-accent-cyan/25 hover:shadow-lg hover:shadow-accent-cyan/10'
                  }`}
                >
                  {active ? <Power size={16} /> : <Zap size={16} />}
                  {active ? '暂停' : '激活'}
                </motion.button>
              </div>

              {/* Autonomy Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders size={16} className="text-text-secondary" />
                    <span className="text-sm font-medium">自主等级</span>
                  </div>
                  <motion.span
                    key={autonomy}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="text-accent-cyan font-display font-bold text-lg"
                  >
                    {autonomy}/10
                  </motion.span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={autonomy}
                    onChange={(e) => setAutonomy(Number(e.target.value))}
                    className="w-full h-2 bg-surface rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-cyan [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-accent-cyan/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background"
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 left-0 h-2 bg-gradient-to-r from-accent-cyan to-accent-magenta rounded-full pointer-events-none"
                    style={{ width: `${(autonomy - 1) / 9 * 100}%` }}
                  />
                </div>
                <motion.p
                  key={autonomy <= 3 ? 'low' : autonomy <= 7 ? 'mid' : 'high'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-text-ghost text-xs"
                >
                  {autonomy <= 3 && '保守：只在收到消息时回复'}
                  {autonomy > 3 && autonomy <= 7 && '平衡：会主动维护和推进关系'}
                  {autonomy > 7 && '激进：非常主动，积极寻求新匹配'}
                </motion.p>
              </div>
            </div>
          </motion.div>

          {/* Calibration CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.01, y: -2 }}
            className="glass rounded-2xl p-5 mb-6 border border-accent-cyan/20 cursor-pointer hover:border-accent-cyan/40 transition-all group"
            onClick={() => navigate('/calibrate')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center group-hover:bg-accent-cyan/20 transition-colors">
                  <FlaskConical size={22} className="text-accent-cyan" />
                </div>
                <div>
                  <h3 className="font-medium mb-0.5">风格校准实验室</h3>
                  <p className="text-text-secondary text-sm">测试回复风格，提供反馈让系统更精准模仿你</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-text-ghost group-hover:text-accent-cyan group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>

          {/* Personality Overview */}
          <div className="grid md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-5 border border-white/5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain size={18} className="text-accent-cyan" />
                <h3 className="font-medium">人格核心</h3>
              </div>
              <div className="space-y-4">
                {traits.map((trait, i) => (
                  <motion.div
                    key={trait.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-secondary">{trait.label}</span>
                      <span className="text-text-primary font-medium">{trait.value}</span>
                    </div>
                    <div className="h-2 bg-surface rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${trait.value}%` }}
                        transition={{ delay: 0.4 + i * 0.08, type: 'spring', stiffness: 100 }}
                        className="h-full bg-gradient-to-r from-accent-cyan to-accent-magenta"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-5 border border-white/5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity size={18} className="text-accent-magenta" />
                <h3 className="font-medium">活跃度统计</h3>
              </div>
              <div className="space-y-3">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface/50 hover:bg-surface/80 transition-colors cursor-default group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-opacity-10 flex items-center justify-center ${stat.color.replace('text-', 'bg-')}`}>
                        <stat.icon size={16} className={stat.color} />
                      </div>
                      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{stat.label}</span>
                    </div>
                    <span className="font-display font-bold">{stat.value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
