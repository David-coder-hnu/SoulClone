import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Send, Sparkles, User, Phone,
  Hand, MoreHorizontal
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { api } from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/stores/authStore'
import { useMessages } from '@/hooks/useMessages'
import { useConversation } from '@/hooks/useConversation'
import { useChatWebSocket } from '@/hooks/useChatWebSocket'
import { playSound } from '@/lib/sound'
import { ErrorState, LoadingSpinner } from '@/components/shared/DataStates'
import AmbientBackground from '@/components/shared/AmbientBackground'

export default function ChatRoomPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const {
    data: conversation,
    isLoading: convLoading,
    error: convError,
  } = useConversation(conversationId || '')

  const {
    data: messages,
    isLoading: msgLoading,
    error: msgError,
  } = useMessages(conversationId || '')

  const { sendMessage: sendWsMessage } = useChatWebSocket(conversationId || '')

  const [input, setInput] = useState('')
  const [isManualMode, setIsManualMode] = useState(false)
  const [showModeHint, setShowModeHint] = useState(false)
  const [isTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !conversationId) return
    const content = input.trim()
    setInput('')
    inputRef.current?.focus()

    // Backend saves the message and broadcasts via WebSocket.
    // We only POST — no manual WS send, to avoid duplicates.
    try {
      await api.post(`/messages/${conversationId}`, { content })
      playSound('send-message')
    } catch {
      // fallback: let user retry
    }
  }, [input, conversationId, user?.id, sendWsMessage])

  const toggleMode = () => {
    if (!isManualMode) {
      setShowModeHint(true)
      setTimeout(() => setShowModeHint(false), 3000)
    }
    setIsManualMode(!isManualMode)
  }

  const isLoading = convLoading || msgLoading
  const error = convError || msgError

  if (error) {
    return (
      <AmbientBackground variant="chat" className="h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <ErrorState
            message="加载对话失败"
            onRetry={() => window.location.reload()}
          />
        </div>
      </AmbientBackground>
    )
  }

  const partnerName = conversation?.partner_nickname || '用户'
  const partnerAvatar = conversation?.partner_avatar
  const intimacy = Math.round(conversation?.intimacy_score || 0)

  return (
    <AmbientBackground variant="chat" className="h-screen flex flex-col">
      {/* Header */}
      <div className="glass border-b border-white/[0.06] px-4 py-3 flex items-center gap-3 shrink-0 z-20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/chat')}
          className="p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors duration-150"
        >
          <ArrowLeft size={20} />
        </motion.button>

        <div className="flex-1 flex items-center gap-3">
          <Avatar
            size="sm"
            status={conversation?.partner_is_online ? 'online' : undefined}
            fallback={partnerName[0]}
            src={partnerAvatar || undefined}
          />
          <div>
            <h2 className="font-medium text-sm">{partnerName}</h2>
            <div className="flex items-center gap-1 text-text-tertiary text-xs">
              <Sparkles size={10} className="text-accent-gold" />
              <span>身份未知</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-white/[0.08]">
            <Phone size={12} className="text-accent-gold" />
            <span className="text-xs text-text-secondary">亲密度 {intimacy}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors duration-150"
          >
            <MoreHorizontal size={18} className="text-text-secondary" />
          </motion.button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* System message */}
            <div className="flex justify-center py-3">
              <span className="px-3 py-1 rounded-full bg-bg-600 border border-white/[0.06] text-[10px] text-text-tertiary">
                对方 AI 孪生已接管对话
              </span>
            </div>

            <AnimatePresence initial={false}>
              {(messages || []).map((msg, index) => {
                const isMe = msg.sender_id === user?.id
                const isClone = msg.sender_type === 'clone'
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25, delay: index < 5 ? 0 : 0 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[80%] sm:max-w-[70%]">
                      {isClone && (
                        <Badge variant="gold" size="sm" className="mb-1">
                          AI 孪生
                        </Badge>
                      )}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className={`px-4 py-3 rounded-2xl ${
                          isMe && !isClone
                            ? 'bg-accent-cyan/10 border border-accent-cyan/25 text-text-primary rounded-br-sm'
                            : isClone
                            ? 'bg-gradient-to-r from-cyan-500/5 to-magenta-500/5 border border-cyan-400/20 text-text-primary rounded-br-sm'
                            : 'bg-bg-600 border border-white/[0.08] rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className="text-[10px] text-text-tertiary mt-1.5 text-right">
                          {formatDate(msg.created_at)}
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex justify-start"
                >
                  <div className="bg-bg-600 border border-white/[0.08] rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                        className="w-1.5 h-1.5 rounded-full bg-text-tertiary"
                      />
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
                        className="w-1.5 h-1.5 rounded-full bg-text-tertiary"
                      />
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
                        className="w-1.5 h-1.5 rounded-full bg-text-tertiary"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Mode hint */}
      <AnimatePresence>
        {showModeHint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 py-2.5 bg-cyan-500/10 border-t border-cyan-400/20 text-center z-20"
          >
            <p className="text-accent-cyan text-sm font-medium">已切换为手动模式，现在由你亲自回复</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="glass-strong border-t border-white/[0.06] p-4 shrink-0 z-20 relative">
        {!isManualMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-gold-500/5 border border-gold-400/10"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles size={14} className="text-accent-gold" />
            </motion.div>
            <span className="text-xs text-accent-gold">智能辅助已开启</span>
          </motion.div>
        )}

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMode}
            className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 ease-spring ${
              isManualMode
                ? 'bg-gradient-to-br from-accent-cyan to-accent-magenta text-white glow-cyan-md'
                : 'bg-bg-600 border border-white/[0.08] text-text-secondary hover:text-accent-cyan hover:border-accent-cyan/30'
            }`}
          >
            {isManualMode ? <User size={20} /> : <Hand size={20} />}
          </motion.button>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="说点什么..."
              className="w-full px-4 py-3 rounded-xl bg-bg-500 border border-white/10 text-text-primary placeholder-text-placeholder focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_16px_rgba(0,240,255,0.4)] focus:bg-bg-600 transition-all duration-200 ease-liquid pr-12"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/25 hover:shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all duration-150 ease-spring disabled:opacity-30 disabled:hover:shadow-none"
            >
              <Send size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </AmbientBackground>
  )
}
