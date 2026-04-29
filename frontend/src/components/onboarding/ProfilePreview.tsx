import { motion } from 'framer-motion'
import { Sparkles, Brain, MessageCircle, Heart } from 'lucide-react'

interface ProfilePreviewProps {
  nickname: string
  traits: { label: string; value: number }[]
}

export default function ProfilePreview({ nickname, traits }: ProfilePreviewProps) {
  return (
    <motion.div
      initial={{ rotateY: -90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: 0.8, type: 'spring' }}
      className="glass-elevated rounded-3xl p-8 text-center"
      style={{ perspective: 1000 }}
    >
      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-magenta flex items-center justify-center glow-cyan">
        <Sparkles size={32} className="text-white" />
      </div>
      <h3 className="font-display text-2xl font-bold mb-2">{nickname}的孪生</h3>
      <p className="text-text-secondary text-sm mb-6">人格蒸馏完成</p>

      <div className="space-y-3">
        {traits.map((trait) => (
          <div key={trait.label} className="flex items-center gap-3">
            <span className="text-xs text-text-secondary w-16 text-left">{trait.label}</span>
            <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${trait.value}%` }}
                className="h-full bg-gradient-to-r from-accent-cyan to-accent-magenta"
                transition={{ delay: 0.5, duration: 1 }}
              />
            </div>
            <span className="text-xs text-text-secondary w-8">{trait.value}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-6 mt-6">
        <div className="flex flex-col items-center gap-1">
          <Brain size={16} className="text-accent-cyan" />
          <span className="text-[10px] text-text-ghost">人格</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <MessageCircle size={16} className="text-accent-magenta" />
          <span className="text-[10px] text-text-ghost">聊天</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Heart size={16} className="text-accent-gold" />
          <span className="text-[10px] text-text-ghost">情感</span>
        </div>
      </div>
    </motion.div>
  )
}
