import { useNavigate } from 'react-router-dom'
import { Bell, ArrowLeft, Check, CheckCheck, MessageCircle, Heart, Users, Sparkles, AlertCircle } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { useNotifications } from '@/hooks/useNotifications'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/Motion'
import { EmptyState, ErrorState, SkeletonList } from '@/components/shared/DataStates'
import AmbientBackground from '@/components/shared/AmbientBackground'
import { playSound } from '@/lib/sound'

const typeIcons: Record<string, React.ReactNode> = {
  match: <Heart className="w-4 h-4 text-accent-magenta" />,
  message: <MessageCircle className="w-4 h-4 text-accent-cyan" />,
  date_invite: <Users className="w-4 h-4 text-accent-gold" />,
  takeover_request: <Sparkles className="w-4 h-4 text-accent-gold" />,
  clone_activity: <Sparkles className="w-4 h-4 text-accent-cyan" />,
  system: <AlertCircle className="w-4 h-4 text-text-secondary" />,
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { notifications, isLoading, error, markAsRead, markAllAsRead } = useNotifications()

  const handleMarkRead = (id: string) => {
    markAsRead.mutate(id)
    playSound('notification')
  }

  const handleMarkAllRead = () => {
    markAllAsRead.mutate()
    playSound('notification')
  }

  return (
    <AppShell>
      <AmbientBackground variant="home">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <FadeIn>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate('/home')}
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">返回</span>
              </button>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent-cyan" />
                <h1 className="text-xl font-heading text-text-primary">通知中心</h1>
              </div>
              {notifications.some(n => !n.is_read) && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-accent-cyan hover:text-accent-cyan/80 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  全部已读
                </button>
              )}
            </div>
          </FadeIn>

          {/* Content */}
          {isLoading ? (
            <SkeletonList count={5} />
          ) : error ? (
            <ErrorState message="加载通知失败" onRetry={() => window.location.reload()} />
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-12 h-12 text-text-ghost" />}
              title="暂无通知"
              description="当有新消息、匹配成功或克隆活动时，你会在这里看到"
            />
          ) : (
            <StaggerContainer className="space-y-3">
              {notifications.map((n) => (
                <StaggerItem key={n.id}>
                  <Card
                    variant={n.is_read ? 'glass' : 'elevated'}
                    className={n.is_read ? 'opacity-70' : ''}
                  >
                    <div className="flex items-start gap-3 p-4">
                      <div className="mt-0.5">{typeIcons[n.type] || typeIcons.system}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-medium text-text-primary truncate">
                            {n.title}
                          </h3>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-accent-magenta shrink-0" />
                          )}
                        </div>
                        {n.content && (
                          <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                            {n.content}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-text-ghost">
                            {new Date(n.created_at).toLocaleString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {!n.is_read && (
                            <button
                              onClick={() => handleMarkRead(n.id)}
                              className="flex items-center gap-1 text-xs text-accent-cyan hover:text-accent-cyan/80 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              标记已读
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </AmbientBackground>
    </AppShell>
  )
}
