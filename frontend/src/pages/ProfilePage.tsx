import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Settings, Edit3, ChevronRight,
  MessageCircle, Heart, FileText, Activity,
  Zap, Brain, Clock, Users,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/stores/authStore'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useCloneStats } from '@/hooks/useCloneStats'
import { useCloneActivities } from '@/hooks/useCloneActivities'
import { FadeIn, StaggerContainer, StaggerItem, CountUp, GlowPulse } from '@/components/shared/Motion'
import { ErrorState } from '@/components/shared/DataStates'
import AmbientBackground from '@/components/shared/AmbientBackground'

// ─── Big Five Radar Chart ───
function BigFiveRadar({ traits }: { traits: Record<string, number> }) {
  const keys = Object.keys(traits)
  if (keys.length === 0) return null

  const size = 200
  const center = size / 2
  const radius = 75
  const angleStep = (Math.PI * 2) / keys.length

  const points = keys.map((key, i) => {
    const angle = i * angleStep - Math.PI / 2
    const r = radius * (traits[key] || 0.5)
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)]
  })

  const polyPoints = points.map((p) => p.join(',')).join(' ')

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {[0.25, 0.5, 0.75, 1].map((s) => (
          <circle key={s} cx={center} cy={center} r={radius * s} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}
        {keys.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2
          const x2 = center + radius * Math.cos(angle)
          const y2 = center + radius * Math.sin(angle)
          return <line key={i} x1={center} y1={center} x2={x2} y2={y2} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        })}
        <motion.polygon
          points={polyPoints}
          fill="url(#radarGradient)"
          stroke="rgba(0,240,255,0.6)"
          strokeWidth={1.5}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,240,255,0.2)" />
            <stop offset="100%" stopColor="rgba(255,0,110,0.15)" />
          </linearGradient>
        </defs>
        {keys.map((key, i) => {
          const angle = i * angleStep - Math.PI / 2
          const x = center + (radius + 22) * Math.cos(angle)
          const y = center + (radius + 22) * Math.sin(angle)
          return (
            <text key={key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-text-tertiary" style={{ fontSize: 10 }}>
              {key}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Trait Tag Cloud ───
function TraitCloud({ traits }: { traits: Record<string, number> }) {
  const entries = Object.entries(traits).sort((a, b) => b[1] - a[1])
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, val], i) => {
        const intensity = Math.round(val * 100)
        const colors = [
          'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan',
          'bg-accent-magenta/10 border-accent-magenta/20 text-accent-magenta',
          'bg-accent-gold/10 border-accent-gold/20 text-accent-gold',
        ]
        const colorClass = colors[i % 3]
        return (
          <motion.span
            key={key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className={`px-3 py-1 rounded-full border text-xs font-medium ${colorClass}`}
          >
            {key} · {intensity}%
          </motion.span>
        )
      })}
    </div>
  )
}

// ─── Timeline Item ───
function TimelineItem({ activity, index }: { activity: any; index: number }) {
  const colors: Record<string, string> = {
    message: 'text-accent-cyan',
    match: 'text-accent-magenta',
    post: 'text-accent-gold',
    takeover: 'text-accent-cyan',
    default: 'text-text-tertiary',
  }
  const color = colors[activity.action_type] || colors.default

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.05 }}
      className="flex items-start gap-3 py-2.5"
    >
      <div className="relative mt-0.5">
        <div className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')}`} />
        {index < 4 && <div className="absolute top-3 left-[3px] w-px h-full bg-white/[0.04]" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-secondary truncate">{activity.description || activity.action_type}</p>
        <p className="text-[10px] text-text-tertiary mt-0.5">
          {new Date(activity.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  )
}

export default function ProfilePage() {
  const { user: authUser, logout } = useAuthStore()
  const { data: profile, error: profileError } = useUserProfile()
  const { data: stats, isLoading: statsLoading } = useCloneStats()
  const { data: activities, isLoading: actLoading } = useCloneActivities()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  if (profileError) {
    return (
      <AppShell>
        <AmbientBackground variant="profile">
          <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <ErrorState message="加载资料失败" onRetry={() => window.location.reload()} />
          </div>
        </AmbientBackground>
      </AppShell>
    )
  }

  const user = profile || authUser
  const isLoading = statsLoading || actLoading

  // Big Five from clone profile or fallback
  const bigFive = profile?.big_five || {
    开放性: 0.72, 尽责性: 0.65, 外向性: 0.58, 宜人性: 0.80, 神经质: 0.45,
  }

  // Twin stats derived from clone stats
  const twinStats = stats ? [
    { icon: Clock, label: '孪生在线', value: `${Math.round((stats.total_messages_sent || 0) * 0.8)}h`, color: 'text-accent-cyan', bg: 'bg-accent-cyan' },
    { icon: MessageCircle, label: '替你回复', value: stats.total_messages_sent || 0, color: 'text-accent-magenta', bg: 'bg-accent-magenta' },
    { icon: Users, label: '维持关系', value: stats.total_conversations || 0, color: 'text-accent-gold', bg: 'bg-accent-gold' },
    { icon: Zap, label: '自主等级', value: `${stats.autonomy_level || 7}/10`, color: 'text-accent-cyan', bg: 'bg-accent-cyan' },
  ] : []

  const menuItems = [
    { icon: Edit3, label: '编辑资料', to: '/profile/edit', desc: '昵称、头像、简介' },
    { icon: MessageCircle, label: '我的对话', to: '/chat', desc: `${stats?.total_conversations || 0} 个活跃对话` },
    { icon: Heart, label: '我的匹配', to: '/matches', desc: `${stats?.total_matches || 0} 个匹配` },
    { icon: FileText, label: '我的动态', to: '/feed/me', desc: '查看发布的历史' },
    { icon: Settings, label: '设置', to: '/settings', desc: '通知、隐私、声音' },
  ]

  return (
    <AppShell>
      <AmbientBackground variant="profile">
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
          {/* ─── Hero: User + Twin Status ─── */}
          <FadeIn>
            <Card variant="elevated" className="mb-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar with intimacy glow */}
                <div className="relative shrink-0">
                  <GlowPulse color="cyan">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-cyan/20 to-accent-magenta/20 border border-white/[0.08] flex items-center justify-center overflow-hidden">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-white">{(user?.nickname || '用')[0]}</span>
                      )}
                    </div>
                  </GlowPulse>
                  {stats?.status === 'active' && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 text-[10px] text-accent-cyan font-medium">
                      孪生在线
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left min-w-0">
                  <h1 className="font-sans text-xl font-bold">{user?.nickname || '未设置昵称'}</h1>
                  <p className="text-sm text-text-secondary mt-1">{user?.bio || '暂无个性签名'}</p>
                  <div className="flex items-center justify-center md:justify-start gap-3 mt-3 text-xs text-text-tertiary">
                    <span>{user?.location_city || '未知城市'}</span>
                    <span className="w-px h-3 bg-white/10" />
                    <span>{user?.gender === 'male' ? '他' : user?.gender === 'female' ? '她' : 'TA'}</span>
                  </div>
                </div>

                {/* Big Five Radar */}
                <BigFiveRadar traits={bigFive} />
              </div>
            </Card>
          </FadeIn>

          {/* ─── Twin Stats ─── */}
          <FadeIn delay={0.05}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} variant="flat" className="h-24 animate-pulse" />
                ))
              ) : (
                twinStats.map((stat) => (
                  <Card key={stat.label} variant="flat" className="text-center py-4">
                    <div className={`w-8 h-8 rounded-lg ${stat.bg}/10 flex items-center justify-center mx-auto mb-2`}>
                      <stat.icon size={16} className={stat.color} />
                    </div>
                    <p className="font-mono text-lg font-bold text-text-primary">
                      {typeof stat.value === 'number' ? <CountUp target={stat.value} /> : stat.value}
                    </p>
                    <p className="text-[10px] text-text-secondary mt-0.5">{stat.label}</p>
                  </Card>
                ))
              )}
            </div>
          </FadeIn>

          {/* ─── Twin Profile + Trait Cloud ─── */}
          <FadeIn delay={0.1}>
            <Card variant="flat" className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={16} className="text-accent-cyan" />
                <h3 className="text-sm font-medium">人格核心</h3>
              </div>
              <TraitCloud traits={bigFive} />
            </Card>
          </FadeIn>

          {/* ─── Recent Twin Activity ─── */}
          <FadeIn delay={0.15}>
            <Card variant="flat" className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-accent-magenta" />
                  <h3 className="text-sm font-medium">孪生最近动态</h3>
                </div>
                <Link to="/clone" className="text-[10px] text-accent-cyan hover:underline">查看全部</Link>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-1">
                  {activities.slice(0, 5).map((activity, i) => (
                    <TimelineItem key={activity.id} activity={activity} index={i} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-tertiary py-4 text-center">暂无活动记录</p>
              )}
            </Card>
          </FadeIn>

          {/* ─── Menu ─── */}
          <FadeIn delay={0.2}>
            <Card variant="flat" className="mb-6">
              <StaggerContainer className="divide-y divide-white/[0.04]">
                {menuItems.map((item) => (
                  <StaggerItem key={item.label}>
                    <Link to={item.to} className="flex items-center gap-3 py-3.5 px-1 hover:text-accent-cyan transition-colors group">
                      <item.icon size={18} className="text-text-tertiary group-hover:text-accent-cyan transition-colors" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm">{item.label}</span>
                        <p className="text-[10px] text-text-tertiary">{item.desc}</p>
                      </div>
                      <ChevronRight size={16} className="text-text-ghost shrink-0" />
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </Card>
          </FadeIn>

          {/* ─── Logout: minimized ─── */}
          <FadeIn delay={0.25}>
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                className="text-xs text-text-ghost hover:text-accent-magenta transition-colors py-2"
              >
                退出登录
              </button>
            </div>
          </FadeIn>
        </div>
      </AmbientBackground>
    </AppShell>
  )
}
