import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-all ease-spring select-none'

    const variantStyles = {
      primary: [
        'bg-cyan-500/10',
        'border border-cyan-400/30',
        'text-cyan-400',
        'hover:bg-cyan-500/20 hover:border-cyan-300/50',
        'active:scale-[0.98] active:bg-cyan-500/30',
        'disabled:opacity-30 disabled:cursor-not-allowed',
      ],
      secondary: [
        'bg-magenta-500/10',
        'border border-magenta-400/30',
        'text-magenta-400',
        'hover:bg-magenta-500/20 hover:border-magenta-300/50',
        'active:scale-[0.98]',
        'disabled:opacity-30 disabled:cursor-not-allowed',
      ],
      ghost: [
        'bg-transparent',
        'border border-white/15',
        'text-text-primary',
        'hover:bg-white/5 hover:border-white/25',
        'active:scale-[0.98] active:bg-white/[0.08]',
        'disabled:opacity-30 disabled:cursor-not-allowed',
      ],
      gold: [
        'bg-gold-500/10',
        'border border-gold-400/30',
        'text-gold-400',
        'hover:bg-gold-500/20 hover:border-gold-300/50',
        'active:scale-[0.98]',
        'disabled:opacity-30 disabled:cursor-not-allowed',
      ],
      danger: [
        'bg-error/10',
        'border border-error/30',
        'text-error',
        'hover:bg-error/20 hover:border-error/50',
        'active:scale-[0.98]',
        'disabled:opacity-30 disabled:cursor-not-allowed',
      ],
      link: [
        'bg-transparent border-0',
        'text-cyan-400',
        'underline underline-offset-4 decoration-transparent',
        'hover:decoration-cyan-400/60',
        'active:opacity-70',
        'disabled:opacity-30 disabled:cursor-not-allowed',
      ],
    }

    const sizeStyles = {
      sm: 'h-8 px-3 text-sm rounded-full',
      md: 'h-10 px-6 text-sm rounded-full',
      lg: 'h-12 px-8 text-base rounded-full',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          'focus-ring rounded-full',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
