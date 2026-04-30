import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MessageSquare, ChevronRight,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { useConversations } from '@/hooks/useConversations'
import { FadeIn, StaggerContainer, StaggerItem, GlowPulse } from '@/components/shared/Motion'
import { ChatEmptyState, ErrorState, SkeletonList } from '@/components/shared/DataStates'
import AmbientBackground from '@/components/shared/AmbientBackground'
import TwinConsciousness from '@/components/shared/TwinConsciousness'

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${Math.floor(diff / 86400)}天前`
}

export default function ChatPage() {
  const { data: conversations, isLoading, error } = useConversations()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filtered = conversations
    ? filter === 'unread'
      ? conversations.filter((c) => c.unread > 0)
      : conversations
    : []

  if (error) {
    return (
      <AppShell>
        <AmbientBackground variant="chat">
          <div className="p-4 md:p-8 max-w-3xl mx-auto">
            <ErrorState message="加载对话失败" onRetry={() => window.location.reload()} />
          </div>
        </AmbientBackground>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <AmbientBackground variant="chat">
        <div className="p-4 md:p-8 flex gap-6 justify-center">
          <div className="w-full max-w-3xl">
            {/* Header */}
            <FadeIn>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-sans text-2xl font-bold">消息</h1>
                <div className="flex gap-2">
                  {(['all', 'unread'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        filter === f
                          ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
                          : 'bg-bg-600 border-white/[0.08] text-text-secondary hover:border-white/15'
                      }`}
                    >
                      {f === 'all' ? '全部' : '未读'}
                    </button>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Conversation List */}
            {isLoading ? (
              <SkeletonList count={4} />
            ) : filtered.length === 0 ? (
              <ChatEmptyState onAction={() => { window.location.href = '/discover' }} />
            ) : (
              <StaggerContainer className="space-y-3">
                {filtered.map((conv) => {
                  const isHighIntimacy = conv.intimacy >= 70
                  return (
                    <StaggerItem key={conv.id}>
                      <Link to={`/chat/${conv.id}`}>
                        <Card
                          variant="flat"
                          hoverable
                          className="flex items-center gap-4 py-4 px-5 relative overflow-hidden"
                        >
                          {/* High intimacy glow — One More Thing */}
                          {isHighIntimacy && (
                            <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-accent-cyan via-accent-magenta to-accent-gold opacity-80 shadow-[0_0_8px_rgba(0,240,255,0.3)]" />
                          )}

                          {/* Avatar with intimacy ring */}
                          <div className="relative shrink-0">
                            <svg className="absolute -inset-1 w-14 h-14" viewBox="0 0 56 56">
                              <circle
                                cx="28" cy="28" r="26"
                                fill="none"
                                stroke="rgba(255,255,255,0.06)"
                                strokeWidth={2}
                              />
                              <circle
                                cx="28" cy="28" r="26"
                                fill="none"
                                stroke={conv.intimacy >= 70 ? '#ffbe0b' : conv.intimacy >= 40 ? '#00f0ff' : '#ff006e'}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeDasharray={`${conv.intimacy * 1.63} 163`}
                                transform="rotate(-90 28 28)"
                                style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
                              />
                            </svg>
                            {conv.partner.avatar ? (
                              <img
                                src={conv.partner.avatar}
                                alt={conv.partner.nickname}
                                className="w-12 h-12 rounded-full object-cover border border-white/10 relative z-10"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-bg-600 border border-white/10 flex items-center justify-center relative z-10">
                                <MessageSquare size={18} className="text-text-tertiary" />
                              </div>
                            )}
                            {conv.partner.is_online && (
                              <GlowPulse color="cyan">
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent-cyan border-2 border-background z-20" />
                              </GlowPulse>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-medium text-sm truncate">
                                {conv.partner.nickname}
                              </span>
                              <span className="text-xs text-text-tertiary shrink-0 ml-2">
                                {timeAgo(conv.last_message_time)}
                              </span>
                            </div>
                            <p className={`text-sm truncate ${conv.unread > 0 ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                              {conv.last_message || <span className="text-text-ghost italic">暂无消息</span>}
                            </p>
                          </div>

                          {/* Unread + Chevron */}
                          <div className="flex items-center gap-2 shrink-0">
                            {conv.unread > 0 && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                className="px-2 py-0.5 rounded-full bg-accent-magenta text-white text-xs font-bold"
                              >
                                {conv.unread}
                              </motion.span>
                            )}
                            <ChevronRight size={16} className="text-text-ghost" />
                          </div>
                        </Card>
                      </Link>
                    </StaggerItem>
                  )
                })}
              </StaggerContainer>
            )}
          </div>

          {/* AI Twin consciousness stream — One More Thing */}
          {!isLoading && conversations && <TwinConsciousness conversations={conversations} />}
        </div>
      </AmbientBackground>
    </AppShell>
  )
}
