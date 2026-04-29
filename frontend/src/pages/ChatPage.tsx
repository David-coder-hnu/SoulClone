import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { formatDate } from '@/lib/utils'

const mockConversations = [
  {
    id: '1',
    partner: { nickname: '小雨', avatar: null },
    last_message: '哈哈，真的很有趣，刚才聊到了电影...',
    last_message_time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unread: 2,
    intimacy: 65,
  },
  {
    id: '2',
    partner: { nickname: '阿杰', avatar: null },
    last_message: '周末一起去 hiking 吗？',
    last_message_time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unread: 0,
    intimacy: 42,
  },
  {
    id: '3',
    partner: { nickname: '林夕', avatar: null },
    last_message: '我最近在画一幅新的插画...',
    last_message_time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unread: 1,
    intimacy: 28,
  },
]

export default function ChatPage() {
  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold">消息</h1>
          <div className="text-text-secondary text-sm">
            {mockConversations.length} 个对话
          </div>
        </div>

        <div className="space-y-3">
          {mockConversations.map((conv, i) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/chat/${conv.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl glass hover:bg-white/5 transition-colors group"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-cyan/30 to-accent-magenta/30 flex items-center justify-center">
                    <span className="font-display font-bold text-lg">
                      {conv.partner.nickname[0]}
                    </span>
                  </div>
                  {conv.unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-magenta flex items-center justify-center text-xs font-bold">
                      {conv.unread}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium truncate">{conv.partner.nickname}</h3>
                    <span className="text-text-ghost text-xs flex items-center gap-1 shrink-0">
                      <Clock size={12} />
                      {formatDate(conv.last_message_time)}
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm truncate">
                    {conv.last_message}
                  </p>
                </div>

                {/* Intimacy */}
                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-text-ghost">亲密度</span>
                  <div className="w-12 h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-cyan to-accent-magenta"
                      style={{ width: `${conv.intimacy}%` }}
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
