import { useEffect, useState, useCallback } from 'react'

export interface DistillationProgress {
  step: string
  percent: number
  status: string
  overall_score?: number
  profile_id?: string
  error?: string
}

export function useDistillationProgress(jobId: string | null) {
  const [progress, setProgress] = useState<DistillationProgress | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const startSSE = useCallback(() => {
    if (!jobId) return

    // Use relative path so Vite dev proxy works correctly
    const eventSource = new EventSource(
      `/api/v1/distillation/progress/sse?job_id=${jobId}`
    )

    eventSource.onopen = () => setIsConnected(true)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setProgress(data)
        if (data.status === 'completed' || data.status === 'failed') {
          eventSource.close()
          setIsConnected(false)
        }
      } catch {
        // ignore parse errors
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
    }

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [jobId])

  useEffect(() => {
    const cleanup = startSSE()
    return cleanup
  }, [startSSE])

  return { progress, isConnected }
}
