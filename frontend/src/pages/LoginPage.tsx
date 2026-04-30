import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import AmbientBackground from '@/components/shared/AmbientBackground'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
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
    <AmbientBackground variant="auth" className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-150 ease-spring" />
          <span className="text-sm">返回首页</span>
        </Link>

        <Card variant="liquid" className="rounded-3xl p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-magenta flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-cyan/20"
            >
              <Sparkles size={28} className="text-white" />
            </motion.div>
            <h1 className="font-sans text-2xl font-bold mb-1">欢迎回来</h1>
            <p className="text-text-secondary text-sm">登录你的 SoulClone 账号</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Input
                type="tel"
                placeholder="手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                className={focusedField === 'phone' ? 'border-accent-cyan/30 shadow-[0_0_12px_rgba(0,240,255,0.1)]' : ''}
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className={focusedField === 'password' ? 'border-accent-cyan/30 shadow-[0_0_12px_rgba(0,240,255,0.1)]' : ''}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-ghost hover:text-text-secondary transition-colors duration-150 z-10"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-error text-sm flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-error" />
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 rounded-full bg-gradient-to-r from-accent-gold to-accent-magenta text-white font-semibold text-base transition-all duration-150 ease-spring hover:shadow-lg hover:shadow-accent-gold/30 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <span className="relative z-10">{loading ? '登录中...' : '进入'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent-magenta to-accent-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.button>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <Divider label="或" className="mb-6" />

            <div className="flex items-center justify-center gap-4">
              {[
                { name: '微信', icon: 'W' },
                { name: 'Apple', icon: 'A' },
                { name: 'Google', icon: 'G' },
              ].map((s) => (
                <button
                  key={s.name}
                  className="w-11 h-11 rounded-full bg-bg-600 border border-white/[0.08] flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-white/15 transition-all duration-150 ease-spring active:scale-95"
                  title={s.name}
                >
                  <span className="text-sm font-semibold">{s.icon}</span>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-6 text-text-secondary text-sm"
          >
            还没有账号？{' '}
            <Link to="/register" className="text-accent-cyan hover:text-accent-cyan-dark transition-colors font-medium">
              立即注册
            </Link>
          </motion.p>
        </Card>
      </motion.div>
    </AmbientBackground>
  )
}
