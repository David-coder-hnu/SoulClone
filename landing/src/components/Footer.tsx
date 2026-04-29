import { Link } from 'react-router-dom'
import { Github } from 'lucide-react'

const footerLinks = [
  { label: '首页', href: '/' },
  { label: '人格觉醒', href: '/personality' },
  { label: '功能特性', href: '/features' },
  { label: '霓虹剧场', href: '/dating' },
  { label: '关于我们', href: '/about' },
]

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#050508]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <span className="font-display text-2xl font-bold tracking-wider text-white">
              Soul<span className="text-accent-cyan">Clone</span>
            </span>
            <p className="max-w-xs text-center text-sm text-white/40 md:text-left">
              你的AI数字孪生。当现实世界的你入眠时，由代码与情感构成的另一个你，正在霓虹交织的社交宇宙中替你经历心动、交友与无限可能。
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-white/40 transition-colors duration-300 hover:text-accent-cyan"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/David-coder-hnu/ChatBoy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-white/40 transition-colors duration-300 hover:text-accent-cyan"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] pt-8 md:flex-row">
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} SoulClone. All rights reserved.
          </p>
          <p className="font-mono text-xs text-white/25">
            Built with React + Three.js + GSAP
          </p>
        </div>
      </div>
    </footer>
  )
}
