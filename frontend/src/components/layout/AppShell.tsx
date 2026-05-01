import { useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Compass, MessageCircle, Newspaper, User } from 'lucide-react'
import Logo from '@/components/shared/Logo'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navItems = [
  { path: '/home', icon: Home, label: '主页' },
  { path: '/discover', icon: Compass, label: '发现' },
  { path: '/feed', icon: Newspaper, label: '社区' },
  { path: '/chat', icon: MessageCircle, label: '聊天' },
  { path: '/profile', icon: User, label: '我的' },
]

// ───────── Floating Dock Navigation ─────────
// Kills the standard SaaS sidebar. Replaces it with a floating glass dock
// that breathes, glows, and feels like a constellation of soul-nodes.

function FloatingDock() {
  const location = useLocation()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.3 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-1 px-2 py-2 rounded-2xl glass-elevated border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path
          const isHovered = hoveredIndex === index

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip label */}
              <AnimatePresence>
                {isHovered && !isActive && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-8 px-2 py-0.5 rounded-md bg-bg-600 border border-white/[0.08] text-[10px] text-text-secondary whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Active glow orb behind icon */}
              {isActive && (
                <motion.div
                  layoutId="dockGlow"
                  className="absolute inset-0 rounded-xl bg-accent-cyan/10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Breathing glow for active item */}
              {isActive && (
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 8px rgba(0,240,255,0.2)',
                      '0 0 20px rgba(0,240,255,0.35)',
                      '0 0 8px rgba(0,240,255,0.2)',
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-xl"
                />
              )}

              <motion.div
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  'relative w-11 h-11 flex items-center justify-center rounded-xl transition-colors duration-200',
                  isActive ? 'text-accent-cyan' : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <item.icon size={20} className={cn(isActive && 'scale-110')} />

                {/* Active dot */}
                {isActive && (
                  <motion.div
                    layoutId="dockDot"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-accent-cyan"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}

// ───────── Top Bar ─────────
// Minimal, just logo + context. No sidebar chrome.

function TopBar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-40 px-4 md:px-8 py-4 glass border-b border-white/[0.04]"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/home" className="flex items-center gap-2.5 group">
          <motion.div whileHover={{ rotate: 8, scale: 1.08 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Logo size={28} variant="color" animate="breathe" />
          </motion.div>
          <span className="font-display text-lg text-white hidden sm:block">SoulClone</span>
        </Link>

        {/* Quick actions could go here — notifications, settings, etc. */}
        <div className="flex items-center gap-2">
          {/* Placeholder for future top-right actions */}
        </div>
      </div>
    </motion.header>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const hideNav = location.pathname.startsWith('/chat/')

  return (
    <div className="min-h-screen relative">
      {/* Top bar */}
      <TopBar />

      {/* Main Content — no sidebar margin, full bleed */}
      <main className={cn('relative min-h-screen pt-20', !hideNav && 'pb-24')}>
        {children}
      </main>

      {/* Floating Dock — desktop + mobile unified */}
      {!hideNav && <FloatingDock />}
    </div>
  )
}
