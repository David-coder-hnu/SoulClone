import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  MessageCircle, Heart, Users, Activity,
  ChevronRight, Sparkles, Bell
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/stores/authStore'
import { useCloneStats } from '@/hooks/useCloneStats'
import { useCloneActivities } from '@/hooks/useCloneActivities'
import { useNotifications } from '@/hooks/useNotifications'
import { FadeIn, StaggerContainer, StaggerItem, CountUp, GlowPulse } from '@/components/shared/Motion'
import { SkeletonList, ErrorState } from '@/components/shared/DataStates'
import AmbientBackground from '@/components/shared/AmbientBackground'
import { playSound } from '@/lib/sound'

export default function HomePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading, error: statsError } = useCloneStats()
  const { data: activities, isLoading: actLoading, error: actError } = useCloneActivities()
  const { unreadCount: notifUnreadCount } = useNotifications()

  const [onlineActive, setOnlineActive] = useState(stats?.status === 'active')
  const unreadCount = notifUnreadCount || 0

  // Stats with real data fallback
  const statItems = stats ? [
    { icon: MessageCircle, label: '今日消息', value: stats.total_messages_sent || 0, color: 'text-accent-cyan', bg: 'bg-accent-cyan' },
    { icon: Heart, label: '新匹配', value: stats.total_matches || 0, color: 'text-accent-magenta', bg: 'bg-accent-magenta' },
    { icon: Users, label: '深入聊天', value: stats.total_conversations || 0, color: 'text-accent-gold', bg: 'bg-accent-gold' },
    { icon: Activity, label: '社区互动', value: (stats.total_posts || 0) + (stats.total_comments || 0), color: 'text-accent-cyan', bg: 'bg-accent-cyan' },
  ] : []

  const isLoading = statsLoading || actLoading

  if (statsError || actError) {
    return (
      <AppShell>
        <AmbientBackground variant="home">
          <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <ErrorState message="加载失败，请重试" onRetry={() => window.location.reload()} />
          </div>
        </AmbientBackground>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <AmbientBackground variant="home">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <FadeIn>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-sans text-2xl md:text-3xl font-bold">
                  你好, <span className="text-accent-cyan">{user?.nickname || '探索者'}</span>
                </h1>
                <p className="text-text-secondary mt-1">
                  {stats?.status === 'active'
                    ? '你的在线状态正在自动运行'
                    : '你的在线状态当前离线'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Notification Bell with bounce */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2.5 rounded-xl bg-bg-600 border border-white/[0.08] hover:border-white/15 transition-colors"
                  onClick={() => navigate('/notifications')}
                >
                  <Bell size={20} className="text-text-secondary" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-magenta"
                    />
                  )}
                </motion.button>

                {/* Online Toggle */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all ${
                    onlineActive
                      ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
                      : 'bg-bg-600 border-white/[0.08] text-text-secondary'
                  }`}
                  onClick={() => {
                    setOnlineActive(!onlineActive)
                    if (!onlineActive) playSound('toggle-on')
                  }}
                >
                  <motion.div
                    animate={onlineActive ? { scale: [1, 1.4, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`w-2 h-2 rounded-full ${onlineActive ? 'bg-accent-cyan' : 'bg-text-ghost'}`}
                  />
                  <span className="text-sm">{onlineActive ? '在线中' : '离线中'}</span>
                </motion.button>
              </div>
            </div>
          </FadeIn>

          {/* Online Status Card — elevated + conic glow when active */}
          <FadeIn delay={0.05}>
            <div className={onlineActive ? 'conic-glow' : ''}>
              <Card variant="elevated" className="mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <GlowPulse color="cyan">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                        onlineActive
                          ? 'bg-gradient-to-br from-accent-cyan to-accent-magenta'
                          : 'bg-bg-600 border border-white/10'
                      }`}>
                        <Sparkles size={24} className={onlineActive ? 'text-white' : 'text-text-disabled'} />
                      </div>
                    </GlowPulse>
                    <div>
                      <h2 className="font-sans text-xl font-bold">自动模式</h2>
                      <p className="text-text-secondary text-sm">
                        {onlineActive ? '正在替你社交、匹配、维系关系' : '离线中，你的孪生不会主动行动'}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/clone"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
                  >
                    管理孪生
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </Card>
            </div>
          </FadeIn>

          {/* Stats Grid */}
          {isLoading ? (
            <SkeletonList count={4} />
          ) : (
            <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statItems.map((stat) => (
                <StaggerItem key={stat.label}>
                  <Card variant="flat" hoverable className="text-center">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg}/10 flex items-center justify-center mx-auto mb-3`}>
                      <stat.icon size={18} className={stat.color} />
                    </div>
                    <p className="font-mono text-2xl font-bold text-text-primary">
                      <CountUp target={stat.value} />
                    </p>
                    <p className="text-xs text-text-secondary mt-1">{stat.label}</p>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {/* Activities */}
          <FadeIn delay={0.2}>
            <Card variant="flat">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">最近动态</h3>
                <Link to="/clone" className="text-xs text-accent-cyan hover:underline">查看全部</Link>
              </div>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity, i) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-bg-600/50 hover:bg-bg-600 transition-colors"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan/60" />
                      <span className="text-sm text-text-secondary flex-1">{activity.description || activity.action_type}</span>
                      <span className="text-xs text-text-tertiary font-mono">
                        {new Date(activity.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity size={24} className="text-text-ghost mx-auto mb-2" />
                  <p className="text-sm text-text-tertiary">暂无活动记录</p>
                  <p className="text-xs text-text-ghost mt-1">你的孪生还在熟悉这个世界</p>
                </div>
              )}
            </Card>
          </FadeIn>
        </div>
      </AmbientBackground>
    </AppShell>
  )
}
