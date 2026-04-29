import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Github } from 'lucide-react'

const navLinks = [
  { label: '首页', href: '/' },
  { label: '人格觉醒', href: '/personality' },
  { label: '功能特性', href: '/features' },
  { label: '霓虹剧场', href: '/dating' },
  { label: '关于我们', href: '/about' },
]

export default function Navbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500 ' +
        (scrolled ? 'liquid-glass border-b border-white/[0.06]' : 'bg-transparent')
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-wider text-white">
            Soul<span className="text-accent-cyan">Clone</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = location.pathname === link.href
            return (
              <Link
                key={link.href}
                to={link.href}
                className={
                  'relative px-4 py-2 text-sm font-medium transition-colors duration-300 ' +
                  (active
                    ? 'text-accent-cyan'
                    : 'text-white/60 hover:text-white')
                }
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-accent-cyan shadow-glow" />
                )}
              </Link>
            )
          })}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="https://github.com/David-coder-hnu/ChatBoy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full liquid-glass px-4 py-2 text-sm font-medium text-white/60 transition-all duration-300 hover:text-white hover:bg-white/5"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <Link
            to="/personality"
            className="rounded-full liquid-glass px-5 py-2 text-sm font-medium text-accent-cyan transition-all duration-300 hover:bg-accent-cyan/10 hover:shadow-glow"
          >
            启动人格觉醒
          </Link>
        </div>
      </div>
    </nav>
  )
}
