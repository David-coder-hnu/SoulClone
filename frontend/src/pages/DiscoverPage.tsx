import { useState } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import {
  MapPin, Heart, X, Star,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { useDiscoverProfiles } from '@/hooks/useDiscoverProfiles'
import { FadeIn } from '@/components/shared/Motion'
import { DiscoverEmptyState, ErrorState, SkeletonCard } from '@/components/shared/DataStates'
import AmbientBackground from '@/components/shared/AmbientBackground'

const SWIPE_THRESHOLD = 120

export default function DiscoverPage() {
  const { data: profiles, isLoading, error } = useDiscoverProfiles()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-15, 15])
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0.3, 1, 1, 1, 0.3])

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      setDirection('right')
      animate(x, 400, { duration: 0.3 }).then(() => nextCard())
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      setDirection('left')
      animate(x, -400, { duration: 0.3 }).then(() => nextCard())
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 25 })
    }
  }

  const nextCard = () => {
    setCurrentIndex((prev) => prev + 1)
    x.set(0)
    setDirection(null)
  }

  const currentProfile = profiles ? profiles[currentIndex] : null
  const remaining = profiles ? profiles.length - currentIndex : 0

  if (error) {
    return (
      <AppShell>
        <AmbientBackground variant="discover">
          <div className="p-4 md:p-8 max-w-md mx-auto">
            <ErrorState message="加载推荐失败" onRetry={() => window.location.reload()} />
          </div>
        </AmbientBackground>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <AmbientBackground variant="discover">
        <div className="p-4 md:p-8 max-w-md mx-auto">
          {/* Header */}
          <FadeIn>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-sans text-2xl font-bold">发现</h1>
              <span className="text-xs text-text-tertiary">剩余 {remaining} 位</span>
            </div>
          </FadeIn>

          {isLoading ? (
            <SkeletonCard />
          ) : !currentProfile ? (
            <DiscoverEmptyState />
          ) : (
            <FadeIn>
              <div className="relative h-[520px]">
                {/* Swipe Card */}
                <motion.div
                  style={{ x, rotate, opacity }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                  className="absolute inset-0 cursor-grab active:cursor-grabbing"
                >
                  <Card variant="elevated" className="h-full flex flex-col overflow-hidden">
                    {/* Avatar */}
                    <div className="relative h-64 shrink-0">
                      {currentProfile.avatar ? (
                        <img
                          src={currentProfile.avatar}
                          alt={currentProfile.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent-cyan/20 to-accent-magenta/20 flex items-center justify-center">
                          <Star size={48} className="text-text-tertiary" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="font-sans text-xl font-bold text-white">
                          {currentProfile.nickname}
                          <span className="ml-2 text-sm font-normal text-text-secondary">
                            {currentProfile.age > 0 ? `${currentProfile.age}岁` : ''}
                          </span>
                        </h2>
                        <div className="flex items-center gap-1 text-text-secondary text-xs mt-1">
                          <MapPin size={12} />
                          {currentProfile.city || '未知位置'}
                          {currentProfile.distance && ` · ${currentProfile.distance}`}
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="flex-1 p-5 overflow-y-auto">
                      <p className="text-sm text-text-secondary leading-relaxed mb-4">
                        {currentProfile.bio || '暂无简介'}
                      </p>

                      {/* Tags */}
                      {currentProfile.tags && currentProfile.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {currentProfile.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-1 rounded-full bg-bg-600 border border-white/[0.08] text-xs text-text-secondary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Traits */}
                      {currentProfile.traits && Object.keys(currentProfile.traits).length > 0 && (
                        <div className="space-y-2">
                          {Object.entries(currentProfile.traits).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-3">
                              <span className="text-xs text-text-tertiary w-12 shrink-0">{key}</span>
                              <div className="flex-1 h-1.5 bg-bg-600 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(value as number) * 100}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className="h-full bg-gradient-to-r from-accent-cyan to-accent-magenta rounded-full"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>

                {/* Particle trail — One More Thing */}
                {direction && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{
                          x: direction === 'right' ? '20%' : '80%',
                          y: `${20 + i * 8}%`,
                          opacity: 0.8,
                          scale: 1,
                        }}
                        animate={{
                          x: direction === 'right' ? '120%' : '-20%',
                          opacity: 0,
                          scale: 0.5,
                        }}
                        transition={{ duration: 0.6, delay: i * 0.03 }}
                        className={`absolute w-1.5 h-1.5 rounded-full ${
                          direction === 'right' ? 'bg-accent-magenta' : 'bg-text-tertiary'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-6 mt-6">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    setDirection('left')
                    animate(x, -400, { duration: 0.3 }).then(() => nextCard())
                  }}
                  className="w-14 h-14 rounded-full bg-bg-600 border border-white/[0.08] flex items-center justify-center text-text-secondary hover:text-accent-magenta hover:border-accent-magenta/30 transition-colors"
                >
                  <X size={24} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    setDirection('right')
                    animate(x, 400, { duration: 0.3 }).then(() => nextCard())
                  }}
                  className="w-14 h-14 rounded-full bg-accent-magenta/10 border border-accent-magenta/30 flex items-center justify-center text-accent-magenta hover:bg-accent-magenta/20 transition-colors"
                >
                  <Heart size={24} />
                </motion.button>
              </div>
            </FadeIn>
          )}
        </div>
      </AmbientBackground>
    </AppShell>
  )
}
