import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background scale (§2.1)
        'bg-100': '#030306',
        'bg-200': '#050508',
        'bg-300': '#08080C',
        'bg-400': '#09090C',
        'bg-500': '#0A0A10',
        'bg-600': '#0C0C12',
        'bg-700': '#0F0F14',
        'bg-800': '#12121A',
        'bg-900': '#16161E',
        'bg-1000': '#181820',

        // Semantic surface
        background: '#050508',
        surface: '#0F0F14',
        'surface-elevated': '#181820',

        // Accent colors (§2.2)
        'accent-cyan': '#00F0FF',
        'accent-cyan-dark': '#00D4E0',
        'accent-magenta': '#FF006E',
        'accent-magenta-dark': '#E0005F',
        'accent-gold': '#FFBE0B',
        'accent-gold-dark': '#E0A500',

        // Text colors (§2.4)
        'text-primary': '#E8E8EC',
        'text-secondary': '#8B8B9A',
        'text-tertiary': '#6B6B7B',
        'text-disabled': '#4A4A5A',
        'text-placeholder': '#5A5A6A',
        'text-inverse': '#050508',

        // Semantic colors (§2.3)
        success: '#00E676',
        warning: '#FF9100',
        error: '#FF1744',
        info: '#00F0FF',
      },
      fontFamily: {
        /* Soul Type — Three-Voice Architecture (§Typography) */
        // Display: the "face" of the soul — high-contrast serif, editorial warmth
        display: ['Newsreader', 'LXGW WenKai', 'Noto Serif SC', 'PingFang SC', 'Microsoft YaHei', 'serif'],
        // Heading: structured elegance — same family, different weight
        heading: ['Newsreader', 'LXGW WenKai', 'Noto Serif SC', 'PingFang SC', 'Microsoft YaHei', 'serif'],
        // Body: the "voice" — clear, breathing, modern
        body: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        // UI: precise but gentle — Medium weight, slightly tracked out
        ui: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        // Mono: the "pulse" — engineer's precision
        mono: ['JetBrains Mono', 'LXGW WenKai Mono', 'monospace'],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'liquid': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'dramatic': 'cubic-bezier(0.87, 0, 0.13, 1)',
      },
      animation: {
        // Ambient
        'breathe': 'breathe 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'blob': 'blob 7s infinite',
        // Entrance
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'blur-in': 'blurIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        // Liquid
        'liquid-morph': 'liquidMorph 6s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(0,240,255,0.4)' },
          '50%': { boxShadow: '0 0 32px rgba(0,240,255,0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        blurIn: {
          '0%': { opacity: '0', filter: 'blur(8px)' },
          '100%': { opacity: '1', filter: 'blur(0px)' },
        },
        liquidMorph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '25%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '50%': { borderRadius: '50% 60% 30% 60% / 30% 60% 70% 40%' },
          '75%': { borderRadius: '60% 40% 60% 30% / 60% 30% 40% 70%' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
} satisfies Config
