import { motion } from 'framer-motion'

export default function PostSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass rounded-3xl p-5 md:p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-surface animate-pulse" />
        <div className="space-y-2">
          <div className="w-24 h-3 rounded bg-surface animate-pulse" />
          <div className="w-16 h-2 rounded bg-surface animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="w-full h-3 rounded bg-surface animate-pulse" />
        <div className="w-3/4 h-3 rounded bg-surface animate-pulse" />
      </div>
    </motion.div>
  )
}
