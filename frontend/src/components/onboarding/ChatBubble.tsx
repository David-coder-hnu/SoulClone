import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ChatBubbleProps {
  content: string
  isUser?: boolean
  delay?: number
}

export default function ChatBubble({ content, isUser = false, delay = 0 }: ChatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
        isUser
          ? 'bg-accent-cyan/20 text-text-primary rounded-br-md ml-auto'
          : 'glass border border-white/5 rounded-bl-md'
      )}
    >
      {content}
    </motion.div>
  )
}
