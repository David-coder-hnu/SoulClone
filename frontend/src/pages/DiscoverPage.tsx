import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Info, MapPin, Sparkles } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { generateGradient } from '@/lib/utils'

const mockProfiles = [
  {
    id: '1',
    nickname: '小雨',
    age: 24,
    city: '上海',
    bio: '喜欢咖啡、摄影和深夜的电影。',
    tags: ['摄影', '咖啡', '电影', '猫奴'],
    traits: { openness: 85, conscientiousness: 70, extraversion: 60, agreeableness: 90, neuroticism: 40 },
    distance: '3km',
  },
  {
    id: '2',
    nickname: '阿杰',
    age: 27,
    city: '上海',
    bio: '程序员，周末户外爱好者。',
    tags: ['编程', '徒步', '游戏', '音乐'],
    traits: { openness: 75, conscientiousness: 85, extraversion: 50, agreeableness: 80, neuroticism: 30 },
    distance: '8km',
  },
  {
    id: '3',
    nickname: '林夕',
    age: 25,
    city: '上海',
    bio: '画画、写手帐、收集 vintage。',
    tags: ['艺术', '手帐', '复古', '阅读'],
    traits: { openness: 95, conscientiousness: 60, extraversion: 45, agreeableness: 85, neuroticism: 55 },
    distance: '5km',
  },
]

export default function DiscoverPage() {
  const [profiles] = useState(mockProfiles)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [showDetail, setShowDetail] = useState(false)
  const [exitX, setExitX] = useState(0)

  const current = profiles[currentIndex]

  const handleSwipe = (dir: 'left' | 'right') => {
    setDirection(dir === 'right' ? 1 : -1)
    setExitX(dir === 'right' ? 500 : -500)
    setTimeout(() => {
      setCurrentIndex((p) => p + 1)
      setDirection(0)
      setExitX(0)
    }, 300)
  }

  if (!current) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Sparkles size={48} className="text-accent-cyan mb-4" />
          </motion.div>
          <h2 className="font-display text-2xl font-bold">今日推荐已看完</h2>
          <p className="text-text-secondary mt-2">明天再来发现新的灵魂吧</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentIndex(0)}
            className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-magenta text-white font-medium"
          >
            重新开始
          </motion.button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-lg mx-auto h-[calc(100vh-80px)] md:h-auto flex flex-col relative">
        {/* Background ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent-cyan/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <h1 className="font-display text-2xl font-bold">发现</h1>
          <div className="flex items-center gap-2 text-text-secondary text-sm glass px-3 py-1.5 rounded-full">
            <MapPin size={14} />
            <span>上海</span>
          </div>
        </div>

        {/* Card Stack */}
        <div className="flex-1 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                x: exitX,
                rotate: direction === 1 ? 15 : direction === -1 ? -15 : 0,
              }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                if (info.offset.x > 150) handleSwipe('right')
                else if (info.offset.x < -150) handleSwipe('left')
              }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <div className="h-full glass-elevated rounded-3xl overflow-hidden flex flex-col relative">
                {/* Avatar area */}
                <div
                  className="h-64 md:h-80 relative flex items-end p-6"
                  style={{ background: generateGradient(current.id) }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="relative z-10">
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="font-display text-3xl font-bold text-white"
                    >
                      {current.nickname}
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-white/80 text-sm mt-1"
                    >
                      {current.age}岁 · {current.city} · {current.distance}
                    </motion.p>
                  </div>

                  {/* Mystery indicator */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute top-4 right-4 px-3 py-1.5 rounded-full glass border border-white/20"
                  >
                    <span className="text-xs text-white/80">身份未知</span>
                  </motion.div>

                  {/* Swipe hint */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-accent-cyan/20 border border-accent-cyan/30"
                  >
                    <span className="text-xs text-accent-cyan">左右滑动</span>
                  </motion.div>
                </div>

                {/* Info */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-text-secondary leading-relaxed mb-4"
                  >
                    {current.bio}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap gap-2 mb-6"
                  >
                    {current.tags.map((tag) => (
                      <motion.span
                        key={tag}
                        whileHover={{ scale: 1.05 }}
                        className="px-3 py-1 rounded-full bg-accent-cyan/10 text-accent-cyan text-xs border border-accent-cyan/20"
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </motion.div>

                  <AnimatePresence>
                    {showDetail && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <p className="text-sm font-medium">人格雷达</p>
                        {Object.entries(current.traits).map(([key, value], i) => (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-3"
                          >
                            <span className="text-xs text-text-secondary w-16 capitalize">{key.slice(0, 3)}</span>
                            <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${value}%` }}
                                transition={{ delay: i * 0.05 + 0.2, type: 'spring' }}
                                className="h-full bg-gradient-to-r from-accent-cyan to-accent-magenta"
                              />
                            </div>
                            <span className="text-xs text-text-secondary w-8">{value}</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-6 py-6 relative z-10">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 rounded-full glass border border-white/10 flex items-center justify-center text-text-secondary hover:text-accent-magenta hover:border-accent-magenta/30 hover:shadow-lg hover:shadow-accent-magenta/20 transition-all"
          >
            <X size={28} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowDetail(!showDetail)}
            className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-text-secondary hover:text-accent-gold hover:border-accent-gold/30 hover:shadow-lg hover:shadow-accent-gold/20 transition-all"
          >
            <Info size={20} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('right')}
            className="w-16 h-16 rounded-full glass border border-accent-cyan/30 flex items-center justify-center text-accent-cyan hover:bg-accent-cyan/10 hover:shadow-lg hover:shadow-accent-cyan/30 transition-all"
          >
            <Heart size={28} />
          </motion.button>
        </div>
      </div>
    </AppShell>
  )
}
