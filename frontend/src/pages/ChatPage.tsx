import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, MessageSquare, Search } from 'lucide-react'
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
    is_online: true,
  },
  {
    id: '2',
    partner: { nickname: '阿杰', avatar: null },
    last_message: '周末一起去 hiking 吗？',
    last_message_time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unread: 0,
    intimacy: 42,
    is_online: false,
  },
  {
    id: '3',
    partner: { nickname: '林夕', avatar: null },
    last_message: '我最近在画一幅新的插画...',
    last_message_time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unread: 1,
    intimacy: 28,
    is_online: true,
  },
]

export default function ChatPage() {
  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-2xl mx-auto relative">
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-accent-cyan/3 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold">消息</h1>
              <p className="text-text-ghost text-sm mt-0.5">{mockConversations.length} 个对话</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl glass border border-white/5 hover:border-white/10 transition-colors"
            >
              <Search size={18} className="text-text-secondary" />
            </motion.button>
          </div>

          <div className="space-y-3">
            {mockConversations.map((conv, i) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
              >
                <Link
                  to={`/chat/${conv.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl glass hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-cyan/30 to-accent-magenta/30 flex items-center justify-center"
                    >
                      <span className="font-display font-bold text-lg">
                        {conv.partner.nickname[0]}
                      </span>
                    </motion.div>
                    {conv.is_online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent-cyan border-2 border-background">
                        <motion.div
                          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-accent-cyan"
                        />
                      </div>
                    )}
                    {conv.unread > 0 && !conv.is_online && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-magenta flex items-center justify-center text-[10px] font-bold">
                        {conv.unread}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate group-hover:text-accent-cyan transition-colors">
                        {conv.partner.nickname}
                      </h3>
                      <span className="text-text-ghost text-xs flex items-center gap-1 shrink-0">
                        <Clock size={11} />
                        {formatDate(conv.last_message_time)}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm truncate group-hover:text-text-primary transition-colors">
                      {conv.last_message}
                    </p>
                  </div>

                  {/* Intimacy */}
                  <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] text-text-ghost uppercase tracking-wider">亲密度</span>
                    <div className="w-14 h-1.5 bg-surface rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${conv.intimacy}%` }}
                        transition={{ delay: i * 0.1 + 0.3, type: 'spring', stiffness: 100 }}
                        className="h-full bg-gradient-to-r from-accent-cyan to-accent-magenta"
                      />
                    </div>
                    <span className="text-[10px] text-text-ghost">{conv.intimacy}%</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Empty state hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/5 text-text-ghost text-sm">
              <MessageSquare size={14} />
              滑动查看更多对话
            </div>
          </motion.div>
        </div>
      </div>
    </AppShell>
  )
}
