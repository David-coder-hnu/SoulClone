import { motion } from 'framer-motion'
import { MapPin, Calendar, Edit, LogOut, Settings, Sparkles, Heart, MessageCircle, Users, Shield } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/stores/authStore'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-elevated rounded-3xl p-6 md:p-8 mb-6 text-center relative overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent-cyan/5 rounded-full blur-[80px]" />

          <div className="relative z-10">
            <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-accent-cyan to-accent-magenta flex items-center justify-center glow-cyan">
              <span className="font-display text-3xl font-bold text-white">
                {user?.nickname?.[0] || '?'}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold">{user?.nickname || '用户'}</h1>
            <p className="text-text-secondary mt-1">{user?.bio || '还没有简介'}</p>

            <div className="flex items-center justify-center gap-4 mt-4 text-text-secondary text-sm">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                上海
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                加入于 2024
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button className="px-6 py-2.5 rounded-xl glass text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2">
                <Edit size={16} />
                编辑资料
              </button>
              <button className="px-6 py-2.5 rounded-xl glass text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2">
                <Settings size={16} />
                设置
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Users, label: '匹配', value: '12', color: 'text-accent-cyan' },
            { icon: MessageCircle, label: '对话', value: '48', color: 'text-accent-magenta' },
            { icon: Heart, label: '获赞', value: '156', color: 'text-accent-gold' },
            { icon: Sparkles, label: '动态', value: '23', color: 'text-accent-cyan' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 text-center hover:bg-white/5 transition-colors"
            >
              <stat.icon size={18} className={`mx-auto mb-2 ${stat.color}`} />
              <p className="font-display text-2xl font-bold text-gradient">{stat.value}</p>
              <p className="text-text-ghost text-xs mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Safety & Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5 mb-6"
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
            {['端到端加密聊天', '身份隐私保护', '随时删除所有数据'].map((item) => (
              <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface/50">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                <span className="text-sm text-text-secondary">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Danger zone */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={logout}
          className="w-full py-3 rounded-xl glass text-accent-magenta hover:bg-accent-magenta/10 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          退出登录
        </motion.button>
      </div>
    </AppShell>
  )
}
