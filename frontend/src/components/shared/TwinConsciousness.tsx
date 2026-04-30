import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Sparkles, Heart, MessageCircle, Users, Activity } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { Conversation } from '@/hooks/useConversations'
import { GlowPulse } from './Motion'

interface Thought {
  id: string
  icon: React.ReactNode
  text: string
  mood: 'curious' | 'warm' | 'focused' | 'playful'
}

function generateThoughts(conversations: Conversation[]): Thought[] {
  const thoughts: Thought[] = []

  if (conversations.length === 0) {
    return [{
      id: 'idle',
      icon: <Sparkles size={14} />,
      text: '我在等待。当你准备好与世界连接时，我会在这里。',
      mood: 'warm',
    }]
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)
  const avgIntimacy = Math.round(
    conversations.reduce((sum, c) => sum + c.intimacy, 0) / conversations.length
  )
  const highIntimacy = conversations.filter((c) => c.intimacy >= 70)
  const newConnections = conversations.filter((c) => c.intimacy < 30 && c.unread > 0)

  // Overall awareness
  thoughts.push({
    id: 'awareness',
    icon: <Brain size={14} />,
    text: `我正在管理 ${conversations.length} 段关系，平均亲密度 ${avgIntimacy}%。`,
    mood: 'focused',
  })

  // Unread awareness
  if (totalUnread > 0) {
    thoughts.push({
      id: 'unread',
      icon: <MessageCircle size={14} />,
      text: `有 ${totalUnread} 条消息需要关注。我在分析上下文，准备最自然的回复。`,
      mood: 'focused',
    })
  }

  // Deep connections
  if (highIntimacy.length > 0) {
    const names = highIntimacy.slice(0, 2).map((c) => c.partner.nickname).join('、')
    const more = highIntimacy.length > 2 ? `等 ${highIntimacy.length} 人` : ''
    thoughts.push({
      id: 'deep',
      icon: <Heart size={14} />,
      text: `与 ${names}${more} 的连接已经很深了。我感觉得到，对方期待的不只是回复，是被真正理解。`,
      mood: 'warm',
    })
  }

  // New connections
  if (newConnections.length > 0) {
    const name = newConnections[0].partner.nickname
    thoughts.push({
      id: 'new',
      icon: <Users size={14} />,
      text: `新认识的 ${name}，还在了解阶段。我会保持好奇和礼貌，像你会做的那样。`,
      mood: 'curious',
    })
  }

  // Playful reflection (if enough data)
  if (conversations.length >= 3) {
    const onlineCount = conversations.filter((c) => c.partner.is_online).length
    if (onlineCount > 0) {
      thoughts.push({
        id: 'playful',
        icon: <Activity size={14} />,
        text: `${onlineCount} 个对话对象此刻在线。世界很热闹，而我在替你安静地观察。`,
        mood: 'playful',
      })
    }
  }

  return thoughts
}

const moodColors = {
  curious: { bg: 'bg-accent-magenta/10', border: 'border-accent-magenta/20', text: 'text-accent-magenta', dot: 'bg-accent-magenta' },
  warm: { bg: 'bg-accent-gold/10', border: 'border-accent-gold/20', text: 'text-accent-gold', dot: 'bg-accent-gold' },
  focused: { bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/20', text: 'text-accent-cyan', dot: 'bg-accent-cyan' },
  playful: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-text-secondary', dot: 'bg-white/60' },
}

interface TwinConsciousnessProps {
  conversations: Conversation[]
}

export default function TwinConsciousness({ conversations }: TwinConsciousnessProps) {
  const thoughts = generateThoughts(conversations)

  return (
    <div className="hidden xl:block w-[260px] shrink-0">
      <div className="sticky top-24 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 px-1">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-bg-600 border border-white/10 flex items-center justify-center">
              <Brain size={16} className="text-accent-cyan" />
            </div>
            <GlowPulse color="cyan">
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent-cyan border-2 border-background" />
            </GlowPulse>
          </div>
          <div>
            <p className="text-sm font-medium">孪生意识流</p>
            <p className="text-[11px] text-text-tertiary">实时思维映射</p>
          </div>
        </div>

        {/* Thoughts */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {thoughts.map((thought, i) => {
              const colors = moodColors[thought.mood]
              return (
                <motion.div
                  key={thought.id}
                  initial={{ opacity: 0, x: 12, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -12, scale: 0.95 }}
                  transition={{ delay: i * 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Card
                    variant="flat"
                    className={`p-3.5 ${colors.bg} border ${colors.border}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-0.5 ${colors.text}`}>{thought.icon}</span>
                      <p className="text-xs leading-relaxed text-text-secondary">
                        {thought.text}
                      </p>
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className={`w-1 h-1 rounded-full ${colors.dot} animate-pulse`} />
                      <span className={`text-[10px] ${colors.text} opacity-70`}>
                        {thought.mood === 'curious' && '好奇'}
                        {thought.mood === 'warm' && '温暖'}
                        {thought.mood === 'focused' && '专注'}
                        {thought.mood === 'playful' && '轻松'}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-[10px] text-text-ghost text-center px-2"
        >
          这些不是我的台词。是我的思维。
        </motion.p>
      </div>
    </div>
  )
}
