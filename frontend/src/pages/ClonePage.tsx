import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Sliders, Activity, MessageSquare, Brain, FlaskConical, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'

export default function ClonePage() {
  const navigate = useNavigate()
  const [autonomy, setAutonomy] = useState(7)
  const [active, setActive] = useState(false)

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <h1 className="font-display text-2xl font-bold mb-6">自动管理</h1>

        {/* Clone Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-elevated rounded-3xl p-6 md:p-8 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                active ? 'bg-gradient-to-br from-accent-cyan to-accent-magenta glow-cyan' : 'bg-surface'
              }`}>
                <Sparkles size={28} className={active ? 'text-white' : 'text-text-ghost'} />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">自动模式</h2>
                <p className="text-text-secondary text-sm">
                  {active ? '正在自动运行中' : '当前处于手动状态'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActive(!active)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                active
                  ? 'bg-accent-magenta/20 text-accent-magenta border border-accent-magenta/30'
                  : 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
              }`}
            >
              {active ? '暂停' : '激活'}
            </button>
          </div>

          {/* Autonomy Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-text-secondary" />
                <span className="text-sm font-medium">自主等级</span>
              </div>
              <span className="text-accent-cyan font-display font-bold">{autonomy}/10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={autonomy}
              onChange={(e) => setAutonomy(Number(e.target.value))}
              className="w-full h-2 bg-surface rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-cyan"
            />
            <p className="text-text-ghost text-xs">
              {autonomy <= 3 && '保守：只在收到消息时回复'}
              {autonomy > 3 && autonomy <= 7 && '平衡：会主动维护和推进关系'}
              {autonomy > 7 && '激进：非常主动，积极寻求新匹配'}
            </p>
          </div>
        </motion.div>

        {/* Calibration CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5 mb-6 border border-accent-cyan/20 cursor-pointer hover:border-accent-cyan/40 transition-colors"
          onClick={() => navigate('/calibrate')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
                <FlaskConical size={22} className="text-accent-cyan" />
              </div>
              <div>
                <h3 className="font-medium mb-0.5">风格校准实验室</h3>
                <p className="text-text-secondary text-sm">测试回复风格，提供反馈让 AI 更精准模仿你</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-text-ghost" />
          </div>
        </motion.div>

        {/* Personality Overview */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={18} className="text-accent-cyan" />
              <h3 className="font-medium">人格核心</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: '开放性', value: 85 },
                { label: '尽责性', value: 70 },
                { label: '外向性', value: 60 },
                { label: '宜人性', value: 90 },
                { label: '情绪稳定', value: 65 },
              ].map((trait) => (
                <div key={trait.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary">{trait.label}</span>
                    <span className="text-text-primary">{trait.value}</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${trait.value}%` }}
                      className="h-full bg-gradient-to-r from-accent-cyan to-accent-magenta"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-accent-magenta" />
              <h3 className="font-medium">活跃度统计</h3>
            </div>
            <div className="space-y-4">
              {[
                { icon: MessageSquare, label: '总消息数', value: '156', color: 'text-accent-cyan' },
                { icon: Activity, label: '匹配成功', value: '12', color: 'text-accent-magenta' },
                { icon: Sparkles, label: '约会邀请', value: '2', color: 'text-accent-gold' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between p-3 rounded-xl bg-surface/50">
                  <div className="flex items-center gap-3">
                    <stat.icon size={16} className={stat.color} />
                    <span className="text-sm text-text-secondary">{stat.label}</span>
                  </div>
                  <span className="font-display font-bold">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
