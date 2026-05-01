import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Heart, MessageCircle, Share2, Ghost,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { useFeedPosts } from '@/hooks/useFeedPosts'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/Motion'
import { FeedEmptyState, ErrorState, SkeletonList } from '@/components/shared/DataStates'
import AmbientBackground from '@/components/shared/AmbientBackground'

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${Math.floor(diff / 86400)}天前`
}

export default function FeedPage() {
  const { data: posts, isLoading, error } = useFeedPosts()
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }

  if (error) {
    return (
      <AppShell>
        <AmbientBackground variant="feed">
          <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <ErrorState message="加载动态失败" onRetry={() => window.location.reload()} />
          </div>
        </AmbientBackground>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <AmbientBackground variant="feed">
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
          {/* Header */}
          <FadeIn>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-heading text-2xl">社区</h1>
              <Link
                to="/feed/create"
                className="px-4 py-2 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
              >
                发布动态
              </Link>
            </div>
          </FadeIn>

          {/* Posts */}
          {isLoading ? (
            <SkeletonList count={3} />
          ) : !posts || posts.length === 0 ? (
            <FeedEmptyState onAction={() => { window.location.href = '/feed/create' }} />
          ) : (
            <StaggerContainer className="space-y-4">
              {posts.map((post) => {
                const isLiked = likedPosts.has(post.id)
                return (
                  <StaggerItem key={post.id}>
                    <Card variant="flat" className="p-5">
                      {/* Author */}
                      <div className="flex items-center gap-3 mb-3">
                        {post.author.avatar ? (
                          <img
                            src={post.author.avatar}
                            alt={post.author.nickname}
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-bg-600 border border-white/10 flex items-center justify-center">
                            <span className="text-xs text-text-tertiary">{post.author.nickname[0]}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{post.author.nickname}</span>
                            {/* Twin post ghost — One More Thing */}
                            {post.is_twin_post && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-xs"
                                title="孪生发布"
                              >
                                <Ghost size={14} className="text-accent-gold" />
                              </motion.span>
                            )}
                          </div>
                          <span className="text-xs text-text-tertiary">{timeAgo(post.created_at)}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-text-primary leading-relaxed mb-3 whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Media */}
                      {post.media_urls && post.media_urls.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3 rounded-xl overflow-hidden">
                          {post.media_urls.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt=""
                              className="w-full h-40 object-cover"
                            />
                          ))}
                        </div>
                      )}

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full bg-bg-600 border border-white/[0.06] text-xs text-text-secondary"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-6 pt-3 border-t border-white/[0.06]">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleLike(post.id)}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            isLiked ? 'text-accent-magenta' : 'text-text-secondary hover:text-accent-magenta'
                          }`}
                        >
                          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                          {post.likes + (isLiked ? 1 : 0)}
                        </motion.button>
                        <span className="flex items-center gap-1.5 text-xs text-text-ghost">
                          <MessageCircle size={16} />
                          {post.comments}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-text-ghost">
                          <Share2 size={16} />
                          分享
                        </span>
                      </div>
                    </Card>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          )}
        </div>
      </AmbientBackground>
    </AppShell>
  )
}
