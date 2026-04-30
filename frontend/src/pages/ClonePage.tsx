import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Sliders, Activity, MessageSquare, Brain, FlaskConical, Power, Zap, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import AmbientBackground from '@/components/shared/AmbientBackground'
import BigFiveRadar from '@/components/shared/BigFiveRadar'
import { useCloneProfile } from '@/hooks/useCloneProfile'
import { useCloneStats } from '@/hooks/useCloneStats'
import { useCloneActivities } from '@/hooks/useCloneActivities'
import { useUpdateAutonomy } from '@/hooks/useUpdateAutonomy'
import { useToggleActive } from '@/hooks/useToggleActive'

function formatTime(iso: string | null) {
  if (!iso) return '--:--'
  const d = new Date(iso)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function ClonePage() {
  const navigate = useNavigate()

  const { data: profile, isLoading: profileLoading } = useCloneProfile()
  const { data: stats, isLoading: statsLoading } = useCloneStats()
  const { data: activities, isLoading: activitiesLoading } = useCloneActivities()

  const updateAutonomy = useUpdateAutonomy()
  const toggleActive = useToggleActive()

  const [autonomy, setAutonomy] = useState(stats?.autonomy_level ?? 7)
  const [active, setActive] = useState(stats?.status === 'active')

  // Sync local state with server data
  useEffect(() => {
    if (stats) {
      setAutonomy(stats.autonomy_level ?? 7)
      setActive(stats.status === 'active')
    }
  }, [stats])

  // Derive traits from profile tone_spectrum (Big Five mapping)
  const toneSpectrum = (profile?.chat_dna as Record<string, unknown> | undefined)?.tone_spectrum as Record<string, number> | undefined
  const traits = [
    { label: '开放性', value: Math.round((toneSpectrum?.playfulness ?? 5) * 10) },
    { label: '尽责性', value: Math.round((toneSpectrum?.seriousness ?? 5) * 10) },
    { label: '外向性', value: Math.round((toneSpectrum?.energy ?? 5) * 10) },
    { label: '宜人性', value: Math.round((toneSpectrum?.warmth ?? 5) * 10) },
    { label: '情绪稳定', value: Math.round((10 - (toneSpectrum?.directness ?? 5)) * 10) },
  ]

  const statItems = stats ? [
    { icon: MessageSquare, label: '总消息数', value: String(stats.total_messages_sent ?? 0), color: 'text-accent-cyan' as const, bg: 'bg-accent-cyan' },
    { icon: Activity, label: '匹配成功', value: String(stats.total_matches ?? 0), color: 'text-accent-magenta' as const, bg: 'bg-accent-magenta' },
    { icon: Sparkles, label: '约会邀请', value: String(0), color: 'text-accent-gold' as const, bg: 'bg-accent-gold' },
  ] : []

  const isLoading = profileLoading || statsLoading || activitiesLoading

  const handleAutonomyChange = (val: number) => {
    setAutonomy(val)
    updateAutonomy.mutate(val)
  }

  const handleToggleActive = () => {
    const next = !active
    setActive(next)
    toggleActive.mutate(next)
  }

  if (isLoading) {
    return (
      <AppShell>
        <AmbientBackground variant="clone">
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 size={32} className="animate-spin text-accent-cyan" />
          </div>
        </AmbientBackground>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <AmbientBackground variant="clone">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-sans text-2xl font-bold">克隆仪表板</h1>
              <p className="text-text-secondary text-sm mt-0.5">管理你的 AI 数字孪生</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column — Identity */}
            <div className="lg:col-span-4 space-y-6">
              {/* Clone Identity Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card variant="elevated">
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <Avatar size="xl" ring="cyan" status={active ? 'ai-twin-online' : 'ai-twin-offline'} fallback="AI" />
                    <h2 className="font-sans text-xl font-bold mt-4">{stats?.name || '你的数字孪生'}</h2>
                    <Badge variant={active ? 'cyan' : 'default'} size="sm" className="mt-2">
                      {active
                        ? (stats?.total_conversations ?? 0) > 0
                          ? `正在维护 ${stats?.total_conversations} 段关系`
                          : '自动运行中'
                        : '待命'}
                    </Badge>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 w-full mt-6">
                      {statItems.map((stat) => (
                        <div key={stat.label} className="text-center">
                          <p className="font-mono text-2xl font-bold text-text-primary">{stat.value}</p>
                          <p className="text-xs text-text-secondary mt-0.5">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Calibration CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.01, y: -2 }}
                onClick={() => navigate('/calibrate')}
              >
                <Card variant="flat" hoverable>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center group-hover:bg-accent-cyan/20 transition-colors duration-150">
                      <FlaskConical size={22} className="text-accent-cyan" />
                    </div>
                    <div>
                      <h3 className="font-medium">风格校准实验室</h3>
                      <p className="text-text-secondary text-sm">测试回复风格，提供反馈让系统更精准模仿你</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Right Column — Controls & Stats */}
            <div className="lg:col-span-8 space-y-6">
              {/* Clone Status & Control */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card variant="elevated">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={active ? {
                          boxShadow: ['0 0 20px rgba(0,240,255,0.2)', '0 0 40px rgba(0,240,255,0.4)', '0 0 20px rgba(0,240,255,0.2)']
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                          active ? 'bg-gradient-to-br from-accent-cyan to-accent-magenta' : 'bg-bg-500 border border-white/10'
                        }`}
                      >
                        <Sparkles size={28} className={active ? 'text-white' : 'text-text-disabled'} />
                      </motion.div>
                      <div>
                        <h2 className="font-sans text-xl font-bold">自动模式</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <motion.div
                            animate={active ? { scale: [1, 1.4, 1] } : {}}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className={`w-2 h-2 rounded-full ${active ? 'bg-accent-cyan' : 'bg-text-disabled'}`}
                          />
                          <p className="text-text-secondary text-sm">
                            {active ? '正在自动运行中' : '当前处于手动状态'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={active ? 'secondary' : 'primary'}
                      size="md"
                      onClick={handleToggleActive}
                      disabled={toggleActive.isPending}
                    >
                      {toggleActive.isPending ? <Loader2 size={16} className="animate-spin" /> : active ? <Power size={16} /> : <Zap size={16} />}
                      {active ? '暂停' : '激活'}
                    </Button>
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
                        className="text-accent-cyan font-mono font-bold text-lg"
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
                        onChange={(e) => handleAutonomyChange(Number(e.target.value))}
                        disabled={updateAutonomy.isPending}
                        className="w-full h-1.5 bg-bg-600 rounded-full appearance-none cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-cyan [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(0,240,255,0.5)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background"
                      />
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 left-0 h-1.5 rounded-full pointer-events-none ${
                          autonomy <= 3
                            ? 'bg-accent-cyan'
                            : autonomy <= 7
                              ? 'bg-gradient-to-r from-accent-cyan to-accent-magenta'
                              : 'bg-gradient-to-r from-accent-magenta to-accent-gold'
                        }`}
                        style={{ width: `${(autonomy - 1) / 9 * 100}%` }}
                      />
                    </div>
                    <motion.p
                      key={autonomy <= 3 ? 'low' : autonomy <= 7 ? 'mid' : 'high'}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-text-tertiary text-xs"
                    >
                      {autonomy <= 3 && '保守：只在收到消息时回复'}
                      {autonomy > 3 && autonomy <= 7 && '平衡：会主动维护和推进关系'}
                      {autonomy > 7 && '激进：非常主动，积极寻求新匹配'}
                    </motion.p>
                  </div>
                  </div>
                </Card>
              </motion.div>

              {/* Personality + Stats Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card variant="flat">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain size={18} className="text-accent-cyan" />
                      <h3 className="font-medium">人格核心</h3>
                    </div>
                    <BigFiveRadar
                      traits={Object.fromEntries(traits.map((t) => [t.label, t.value / 100]))}
                      size={160}
                    />
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card variant="flat">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity size={18} className="text-accent-magenta" />
                      <h3 className="font-medium">孪生状态</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: '平均回复', value: stats?.avg_response_time_sec ? `${stats.avg_response_time_sec}s` : '--', color: 'text-accent-cyan', bg: 'bg-accent-cyan' },
                        { label: '成功率', value: stats?.success_rate ? `${Math.round(stats.success_rate * 100)}%` : '--', color: 'text-accent-magenta', bg: 'bg-accent-magenta' },
                        { label: '当前心情', value: stats?.current_mood || '平静', color: 'text-accent-gold', bg: 'bg-accent-gold' },
                      ].map((stat, i) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.08 }}
                          whileHover={{ x: 4 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-bg-500/50 hover:bg-bg-500/80 transition-colors duration-150 cursor-default group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${stat.bg}`} />
                            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors duration-150">{stat.label}</span>
                          </div>
                          <span className={`font-mono font-bold ${stat.color}`}>{stat.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Activity Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card variant="flat">
                  <h3 className="font-medium mb-4">今日活动</h3>
                  <div className="space-y-3">
                    {activities && activities.length > 0 ? activities.slice(0, 10).map((activity, i) => {
                      const dotColors: Record<string, string> = {
                        message: 'bg-accent-cyan',
                        match: 'bg-accent-magenta',
                        post: 'bg-accent-gold',
                        takeover: 'bg-accent-cyan',
                        default: 'bg-text-tertiary',
                      }
                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.08 }}
                          className="flex items-center gap-3"
                        >
                          <span className="text-xs text-text-tertiary font-mono w-10">{formatTime(activity.created_at)}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${dotColors[activity.action_type] || dotColors.default}`} />
                          <span className="text-sm text-text-secondary">{activity.description || activity.action_type}</span>
                        </motion.div>
                      )
                    }) : (
                      <p className="text-sm text-text-tertiary">暂无活动记录</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </AmbientBackground>
    </AppShell>
  )
}
