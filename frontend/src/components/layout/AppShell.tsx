import { useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Compass, MessageCircle, Newspaper, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import PageTransition from '@/components/shared/PageTransition'

const navItems = [
  { path: '/home', icon: Home, label: '主页' },
  { path: '/discover', icon: Compass, label: '发现' },
  { path: '/feed', icon: Newspaper, label: '社区' },
  { path: '/chat', icon: MessageCircle, label: '聊天' },
  { path: '/profile', icon: User, label: '我的' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const hideNav = location.pathname.startsWith('/chat/')

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-strong border-r border-white/5 fixed h-full z-40">
        <div className="p-6">
          <Link to="/home" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-magenta flex items-center justify-center"
            >
              <span className="text-white font-bold text-sm">SC</span>
            </motion.div>
            <span className="font-display font-bold text-xl text-white">SoulClone</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group',
                  isActive
                    ? 'bg-accent-cyan/10 text-accent-cyan'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-accent-cyan to-accent-magenta rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon size={20} className={cn('transition-transform duration-300', isActive && 'scale-110')} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-accent-cyan"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom glow */}
        <div className="p-4">
          <div className="p-4 rounded-2xl glass border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
              <span className="text-xs text-text-secondary">在线状态</span>
            </div>
            <div className="h-1 bg-surface rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-cyan to-accent-magenta"
                animate={{ width: ['60%', '80%', '60%'] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn('flex-1 relative', !hideNav && 'pb-20 md:pb-0 md:ml-64')}>
        <PageTransition>{children}</PageTransition>
      </main>

      {/* Mobile Bottom Nav */}
      {!hideNav && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="md:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-white/5 z-50"
        >
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all duration-300 relative',
                    isActive ? 'text-accent-cyan' : 'text-text-secondary'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileActiveIndicator"
                      className="absolute -top-1 w-8 h-1 rounded-full bg-gradient-to-r from-accent-cyan to-accent-magenta"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon size={22} className={cn('transition-transform', isActive && 'scale-110')} />
                  <span className="text-[10px]">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </motion.nav>
      )}
    </div>
  )
}
