import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X } from 'lucide-react'

interface MatchSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  matchName: string
}

export default function MatchSuccessModal({ isOpen, onClose, matchName }: MatchSuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="glass-elevated rounded-3xl p-8 text-center max-w-sm mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-text-ghost hover:text-text-primary">
              <X size={20} />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-cyan to-accent-magenta flex items-center justify-center glow-cyan"
            >
              <Heart size={36} className="text-white fill-white" />
            </motion.div>

            <h2 className="font-display text-2xl font-bold mb-2">匹配成功!</h2>
            <p className="text-text-secondary mb-6">
              你与 <span className="text-accent-cyan font-medium">{matchName}</span> 的克隆体互相喜欢了
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-magenta text-white font-semibold"
            >
              开始聊天
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
