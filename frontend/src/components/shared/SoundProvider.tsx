import { useEffect, createContext, useContext, useState } from 'react'
import { initAudioContext, getSoundEnabled, setSoundEnabled } from '@/lib/sound'

interface SoundContextValue {
  enabled: boolean
  toggle: () => void
}

const SoundContext = createContext<SoundContextValue>({
  enabled: true,
  toggle: () => {},
})

export function useSoundSettings() {
  return useContext(SoundContext)
}

export default function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(() => getSoundEnabled())

  useEffect(() => {
    const handleFirstInteraction = () => {
      initAudioContext()
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }
    document.addEventListener('click', handleFirstInteraction, { once: true })
    document.addEventListener('keydown', handleFirstInteraction, { once: true })
    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    setSoundEnabled(next)
  }

  return (
    <SoundContext.Provider value={{ enabled, toggle }}>
      {children}
    </SoundContext.Provider>
  )
}
