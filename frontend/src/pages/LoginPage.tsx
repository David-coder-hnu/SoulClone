import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import AuroraBackground from '@/components/shared/AuroraBackground'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { phone, password })
      setAuth(
        { id: 'mock', phone, nickname: null, avatar_url: null, bio: null, status: 'active' },
        res.data.access_token
      )
      navigate('/home')
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <AuroraBackground />

      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-magenta/10 rounded-full blur-[128px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 transition-colors">
          <ArrowLeft size={18} />
          返回首页
        </Link>

        <div className="glass-elevated rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent-cyan/5 rounded-full blur-[60px] pointer-events-none" />

          <div className="text-center mb-8 relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-magenta flex items-center justify-center"
            >
              <span className="text-white font-display font-bold text-xl">SC</span>
            </motion.div>
            <h1 className="font-display text-3xl font-bold mb-2">欢迎回来</h1>
            <p className="text-text-secondary">登录你的 SoulClone 账号</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-medium mb-2">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-text-primary placeholder-text-ghost focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all"
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium mb-2">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-text-primary placeholder-text-ghost focus:outline-none focus:border-accent-cyan/50 focus:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-ghost hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-accent-magenta text-sm"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-magenta text-white font-semibold transition-all hover:shadow-lg hover:shadow-accent-cyan/25 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
              <span className="relative z-10">{loading ? '登录中...' : '登录'}</span>
            </motion.button>
          </form>

          <p className="text-center mt-6 text-text-secondary text-sm relative z-10">
            还没有账号？{' '}
            <Link to="/register" className="text-accent-cyan hover:underline">
              立即注册
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
