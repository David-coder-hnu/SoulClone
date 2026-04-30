import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Settings, Edit3, LogOut, ChevronRight,
  MessageCircle, Heart, FileText,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/stores/authStore'
import { useUserProfile } from '@/hooks/useUserProfile'
import { FadeIn, StaggerContainer, StaggerItem, CountUp } from '@/components/shared/Motion'
import { ErrorState } from '@/components/shared/DataStates'
import AmbientBackground from '@/components/shared/AmbientBackground'

// Simple Big Five radar chart — One More Thing
function BigFiveRadar({ traits }: { traits: Record<string, number> }) {
  const keys = Object.keys(traits)
  if (keys.length === 0) return null

  const size = 180
  const center = size / 2
  const radius = 70
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
        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map((s) => (
          <circle
            key={s}
            cx={center}
            cy={center}
            r={radius * s}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        ))}
        {/* Axes */}
        {keys.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2
          const x2 = center + radius * Math.cos(angle)
          const y2 = center + radius * Math.sin(angle)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          )
        })}
        {/* Data polygon */}
        <motion.polygon
          points={polyPoints}
          fill="rgba(0,240,255,0.15)"
          stroke="rgba(0,240,255,0.5)"
          strokeWidth={2}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
        {/* Labels */}
        {keys.map((key, i) => {
          const angle = i * angleStep - Math.PI / 2
          const x = center + (radius + 18) * Math.cos(angle)
          const y = center + (radius + 18) * Math.sin(angle)
          return (
            <text
              key={key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-text-tertiary text-[9px]"
            >
              {key.slice(0, 2)}
            </text>
          )
        })}
      </svg>
      <p className="text-xs text-text-tertiary mt-2">人格雷达</p>
    </div>
  )
}

export default function ProfilePage() {
  const { user: authUser, logout } = useAuthStore()
  const { data: profile, error } = useUserProfile()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  if (error) {
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

  // Mock Big Five for demo — in production this comes from clone profile
  const bigFive = profile?.big_five || {
    开放性: 0.72,
    尽责性: 0.65,
    外向性: 0.58,
    宜人性: 0.80,
    神经质: 0.45,
  }

  const menuItems = [
    { icon: Edit3, label: '编辑资料', to: '/profile/edit' },
    { icon: MessageCircle, label: '我的对话', to: '/chat' },
    { icon: Heart, label: '我的匹配', to: '/matches' },
    { icon: FileText, label: '我的动态', to: '/feed/me' },
    { icon: Settings, label: '设置', to: '/settings' },
  ]

  return (
    <AppShell>
      <AmbientBackground variant="profile">
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
          {/* Profile Header */}
          <FadeIn>
            <Card variant="elevated" className="mb-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.nickname || '用户'}
                      className="w-24 h-24 rounded-full object-cover border-2 border-white/10"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-cyan/30 to-accent-magenta/30 border-2 border-white/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {(user?.nickname || '用')[0]}
                      </span>
                    </div>
                  )}
                  {user?.is_online && (
                    <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-accent-cyan border-2 border-background" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="font-sans text-xl font-bold">
                    {user?.nickname || '未设置昵称'}
                  </h1>
                  <p className="text-sm text-text-secondary mt-1">
                    {user?.bio || '暂无个性签名'}
                  </p>
                  <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-xs text-text-tertiary">
                    <span>{user?.location_city || '未知城市'}</span>
                    <span>{user?.gender === 'male' ? '男' : user?.gender === 'female' ? '女' : '未知性别'}</span>
                  </div>
                </div>

                {/* Big Five Radar — One More Thing */}
                <BigFiveRadar traits={bigFive} />
              </div>
            </Card>
          </FadeIn>

          {/* Stats */}
          <FadeIn delay={0.05}>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: '对话', value: 0 },
                { label: '匹配', value: 0 },
                { label: '动态', value: 0 },
              ].map((stat) => (
                <Card key={stat.label} variant="flat" className="text-center py-4">
                  <p className="font-mono text-xl font-bold text-text-primary">
                    <CountUp target={stat.value} />
                  </p>
                  <p className="text-xs text-text-secondary mt-1">{stat.label}</p>
                </Card>
              ))}
            </div>
          </FadeIn>

          {/* Menu */}
          <FadeIn delay={0.1}>
            <Card variant="flat" className="mb-6">
              <StaggerContainer className="divide-y divide-white/[0.04]">
                {menuItems.map((item) => (
                  <StaggerItem key={item.label}>
                    <Link
                      to={item.to}
                      className="flex items-center gap-3 py-3.5 px-1 hover:text-accent-cyan transition-colors group"
                    >
                      <item.icon size={18} className="text-text-tertiary group-hover:text-accent-cyan transition-colors" />
                      <span className="text-sm flex-1">{item.label}</span>
                      <ChevronRight size={16} className="text-text-ghost" />
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </Card>
          </FadeIn>

          {/* Logout */}
          <FadeIn delay={0.15}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-bg-600 border border-white/[0.08] text-text-secondary text-sm hover:text-accent-magenta hover:border-accent-magenta/20 transition-colors"
            >
              <LogOut size={16} />
              退出登录
            </motion.button>
          </FadeIn>
        </div>
      </AmbientBackground>
    </AppShell>
  )
}
