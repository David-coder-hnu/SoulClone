import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <input
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-text-primary placeholder-text-ghost focus:outline-none focus:border-accent-cyan/50 transition-colors',
          error && 'border-accent-magenta/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-accent-magenta text-xs">{error}</p>}
    </div>
  )
}
