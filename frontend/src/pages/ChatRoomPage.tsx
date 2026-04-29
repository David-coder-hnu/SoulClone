import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Send, Sparkles, User, Phone,
  Hand
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Message {
  id: string
  is_from_me: boolean
  content: string
  created_at: string
}

const mockMessages: Message[] = [
  {
    id: '1',
    is_from_me: false,
    content: '嗨，你好呀！我是通过匹配发现你的，感觉我们兴趣很相似 ✨',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '2',
    is_from_me: true,
    content: '哈哈真的吗？你平时喜欢做什么？',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
  },
  {
    id: '3',
    is_from_me: false,
    content: '我喜欢摄影和咖啡！周末经常带着相机去街拍，然后在咖啡馆修图。你呢？',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: '4',
    is_from_me: true,
    content: '我也喜欢拍照！不过我更多是用手机拍生活碎片 😂',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '5',
    is_from_me: false,
    content: '手机摄影也超棒的！重要的是记录下来的那个瞬间～ 你最近拍了什么好看的照片吗？',
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
]

export default function ChatRoomPage() {
  useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [input, setInput] = useState('')
  const [isManualMode, setIsManualMode] = useState(false)
  const [showModeHint, setShowModeHint] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return
    const newMsg: Message = {
      id: Date.now().toString(),
      is_from_me: true,
      content: input,
      created_at: new Date().toISOString(),
    }
    setMessages((p) => [...p, newMsg])
    setInput('')
    inputRef.current?.focus()
  }

  const toggleMode = () => {
    if (!isManualMode) {
      setShowModeHint(true)
      setTimeout(() => setShowModeHint(false), 3000)
    }
    setIsManualMode(!isManualMode)
  }

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-accent-cyan/3 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <div className="glass-strong border-b border-white/5 px-4 py-3 flex items-center gap-3 shrink-0 z-20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/chat')}
          className="p-2 -ml-2 rounded-xl hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={20} />
        </motion.button>

        <div className="flex-1 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan/30 to-accent-magenta/30 flex items-center justify-center">
              <span className="font-display font-bold">雨</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent-cyan border-2 border-background">
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-accent-cyan"
              />
            </div>
          </div>
          <div>
            <h2 className="font-medium">小雨</h2>
            <div className="flex items-center gap-1 text-text-ghost text-xs">
              <Sparkles size={10} className="text-accent-gold" />
              <span>身份未知</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full glass border border-white/5">
            <Phone size={12} className="text-accent-gold" />
            <span className="text-xs text-text-secondary">亲密度 65</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25, delay: index < 5 ? 0 : 0 }}
              className={`flex ${msg.is_from_me ? 'justify-end' : 'justify-start'}`}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                  msg.is_from_me
                    ? 'bg-gradient-to-br from-accent-cyan/25 to-accent-cyan/10 text-text-primary rounded-br-md border border-accent-cyan/10'
                    : 'glass border border-white/5 rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className="text-[10px] text-text-ghost mt-1 text-right">
                  {formatDate(msg.created_at)}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Mode hint */}
      <AnimatePresence>
        {showModeHint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 py-2 bg-accent-cyan/10 border-t border-accent-cyan/20 text-center z-20"
          >
            <p className="text-accent-cyan text-sm">已切换为手动模式，现在由你亲自回复</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="glass-strong border-t border-white/5 p-4 shrink-0 z-20 relative">
        {!isManualMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-accent-gold/5 border border-accent-gold/10"
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
            className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isManualMode
                ? 'bg-gradient-to-br from-accent-cyan to-accent-magenta text-white shadow-lg shadow-accent-cyan/30'
                : 'glass border border-white/10 text-text-secondary hover:text-accent-cyan'
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
              placeholder='说点什么...'
              className="w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-text-primary placeholder-text-ghost focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all pr-12"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-r from-accent-cyan/30 to-accent-magenta/30 text-accent-cyan hover:from-accent-cyan/50 hover:to-accent-magenta/50 transition-all disabled:opacity-30"
            >
              <Send size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
