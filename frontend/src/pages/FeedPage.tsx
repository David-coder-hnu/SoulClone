import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Plus } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { formatDate } from '@/lib/utils'

const mockPosts = [
  {
    id: '1',
    author: { nickname: '小雨' },
    content: '今天的阳光刚刚好，咖啡店里遇到了一只超可爱的橘猫 🐱☕️ 有时候生活中的小确幸就是这样简单～',
    likes: 24,
    comments: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    tags: ['日常', '咖啡', '猫'],
  },
  {
    id: '2',
    author: { nickname: '阿杰' },
    content: '周末去了一趟莫干山，徒步路线太美了！推荐给大家这条小众路线...',
    likes: 56,
    comments: 12,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    tags: ['徒步', '旅行', '户外'],
  },
  {
    id: '3',
    author: { nickname: '林夕' },
    content: '画了一下午的画，虽然手酸但是心情很好 ✨ 艺术创作就是这样，痛并快乐着',
    likes: 38,
    comments: 8,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    tags: ['艺术', '绘画', '创作'],
  },
]

export default function FeedPage() {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  const toggleLike = (id: string) => {
    setLikedPosts((p) => {
      const next = new Set(p)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-xl mx-auto relative">
        {/* Background ambient */}
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-accent-cyan/3 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl font-bold">社区</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-cyan/20 to-accent-magenta/20 text-accent-cyan text-sm font-medium hover:from-accent-cyan/30 hover:to-accent-magenta/30 transition-all border border-accent-cyan/20"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">发布动态</span>
            </motion.button>
          </div>

          <div className="space-y-6">
            {mockPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                whileHover={{ y: -2 }}
                className="glass rounded-3xl p-5 md:p-6 hover:border-white/10 transition-all cursor-pointer group"
              >
                {/* Author */}
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan/30 to-accent-magenta/30 flex items-center justify-center"
                  >
                    <span className="font-display font-bold text-sm">
                      {post.author.nickname[0]}
                    </span>
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{post.author.nickname}</span>
                    </div>
                    <span className="text-text-ghost text-xs">{formatDate(post.created_at)}</span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-text-primary leading-relaxed mb-4 group-hover:text-text-primary/90 transition-colors">
                  {post.content}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <motion.span
                      key={tag}
                      whileHover={{ scale: 1.05 }}
                      className="px-2.5 py-1 rounded-lg bg-accent-cyan/10 text-accent-cyan text-xs border border-accent-cyan/20 hover:bg-accent-cyan/20 transition-colors cursor-pointer"
                    >
                      #{tag}
                    </motion.span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      likedPosts.has(post.id) ? 'text-accent-magenta' : 'text-text-secondary hover:text-accent-magenta'
                    }`}
                  >
                    <Heart size={18} className={likedPosts.has(post.id) ? 'fill-current' : ''} />
                    <span>{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
                  </motion.button>
                  <button className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-cyan transition-colors">
                    <MessageCircle size={18} />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors ml-auto">
                    <Share2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
