import { useState, useCallback, useRef } from 'react'

export function useTakeover() {
  const [isTakeover, setIsTakeover] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startHold = useCallback(() => {
    setHoldProgress(0)
    timerRef.current = setInterval(() => {
      setHoldProgress((p) => {
        if (p >= 100) {
          clearInterval(timerRef.current!)
          setIsTakeover(true)
          return 100
        }
        return p + 5
      })
    }, 50)
  }, [])

  const endHold = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (holdProgress < 100) {
      setHoldProgress(0)
    }
  }, [holdProgress])

  const release = useCallback(() => {
    setIsTakeover(false)
    setHoldProgress(0)
  }, [])

  return { isTakeover, holdProgress, startHold, endHold, release }
}
