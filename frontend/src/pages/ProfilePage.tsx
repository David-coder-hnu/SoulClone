import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Edit, LogOut, Settings, Sparkles, Heart, MessageCircle, Users, Shield, Camera } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/stores/authStore'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const [hoverStat, setHoverStat] = useState<string | null>(null)

  const stats = [
    { icon: Users, label: '匹配', value: '12', color: 'text-accent-cyan', glow: 'shadow-accent-cyan/20' },
    { icon: MessageCircle, label: '对话', value: '48', color: 'text-accent-magenta', glow: 'shadow-accent-magenta/20' },
    { icon: Heart, label: '获赞', value: '156', color: 'text-accent-gold', glow: 'shadow-accent-gold/20' },
    { icon: Sparkles, label: '动态', value: '23', color: 'text-accent-cyan', glow: 'shadow-accent-cyan/20' },
  ]

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-2xl mx-auto relative">
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-accent-cyan/3 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-elevated rounded-3xl p-6 md:p-8 mb-6 text-center relative overflow-hidden border border-white/5"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-accent-cyan/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent-magenta/5 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative w-24 h-24 mx-auto mb-4"
              >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent-cyan to-accent-magenta flex items-center justify-center shadow-lg shadow-accent-cyan/20">
                  <span className="font-display text-3xl font-bold text-white">
                    {user?.nickname?.[0] || '?'}
                  </span>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-surface border border-white/10 flex items-center justify-center cursor-pointer hover:border-accent-cyan/30 transition-colors"
                >
                  <Camera size={14} className="text-text-secondary" />
                </motion.div>
              </motion.div>

              <h1 className="font-display text-2xl font-bold">{user?.nickname || '用户'}</h1>
              <p className="text-text-secondary mt-1">{user?.bio || '还没有简介'}</p>

              <div className="flex items-center justify-center gap-5 mt-4 text-text-secondary text-sm">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-text-ghost" />
                  上海
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-text-ghost" />
                  加入于 2024
                </span>
              </div>

              <div className="flex items-center justify-center gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2.5 rounded-xl glass text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2 border border-white/5"
                >
                  <Edit size={16} />
                  编辑资料
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2.5 rounded-xl glass text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2 border border-white/5"
                >
                  <Settings size={16} />
                  设置
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
                whileHover={{ y: -4, scale: 1.03 }}
                onHoverStart={() => setHoverStat(stat.label)}
                onHoverEnd={() => setHoverStat(null)}
                className={`glass rounded-2xl p-4 text-center transition-all cursor-default border border-transparent ${
                  hoverStat === stat.label ? 'border-white/10 shadow-lg' : ''
                }`}
              >
                <motion.div
                  animate={hoverStat === stat.label ? { rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <stat.icon size={18} className={`mx-auto mb-2 ${stat.color}`} />
                </motion.div>
                <motion.p
                  key={stat.value}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, delay: i * 0.08 + 0.2 }}
                  className="font-display text-2xl font-bold text-gradient"
                >
                  {stat.value}
                </motion.p>
                <p className="text-text-ghost text-xs mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Safety & Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-2xl p-5 mb-6 border border-white/5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
                <Shield size={18} className="text-accent-cyan" />
              </div>
              <div>
                <h3 className="font-medium">隐私与安全</h3>
                <p className="text-text-secondary text-sm">你的数据完全加密存储</p>
              </div>
            </div>
            <div className="space-y-2">
              {['端到端加密聊天', '身份隐私保护', '随时删除所有数据'].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface/50 hover:bg-surface/80 transition-colors cursor-default group"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    className="w-2 h-2 rounded-full bg-accent-cyan"
                  />
                  <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Danger zone */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className="w-full py-3.5 rounded-xl glass text-accent-magenta hover:bg-accent-magenta/10 transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-accent-magenta/20"
          >
            <LogOut size={18} />
            退出登录
          </motion.button>
        </div>
      </div>
    </AppShell>
  )
}
