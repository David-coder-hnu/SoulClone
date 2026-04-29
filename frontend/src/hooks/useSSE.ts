import { useEffect, useState } from 'react'

export function useSSE(url: string) {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type !== 'ping') {
          setEvents((prev) => [...prev, data])
        }
      } catch {
        setEvents((prev) => [...prev, event.data])
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [url])

  return { events }
}
