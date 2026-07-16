import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowDown, ArrowRight, Bot, MessageCircle, Undo2, UserRound, X } from 'lucide-react'
import { playSound } from '@/lib/sound'

interface HandoverCeremonyProps {
  visible: boolean
  partnerName: string
  partnerAvatar?: string | null
  userName?: string
  userAvatar?: string | null
  twinName?: string
  intimacy?: number
  contextSummary?: string
  undoPending?: boolean
  undoError?: string
  onClose: () => void
  onContinue: () => void
  onUndo?: () => void
}

type Phase = 'preparing' | 'transfer' | 'complete'

const phaseCopy: Record<Phase, string> = {
  preparing: '孪生正在整理这段关系的关键上下文',
  transfer: '上下文正在交给你，孪生将退出这段对话',
  complete: '交接完成，这段关系现在由你本人回应',
}

export default function HandoverCeremony({
  visible,
  partnerName,
  partnerAvatar,
  userName = '你',
  userAvatar,
  twinName = '你的孪生',
  intimacy = 0,
  contextSummary,
  undoPending = false,
  undoError,
  onClose,
  onContinue,
  onUndo,
}: HandoverCeremonyProps) {
  const [phase, setPhase] = useState<Phase>('preparing')
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!visible) {
      setPhase('preparing')
      return
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null
    window.requestAnimationFrame(() => dialogRef.current?.focus())
    playSound('handover')

    if (reduceMotion) {
      setPhase('complete')
      return () => previousFocusRef.current?.focus()
    }

    const transferTimer = window.setTimeout(() => setPhase('transfer'), 650)
    const completeTimer = window.setTimeout(() => setPhase('complete'), 1550)

    return () => {
      window.clearTimeout(transferTimer)
      window.clearTimeout(completeTimer)
      previousFocusRef.current?.focus()
    }
  }, [visible, reduceMotion])

  useEffect(() => {
    if (!visible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      )
      if (focusable.length === 0) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible, onClose])

  const motionTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          <div className="absolute inset-0 bg-background/95 backdrop-blur-lg" aria-hidden="true" />
          <div
            className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-gold/[0.08] blur-[80px]"
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="handover-title"
            aria-describedby="handover-description"
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
            transition={motionTransition}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-accent-gold/20 bg-bg-500 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] outline-none sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭交接说明，稍后处理"
              className="focus-ring absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary sm:right-5 sm:top-5"
            >
              <X size={20} />
            </button>

            <div className="flex items-start gap-3 pr-12">
              {partnerAvatar ? (
                <img src={partnerAvatar} alt="" className="mt-1 h-11 w-11 shrink-0 rounded-full border border-accent-gold/30 object-cover" />
              ) : (
                <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent-gold/30 bg-accent-gold/[0.08] text-accent-gold">
                  <UserRound size={20} aria-hidden="true" />
                </div>
              )}
              <div>
                <p className="mb-2 text-sm font-medium text-accent-gold">真人接管</p>
                <h2 id="handover-title" className="font-heading text-2xl text-text-primary sm:text-3xl">
                  把与 {partnerName} 的关系交给你
                </h2>
                <p id="handover-description" className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
                  孪生已经完成初步了解。接管后，它不会再替你回复这段对话；接下来发生的每句话，都来自你本人。
                </p>
              </div>
            </div>

            <div className="my-7 flex flex-col items-center gap-4 sm:my-9 sm:flex-row sm:justify-center sm:gap-6">
              <motion.div
                animate={{ opacity: phase === 'complete' ? 0.45 : 1, scale: phase === 'complete' ? 0.92 : 1 }}
                transition={motionTransition}
                className="flex min-w-0 items-center gap-3 sm:flex-col sm:text-center"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-accent-cyan/25 bg-accent-cyan/[0.08] text-accent-cyan">
                  <Bot size={26} aria-hidden="true" />
                </div>
                <div className="min-w-0 sm:mt-1">
                  <p className="truncate text-sm font-medium text-text-primary">{twinName}</p>
                  <p className="text-sm text-text-secondary">完成寻找，准备退出</p>
                </div>
              </motion.div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-gold/20 bg-accent-gold/[0.08] text-accent-gold" aria-hidden="true">
                <ArrowDown className="sm:hidden" size={20} />
                <ArrowRight className="hidden sm:block" size={20} />
              </div>

              <motion.div
                animate={{ opacity: phase === 'preparing' ? 0.55 : 1, scale: phase === 'complete' ? 1.04 : 1 }}
                transition={motionTransition}
                className="flex min-w-0 items-center gap-3 sm:flex-col sm:text-center"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-full border-2 border-accent-gold/50 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-accent-gold/50 bg-accent-gold/[0.08] text-accent-gold">
                    <UserRound size={26} aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0 sm:mt-1">
                  <p className="truncate text-sm font-medium text-text-primary">{userName}</p>
                  <p className="text-sm text-text-secondary">亲自回应这段关系</p>
                </div>
              </motion.div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-background/60 p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-medium text-text-primary">关系深度 {Math.round(intimacy)}/100</span>
                <span className="text-sm text-text-secondary">系统提醒，不代替你的判断</span>
              </div>
              {contextSummary && (
                <p className="mt-2 line-clamp-2 [overflow-wrap:anywhere] text-sm leading-relaxed text-text-secondary">
                  最近上下文：{contextSummary}
                </p>
              )}
            </div>

            <p aria-live="polite" aria-atomic="true" className="mt-5 text-center text-sm text-accent-gold">
              {phaseCopy[phase]}
            </p>

            {undoError && (
              <p role="alert" className="mt-3 text-center text-sm text-error">
                {undoError}
              </p>
            )}

            {phase === 'complete' && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={motionTransition}
                className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                {onUndo ? (
                  <button
                    type="button"
                    onClick={onUndo}
                    disabled={undoPending}
                    className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Undo2 size={16} aria-hidden="true" />
                    {undoPending ? '正在撤销…' : '撤销接管'}
                  </button>
                ) : <span />}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={onClose}
                    className="focus-ring min-h-11 rounded-xl border border-white/10 px-5 text-sm text-text-secondary transition-colors hover:border-white/20 hover:text-text-primary"
                  >
                    稍后处理
                  </button>
                  <button
                    type="button"
                    onClick={onContinue}
                    className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent-gold px-5 text-sm font-semibold text-background transition-colors hover:bg-accent-gold-dark"
                  >
                    <MessageCircle size={17} aria-hidden="true" />
                    进入对话
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
