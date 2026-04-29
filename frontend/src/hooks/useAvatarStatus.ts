import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export function useAvatarStatus() {
  const [status, setStatus] = useState<'active' | 'dormant' | 'unknown'>('unknown')

  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.get('/clones/me')
        setStatus(res.data.status)
      } catch {
        setStatus('unknown')
      }
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  return { status }
}
