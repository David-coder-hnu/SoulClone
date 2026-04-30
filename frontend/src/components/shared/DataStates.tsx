import { motion } from 'framer-motion'
import { Loader2, MessageSquareOff, Newspaper, RefreshCw, Moon, Compass } from 'lucide-react'
import { ReactNode } from 'react'

// ───────── SkeletonCard ─────────

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-bg-500 border border-white/[0.06] rounded-2xl p-5 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 bg-white/5 rounded animate-pulse" />
          <div className="h-3 w-1/4 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-white/5 rounded animate-pulse" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// ───────── EmptyState ─────────

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-bg-600 border border-white/[0.06] flex items-center justify-center mb-4">
        <div className="text-text-tertiary">{icon}</div>
      </div>
      <h3 className="font-sans text-lg font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-text-secondary text-sm max-w-xs mb-6">{description}</p>
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className="px-5 py-2.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-sm font-medium hover:bg-accent-cyan/20 transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}

// Pre-configured empty states for each page — with soul

export function ChatEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={<MessageSquareOff size={24} />}
      title="对话还是空白的"
      description="你的孪生还没替你开启任何对话。去 Discover 认识新的人，或者激活孪生让它主动出击"
      action={onAction ? { label: '去发现', onClick: onAction } : undefined}
    />
  )
}

export function DiscoverEmptyState() {
  return (
    <EmptyState
      icon={<Compass size={24} />}
      title="今日的灵魂已浏览完毕"
      description="世界很大，有趣的灵魂很多。明天再来，你的孪生会为你准备新的推荐"
    />
  )
}

export function FeedEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={<Newspaper size={24} />}
      title="社区还在沉睡"
      description="这里本该充满故事。发布第一条动态，让你的孪生替你分享生活"
      action={onAction ? { label: '发布动态', onClick: onAction } : undefined}
    />
  )
}

export function CloneEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-2xl bg-bg-600 border border-white/[0.06] flex items-center justify-center mb-5"
      >
        <Moon size={32} className="text-text-tertiary" />
      </motion.div>
      <h3 className="font-sans text-lg font-bold text-text-primary mb-2">你的孪生还在沉睡</h3>
      <p className="text-text-secondary text-sm max-w-sm mb-2">
        它需要一个灵魂模板才能醒来。回答几道问题，等待几分钟，另一个你就会诞生。
      </p>
      <p className="text-text-ghost text-xs italic">
        "你关机的那一刻，另一个你，正在真诚地与世界说你好。"
      </p>
    </motion.div>
  )
}

// ───────── ErrorState ─────────

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = '加载失败', onRetry }: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-12 h-12 rounded-xl bg-accent-magenta/10 border border-accent-magenta/20 flex items-center justify-center mb-3">
        <RefreshCw size={20} className="text-accent-magenta" />
      </div>
      <h3 className="font-sans text-base font-bold text-text-primary mb-1">出错了</h3>
      <p className="text-text-secondary text-sm mb-4">{message}</p>
      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-bg-600 border border-white/[0.08] text-text-secondary text-sm hover:border-accent-cyan/30 hover:text-accent-cyan transition-colors"
        >
          <RefreshCw size={14} />
          重试
        </motion.button>
      )}
    </motion.div>
  )
}

// ───────── LoadingSpinner ─────────

export function LoadingSpinner({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={size} className="animate-spin text-accent-cyan" />
    </div>
  )
}
